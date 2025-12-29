// Encryption utility for secure API Key storage
// Uses Web Crypto API with AES-GCM encryption

const ENCRYPTION_KEY_NAME = 'chat-with-page-encryption-key';
const ALGORITHM = 'AES-GCM';

// Generate a unique device-based salt for key derivation
const getDeviceSalt = async (): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  // Use extension ID and a fixed string as salt base
  const saltBase = `chat-with-page-${chrome.runtime.id || 'extension'}-salt`;
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(saltBase));
  return new Uint8Array(hashBuffer.slice(0, 16));
};

// Derive encryption key from a passphrase
const deriveKey = async (): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  // Use extension ID as base passphrase (unique per installation)
  const passphrase = `chat-with-page-secure-${chrome.runtime.id || 'default'}`;
  const salt = await getDeviceSalt();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Cache the derived key to avoid repeated derivation
let cachedKey: CryptoKey | null = null;

const getEncryptionKey = async (): Promise<CryptoKey> => {
  if (!cachedKey) {
    cachedKey = await deriveKey();
  }
  return cachedKey;
};

/**
 * Encrypt a string value
 * @param plaintext - The string to encrypt
 * @returns Base64 encoded encrypted string with IV prefix
 */
export const encryptValue = async (plaintext: string): Promise<string> => {
  if (!plaintext) return '';

  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt value');
  }
};

/**
 * Decrypt a previously encrypted string
 * @param encryptedBase64 - Base64 encoded encrypted string with IV prefix
 * @returns Decrypted plaintext string
 */
export const decryptValue = async (encryptedBase64: string): Promise<string> => {
  if (!encryptedBase64) return '';

  try {
    const key = await getEncryptionKey();

    // Decode base64
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    // If decryption fails, the value might be stored in plain text (legacy)
    // Return empty string to force user to re-enter
    console.error('Decryption failed - value may be legacy unencrypted:', error);
    return '';
  }
};

/**
 * Check if a string looks like an encrypted value
 * Encrypted values are base64 encoded and have a minimum length
 */
export const isEncryptedValue = (value: string): boolean => {
  if (!value || value.length < 20) return false;

  try {
    // Try to decode as base64
    const decoded = atob(value);
    // Encrypted values should be at least IV (12 bytes) + some data
    return decoded.length >= 13;
  } catch {
    return false;
  }
};

/**
 * Migrate a plain text value to encrypted storage
 * Returns the encrypted value if input is plain text, or the original if already encrypted
 */
export const migrateToEncrypted = async (value: string): Promise<string> => {
  if (!value) return '';

  // Check if already encrypted
  if (isEncryptedValue(value)) {
    // Verify it can be decrypted
    const decrypted = await decryptValue(value);
    if (decrypted) {
      return value; // Already properly encrypted
    }
  }

  // Encrypt the plain text value
  return encryptValue(value);
};

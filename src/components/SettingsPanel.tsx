import React, { useState } from 'react';
import type { ThemeColors, ThemeMode } from '../hooks/useTheme';

interface SettingsPanelProps {
  selectedProvider: string;
  aiProviders: Array<{
    id: string;
    name: string;
    baseUrl: string;
  }>;
  apiEndpointInput: string;
  apiKeyInput: string;
  selectedLanguage: string;
  languages: Array<{
    code: string;
    name: string;
  }>;
  t: (key: string) => string;
  handleProviderChange: (provider: string) => void;
  setApiEndpointInput: (endpoint: string) => void;
  setApiKeyInput: (key: string) => void;
  setSelectedLanguage: (language: string) => void;
  saveSettings: () => void;
  i18n: {
    changeLanguage: (language: string) => void;
  };
  colors: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedProvider,
  aiProviders,
  apiEndpointInput,
  apiKeyInput,
  selectedLanguage,
  languages,
  t,
  handleProviderChange,
  setApiEndpointInput,
  setApiKeyInput,
  setSelectedLanguage,
  saveSettings,
  i18n,
  colors,
  themeMode,
  setThemeMode
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const themeOptions = [
    { value: 'system' as ThemeMode, label: t('settings_section.themeSystem') || '跟随系统' },
    { value: 'light' as ThemeMode, label: t('settings_section.themeLight') || '浅色' },
    { value: 'dark' as ThemeMode, label: t('settings_section.themeDark') || '深色' },
  ];

  const styles = {
    container: {
      padding: '0 12px 12px 12px',
      maxWidth: '100%',
      backgroundColor: colors.bgPrimary,
    },
    header: {
      fontSize: '18px',
      fontWeight: 600,
      marginBottom: '16px',
      color: colors.textPrimary,
      borderBottom: `2px solid ${colors.primary}`,
      paddingBottom: '8px',
    },
    formGroup: {
      marginBottom: '14px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: 500,
      color: colors.textSecondary,
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      boxSizing: 'border-box' as const,
      border: `1px solid ${colors.borderPrimary}`,
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      outline: 'none',
      backgroundColor: colors.bgInput,
      color: colors.textPrimary,
    },
    select: {
      width: '100%',
      padding: '12px 14px',
      boxSizing: 'border-box' as const,
      border: `1px solid ${colors.borderPrimary}`,
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: colors.bgInput,
      color: colors.textPrimary,
      cursor: 'pointer',
      outline: 'none',
      appearance: 'none' as const,
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 12px center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '16px',
    },
    passwordWrapper: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
    },
    passwordInput: {
      width: '100%',
      padding: '12px 44px 12px 14px',
      boxSizing: 'border-box' as const,
      border: `1px solid ${colors.borderPrimary}`,
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      outline: 'none',
      backgroundColor: colors.bgInput,
      color: colors.textPrimary,
    },
    toggleButton: {
      position: 'absolute' as const,
      right: '12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.textMuted,
    },
    saveButton: {
      width: '100%',
      padding: '14px 20px',
      backgroundColor: colors.primary,
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 500,
      transition: 'background-color 0.2s, transform 0.1s',
      marginTop: '8px',
    },
    hint: {
      fontSize: '12px',
      color: colors.textMuted,
      marginTop: '4px',
    },
    themeSelector: {
      display: 'flex',
      gap: '6px',
      width: '100%',
    },
    themeButton: (isActive: boolean) => ({
      flex: 1,
      padding: '10px 12px',
      border: `1px solid ${isActive ? colors.primary : colors.borderPrimary}`,
      borderRadius: '8px',
      backgroundColor: isActive ? colors.primaryLight : colors.bgInput,
      color: isActive ? colors.primary : colors.textSecondary,
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: isActive ? 500 : 400,
      transition: 'all 0.2s',
      textAlign: 'center' as const,
    }),
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>{t('settings')}</h2>

      {/* 主题选择 */}
      <div style={styles.formGroup}>
        <label style={styles.label}>{t('settings_section.theme') || '主题'}</label>
        <div style={styles.themeSelector}>
          {themeOptions.map((option) => (
            <button
              key={option.value}
              style={styles.themeButton(themeMode === option.value)}
              onClick={() => setThemeMode(option.value)}
              onMouseOver={(e) => {
                if (themeMode !== option.value) {
                  e.currentTarget.style.backgroundColor = colors.bgHover;
                }
              }}
              onMouseOut={(e) => {
                if (themeMode !== option.value) {
                  e.currentTarget.style.backgroundColor = colors.bgInput;
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>{t('settings_section.aiProvider')}</label>
        <select
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          style={styles.select}
        >
          {aiProviders.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Base URL</label>
        <input
          type="text"
          onChange={(e) => setApiEndpointInput(e.target.value)}
          value={apiEndpointInput}
          placeholder={selectedProvider === "custom" ? t('placeholders.enterCustomBaseUrl') : `${aiProviders.find(p => p.id === selectedProvider)?.baseUrl || ''}`}
          style={styles.input}
        />
        {selectedProvider !== "custom" && (
          <p style={styles.hint}>
            {t('settings_section.autoFill') || 'Leave empty to use default URL'}
          </p>
        )}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>{t('settings_section.apiToken')}</label>
        <div style={styles.passwordWrapper}>
          <input
            type={showApiKey ? "text" : "password"}
            onChange={(e) => setApiKeyInput(e.target.value)}
            value={apiKeyInput}
            placeholder={t('messages.enterApiToken')}
            style={styles.passwordInput}
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            style={styles.toggleButton}
            title={showApiKey ? "Hide" : "Show"}
          >
            {showApiKey ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>{t('settings_section.language')}</label>
        <select
          value={selectedLanguage}
          onChange={(e) => {
            const newLanguage = e.target.value;
            setSelectedLanguage(newLanguage);
            i18n.changeLanguage(newLanguage);
          }}
          style={styles.select}
        >
          {languages.map(language => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={saveSettings}
        style={styles.saveButton}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = colors.primaryHover;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = colors.primary;
        }}
      >
        {t('settings_section.save')}
      </button>
    </div>
  );
};

export default SettingsPanel;

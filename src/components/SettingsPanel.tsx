import React from 'react';

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
  i18n
}) => {
  return (
    <div style={{ padding: 16 }}>
      <h2>{t('settings')}</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: "14px" }}>{t('settings_section.aiProvider')}</label>
        <select
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        >
          {aiProviders.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: "14px" }}>Base URL</label>
        <input
          type="text"
          onChange={(e) => setApiEndpointInput(e.target.value)}
          value={apiEndpointInput}
          placeholder={selectedProvider === "custom" ? t('placeholders.enterCustomBaseUrl') : `自动填充 (${aiProviders.find(p => p.id === selectedProvider)?.baseUrl})`}
          style={{
            width: "100%",
            padding: 8,
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: "14px" }}>{t('settings_section.apiToken')}</label>
        <input
          type="text"
          onChange={(e) => setApiKeyInput(e.target.value)}
          value={apiKeyInput}
          placeholder={t('messages.enterApiToken')}
          style={{
            width: "100%",
            padding: 8,
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: "14px" }}>{t('settings_section.language')}</label>
        <select
          value={selectedLanguage}
          onChange={(e) => {
            const newLanguage = e.target.value;
            setSelectedLanguage(newLanguage);
            i18n.changeLanguage(newLanguage);
          }}
          style={{
            width: "100%",
            padding: 8,
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px"
          }}
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
        style={{
          width: "100%",
          padding: 10,
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px"
        }}>
        {t('settings_section.save')}
      </button>
    </div>
  );
};

export default SettingsPanel;

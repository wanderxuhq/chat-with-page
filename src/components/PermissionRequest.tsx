import React from 'react';
import { useLanguageManagement } from '../hooks/useLanguageManagement';
import { useTheme } from '../hooks/useTheme';

interface PermissionRequestProps {
  requestPermission: () => void;
  isRequesting: boolean;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({
  requestPermission,
  isRequesting
}) => {
  const { t } = useLanguageManagement();
  const { colors } = useTheme();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: 24,
        backgroundColor: colors.bgPrimary,
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h1 style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>
            {t('permission.title')}
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: 13, margin: 0 }}>
            {t('permission.subtitle')}
          </p>
        </div>

        <div
          style={{
            backgroundColor: colors.bgSecondary,
            borderRadius: 10,
            padding: 16,
            marginBottom: 12,
            border: `1px solid ${colors.borderSecondary}`,
          }}
        >
          <p style={{ color: colors.textSecondary, fontSize: 12, margin: "0 0 12px" }}>
            {t('permission.description')}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              t('permission.features.read'),
              t('permission.features.analyze'),
              t('permission.features.chat'),
            ].map((text, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ color: colors.textPrimary, fontSize: 12 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: 10,
            backgroundColor: "rgba(34, 197, 94, 0.08)",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 1.4, margin: 0 }}>
            {t('permission.privacy')}
          </p>
        </div>

        <button
          onClick={requestPermission}
          disabled={isRequesting}
          style={{
            width: "100%",
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            background: isRequesting ? colors.textSecondary : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            border: "none",
            borderRadius: 8,
            cursor: isRequesting ? "not-allowed" : "pointer",
            boxShadow: isRequesting ? "none" : "0 3px 12px rgba(59, 130, 246, 0.4)",
          }}
        >
          {isRequesting ? t('permission.requesting') : t('permission.grant')}
        </button>
      </div>
    </div>
  );
};

export default PermissionRequest;

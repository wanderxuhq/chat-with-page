import { defineConfig } from 'wxt';
export default defineConfig({
    srcDir: 'src',
    modules: ['@wxt-dev/module-react'],
    manifest: {
        permissions: [
            "storage",
            "tabs",
            "activeTab",
            "scripting",
            "sidePanel"
        ],
        optional_host_permissions: [
            "https://*/*",
            "http://*/*"
        ],
        action: {
            default_title: "Chat with Page"
        },
        side_panel: {
            default_path: "sidepanel.html"
        }
    },
});

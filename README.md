# Chat with Page - Web Content Interaction Plugin

This is a browser extension developed based on the [WXT](https://wxt.dev/) framework that allows you to interact intelligently with web page content, supporting multiple AI providers and a multilingual interface.

## 🚀 Main Features

- **Intelligent Content Interaction**: Engage in conversational interactions with web page content to obtain information, summaries, or explanations
- **Multi-language Support**: Automatically detects browser language, supporting Chinese, English, Japanese, Korean, French, German, Spanish, Russian, and other languages
- **Multiple AI Providers**: Supports OpenAI, Anthropic, Ollama, and other AI service providers
- **Personalized Settings**: Customizable API keys, endpoints, and models
- **Sidebar Integration**: Convenient use in browser sidebar

## 🌐 Supported Languages

- English (en-US)
- Chinese (zh-CN)
- Japanese (ja-JP)
- Korean (ko-KR)
- French (fr-FR)
- German (de-DE)
- Spanish (es-ES)
- Russian (ru-RU)

The extension automatically detects your browser language and uses the corresponding interface language. If no corresponding language is supported, English is used by default.

### Internationalization Implementation

The extension uses [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) for internationalization support. All interface text is centralized in JSON files under the `src/i18n/locales/` directory for unified management and translation.

#### Translation File Structure

Each language has an independent JSON file, example structure:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "settings": {
    "title": "Settings",
    "apiKey": "API Key"
  }
}
```

#### Adding New Languages

To add support for a new language, simply:
1. Create a new language file in the `src/i18n/locales/` directory (e.g., `fr-FR.json`)
2. Import the new language file in `src/i18n/index.ts`
3. Add to the supported languages list

#### Customizing Translations

You can modify or extend the translation files as needed to meet specific localization requirements.

## 🤖 Supported AI Providers

- **OpenAI**: Supports GPT-3.5, GPT-4, and other models
- **Anthropic**: Supports Claude series models
- **Ollama**: Supports locally deployed AI models

## 📦 Installation

### Development Version

1. Clone the repository:
   ```bash
   git clone https://github.com/wanderxuhq/chat-with-page.git
   cd chat-with-page
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. Load the extension in your browser:
   - Chrome/Edge: Open `chrome://extensions/`, enable Developer mode, click "Load unpacked extension", select the `dist/chrome-mv3-dev` directory
   - Firefox: Open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", select the `dist/firefox-mv3-dev` directory

### Production Version

1. Build the production version:
   ```bash
   pnpm build
   # or
   npm run build
   ```

2. After building, the extension files will be generated in the `dist` directory, which can be used for publishing to browser app stores.

## 🎯 Usage

1. After installing the extension, click the extension icon in the browser toolbar to open the sidebar
2. Select an AI provider and configure API keys in the sidebar
3. Start interacting with the current web page content

## ⚙️ Configuration

The extension supports the following configuration options:

- **AI Provider**: Select the AI service provider to use
- **API Key**: Enter your AI service API key
- **API Endpoint**: Custom API request endpoint (optional)
- **Model**: Select the AI model to use
- **Language**: Manually select the interface language

### Technology Stack

- **React**: UI framework
- **TypeScript**: Type system
- **WXT**: Browser extension development framework
- **i18next**: Internationalization support
- **OpenAI SDK**: AI API client

## 📝 Contribution

Welcome to submit Issues and Pull Requests!

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [WXT](https://wxt.dev/): Browser extension development framework
- [Readability.js](https://github.com/mozilla/readability): Web page content parsing
- [i18next](https://www.i18next.com/): Internationalization support

## 📞 Contact

If you have any questions or suggestions, please submit an [Issue](https://github.com/wanderxuhq/chat-with-page/issues).
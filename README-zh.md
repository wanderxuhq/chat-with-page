# Chat with Page - 网页内容交互插件

这是一个基于 [Plasmo](https://docs.plasmo.com/) 框架开发的浏览器插件，允许您与网页内容进行智能交互，支持多种AI提供商和多语言界面。

## 🚀 主要功能

- **智能内容交互**：与网页内容进行对话式交互，获取信息、摘要或解释
- **多语言支持**：自动检测浏览器语言，支持中文、英文、日文、韩文、法文、德文、西班牙文、俄文等多种语言
- **多AI提供商**：支持 OpenAI、Anthropic、Ollama 等多种AI服务提供商
- **个性化设置**：可自定义API密钥、端点和模型
- **侧边栏集成**：在浏览器侧边栏中便捷使用

## 🌐 支持的语言

- 中文 (zh-CN)
- 英文 (en-US)
- 日文 (ja-JP)
- 韩文 (ko-KR)
- 法文 (fr-FR)
- 德文 (de-DE)
- 西班牙文 (es-ES)
- 俄文 (ru-RU)

插件会自动检测您的浏览器语言并使用相应的界面语言，如无对应语言支持则默认使用英文。

### 国际化实现

插件使用 [i18next](https://www.i18next.com/) 和 [react-i18next](https://react.i18next.com/) 实现国际化支持。所有界面文本都集中在 `src/i18n/locales/` 目录下的 JSON 文件中，便于统一管理和翻译。

#### 翻译文件结构

每个语言都有一个独立的 JSON 文件，结构示例：

```json
{
  "common": {
    "save": "保存",
    "cancel": "取消"
  },
  "settings": {
    "title": "设置",
    "apiKey": "API 密钥"
  }
}
```

#### 添加新语言

要添加新的语言支持，只需：
1. 在 `src/i18n/locales/` 目录下创建新的语言文件（如 `fr-FR.json`）
2. 在 `src/i18n/index.ts` 中导入新的语言文件
3. 添加到支持的语言列表中

#### 自定义翻译

您可以根据需要修改或扩展翻译文件，以满足特定的本地化需求。

## 🤖 支持的AI提供商

- **OpenAI**：支持 GPT-3.5, GPT-4 等模型
- **Anthropic**：支持 Claude 系列模型
- **Ollama**：支持本地部署的 AI 模型

## 📦 安装

### 开发版本

1. 克隆仓库：
   ```bash
   git clone https://github.com/yourusername/chat-with-page.git
   cd chat-with-page
   ```

2. 安装依赖：
   ```bash
   pnpm install
   # 或
   npm install
   ```

3. 启动开发服务器：
   ```bash
   pnpm dev
   # 或
   npm run dev
   ```

4. 在浏览器中加载扩展：
   - Chrome/Edge：打开 `chrome://extensions/`，启用开发者模式，点击「加载已解压的扩展程序」，选择 `build/chrome-mv3-dev` 目录
   - Firefox：打开 `about:debugging#/runtime/this-firefox`，点击「临时载入附加组件」，选择 `build/firefox-mv3-dev` 目录

### 生产版本

1. 构建生产版本：
   ```bash
   pnpm build
   # 或
   npm run build
   ```

2. 构建完成后，扩展文件将生成在 `build` 目录中，可用于发布到浏览器应用商店。

## 🎯 使用方法

1. 安装插件后，点击浏览器工具栏中的插件图标打开侧边栏
2. 在侧边栏中选择AI提供商并配置API密钥
3. 开始与当前网页内容进行交互

## ⚙️ 配置

插件支持以下配置项：

- **AI提供商**：选择要使用的AI服务提供商
- **API密钥**：输入您的AI服务API密钥
- **API端点**：自定义API请求端点（可选）
- **模型**：选择要使用的AI模型
- **语言**：手动选择界面语言

## 🛠️ 开发

### 项目结构

```
├── src/
│   ├── components/              # React 组件
│   ├── background/              # 后台脚本
│   ├── hooks/                   # 自定义钩子
│   ├── i18n/                    # 国际化配置
│   │   ├── locales/             # 多语言翻译文件
│   │   │   ├── zh-CN.json       # 中文翻译
│   │   │   ├── en-US.json       # 英文翻译
│   │   │   └── ...              # 其他语言翻译
│   │   └── index.ts             # i18n 初始化
│   ├── utils/                   # 工具函数
│   └── main.tsx                 # 主入口
├── tsconfig.json                # TypeScript 配置
├── package.json                 # 项目配置
└── README-zh.md                 # 项目说明（中文）
```

### 技术栈

- **React**：UI 框架
- **TypeScript**：类型系统
- **Plasmo**：浏览器扩展开发框架
- **i18next**：国际化支持
- **OpenAI SDK**：AI API 客户端

## 📝 贡献

欢迎提交 Issues 和 Pull Requests！

### 贡献指南

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Plasmo](https://docs.plasmo.com/)：浏览器扩展开发框架
- [Readability.js](https://github.com/mozilla/readability)：网页内容解析
- [i18next](https://www.i18next.com/)：国际化支持

## 📞 联系方式

如有问题或建议，欢迎提交 [Issue](https://github.com/yourusername/chat-with-page/issues)。
import { marked } from "marked";
import { escape } from "../../escape";

// 配置marked渲染器
marked.use({
  renderer: {
    codespan: function ({ text }) {
      return `<code class="custom-codespan">${escape(text, true)}</code>`;
    }
  }
});

export { marked };

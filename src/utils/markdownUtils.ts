import { marked } from "marked";
import { escape } from "../../escape";

// Configure marked renderer
marked.use({
  renderer: {
    codespan: function ({ text }) {
      return `<code class="custom-codespan">${escape(text, true)}</code>`;
    }
  }
});

export { marked };

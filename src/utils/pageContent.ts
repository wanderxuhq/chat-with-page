import { browser } from 'wxt/browser';
import i18n from '../i18n';

// Check if a URL is accessible by the extension
export const isAccessibleUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const inaccessibleProtocols = [
    'chrome://', 'chrome-extension://', 'edge://', 'about:',
    'moz-extension://', 'opera://', 'brave://', 'vivaldi://'
  ];
  return !inaccessibleProtocols.some(protocol => url.startsWith(protocol));
};

// Extract page content with REF markers
export const extractPageContent = async (tabId: number, annotate: boolean): Promise<{ text: string; index: number }[]> => {
  /*
  if (!activeTab || !activeTab.id || !isAccessibleUrl(activeTab.url)) {
    return [];
  }
  */

  try {
    const pageContentResult = await browser.scripting.executeScript({
      target: { tabId: tabId },
      func: (annotate: boolean) => {
        const visibilityCache = new Map<HTMLElement, boolean>();
        const body = document.body;
        if (!body) return [];

        const isElVisible = (el: HTMLElement) => {
          if (!el) return false;
          if (visibilityCache.has(el)) return visibilityCache.get(el)!;

          const style = window.getComputedStyle(el);
          if (!el.isConnected || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            visibilityCache.set(el, false);
            return false;
          }
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            visibilityCache.set(el, false);
            return false;
          }

          const right = rect.right + document.documentElement.scrollLeft;
          if (right <= 0) {
            visibilityCache.set(el, false);
            return false;
          }

          const left = rect.left + document.documentElement.scrollLeft;
          if (left >= document.documentElement.scrollWidth) {
            visibilityCache.set(el, false);
            return false;
          }

          const bottom = rect.bottom + document.documentElement.scrollTop;
          if (bottom <= 0) {
            visibilityCache.set(el, false);
            return false;
          }

          const top = rect.top + document.documentElement.scrollTop;
          if (top >= document.documentElement.scrollHeight) {
            visibilityCache.set(el, false);
            return false;
          }
          
          visibilityCache.set(el, true);
          return true;
        };

        const cleanText = (text: string): string => {
          return text.replace(/\n+/g, ' ').replace(/[ \t]+/g, ' ').trim();
        };

        const tableToMarkdown = (table: HTMLTableElement) => {
          const rows = Array.from(table.rows);
          let markdown = "\n";
          rows.forEach((row, rowIndex) => {
            const cells = Array.from(row.cells);
            const rowContent = cells.map(cell => cell.innerText.replace(/\n/g, "<br>").trim());
            markdown += `| ${rowContent.join(" | ")} |\n`;
            if (rowIndex === 0) {
              markdown += `| ${cells.map(() => "---").join(" | ")} |\n`;
            }
          });
          return markdown;
        };

        const isElToContinue = (el: HTMLElement) => {
          if (!el || !el.tagName) return false;
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'MAP', 'PICTURE', 'SOURCE'].includes(el.tagName)) {
            return false;
          }
          return isElVisible(el);
        };

        const annotateSummaryRefs = (node: Node, collect: boolean): { annotated: boolean; markedTexts: { text: string; el: HTMLElement }[] } => {
          let markedTexts: { text: string; el: HTMLElement }[] = [];

          if (node instanceof Text) {
            return { annotated: false, markedTexts };
          }

          const el = node as HTMLElement;

          if (!isElToContinue(el)) {
            return { annotated: false, markedTexts };
          }

          if (el.tagName === 'IMG') {
            const alt = el.getAttribute('alt')?.trim();
            if (alt) {
              markedTexts.push({ text: `[Image: ${alt}]`, el });
            }
            return { annotated: true, markedTexts };
          }

          if (["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "BLOCKQUOTE", "PRE"].includes(el.tagName)) {
            const cleanedText = cleanText(el.innerText);
            if (cleanedText) {
              markedTexts.push({ text: cleanedText, el });
              return { annotated: true, markedTexts };
            }
            return { annotated: false, markedTexts };
          }

          if (el.tagName === "TABLE") {
            markedTexts.push({ text: tableToMarkdown(el as HTMLTableElement), el });
            return { annotated: true, markedTexts };
          }

          let hasChildAnnotated = false;
          for (const child of el.childNodes) {
            if (child instanceof HTMLElement) {
              const childAnnotated = annotateSummaryRefs(child, false);
              if (childAnnotated.annotated) {
                hasChildAnnotated = true;
                break;
              }
            }
          }

          if (!collect) {
            return { annotated: hasChildAnnotated, markedTexts: [] };
          }

          if (hasChildAnnotated) {
            for (const child of el.childNodes) {
              if (child instanceof HTMLElement) {
                const childAnnotated = annotateSummaryRefs(child, true);
                if (childAnnotated.annotated) {
                  markedTexts.push(...childAnnotated.markedTexts);
                }
              } else if (child instanceof Text) {
                const cleanedText = cleanText(child.textContent);
                if (cleanedText) {
                  markedTexts.push({ text: cleanedText, el });
                }
              }
            }
          } else {
            const cleanedText = cleanText(el.innerText);
            if (cleanedText) {
              markedTexts.push({ text: cleanedText, el });
            }
          }

          return { annotated: true, markedTexts };
        };

        const annotations =  annotateSummaryRefs(document.body, true).markedTexts.map((markedText, index) => { return { ...markedText, index } });

        if (annotate) {
          const summaryRefIdAttr = "data-summary-ref-id";

          if (annotations && annotations.length > 0) {
            annotations.forEach((annotation) => {
              if (!annotation.el.hasAttribute(summaryRefIdAttr)) {
                annotation.el.setAttribute(summaryRefIdAttr, annotation.index.toString());
              }
            });
          }
        }

        return annotations.map(({ text, index }) => ({ text, index }));
      },
      args: [annotate]
    });

    const result = pageContentResult && pageContentResult[0]?.result;

    return result || [];
  } catch (error) {
    // Silently handle errors
    return [];
  }
};

export const extractAiInputText = (annotations: { text: string; index: number }[]): string => {
  //let aiInputText = '';

  if (annotations && annotations.length > 0) {
    return annotations.reduce((acc, annotation) => {
      acc += `[REF${annotation.index}] ${annotation.text}\n`;
      return acc;
    }, '');

  }
  return '';
}

// Build system prompt from page content
export const buildSystemPrompt = async (tabId: number, url: string, language: string = 'zh'): Promise<string> => {
  if (!tabId || !isAccessibleUrl(url)) {
    return '';
  }

  const annotations = await extractPageContent(tabId, true);

  if (!annotations || annotations.length === 0) {
    return '';
  }

  const aiInputText = extractAiInputText(annotations);

  // Set language prompt based on selected language
  i18n.changeLanguage(language || i18n.language);
  const languagePrompt = i18n.t("languagePrompts.answerInLanguage") || "Please answer in Chinese";

  // Build complete system prompt
  let systemPrompt = `You are an intelligent assistant, ${languagePrompt}. ` +
    `The input text contains markers in the format [REF***]. ` +
    `When quoting the original text, you must keep the corresponding marker ` +
    `exactly as it is immediately after the quoted sentence.\n\n` +
    `Below is page content. Please focus on the main content:\n${aiInputText}`;

  return systemPrompt;
};

// Ensure system prompt is available (extract if not exists)
export const ensureSystemPrompt = async (
  tabId: number,
  url: string,
  setSystemPrompt?: (prompt: string) => void,
  language: string = 'zh'
): Promise<string> => {
  const newSystemPrompt = await buildSystemPrompt(tabId, url, language);
  setSystemPrompt?.(newSystemPrompt);
  return newSystemPrompt;
};

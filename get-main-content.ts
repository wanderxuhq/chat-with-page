/* eslint-disable no-cond-assign */
/*
 * Copyright (c) 2010 Arc90 Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * This code is heavily based on Arc90's readability.js (1.7.1) script
 * available at: http://code.google.com/p/arc90labs-readability
 */

class Readability {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
  FLAG_STRIP_UNLIKELYS = 0x1;
  FLAG_WEIGHT_CLASSES = 0x2;
  FLAG_CLEAN_CONDITIONALLY = 0x4;
  ELEMENT_NODE = 1;
  TEXT_NODE = 3;
  DEFAULT_MAX_ELEMS_TO_PARSE = 0;
  DEFAULT_N_TOP_CANDIDATES = 5;
  DEFAULT_TAGS_TO_SCORE = "section,h2,h3,h4,h5,h6,p,td,pre"
    .toUpperCase()
    .split(",");
  DEFAULT_CHAR_THRESHOLD = 500;
  REGEXPS = {
    unlikelyCandidates:
      /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
    okMaybeItsACandidate:
      /and|article|body|column|content|main|mathjax|shadow/i,
    positive:
      /article|body|content|entry|hentry|h-entry|main|page|pagination|post|text|blog|story/i,
    negative:
      /-ad-|hidden|^hid$| hid$| hid |^hid |banner|combx|comment|com-|contact|footer|gdpr|masthead|media|meta|outbrain|promo|related|scroll|share|shoutbox|sidebar|skyscraper|sponsor|shopping|tags|widget/i,
    extraneous:
      /print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single|utility/i,
    byline: /byline|author|dateline|writtenby|p-author/i,
    replaceFonts: /<(\/?)font[^>]*>/gi,
    normalize: /\s{2,}/g,
    videos:
      /\/\/(www\.)?((dailymotion|youtube|youtube-nocookie|player\.vimeo|v\.qq|bilibili|live.bilibili)\.com|(archive|upload\.wikimedia)\.org|player\.twitch\.tv)/i,
    shareElements: /(\b|_)(share|sharedaddy)(\b|_)/i,
    nextLink: /(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i,
    prevLink: /(prev|earl|old|new|<|«)/i,
    tokenize: /\W+/g,
    whitespace: /^\s*$/,
    hasContent: /\S$/,
    hashUrl: /^#.+/,
    srcsetUrl: /(\S+)(\s+[\d.]+[xw])?(\s*(?:,|$))/g,
    b64DataUrl: /^data:\s*([^\s;,]+)\s*;\s*base64\s*,/i,
    commas: /\u002C|\u060C|\uFE50|\uFE10|\uFE11|\u2E41|\u2E34|\u2E32|\uFF0C/g,
    jsonLdArticleTypes:
      /^Article|AdvertiserContentArticle|NewsArticle|AnalysisNewsArticle|AskPublicNewsArticle|BackgroundNewsArticle|OpinionNewsArticle|ReportageNewsArticle|ReviewNewsArticle|Report|SatiricalArticle|ScholarlyArticle|MedicalScholarlyArticle|SocialMediaPosting|BlogPosting|LiveBlogPosting|DiscussionForumPosting|TechArticle|APIReference$/,
    adWords:
      /^(ad(vertising|vertisement)?|pub(licité)?|werb(ung)?|广告|Реклама|Anuncio)$/iu,
    loadingWords:
      /^((loading|正在加载|Загрузка|chargement|cargando)(…|\.\.\.)?)$/iu,
  };
  UNLIKELY_ROLES = [
    "menu",
    "menubar",
    "complementary",
    "navigation",
    "alert",
    "alertdialog",
    "dialog",
  ];
  DIV_TO_P_ELEMS = new Set([
    "BLOCKQUOTE",
    "DL",
    "DIV",
    "IMG",
    "OL",
    "P",
    "PRE",
    "TABLE",
    "UL",
  ]);
  ALTER_TO_DIV_EXCEPTIONS = ["DIV", "ARTICLE", "SECTION", "P", "OL", "UL"];
  PRESENTATIONAL_ATTRIBUTES = [
    "align",
    "background",
    "bgcolor",
    "border",
    "cellpadding",
    "cellspacing",
    "frame",
    "hspace",
    "rules",
    "style",
    "valign",
    "vspace",
  ];
  DEPRECATED_SIZE_ATTRIBUTE_ELEMS = ["TABLE", "TH", "TD", "HR", "PRE"];
  PHRASING_ELEMS = [
    "ABBR",
    "AUDIO",
    "B",
    "BDO",
    "BR",
    "BUTTON",
    "CITE",
    "CODE",
    "DATA",
    "DATALIST",
    "DFN",
    "EM",
    "EMBED",
    "I",
    "IMG",
    "INPUT",
    "KBD",
    "LABEL",
    "MARK",
    "MATH",
    "METER",
    "NOSCRIPT",
    "OBJECT",
    "OUTPUT",
    "PROGRESS",
    "Q",
    "RUBY",
    "SAMP",
    "SCRIPT",
    "SELECT",
    "SMALL",
    "SPAN",
    "STRONG",
    "SUB",
    "SUP",
    "TEXTAREA",
    "TIME",
    "VAR",
    "WBR",
  ];
  CLASSES_TO_PRESERVE = ["page"];

  _doc: Document;
  _docJSDOMParser: boolean;
  _articleTitle: string;
  _articleByline: string;
  _articleDir: string;
  _articleSiteName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _attempts: any[];
  _debug: boolean;
  _maxElemsToParse: number;
  _nbTopCandidates: number;
  _charThreshold: number;
  _classesToPreserve: string[];
  _keepClasses: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _serializer: (el: Element) => any;
  _disableJSONLD: boolean;
  _allowedVideoRegex: RegExp;
  _flags: number;

  constructor(doc: Document, options: Partial<ReadabilityOptions> = {}) {
    this._doc = doc;
    this._docJSDOMParser = this._doc.firstChild
      ? "__JSDOMParser__" in this._doc.firstChild
      : false;
    this._articleTitle = "";
    this._articleByline = "";
    this._articleDir = "";
    this._articleSiteName = "";
    this._attempts = [];

    this._debug = !!options.debug;
    this._maxElemsToParse =
      options.maxElemsToParse || this.DEFAULT_MAX_ELEMS_TO_PARSE;
    this._nbTopCandidates =
      options.nbTopCandidates || this.DEFAULT_N_TOP_CANDIDATES;
    this._charThreshold = options.charThreshold || this.DEFAULT_CHAR_THRESHOLD;
    this._classesToPreserve = this.CLASSES_TO_PRESERVE.concat(
      options.classesToPreserve || []
    );
    this._keepClasses = !!options.keepClasses;
    this._serializer =
      options.serializer ||
      function (el) {
        return el.innerHTML;
      };
    this._disableJSONLD = !!options.disableJSONLD;
    this._allowedVideoRegex = options.allowedVideoRegex || this.REGEXPS.videos;

    this._flags =
      this.FLAG_STRIP_UNLIKELYS |
      this.FLAG_WEIGHT_CLASSES |
      this.FLAG_CLEAN_CONDITIONALLY;
  }

  _getArticleTitle() {
    let curTitle = "";
    let origTitle = "";

    try {
      curTitle = origTitle = this._doc.title.trim();
      if (typeof curTitle !== "string") {
        curTitle = origTitle = this._getInnerText(
          this._doc.getElementsByTagName("title")[0]
        );
      }
    } catch (e) {
      /* ignore exceptions setting the title. */
    }

    let titleHadHierarchicalSeparators = false;
    const wordCount = (str: string) => str.split(/\s+/).length;

    if (/[|\-–—\\/>»]/.test(curTitle)) {
      titleHadHierarchicalSeparators = /[\\/>»]/.test(curTitle);
      curTitle = origTitle.replace(/(.*)[|\-–—\\/>»](.*)/gi, "$1");

      if (wordCount(curTitle) < 3) {
        curTitle = origTitle.replace(/[^|\-–—\\/>»]*[|\-–—\\/>»](.*)/gi, "$2");
      }
    } else if (curTitle.indexOf(": ") !== -1) {
      const headings = this._getAllNodesWithTag(this._doc, ["h1", "h2"]);
      const trimmedTitle = curTitle.trim();
      const match = this._someNode(headings, (heading: Element) => {
        return heading.textContent?.trim() === trimmedTitle;
      });

      if (!match) {
        curTitle = curTitle.substring(curTitle.lastIndexOf(":") + 1);
        if (wordCount(curTitle) < 3) {
          curTitle = curTitle.substring(curTitle.indexOf(":") + 1);
        }
      }
    } else if (curTitle.length > 150 || curTitle.length < 15) {
      const hOnes = this._doc.getElementsByTagName("h1");
      if (hOnes.length === 1) {
        curTitle = this._getInnerText(hOnes[0]);
      }
    }

    curTitle = curTitle.trim().replace(/\s{2,}/g, " ");
    const curTitleWordCount = wordCount(curTitle);

    if (
      curTitleWordCount <= 4 &&
      (!titleHadHierarchicalSeparators ||
        curTitleWordCount !==
          wordCount(origTitle.replace(/[|\-–—\\/>»]+/g, "")))
    ) {
      curTitle = origTitle;
    }

    return curTitle;
  }

  _prepDocument() {
    this._removeNodes(this._getAllNodesWithTag(this._doc, ["style"]));
    if (this._doc.body) {
      this._replaceBrs(this._doc.body);
    }
    this._replaceNodeTags(this._getAllNodesWithTag(this._doc, ["font"]), "SPAN");
  }

  _nextNode(node: Node) {
    let next: Node | null = node;
    while (
      next &&
      next.nodeType !== this.ELEMENT_NODE &&
      this.REGEXPS.whitespace.test(next.textContent || "")
    ) {
      next = next.nextSibling;
    }
    return next;
  }

  _replaceBrs(elem: Element) {
    this._forEachNode(
      this._getAllNodesWithTag(elem, ["br"]),
      (br: Element) => {
        let next: Node | null = br.nextSibling;
        let replaced = false;

        while ((next = this._nextNode(next!)) && next.nodeName === "BR") {
          replaced = true;
          const brSibling = next.nextSibling;
          next.parentNode?.removeChild(next);
          next = brSibling;
        }

        if (replaced) {
          const p = this._doc.createElement("p");
          br.parentNode?.replaceChild(p, br);
          next = p.nextSibling;
          while (next) {
            if (next.nodeName === "BR") {
              const nextElem = this._nextNode(next.nextSibling!);
              if (nextElem && nextElem.nodeName === "BR") {
                break;
              }
            }
            if (!this._isPhrasingContent(next)) {
              break;
            }
            const sibling = next.nextSibling;
            p.appendChild(next);
            next = sibling;
          }
        }
      }
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _setNodeTag(node: Element, tag: string): Element {
    const replacement = this._doc.createElement(tag);
    while (node.firstChild) {
      replacement.appendChild(node.firstChild);
    }
    node.parentNode?.replaceChild(replacement, node);
    if ((node as any).readability) {
      (replacement as any).readability = (node as any).readability;
    }
    for (let i = 0; i < node.attributes.length; i++) {
      try {
        replacement.setAttribute(
          node.attributes[i].name,
          node.attributes[i].value
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    return replacement;
  }

  _prepArticle(articleContent: Element) {
    this._cleanStyles(articleContent);
    this._markDataTables(articleContent);
    this._fixLazyImages(articleContent);
    this._cleanConditionally(articleContent, "form");
    this._cleanConditionally(articleContent, "fieldset");
    this._clean(articleContent, "object");
    this._clean(articleContent, "embed");
    this._clean(articleContent, "footer");
    this._clean(articleContent, "link");
    this._clean(articleContent, "aside");

    const shareElementThreshold = this.DEFAULT_CHAR_THRESHOLD;
    this._forEachNode(articleContent.children, (topCandidate: Element) => {
      this._cleanMatchedNodes(
        topCandidate,
        (node: Element, matchString: string) => {
          return (
            this.REGEXPS.shareElements.test(matchString) &&
            (node.textContent?.length || 0) < shareElementThreshold
          );
        }
      );
    });

    this._clean(articleContent, "iframe");
    this._clean(articleContent, "input");
    this._clean(articleContent, "textarea");
    this._clean(articleContent, "select");
    this._clean(articleContent, "button");
    this._cleanHeaders(articleContent);

    this._cleanConditionally(articleContent, "table");
    this._cleanConditionally(articleContent, "ul");
    this._cleanConditionally(articleContent, "div");

    this._replaceNodeTags(
      this._getAllNodesWithTag(articleContent, ["h1"]),
      "h2"
    );

    this._removeNodes(
      this._getAllNodesWithTag(articleContent, ["p"]),
      (paragraph: Element) => {
        const contentElementCount = this._getAllNodesWithTag(paragraph, [
          "img",
          "embed",
          "object",
          "iframe",
        ]).length;
        return (
          contentElementCount === 0 && !this._getInnerText(paragraph, false)
        );
      }
    );

    this._forEachNode(
      this._getAllNodesWithTag(articleContent, ["br"]),
      (br: Element) => {
        const next = this._nextNode(br.nextSibling!);
        if (next && next.nodeName === "P") {
          br.parentNode?.removeChild(br);
        }
      }
    );

    this._forEachNode(
      this._getAllNodesWithTag(articleContent, ["table"]),
      (table: Element) => {
        const tbody = this._hasSingleTagInsideElement(table, "TBODY")
          ? table.firstElementChild
          : table;
        if (this._hasSingleTagInsideElement(tbody as Element, "TR")) {
          const row = tbody?.firstElementChild;
          if (this._hasSingleTagInsideElement(row as Element, "TD")) {
            let cell = row?.firstElementChild as Element;
            cell = this._setNodeTag(
              cell,
              this._everyNode(cell.childNodes, this._isPhrasingContent)
                ? "P"
                : "DIV"
            );
            table.parentNode?.replaceChild(cell, table);
          }
        }
      }
    );
  }

  _initializeNode(node: Element) {
    (node as any).readability = { contentScore: 0 };

    switch (node.nodeName) {
      case "DIV":
        (node as any).readability.contentScore += 5;
        break;
      case "PRE":
      case "TD":
      case "BLOCKQUOTE":
        (node as any).readability.contentScore += 3;
        break;
      case "ADDRESS":
      case "OL":
      case "UL":
      case "DL":
      case "DD":
      case "DT":
      case "LI":
      case "FORM":
        (node as any).readability.contentScore -= 3;
        break;
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6":
      case "TH":
        (node as any).readability.contentScore -= 5;
        break;
    }
    (node as any).readability.contentScore += this._getClassWeight(node);
  }

  _removeAndGetNext(node: Element): Element {
    const nextNode = this._getNextNode(node, true) as Element;
    node.parentNode?.removeChild(node);
    return nextNode;
  }

  _getNextNode(node: Node, ignoreSelfAndKids = false): Node | null {
    if (!ignoreSelfAndKids && (node as Element).firstElementChild) {
      return (node as Element).firstElementChild;
    }
    if (node.nextSibling) {
      return node.nextSibling;
    }
    do {
      node = node.parentNode as Node;
    } while (node && !(node as Element).nextElementSibling);
    return node && (node as Element).nextElementSibling;
  }

  _isProbablyVisible(node: Element): boolean {
    return (
      (!(node as HTMLElement).style || (node as HTMLElement).style.display !== "none") &&
      (!(node as HTMLElement).style || (node as HTMLElement).style.visibility !== "hidden") &&
      !node.hasAttribute("hidden") &&
      (!node.hasAttribute("aria-hidden") ||
        node.getAttribute("aria-hidden") !== "true")
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _grabArticle(page: HTMLElement): HTMLElement | null {
    const doc = this._doc;
    const isPaging = page !== null;
    page = page || this._doc.body;

    if (!page) {
      return null;
    }

    const pageCacheHtml = page.innerHTML;

    while (true) {
      const stripUnlikelyCandidates = this._flagIsActive(
        this.FLAG_STRIP_UNLIKELYS
      );
      let elementsToScore: Element[] = [];
      let node: Node | null = this._doc.documentElement;

      while (node) {
        if (node.nodeType !== this.ELEMENT_NODE) {
          node = this._getNextNode(node);
          continue;
        }
        const matchString = `${(node as Element).className} ${
          (node as Element).id
        }`;

        if (!this._isProbablyVisible(node as Element)) {
          node = this._removeAndGetNext(node as Element);
          continue;
        }

        if (stripUnlikelyCandidates) {
          if (
            this.REGEXPS.unlikelyCandidates.test(matchString) &&
            !this.REGEXPS.okMaybeItsACandidate.test(matchString) &&
            node.nodeName !== "BODY" &&
            node.nodeName !== "A"
          ) {
            node = this._removeAndGetNext(node as Element);
            continue;
          }
        }
        if (
          (node.nodeName === "DIV" ||
            node.nodeName === "SECTION" ||
            node.nodeName === "HEADER" ||
            node.nodeName === "H1" ||
            node.nodeName === "H2" ||
            node.nodeName === "H3" ||
            node.nodeName === "H4" ||
            node.nodeName === "H5" ||
            node.nodeName === "H6") &&
          this._isElementWithoutContent(node as Element)
        ) {
          node = this._removeAndGetNext(node as Element);
          continue;
        }
        if (this.DEFAULT_TAGS_TO_SCORE.includes(node.nodeName)) {
          elementsToScore.push(node as Element);
        }

        if (node.nodeName === "DIV") {
          let p: Element | null = null;
          let childNode = node.firstChild;
          while (childNode) {
            const nextSibling = childNode.nextSibling;
            if (this._isPhrasingContent(childNode)) {
              if (p !== null) {
                p.appendChild(childNode);
              } else {
                p = doc.createElement("p");
                p.appendChild(childNode);
              }
            } else if (p !== null) {
              while (p.lastChild && this._isWhitespace(p.lastChild)) {
                p.lastChild.parentNode?.removeChild(p.lastChild);
              }
              if (p.children.length > 0) {
                node.insertBefore(p, childNode);
              }
              p = null;
            }
            childNode = nextSibling;
          }

          if (
            this._hasSingleTagInsideElement(node as Element, "P") &&
            this._getLinkDensity(node as Element) < 0.25
          ) {
            const newNode = (node as Element).children[0];
            node.parentNode?.replaceChild(newNode, node);
            node = newNode;
            elementsToScore.push(node as Element);
          } else if (!this._hasChildBlockElement(node as Element)) {
            node = this._setNodeTag(node as Element, "P");
            elementsToScore.push(node as Element);
          }
        }
        node = this._getNextNode(node);
      }
      const candidates: Element[] = [];
      this._forEachNode(elementsToScore, (elementToScore: Element) => {
        if (!elementToScore.parentNode) {
          return;
        }
        const innerText = this._getInnerText(elementToScore);
        if (innerText.length < 25) {
          return;
        }
        const ancestors = this._getNodeAncestors(elementToScore, 5);
        if (ancestors.length === 0) {
          return;
        }
        let contentScore = 0;
        contentScore += 1;
        contentScore += innerText.split(",").length;
        contentScore += Math.min(Math.floor(innerText.length / 100), 3);
        this._forEachNode(
          ancestors,
          (ancestor: Element, level: number) => {
            if (
              !ancestor.nodeName ||
              !ancestor.parentNode ||
              typeof (ancestor.parentNode as any).tagName === "undefined"
            ) {
              return;
            }
            if (typeof (ancestor as any).readability === "undefined") {
              this._initializeNode(ancestor);
              candidates.push(ancestor);
            }
            let scoreDivider = 0;
            if (level === 0) {
              scoreDivider = 1;
            } else if (level === 1) {
              scoreDivider = 2;
            } else {
              scoreDivider = level * 3;
            }
            (ancestor as any).readability.contentScore +=
              contentScore / scoreDivider;
          }
        );
      });

      const topCandidates: Element[] = [];
      for (let c = 0, cl = candidates.length; c < cl; c += 1) {
        const candidate = candidates[c];
        const candidateScore =
          (candidate as any).readability.contentScore *
          (1 - this._getLinkDensity(candidate));
        (candidate as any).readability.contentScore = candidateScore;

        for (let t = 0; t < this._nbTopCandidates; t++) {
          const aTopCandidate = topCandidates[t];
          if (
            !aTopCandidate ||
            candidateScore > (aTopCandidate as any).readability.contentScore
          ) {
            topCandidates.splice(t, 0, candidate);
            if (topCandidates.length > this._nbTopCandidates) {
              topCandidates.pop();
            }
            break;
          }
        }
      }

      let topCandidate: Element | null = topCandidates[0] || null;
      let neededToCreateTopCandidate = false;

      if (topCandidate === null || topCandidate.nodeName === "BODY") {
        topCandidate = doc.createElement("div");
        neededToCreateTopCandidate = true;
        while (page.firstChild) {
          topCandidate.appendChild(page.firstChild);
        }
        page.appendChild(topCandidate);
        this._initializeNode(topCandidate);
      } else {
        let parentOfTopCandidate = topCandidate.parentNode as Element;
        while (parentOfTopCandidate.nodeName !== "BODY") {
          if (!(parentOfTopCandidate as any).readability) {
            this._initializeNode(parentOfTopCandidate);
          }
          const parentScore = (parentOfTopCandidate as any).readability
            .contentScore;
          if (parentScore > (topCandidate as any).readability.contentScore) {
            topCandidate = parentOfTopCandidate;
          }
          parentOfTopCandidate = parentOfTopCandidate.parentNode as Element;
        }
      }

      const articleContent = doc.createElement("div");
      if (isPaging) {
        articleContent.id = "readability-content";
      }

      const siblingScoreThreshold = Math.max(
        10,
        (topCandidate as any).readability.contentScore * 0.2
      );
      const parentOfTopCandidate = topCandidate.parentNode as Element;
      const siblings = parentOfTopCandidate.children;
      for (let s = 0, sl = siblings.length; s < sl; s++) {
        let sibling = siblings[s];
        let append = false;

        if (sibling === topCandidate) {
          append = true;
        } else {
          let contentBonus = 0;
          if (
            sibling.className === topCandidate.className &&
            topCandidate.className !== ""
          ) {
            contentBonus +=
              (topCandidate as any).readability.contentScore * 0.2;
          }
          if (
            (sibling as any).readability &&
            (sibling as any).readability.contentScore + contentBonus >=
              siblingScoreThreshold
          ) {
            append = true;
          } else if (sibling.nodeName === "P") {
            const linkDensity = this._getLinkDensity(sibling);
            const nodeContent = this._getInnerText(sibling);
            const nodeLength = nodeContent.length;

            if (nodeLength > 80 && linkDensity < 0.25) {
              append = true;
            } else if (
              nodeLength < 80 &&
              nodeLength > 0 &&
              linkDensity === 0 &&
              /\.( |$)/.test(nodeContent)
            ) {
              append = true;
            }
          }
        }
        if (append) {
          if (!this.ALTER_TO_DIV_EXCEPTIONS.includes(sibling.nodeName)) {
            sibling = this._setNodeTag(sibling, "DIV");
          }
          articleContent.appendChild(sibling);
          s -= 1;
          sl -= 1;
        }
      }
      this._prepArticle(articleContent);

      if (neededToCreateTopCandidate) {
        topCandidate.id = "readability-page-1";
        topCandidate.className = "page";
      } else {
        const div = doc.createElement("div");
        div.id = "readability-page-1";
        div.className = "page";
        while (articleContent.firstChild) {
          div.appendChild(articleContent.firstChild);
        }
        articleContent.appendChild(div);
      }

      const parseSuccessful = true;
      const textLength = this._getInnerText(articleContent, true).length;
      if (textLength < this._charThreshold) {
        // eslint-disable-next-line no-unsanitized/property
        page.innerHTML = pageCacheHtml;
        if (this._flagIsActive(this.FLAG_STRIP_UNLIKELYS)) {
          this._removeFlag(this.FLAG_STRIP_UNLIKELYS);
        } else if (this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) {
          this._removeFlag(this.FLAG_WEIGHT_CLASSES);
        } else if (this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) {
          this._removeFlag(this.FLAG_CLEAN_CONDITIONALLY);
        } else {
          return null;
        }
      }
      if (parseSuccessful) {
        return articleContent;
      }
    }
  }

  _getInnerText(e: Element, normalizeSpaces = true): string {
    let textContent = e.textContent?.trim() || "";
    if (normalizeSpaces) {
      return textContent.replace(/\s{2,}/g, " ");
    }
    return textContent;
  }

  _getLinkDensity(element: Element): number {
    const textLength = this._getInnerText(element).length;
    if (textLength === 0) {
      return 0;
    }
    let linkLength = 0;
    this._forEachNode(element.getElementsByTagName("a"), (linkNode: Element) => {
      linkLength += this._getInnerText(linkNode).length;
    });
    return linkLength / textLength;
  }

  _getClassWeight(e: Element): number {
    if (!this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) {
      return 0;
    }
    let weight = 0;
    if (typeof e.className === "string" && e.className !== "") {
      if (this.REGEXPS.negative.test(e.className)) {
        weight -= 25;
      }
      if (this.REGEXPS.positive.test(e.className)) {
        weight += 25;
      }
    }
    if (typeof e.id === "string" && e.id !== "") {
      if (this.REGEXPS.negative.test(e.id)) {
        weight -= 25;
      }
      if (this.REGEXPS.positive.test(e.id)) {
        weight += 25;
      }
    }
    return weight;
  }

  _removeNodes(
    nodeList:
      | HTMLCollectionOf<Element>
      | NodeListOf<Element>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      | any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filterFn?: (node: Element, i: number, nodeList: any) => boolean
  ) {
    for (let i = nodeList.length - 1; i >= 0; i--) {
      const node = nodeList[i];
      const parentNode = node.parentNode;
      if (parentNode) {
        if (!filterFn || filterFn.call(this, node, i, nodeList)) {
          parentNode.removeChild(node);
        }
      }
    }
  }
  _replaceNodeTags(
    nodeList:
      | HTMLCollectionOf<Element>
      | NodeListOf<Element>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      | any,
    newTagName: string
  ) {
    for (const node of nodeList) {
      this._setNodeTag(node, newTagName);
    }
  }

  _forEachNode(
    nodeList:
      | HTMLCollectionOf<Element>
      | NodeListOf<Element>
      | Node[]
      | Element[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (node: any, i: number, nodeList: any) => void
  ) {
    Array.prototype.forEach.call(nodeList, fn, this);
  }

  _someNode(
    nodeList: HTMLCollectionOf<Element> | NodeListOf<Element>,
    fn: (node: Element, i: number, nodeList: HTMLCollectionOf<Element>) => boolean
  ): boolean {
    return Array.prototype.some.call(nodeList, fn, this);
  }

  _everyNode(
    nodeList: NodeListOf<ChildNode> | Node[],
    fn: (node: Node) => boolean
  ): boolean {
    return Array.prototype.every.call(nodeList, fn, this);
  }

  _getAllNodesWithTag(
    node: Element | Document,
    tagNames: string[]
  ): NodeListOf<Element> {
    return (node as Element).querySelectorAll(tagNames.join(","));
  }

  _cleanStyles(e: Element | null) {
    if (!e || e.nodeName.toLowerCase() === "svg") {
      return;
    }

    for (let i = 0; i < this.PRESENTATIONAL_ATTRIBUTES.length; i++) {
      e.removeAttribute(this.PRESENTATIONAL_ATTRIBUTES[i]);
    }

    if (this.DEPRECATED_SIZE_ATTRIBUTE_ELEMS.includes(e.nodeName)) {
      e.removeAttribute("width");
      e.removeAttribute("height");
    }

    let cur = e.firstElementChild;
    while (cur !== null) {
      this._cleanStyles(cur);
      cur = cur.nextElementSibling;
    }
  }

  _markDataTables(root: Element) {
    const tables = root.getElementsByTagName("table");
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const role = table.getAttribute("role");
      if (role === "presentation") {
        (table as any)._readabilityDataTable = false;
        continue;
      }
      const datatable = table.getAttribute("datatable");
      if (datatable === "0") {
        (table as any)._readabilityDataTable = false;
        continue;
      }
      const summary = table.getAttribute("summary");
      if (summary) {
        (table as any)._readabilityDataTable = true;
        continue;
      }

      const caption = table.getElementsByTagName("caption")[0];
      if (caption && caption.childNodes.length > 0) {
        (table as any)._readabilityDataTable = true;
        continue;
      }
      const dataTableDescendants = ["col", "colgroup", "tfoot", "thead", "th"];
      const descendantExists = (tag: string) =>
        !!table.getElementsByTagName(tag)[0];
      if (dataTableDescendants.some(descendantExists)) {
        (table as any)._readabilityDataTable = true;
        continue;
      }
      if (table.getElementsByTagName("table")[0]) {
        (table as any)._readabilityDataTable = false;
        continue;
      }
      const sizeInfo = this._getRowAndColumnCount(table);
      if (sizeInfo.rows >= 10 || sizeInfo.columns > 4) {
        (table as any)._readabilityDataTable = true;
        continue;
      }
      (table as any)._readabilityDataTable = sizeInfo.rows * sizeInfo.columns > 10;
    }
  }
  _getRowAndColumnCount(table: HTMLTableElement) {
    let rows = 0;
    let columns = 0;
    const trs = table.getElementsByTagName("tr");
    for (let i = 0; i < trs.length; i++) {
      const rowspan = parseInt(trs[i].getAttribute("rowspan") || "0", 10);
      rows += rowspan || 1;
      let columnsInThisRow = 0;
      const cells = trs[i].getElementsByTagName("td");
      for (let j = 0; j < cells.length; j++) {
        const colspan = parseInt(cells[j].getAttribute("colspan") || "0", 10);
        columnsInThisRow += colspan || 1;
      }
      columns = Math.max(columns, columnsInThisRow);
    }
    return { rows, columns };
  }

  _fixLazyImages(root: Element) {
    this._forEachNode(
      this._getAllNodesWithTag(root, ["img", "picture", "figure"]),
      (elem: HTMLImageElement) => {
        if (
          elem.src &&
          this.REGEXPS.b64DataUrl.test(elem.src) &&
          !/image\/svg/.test(elem.src)
        ) {
          const b64starts = elem.src.indexOf("base64,") + 7;
          if (elem.src.length - b64starts < 100) {
            elem.removeAttribute("src");
          }
        }
        if (elem.src || (elem.srcset && elem.srcset !== "null")) {
          return;
        }

        for (let j = 0; j < elem.attributes.length; j++) {
          const attr = elem.attributes[j];
          if (attr.name === "src" || attr.name === "srcset") {
            continue;
          }
          let copyTo: "src" | "srcset" | null = null;
          if (/\.(jpg|jpeg|png|webp)\s+\d/.test(attr.value)) {
            copyTo = "srcset";
          } else if (/^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/.test(attr.value)) {
            copyTo = "src";
          }
          if (copyTo) {
            elem.setAttribute(copyTo, attr.value);
          }
        }
      }
    );
  }

  _cleanConditionally(e: Element, tag: string) {
    if (!this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) {
      return;
    }
    this._removeNodes(this._getAllNodesWithTag(e, [tag]), (node: Element) => {
      const isDataTable = (t: Element) => (t as any)._readabilityDataTable;
      const isList = tag === "ul" || tag === "ol";
      if (tag === "table" && isDataTable(node)) {
        return false;
      }
      if (this._hasAncestorTag(node, "table", -1, isDataTable)) {
        return false;
      }
      const weight = this._getClassWeight(node);
      const contentScore = 0;
      if (weight + contentScore < 0) {
        return true;
      }
      if (this._getCharCount(node) < 10) {
        const p = node.getElementsByTagName("p").length;
        const img = node.getElementsByTagName("img").length;
        const li = node.getElementsByTagName("li").length - 100;
        const input = node.getElementsByTagName("input").length;
        const embedCount = node.getElementsByTagName("embed").length;
        const linkDensity = this._getLinkDensity(node);
        const contentLength = this._getInnerText(node).length;
        if (img > p) {
          return true;
        }
        if (li > p && !isList) {
          return true;
        }
        if (input > Math.floor(p / 3)) {
          return true;
        }
        if (contentLength < 25 && (img === 0 || img > 2)) {
          return true;
        }
        if (weight < 25 && linkDensity > 0.2) {
          return true;
        }
        if (weight >= 25 && linkDensity > 0.5) {
          return true;
        }
        if ((embedCount === 1 && contentLength < 75) || embedCount > 1) {
          return true;
        }
      }
      return false;
    });
  }

  _cleanMatchedNodes(
    e: Element,
    filter: (node: Element, matchString: string) => boolean
  ) {
    const endOfSearchMarkerNode = this._getNextNode(e, true);
    let next = this._getNextNode(e);
    while (next && next !== endOfSearchMarkerNode) {
      if (
        filter.call(
          this,
          next,
          `${(next as Element).className} ${(next as Element).id}`
        )
      ) {
        next = this._removeAndGetNext(next as Element);
      } else {
        next = this._getNextNode(next);
      }
    }
  }

  _cleanHeaders(e: Element) {
    this._removeNodes(
      this._getAllNodesWithTag(e, ["h1", "h2"]),
      (node: Element) => {
        const shouldRemove = this._getClassWeight(node) < 0;
        return shouldRemove;
      }
    );
  }

  _clean(e: Element, tag: string) {
    const isEmbed = ["object", "embed", "iframe"].includes(tag);

    this._removeNodes(this._getAllNodesWithTag(e, [tag]), (element: Element) => {
      if (isEmbed) {
        for (let i = 0; i < element.attributes.length; i++) {
          if (this.REGEXPS.videos.test(element.attributes[i].value)) {
            return false;
          }
        }
        if (
          element.nodeName === "OBJECT" &&
          this.REGEXPS.videos.test(element.innerHTML)
        ) {
          return false;
        }
      }
      return true;
    });
  }

  _hasAncestorTag(
    node: Node,
    tagName: string,
    maxDepth = 3,
    filterFn?: (node: Element) => boolean
  ): boolean {
    tagName = tagName.toUpperCase();
    let depth = 0;
    while (node.parentNode) {
      if (maxDepth > 0 && depth > maxDepth) {
        return false;
      }
      if (
        (node.parentNode as Element).tagName === tagName &&
        (!filterFn || filterFn(node.parentNode as Element))
      ) {
        return true;
      }
      node = node.parentNode;
      depth++;
    }
    return false;
  }
  _getNodeAncestors(node: Element, maxDepth?: number) {
    maxDepth = maxDepth || 0;
    let i = 0;
    const ancestors = [];
    while (node.parentNode) {
      ancestors.push(node.parentNode);
      if (maxDepth && ++i === maxDepth) {
        break;
      }
      node = node.parentNode as Element;
    }
    return ancestors;
  }
  _isElementWithoutContent(node: Element): boolean {
    return (
      node.nodeType === this.ELEMENT_NODE &&
      (node.textContent || "").trim().length === 0 &&
      (node.children.length === 0 ||
        node.children.length ===
          node.getElementsByTagName("br").length +
            node.getElementsByTagName("hr").length)
    );
  }

  _hasSingleTagInsideElement(element: Element, tag: string): boolean {
    return (
      element.children.length === 1 && element.children[0].tagName === tag
    );
  }
  _hasChildBlockElement(element: Element): boolean {
    return this._someNode(
      element.children,
      (child: Element) =>
        this.DIV_TO_P_ELEMS.has(child.tagName) ||
        this._hasChildBlockElement(child)
    );
  }
  _isPhrasingContent(node: Node): boolean {
    return (
      node.nodeType === this.TEXT_NODE ||
      this.PHRASING_ELEMS.includes((node as Element).tagName)
    );
  }

  _isWhitespace(node: Node): boolean {
    return (
      (node.nodeType === this.TEXT_NODE &&
        (node.textContent || "").trim().length === 0) ||
      (node.nodeType === this.ELEMENT_NODE && (node as Element).tagName === "BR")
    );
  }

  _getCharCount(e: Element, s = ","): number {
    return this._getInnerText(e).split(s).length - 1;
  }

  _flagIsActive(flag: number): boolean {
    return (this._flags & flag) > 0;
  }

  _removeFlag(flag: number) {
    this._flags &= ~flag;
  }
}

interface ReadabilityOptions {
  debug: boolean;
  maxElemsToParse: number;
  nbTopCandidates: number;
  charThreshold: number;
  classesToPreserve: string[];
  keepClasses: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serializer: (el: Element) => any;
  disableJSONLD: boolean;
  allowedVideoRegex: RegExp;
}

export function getMainContent(doc: Document): HTMLElement | null {
  const readability = new Readability(doc);
  return readability._grabArticle(doc.body);
}

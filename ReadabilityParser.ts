/**
 * This is a TypeScript port of the full Arc90 Readability algorithm.
 * Based on the Readability.js source provided.
 */

export interface ReadabilityOptions {
  debug?: boolean;
  maxElemsToParse?: number;
  nbTopCandidates?: number;
  charThreshold?: number;
  classesToPreserve?: string[];
  keepClasses?: boolean;
  disableJSONLD?: boolean;
  allowedVideoRegex?: RegExp;
  linkDensityModifier?: number;
  serializer?: (el: Node) => string;
}

export interface ReadabilityResult {
  title: string;
  byline: string | null;
  dir: string | null;
  lang: string | null;
  content: string;
  textContent: string;
  length: number;
  excerpt: string | null;
  siteName: string | null;
  publishedTime: string | null;
  node: HTMLElement; // The extracted DOM element
}

interface ScoredElement extends HTMLElement {
  readability?: {
    contentScore: number;
  };
}

export class ReadabilityParser {
  private _doc: Document;
  private _articleTitle: string | null = null;
  private _articleByline: string | null = null;
  private _articleDir: string | null = null;
  private _articleSiteName: string | null = null;
  private _articleLang: string | null = null;
  private _attempts: { articleContent: HTMLElement; textLength: number }[] = [];
  private _debug: boolean;
  private _metadata: any = {};
  private _flags: number;

  // Options
  private _maxElemsToParse: number;
  private _nbTopCandidates: number;
  private _charThreshold: number;
  private _classesToPreserve: string[];
  private _keepClasses: boolean;
  private _disableJSONLD: boolean;
  private _allowedVideoRegex: RegExp;
  private _linkDensityModifier: number;
  private _serializer: (el: Node) => string;

  // Constants
  static readonly FLAG_STRIP_UNLIKELYS = 0x1;
  static readonly FLAG_WEIGHT_CLASSES = 0x2;
  static readonly FLAG_CLEAN_CONDITIONALLY = 0x4;

  static readonly ELEMENT_NODE = 1;
  static readonly TEXT_NODE = 3;

  static readonly DEFAULT_MAX_ELEMS_TO_PARSE = 0;
  static readonly DEFAULT_N_TOP_CANDIDATES = 5;
  static readonly DEFAULT_TAGS_TO_SCORE = [
    'SECTION',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'P',
    'TD',
    'PRE',
  ];
  static readonly DEFAULT_CHAR_THRESHOLD = 500;

  static readonly REGEXPS = {
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

  static readonly UNLIKELY_ROLES = [
    'menu',
    'menubar',
    'complementary',
    'navigation',
    'alert',
    'alertdialog',
    'dialog',
  ];

  static readonly DIV_TO_P_ELEMS = new Set([
    'BLOCKQUOTE',
    'DL',
    'DIV',
    'IMG',
    'OL',
    'P',
    'PRE',
    'TABLE',
    'UL',
  ]);

  static readonly ALTER_TO_DIV_EXCEPTIONS = [
    'DIV',
    'ARTICLE',
    'SECTION',
    'P',
    'OL',
    'UL',
  ];

  static readonly PRESENTATIONAL_ATTRIBUTES = [
    'align',
    'background',
    'bgcolor',
    'border',
    'cellpadding',
    'cellspacing',
    'frame',
    'hspace',
    'rules',
    'style',
    'valign',
    'vspace',
  ];

  static readonly DEPRECATED_SIZE_ATTRIBUTE_ELEMS = [
    'TABLE',
    'TH',
    'TD',
    'HR',
    'PRE',
  ];

  static readonly PHRASING_ELEMS = [
    'ABBR',
    'AUDIO',
    'B',
    'BDO',
    'BR',
    'BUTTON',
    'CITE',
    'CODE',
    'DATA',
    'DATALIST',
    'DFN',
    'EM',
    'EMBED',
    'I',
    'IMG',
    'INPUT',
    'KBD',
    'LABEL',
    'MARK',
    'MATH',
    'METER',
    'NOSCRIPT',
    'OBJECT',
    'OUTPUT',
    'PROGRESS',
    'Q',
    'RUBY',
    'SAMP',
    'SCRIPT',
    'SELECT',
    'SMALL',
    'SPAN',
    'STRONG',
    'SUB',
    'SUP',
    'TEXTAREA',
    'TIME',
    'VAR',
    'WBR',
  ];

  static readonly CLASSES_TO_PRESERVE = ['page'];

  static readonly HTML_ESCAPE_MAP: Record<string, string> = {
    lt: '<',
    gt: '>',
    amp: '&',
    quot: '"',
    apos: "'",
  };

  constructor(doc: Document, options: ReadabilityOptions = {}) {
    this._doc = doc;
    this._debug = !!options.debug;
    this._maxElemsToParse =
      options.maxElemsToParse || ReadabilityParser.DEFAULT_MAX_ELEMS_TO_PARSE;
    this._nbTopCandidates =
      options.nbTopCandidates || ReadabilityParser.DEFAULT_N_TOP_CANDIDATES;
    this._charThreshold =
      options.charThreshold || ReadabilityParser.DEFAULT_CHAR_THRESHOLD;
    this._classesToPreserve = ReadabilityParser.CLASSES_TO_PRESERVE.concat(
      options.classesToPreserve || []
    );
    this._keepClasses = !!options.keepClasses;
    this._serializer =
      options.serializer ||
      ((el: Node) => (el as HTMLElement).innerHTML || '');
    this._disableJSONLD = !!options.disableJSONLD;
    this._allowedVideoRegex =
      options.allowedVideoRegex || ReadabilityParser.REGEXPS.videos;
    this._linkDensityModifier = options.linkDensityModifier || 0;

    this._flags =
      ReadabilityParser.FLAG_STRIP_UNLIKELYS |
      ReadabilityParser.FLAG_WEIGHT_CLASSES |
      ReadabilityParser.FLAG_CLEAN_CONDITIONALLY;
  }

  private log(...args: any[]) {
    if (this._debug) {
      console.log('Readability:', ...args);
    }
  }

  public parse(): ReadabilityResult | null {
    if (this._maxElemsToParse > 0) {
      const numTags = this._doc.getElementsByTagName('*').length;
      if (numTags > this._maxElemsToParse) {
        throw new Error('Aborting parsing document; ' + numTags + ' elements found');
      }
    }

    this._unwrapNoscriptImages(this._doc);
    const jsonLd = this._disableJSONLD ? {} : this._getJSONLD(this._doc);
    this._removeScripts(this._doc);
    this._prepDocument();

    const metadata = this._getArticleMetadata(jsonLd);
    this._metadata = metadata;
    this._articleTitle = metadata.title;

    const articleContent = this._grabArticle();
    if (!articleContent) return null;

    this.log('Grabbed:', articleContent.innerHTML);

    this._postProcessContent(articleContent);

    if (!metadata.excerpt) {
      const paragraphs = articleContent.getElementsByTagName('p');
      if (paragraphs.length) {
        metadata.excerpt = paragraphs[0].textContent?.trim() || null;
      }
    }

    const textContent = articleContent.textContent || '';
    return {
      title: this._articleTitle || '',
      byline: metadata.byline || this._articleByline,
      dir: this._articleDir,
      lang: this._articleLang,
      content: this._serializer(articleContent),
      textContent,
      length: textContent.length,
      excerpt: metadata.excerpt || null,
      siteName: metadata.siteName || this._articleSiteName,
      publishedTime: metadata.publishedTime || null,
      node: articleContent,
    };
  }

  private _postProcessContent(articleContent: HTMLElement) {
    this._fixRelativeUris(articleContent);
    this._simplifyNestedElements(articleContent);
    if (!this._keepClasses) {
      this._cleanClasses(articleContent);
    }
  }

  private _removeNodes(
    nodeList: NodeListOf<Element> | Element[],
    filterFn?: (node: Element) => boolean
  ) {
    const nodes = Array.from(nodeList);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const parentNode = node.parentNode;
      if (parentNode) {
        if (!filterFn || filterFn(node)) {
          parentNode.removeChild(node);
        }
      }
    }
  }

  private _replaceNodeTags(
    nodeList: NodeListOf<Element> | Element[],
    newTagName: string
  ) {
    const nodes = Array.from(nodeList);
    for (const node of nodes) {
      this._setNodeTag(node as HTMLElement, newTagName);
    }
  }

  private _forEachNode(
    nodeList: NodeListOf<Element> | Element[] | HTMLCollection,
    fn: (node: Element) => void
  ) {
    Array.from(nodeList).forEach((node) => fn(node as Element));
  }

  private _someNode(
    nodeList: NodeListOf<Node> | Node[] | NodeListOf<any>,
    fn: (node: Node) => boolean
  ): boolean {
    return (Array.from(nodeList as any) as Node[]).some((node) => fn(node));
  }

  private _everyNode(
    nodeList: NodeListOf<Node> | Node[] | NodeListOf<any>,
    fn: (node: Node) => boolean
  ): boolean {
    return (Array.from(nodeList as any) as Node[]).every((node) => fn(node));
  }

  private _getAllNodesWithTag(node: Element | Document, tagNames: string[]) {
    if ((node as Element).querySelectorAll) {
      return (node as Element).querySelectorAll(tagNames.join(','));
    }
    return [].concat.apply(
      [],
      tagNames.map((tag) => {
        const collection = node.getElementsByTagName(tag);
        return Array.from(collection) as any;
      })
    ) as any as NodeListOf<Element>;
  }

  private _cleanClasses(node: Element) {
    const classesToPreserve = this._classesToPreserve;
    const className = (node.getAttribute('class') || '')
      .split(/\s+/)
      .filter((cls) => classesToPreserve.includes(cls))
      .join(' ');

    if (className) {
      node.setAttribute('class', className);
    } else {
      node.removeAttribute('class');
    }

    let child = node.firstElementChild;
    while (child) {
      this._cleanClasses(child);
      child = child.nextElementSibling;
    }
  }

  private _fixRelativeUris(articleContent: HTMLElement) {
    const baseURI = this._doc.baseURI;
    const documentURI = this._doc.documentURI;
    
    const toAbsoluteURI = (uri: string) => {
      if (baseURI === documentURI && uri.charAt(0) === '#') {
        return uri;
      }
      try {
        return new URL(uri, baseURI).href;
      } catch (ex) {
        return uri;
      }
    };

    const links = this._getAllNodesWithTag(articleContent, ['a']);
    this._forEachNode(links, (link) => {
      const href = link.getAttribute('href');
      if (href) {
        if (href.indexOf('javascript:') === 0) {
          if (
            link.childNodes.length === 1 &&
            link.childNodes[0].nodeType === ReadabilityParser.TEXT_NODE
          ) {
            const text = this._doc.createTextNode(link.textContent || '');
            link.parentNode?.replaceChild(text, link);
          } else {
            const container = this._doc.createElement('span');
            while (link.firstChild) {
              container.appendChild(link.firstChild);
            }
            link.parentNode?.replaceChild(container, link);
          }
        } else {
          link.setAttribute('href', toAbsoluteURI(href));
        }
      }
    });

    const medias = this._getAllNodesWithTag(articleContent, [
      'img',
      'picture',
      'figure',
      'video',
      'audio',
      'source',
    ]);
    this._forEachNode(medias, (media) => {
      const src = media.getAttribute('src');
      const poster = media.getAttribute('poster');
      const srcset = media.getAttribute('srcset');

      if (src) media.setAttribute('src', toAbsoluteURI(src));
      if (poster) media.setAttribute('poster', toAbsoluteURI(poster));
      if (srcset) {
        const newSrcset = srcset.replace(
          ReadabilityParser.REGEXPS.srcsetUrl,
          (_, p1, p2, p3) => toAbsoluteURI(p1) + (p2 || '') + p3
        );
        media.setAttribute('srcset', newSrcset);
      }
    });
  }

  private _simplifyNestedElements(articleContent: HTMLElement) {
    let node: Node | null = articleContent;
    while (node) {
      if (
        node.nodeType === ReadabilityParser.ELEMENT_NODE &&
        node.parentNode &&
        ['DIV', 'SECTION'].includes((node as HTMLElement).tagName) &&
        !(((node as HTMLElement).id && (node as HTMLElement).id.startsWith('readability')))
      ) {
        const element = node as HTMLElement;
        if (this._isElementWithoutContent(element)) {
          node = this._removeAndGetNext(element);
          continue;
        } else if (
          this._hasSingleTagInsideElement(element, 'DIV') ||
          this._hasSingleTagInsideElement(element, 'SECTION')
        ) {
          const child = element.children[0];
          for (let i = 0; i < element.attributes.length; i++) {
            child.setAttributeNode(element.attributes[i].cloneNode(true) as Attr);
          }
          element.parentNode?.replaceChild(child, element);
          node = child as HTMLElement;
          continue;
        }
      }
      node = this._getNextNode(node);
    }
  }

  private _getArticleTitle() {
    let curTitle = '';
    let origTitle = '';

    try {
      curTitle = origTitle = this._doc.title.trim();

      if (typeof curTitle !== 'string') {
        curTitle = origTitle = this._getInnerText(
          this._doc.getElementsByTagName('title')[0] as HTMLElement
        );
      }
    } catch (e) { /* ignore */ }

    let titleHadHierarchicalSeparators = false;
    const wordCount = (str: string) => str.split(/\s+/).length;

    // Matches: | - – — \ / > »
    const titleSeparators = /\|\-–—\\\/>»/.source;
    
    // Original uses no flags for the test check
    if (new RegExp(`\\s[${titleSeparators}]\\s`).test(curTitle)) {
      titleHadHierarchicalSeparators = /\s[\\\/>»]\s/.test(curTitle);
      const allSeparators = Array.from(
        origTitle.matchAll(new RegExp(`\\s[${titleSeparators}]\\s`, 'gi'))
      );
      
      if(allSeparators.length > 0) {
        const lastSeparator = allSeparators[allSeparators.length - 1];
        if(lastSeparator && lastSeparator.index !== undefined) {
             curTitle = origTitle.substring(0, lastSeparator.index);
        }
      }

      if (wordCount(curTitle) < 3) {
        curTitle = origTitle.replace(
          new RegExp(`^[^${titleSeparators}]*[${titleSeparators}]`, 'gi'),
          ''
        );
      }
    } else if (curTitle.includes(': ')) {
      const headings = this._getAllNodesWithTag(this._doc, ['h1', 'h2']);
      const trimmedTitle = curTitle.trim();
      const match = this._someNode(headings, (heading) => {
        return heading.textContent?.trim() === trimmedTitle;
      });

      if (!match) {
        curTitle = origTitle.substring(origTitle.lastIndexOf(':') + 1);
        if (wordCount(curTitle) < 3) {
          curTitle = origTitle.substring(origTitle.indexOf(':') + 1);
        } else if (wordCount(origTitle.substr(0, origTitle.indexOf(':'))) > 5) {
          curTitle = origTitle;
        }
      }
    } else if (curTitle.length > 150 || curTitle.length < 15) {
      const hOnes = this._doc.getElementsByTagName('h1');
      if (hOnes.length === 1) {
        curTitle = this._getInnerText(hOnes[0] as HTMLElement);
      }
    }

    curTitle = curTitle.trim().replace(ReadabilityParser.REGEXPS.normalize, ' ');
    const curTitleWordCount = wordCount(curTitle);
    
    if (
      curTitleWordCount <= 4 &&
      (!titleHadHierarchicalSeparators ||
        curTitleWordCount !==
          wordCount(
            origTitle.replace(new RegExp(`\\s[${titleSeparators}]\\s`, 'g'), '')
          ) -
            1)
    ) {
      curTitle = origTitle;
    }

    return curTitle;
  }

  private _prepDocument() {
    this._removeNodes(this._getAllNodesWithTag(this._doc, ['style']));
    if (this._doc.body) {
      this._replaceBrs(this._doc.body);
    }
    this._replaceNodeTags(this._getAllNodesWithTag(this._doc, ['font']), 'SPAN');
  }

  private _nextNode(node: Node) {
    let next = node;
    while (
      next &&
      next.nodeType !== ReadabilityParser.ELEMENT_NODE &&
      ReadabilityParser.REGEXPS.whitespace.test(next.textContent || '')
    ) {
      next = next.nextSibling as Node;
    }
    return next;
  }

  private _replaceBrs(elem: Element) {
    this._forEachNode(this._getAllNodesWithTag(elem, ['br']), (br) => {
      let next: Node | null = br.nextSibling;
      let replaced = false;

      while ((next = this._nextNode(next as Node)) && (next as Element).tagName === 'BR') {
        replaced = true;
        const brSibling = next.nextSibling;
        (next as Element).remove();
        next = brSibling;
      }

      if (replaced && br.parentNode) {
        const p = this._doc.createElement('p');
        br.parentNode.replaceChild(p, br);
        next = p.nextSibling;
        while (next) {
          if ((next as Element).tagName === 'BR') {
            const nextElem = this._nextNode(next.nextSibling as Node);
            if (nextElem && (nextElem as Element).tagName === 'BR') break;
          }
          if (!this._isPhrasingContent(next)) break;
          const sibling = next.nextSibling;
          p.appendChild(next);
          next = sibling;
        }
        while (p.lastChild && this._isWhitespace(p.lastChild)) {
          p.removeChild(p.lastChild);
        }
        if (p.parentNode && (p.parentNode as Element).tagName === 'P') {
          this._setNodeTag(p.parentNode as HTMLElement, 'DIV');
        }
      }
    });
  }

  private _setNodeTag(node: HTMLElement, tag: string) {
    const replacement = node.ownerDocument.createElement(tag);
    while (node.firstChild) {
      replacement.appendChild(node.firstChild);
    }
    node.parentNode?.replaceChild(replacement, node);
    if ((node as ScoredElement).readability) {
      (replacement as ScoredElement).readability = (node as ScoredElement).readability;
    }
    for (let i = 0; i < node.attributes.length; i++) {
      replacement.setAttributeNode(node.attributes[i].cloneNode(true) as Attr);
    }
    return replacement;
  }

  private _prepArticle(articleContent: HTMLElement) {
    this._cleanStyles(articleContent);
    this._markDataTables(articleContent);
    this._fixLazyImages(articleContent);
    this._cleanConditionally(articleContent, 'form');
    this._cleanConditionally(articleContent, 'fieldset');
    this._clean(articleContent, 'object');
    this._clean(articleContent, 'embed');
    this._clean(articleContent, 'footer');
    this._clean(articleContent, 'link');
    this._clean(articleContent, 'aside');

    const shareElementThreshold = this._charThreshold;
    this._forEachNode(articleContent.children, (topCandidate) => {
      this._cleanMatchedNodes(topCandidate, (node, matchString) => {
        return (
          ReadabilityParser.REGEXPS.shareElements.test(matchString) &&
          (node.textContent || '').length < shareElementThreshold
        );
      });
    });

    this._clean(articleContent, 'iframe');
    this._clean(articleContent, 'input');
    this._clean(articleContent, 'textarea');
    this._clean(articleContent, 'select');
    this._clean(articleContent, 'button');
    this._cleanHeaders(articleContent);

    this._cleanConditionally(articleContent, 'table');
    this._cleanConditionally(articleContent, 'ul');
    this._cleanConditionally(articleContent, 'div');

    this._replaceNodeTags(this._getAllNodesWithTag(articleContent, ['h1']), 'h2');

    this._removeNodes(this._getAllNodesWithTag(articleContent, ['p']), (paragraph) => {
      const contentElementCount = this._getAllNodesWithTag(paragraph, [
        'img', 'embed', 'object', 'iframe',
      ]).length;
      return (
        contentElementCount === 0 && !this._getInnerText(paragraph as HTMLElement, false)
      );
    });

    this._forEachNode(this._getAllNodesWithTag(articleContent, ['br']), (br) => {
      const next = this._nextNode(br.nextSibling as Node);
      if (next && (next as Element).tagName === 'P') {
        br.remove();
      }
    });

    this._forEachNode(this._getAllNodesWithTag(articleContent, ['table']), (table) => {
      const tbody = this._hasSingleTagInsideElement(table as HTMLElement, 'TBODY')
        ? table.firstElementChild
        : table;
      if (this._hasSingleTagInsideElement(tbody as HTMLElement, 'TR')) {
        const row = tbody!.firstElementChild;
        if (this._hasSingleTagInsideElement(row as HTMLElement, 'TD')) {
          let cell = row!.firstElementChild as HTMLElement;
          cell = this._setNodeTag(
            cell,
            this._everyNode(cell.childNodes, this._isPhrasingContent.bind(this))
              ? 'P'
              : 'DIV'
          );
          table.parentNode?.replaceChild(cell, table);
        }
      }
    });
  }

  private _initializeNode(node: ScoredElement) {
    node.readability = { contentScore: 0 };
    switch (node.tagName) {
      case 'DIV':
        node.readability.contentScore += 5;
        break;
      case 'PRE':
      case 'TD':
      case 'BLOCKQUOTE':
        node.readability.contentScore += 3;
        break;
      case 'ADDRESS':
      case 'OL':
      case 'UL':
      case 'DL':
      case 'DD':
      case 'DT':
      case 'LI':
      case 'FORM':
        node.readability.contentScore -= 3;
        break;
      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
      case 'H5':
      case 'H6':
      case 'TH':
        node.readability.contentScore -= 5;
        break;
    }
    node.readability.contentScore += this._getClassWeight(node);
  }

  private _removeAndGetNext(node: Node) {
    const nextNode = this._getNextNode(node, true);
    node.parentNode?.removeChild(node);
    return nextNode;
  }

  private _getNextNode(node: Node, ignoreSelfAndKids = false): Node | null {
    if (!ignoreSelfAndKids && (node as Element).firstElementChild) {
      return (node as Element).firstElementChild;
    }
    if (node.nextSibling) {
      return node.nextSibling;
    }
    let temp: Node | null = node;
    do {
      temp = temp.parentNode;
    } while (temp && !temp.nextSibling);
    return temp ? temp.nextSibling : null;
  }

  private _textSimilarity(textA: string, textB: string) {
    const tokensA = textA.toLowerCase().split(ReadabilityParser.REGEXPS.tokenize).filter(Boolean);
    const tokensB = textB.toLowerCase().split(ReadabilityParser.REGEXPS.tokenize).filter(Boolean);
    if (!tokensA.length || !tokensB.length) return 0;
    const uniqTokensB = tokensB.filter((token) => !tokensA.includes(token));
    const distanceB = uniqTokensB.join(' ').length / tokensB.join(' ').length;
    return 1 - distanceB;
  }

  private _isValidByline(node: HTMLElement, matchString: string) {
    if(!node.getAttribute) return false;
    const rel = node.getAttribute("rel");
    const itemprop = node.getAttribute("itemprop");
    const bylineLength = (node.textContent || "").trim().length;

    return (
      (rel === "author" ||
        (itemprop && itemprop.indexOf("author") !== -1) ||
        ReadabilityParser.REGEXPS.byline.test(matchString)) &&
      !!bylineLength &&
      bylineLength < 100
    );
  }

  private _getNodeAncestors(node: Node, maxDepth = 0): Element[] {
    let i = 0;
    const ancestors: Element[] = [];
    let parent = node.parentNode;
    while (parent && parent.nodeType === ReadabilityParser.ELEMENT_NODE) {
      ancestors.push(parent as Element);
      if (maxDepth && ++i === maxDepth) break;
      parent = parent.parentNode;
    }
    return ancestors;
  }

  private _grabArticle(page?: HTMLElement): HTMLElement | null {
    this.log('**** grabArticle ****');
    const doc = this._doc;
    const isPaging = page !== undefined;
    page = page ? page : this._doc.body;

    if (!page) {
      this.log('No body found in document. Abort.');
      return null;
    }

    const pageCacheHtml = page.innerHTML;

    // Retry loop
    while (true) {
      const stripUnlikelyCandidates = this._flagIsActive(ReadabilityParser.FLAG_STRIP_UNLIKELYS);
      const elementsToScore: ScoredElement[] = [];
      let node: Node | null = this._doc.documentElement;
      let shouldRemoveTitleHeader = true;

      while (node) {
        if(node.nodeType === ReadabilityParser.ELEMENT_NODE && (node as Element).tagName === 'HTML') {
             this._articleLang = (node as Element).getAttribute('lang');
        }
        
        const matchString = (node.nodeType === ReadabilityParser.ELEMENT_NODE) 
            ? ((node as Element).className || '') + ' ' + ((node as Element).id || '') 
            : '';

        if(node.nodeType === ReadabilityParser.ELEMENT_NODE && !this._isProbablyVisible(node as HTMLElement)) {
             this.log('Removing hidden node - ' + matchString);
             node = this._removeAndGetNext(node);
             continue;
        }

        if (
            node.nodeType === ReadabilityParser.ELEMENT_NODE &&
            !this._articleByline &&
            !this._metadata.byline &&
            this._isValidByline(node as HTMLElement, matchString)
        ) {
             const element = node as HTMLElement;
             const endOfSearchMarkerNode = this._getNextNode(element, true);
             let next = this._getNextNode(element);
             let itemPropNameNode: Node | null = null;
             
             while (next && next !== endOfSearchMarkerNode) {
                 if (next.nodeType === ReadabilityParser.ELEMENT_NODE) {
                    const itemprop = (next as Element).getAttribute('itemprop');
                    if (itemprop && itemprop.indexOf('name') !== -1) {
                        itemPropNameNode = next;
                        break;
                    }
                 }
                 next = this._getNextNode(next);
             }
             
             this._articleByline = (itemPropNameNode || element).textContent?.trim() || "";
             node = this._removeAndGetNext(node);
             continue;
        }

        if (node.nodeType === ReadabilityParser.ELEMENT_NODE && shouldRemoveTitleHeader && this._headerDuplicatesTitle(node as HTMLElement)) {
             this.log('Removing header: ', node.textContent?.trim(), this._articleTitle?.trim());
             shouldRemoveTitleHeader = false;
             node = this._removeAndGetNext(node);
             continue;
        }

        if (stripUnlikelyCandidates && node.nodeType === ReadabilityParser.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (
            ReadabilityParser.REGEXPS.unlikelyCandidates.test(matchString) &&
            !ReadabilityParser.REGEXPS.okMaybeItsACandidate.test(matchString) &&
            !this._hasAncestorTag(element, 'table') &&
            !this._hasAncestorTag(element, 'code') &&
            element.tagName !== 'BODY' &&
            element.tagName !== 'A'
          ) {
            this.log('Removing unlikely candidate - ' + matchString);
            node = this._removeAndGetNext(node);
            continue;
          }
           if (element.getAttribute && ReadabilityParser.UNLIKELY_ROLES.includes(element.getAttribute('role') || '')) {
            this.log('Removing content with role ' + element.getAttribute('role') + ' - ' + matchString);
            node = this._removeAndGetNext(node);
            continue;
          }
        }

        if (
          node.nodeType === ReadabilityParser.ELEMENT_NODE &&
          ['DIV', 'SECTION', 'HEADER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes((node as Element).tagName) &&
          this._isElementWithoutContent(node as HTMLElement)
        ) {
          node = this._removeAndGetNext(node);
          continue;
        }

        if (node.nodeType === ReadabilityParser.ELEMENT_NODE && ReadabilityParser.DEFAULT_TAGS_TO_SCORE.includes((node as Element).tagName)) {
          elementsToScore.push(node as ScoredElement);
        }

        if (node.nodeType === ReadabilityParser.ELEMENT_NODE && (node as Element).tagName === 'DIV') {
          const element = node as HTMLElement;
          let childNode = element.firstChild;
          while (childNode) {
            let nextSibling = childNode.nextSibling;
            if (this._isPhrasingContent(childNode)) {
              const fragment = doc.createDocumentFragment();
              do {
                nextSibling = childNode.nextSibling;
                fragment.appendChild(childNode);
                childNode = nextSibling;
              } while (childNode && this._isPhrasingContent(childNode));

              if (fragment.firstChild) {
                const p = doc.createElement('p');
                p.appendChild(fragment);
                element.insertBefore(p, nextSibling);
              }
            }
            childNode = nextSibling;
          }

          if (this._hasSingleTagInsideElement(element, 'P') && this._getLinkDensity(element) < 0.25) {
             const newNode = element.children[0] as HTMLElement;
             element.parentNode?.replaceChild(newNode, element);
             node = newNode;
             elementsToScore.push(node as ScoredElement);
          } else if (!this._hasChildBlockElement(element)) {
             node = this._setNodeTag(element, 'P');
             elementsToScore.push(node as ScoredElement);
          }
        }
        node = this._getNextNode(node);
      }

      const candidates: ScoredElement[] = [];
      this._forEachNode(elementsToScore, (elementToScore) => {
         const elem = elementToScore as ScoredElement;
         if(!elem.parentNode || typeof (elem.parentNode as Element).tagName === 'undefined') return;

         const innerText = this._getInnerText(elem);
         if(innerText.length < 25) return;

         const ancestors = this._getNodeAncestors(elem, 5);
         if(ancestors.length === 0) return;

         let contentScore = 0;
         contentScore += 1;
         contentScore += innerText.split(ReadabilityParser.REGEXPS.commas).length;
         contentScore += Math.min(Math.floor(innerText.length / 100), 3);

         this._forEachNode(ancestors, (ancestor) => {
             const anc = ancestor as ScoredElement;
             if(!anc.tagName || !anc.parentNode) return;
             if(typeof anc.readability === 'undefined') {
                 this._initializeNode(anc);
                 candidates.push(anc);
             }
             let scoreDivider = 1; // Default for parent
             // We can't easily track level in forEach, so simple check:
             if (anc === elem.parentNode) scoreDivider = 1;
             else if (anc === elem.parentNode?.parentNode) scoreDivider = 2;
             else scoreDivider = 3;
             anc.readability!.contentScore += contentScore / scoreDivider;
         });
      });

      const topCandidates: ScoredElement[] = [];
      for(let c = 0; c < candidates.length; c++) {
          const candidate = candidates[c];
          const candidateScore = candidate.readability!.contentScore * (1 - this._getLinkDensity(candidate));
          candidate.readability!.contentScore = candidateScore;

          for(let t=0; t < this._nbTopCandidates; t++) {
              const aTopCandidate = topCandidates[t];
              if(!aTopCandidate || candidateScore > aTopCandidate.readability!.contentScore) {
                  topCandidates.splice(t, 0, candidate);
                  if(topCandidates.length > this._nbTopCandidates) {
                      topCandidates.pop();
                  }
                  break;
              }
          }
      }

      let topCandidate = topCandidates[0] || null;
      let neededToCreateTopCandidate = false;
      let parentOfTopCandidate: HTMLElement | null = null;

      if(topCandidate === null || topCandidate.tagName === 'BODY') {
          topCandidate = doc.createElement('DIV');
          neededToCreateTopCandidate = true;
          while(page.firstChild) {
              topCandidate.appendChild(page.firstChild);
          }
          page.appendChild(topCandidate);
          this._initializeNode(topCandidate);
      } else if (topCandidate) {
          // Find better top candidate using full logic
          const alternativeCandidateAncestors: Element[][] = [];
          for (let i = 1; i < topCandidates.length; i++) {
            if ((topCandidates[i].readability!.contentScore / topCandidate.readability!.contentScore) >= 0.75) {
                alternativeCandidateAncestors.push(this._getNodeAncestors(topCandidates[i]));
            }
          }

          const MINIMUM_TOPCANDIDATES = 3;
          if (alternativeCandidateAncestors.length >= MINIMUM_TOPCANDIDATES) {
              parentOfTopCandidate = topCandidate.parentNode as HTMLElement;
              while (parentOfTopCandidate && parentOfTopCandidate.tagName !== 'BODY') {
                  let listsContainingThisAncestor = 0;
                  for (let ancestorIndex = 0; ancestorIndex < alternativeCandidateAncestors.length && listsContainingThisAncestor < MINIMUM_TOPCANDIDATES; ancestorIndex++) {
                      // .includes on Element[]
                      if (alternativeCandidateAncestors[ancestorIndex].includes(parentOfTopCandidate)) {
                          listsContainingThisAncestor++;
                      }
                  }
                  if (listsContainingThisAncestor >= MINIMUM_TOPCANDIDATES) {
                      topCandidate = parentOfTopCandidate;
                      break;
                  }
                  parentOfTopCandidate = parentOfTopCandidate.parentNode as HTMLElement;
              }
          }

          if (!(topCandidate as ScoredElement).readability) {
              this._initializeNode(topCandidate);
          }

          // Bonus system for parents
          parentOfTopCandidate = topCandidate.parentNode as HTMLElement;
          let lastScore = topCandidate.readability!.contentScore;
          const scoreThreshold = lastScore / 3;

          while(parentOfTopCandidate && parentOfTopCandidate.tagName !== 'BODY') {
             if(!(parentOfTopCandidate as ScoredElement).readability) {
                 parentOfTopCandidate = parentOfTopCandidate.parentNode as HTMLElement;
                 continue;
             }
             const parentScore = (parentOfTopCandidate as ScoredElement).readability!.contentScore;
             if(parentScore < scoreThreshold) break;
             if(parentScore > lastScore) {
                 topCandidate = parentOfTopCandidate;
                 break;
             }
             lastScore = (parentOfTopCandidate as ScoredElement).readability!.contentScore;
             parentOfTopCandidate = parentOfTopCandidate.parentNode as HTMLElement;
          }
          
          parentOfTopCandidate = topCandidate.parentNode as HTMLElement;
          while (parentOfTopCandidate && parentOfTopCandidate.tagName !== 'BODY' && parentOfTopCandidate.children.length === 1) {
              topCandidate = parentOfTopCandidate;
              parentOfTopCandidate = topCandidate.parentNode as HTMLElement;
          }
          
          if (!(topCandidate as ScoredElement).readability) {
              this._initializeNode(topCandidate);
          }
      }

      const articleContent = doc.createElement('DIV');
      if(isPaging) articleContent.id = 'readability-content';

      const siblingScoreThreshold = Math.max(10, topCandidate.readability!.contentScore * 0.2);
      parentOfTopCandidate = topCandidate.parentNode as HTMLElement;
      const siblings = parentOfTopCandidate ? Array.from(parentOfTopCandidate.children) : [topCandidate];

      for(let s = 0; s < siblings.length; s++) {
          let sibling = siblings[s] as ScoredElement;
          let append = false;

          if(sibling === topCandidate) {
              append = true;
          } else {
              let contentBonus = 0;
              if (sibling.className === topCandidate.className && topCandidate.className !== '') {
                  contentBonus += topCandidate.readability!.contentScore * 0.2;
              }
              if(sibling.readability && ((sibling.readability.contentScore + contentBonus) >= siblingScoreThreshold)) {
                  append = true;
              } else if (sibling.nodeName === 'P') {
                  const linkDensity = this._getLinkDensity(sibling);
                  const nodeContent = this._getInnerText(sibling);
                  const nodeLength = nodeContent.length;
                  if(nodeLength > 80 && linkDensity < 0.25) {
                      append = true;
                  } else if (nodeLength < 80 && nodeLength > 0 && linkDensity === 0 && nodeContent.search(/\.( |$)/) !== -1) {
                      append = true;
                  }
              }
          }

          if(append) {
             if(!ReadabilityParser.ALTER_TO_DIV_EXCEPTIONS.includes(sibling.nodeName)) {
                 sibling = this._setNodeTag(sibling, 'DIV');
             }
             articleContent.appendChild(sibling);
          }
      }

      this._prepArticle(articleContent);

      if (neededToCreateTopCandidate) {
          topCandidate.id = 'readability-page-1';
          topCandidate.className = 'page';
      } else {
          const div = doc.createElement('DIV');
          div.id = 'readability-page-1';
          div.className = 'page';
          while(articleContent.firstChild) {
              div.appendChild(articleContent.firstChild);
          }
          articleContent.appendChild(div);
      }

      const parseSuccessful = true;
      const textLength = this._getInnerText(articleContent, true).length;
      
      if(textLength < this._charThreshold) {
          page.innerHTML = pageCacheHtml;
          this._attempts.push({ articleContent, textLength });
          
          if(this._flagIsActive(ReadabilityParser.FLAG_STRIP_UNLIKELYS)) {
              this._removeFlag(ReadabilityParser.FLAG_STRIP_UNLIKELYS);
          } else if (this._flagIsActive(ReadabilityParser.FLAG_WEIGHT_CLASSES)) {
              this._removeFlag(ReadabilityParser.FLAG_WEIGHT_CLASSES);
          } else if (this._flagIsActive(ReadabilityParser.FLAG_CLEAN_CONDITIONALLY)) {
              this._removeFlag(ReadabilityParser.FLAG_CLEAN_CONDITIONALLY);
          } else {
              this._attempts.sort((a,b) => b.textLength - a.textLength);
              if(!this._attempts[0].textLength) return null;
              return this._attempts[0].articleContent;
          }
      } else {
           return articleContent;
      }
    }
  }

  private _getJSONLD(doc: Document) {
    const scripts = this._getAllNodesWithTag(doc, ['script']);
    let metadata: any;
    this._forEachNode(scripts, (jsonLdElement) => {
        if(!metadata && jsonLdElement.getAttribute('type') === 'application/ld+json') {
            try {
                const content = jsonLdElement.textContent?.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '') || "";
                let parsed = JSON.parse(content);
                if(Array.isArray(parsed)) {
                    parsed = parsed.find(it => it['@type'] && it['@type'].match(ReadabilityParser.REGEXPS.jsonLdArticleTypes));
                    if(!parsed) return;
                }
                if(!parsed['@context'] || !parsed['@type'] || !parsed['@type'].match(ReadabilityParser.REGEXPS.jsonLdArticleTypes)) {
                    return;
                }
                metadata = {};
                if(typeof parsed.name === 'string') metadata.title = parsed.name.trim();
                else if (typeof parsed.headline === 'string') metadata.title = parsed.headline.trim();
                
                if(parsed.author) {
                     if(typeof parsed.author.name === 'string') metadata.byline = parsed.author.name.trim();
                }
                if(typeof parsed.description === 'string') metadata.excerpt = parsed.description.trim();
                if(parsed.publisher && typeof parsed.publisher.name === 'string') metadata.siteName = parsed.publisher.name.trim();
                if(typeof parsed.datePublished === 'string') metadata.publishedTime = parsed.datePublished.trim();

            } catch(err) { /* ignore */ }
        }
    });
    return metadata ? metadata : {};
  }

  private _getArticleMetadata(jsonld: any) {
    const metadata: any = {};
    const values: any = {};
    const metaElements = this._doc.getElementsByTagName('meta');

    this._forEachNode(metaElements, (element) => {
        const elementName = element.getAttribute('name');
        const elementProperty = element.getAttribute('property');
        const content = element.getAttribute('content');
        if(!content) return;
        let name = null;
        if(elementProperty) {
            const matches = elementProperty.match(/\s*(article|dc|dcterm|og|twitter)\s*:\s*(author|creator|description|published_time|title|site_name)\s*/gi);
            if(matches) name = matches[0].toLowerCase().replace(/\s/g, '');
        }
        if(!name && elementName) name = elementName;
        if(name) values[name] = content.trim();
    });

    metadata.title = jsonld.title || values['og:title'] || values['twitter:title'] || values['dc:title'] || this._getArticleTitle();
    metadata.byline = jsonld.byline || values['dc:creator'] || values['author'];
    metadata.excerpt = jsonld.excerpt || values['og:description'] || values['description'] || values['twitter:description'];
    metadata.siteName = jsonld.siteName || values['og:site_name'];
    metadata.publishedTime = jsonld.datePublished || values['article:published_time'];

    return metadata;
  }

  private _isSingleImage(node: Element) {
    if(node.tagName === 'IMG') return true;
    if(node.children.length !== 1 || node.textContent?.trim() !== '') return false;
    return this._isSingleImage(node.children[0]);
  }

  private _unwrapNoscriptImages(doc: Document) {
      const imgs = Array.from(doc.getElementsByTagName('img'));
      this._forEachNode(imgs, (img) => {
          for(let i=0; i<img.attributes.length; i++) {
              const attr = img.attributes[i];
              if(['src', 'srcset', 'data-src', 'data-srcset'].includes(attr.name)) return;
              if(/\.(jpg|jpeg|png|webp)/i.test(attr.value)) return;
          }
          img.remove();
      });
      const noscripts = Array.from(doc.getElementsByTagName('noscript'));
      this._forEachNode(noscripts, (noscript) => {
          if(!this._isSingleImage(noscript)) return;
          const tmp = doc.createElement('div');
          tmp.innerHTML = noscript.innerHTML;
          const prevElement = noscript.previousElementSibling;
          if(prevElement && this._isSingleImage(prevElement)) {
              let prevImg = prevElement;
              if(prevImg.tagName !== 'IMG') prevImg = prevElement.getElementsByTagName('img')[0];
              const newImg = tmp.getElementsByTagName('img')[0];
              for(let i=0; i<prevImg.attributes.length; i++) {
                  const attr = prevImg.attributes[i];
                  if(attr.value === '') continue;
                  if(['src','srcset'].includes(attr.name) || /\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
                      if(newImg.getAttribute(attr.name) === attr.value) continue;
                      let attrName = attr.name;
                      if(newImg.hasAttribute(attrName)) attrName = 'data-old-' + attrName;
                      newImg.setAttribute(attrName, attr.value);
                  }
              }
              noscript.parentNode?.replaceChild(tmp.firstElementChild!, prevElement);
          }
      });
  }

  private _removeScripts(doc: Document) {
    this._removeNodes(this._getAllNodesWithTag(doc, ['script', 'noscript']));
  }

  private _hasSingleTagInsideElement(element: HTMLElement, tag: string) {
    if (element.children.length !== 1 || element.children[0].tagName !== tag) {
      return false;
    }
    return !this._someNode(element.childNodes, (node) => {
      return (
        node.nodeType === ReadabilityParser.TEXT_NODE &&
        ReadabilityParser.REGEXPS.hasContent.test(node.textContent || '')
      );
    });
  }

  private _isElementWithoutContent(node: HTMLElement) {
    return (
      node.nodeType === ReadabilityParser.ELEMENT_NODE &&
      node.textContent?.trim().length === 0 &&
      (node.children.length === 0 ||
        node.children.length ===
          node.getElementsByTagName('br').length +
            node.getElementsByTagName('hr').length)
    );
  }

  private _hasChildBlockElement(element: HTMLElement) {
    return this._someNode(element.childNodes, (node) => {
      return (
        ReadabilityParser.DIV_TO_P_ELEMS.has((node as HTMLElement).tagName) ||
        this._hasChildBlockElement(node as HTMLElement)
      );
    });
  }

  private _isPhrasingContent(node: Node) {
    return (
      node.nodeType === ReadabilityParser.TEXT_NODE ||
      ReadabilityParser.PHRASING_ELEMS.includes((node as Element).tagName) ||
      ((['A', 'DEL', 'INS'].includes((node as Element).tagName)) &&
        this._everyNode(node.childNodes, this._isPhrasingContent.bind(this)))
    );
  }

  private _isWhitespace(node: Node) {
    return (
      (node.nodeType === ReadabilityParser.TEXT_NODE &&
        node.textContent?.trim().length === 0) ||
      (node.nodeType === ReadabilityParser.ELEMENT_NODE && (node as Element).tagName === 'BR')
    );
  }

  private _getInnerText(e: HTMLElement, normalizeSpaces = true) {
    const textContent = e.textContent?.trim() || '';
    if (normalizeSpaces) {
      return textContent.replace(ReadabilityParser.REGEXPS.normalize, ' ');
    }
    return textContent;
  }

  private _getCharCount(e: HTMLElement, s = ',') {
    return this._getInnerText(e).split(s).length - 1;
  }

  private _cleanStyles(e: HTMLElement) {
    if (!e || e.tagName.toLowerCase() === 'svg') return;
    for (let i = 0; i < ReadabilityParser.PRESENTATIONAL_ATTRIBUTES.length; i++) {
      e.removeAttribute(ReadabilityParser.PRESENTATIONAL_ATTRIBUTES[i]);
    }
    if (ReadabilityParser.DEPRECATED_SIZE_ATTRIBUTE_ELEMS.includes(e.tagName)) {
      e.removeAttribute('width');
      e.removeAttribute('height');
    }
    let cur = e.firstElementChild;
    while (cur) {
      this._cleanStyles(cur as HTMLElement);
      cur = cur.nextElementSibling;
    }
  }

  private _getLinkDensity(element: HTMLElement) {
    const textLength = this._getInnerText(element).length;
    if (textLength === 0) return 0;
    let linkLength = 0;
    this._forEachNode(element.getElementsByTagName('a'), (linkNode) => {
      const href = linkNode.getAttribute('href');
      const coefficient = href && ReadabilityParser.REGEXPS.hashUrl.test(href) ? 0.3 : 1;
      linkLength += this._getInnerText(linkNode as HTMLElement).length * coefficient;
    });
    return linkLength / textLength;
  }

  private _getClassWeight(e: HTMLElement) {
    if (!this._flagIsActive(ReadabilityParser.FLAG_WEIGHT_CLASSES)) return 0;
    let weight = 0;
    if (typeof e.className === 'string' && e.className !== '') {
      if (ReadabilityParser.REGEXPS.negative.test(e.className)) weight -= 25;
      if (ReadabilityParser.REGEXPS.positive.test(e.className)) weight += 25;
    }
    if (typeof e.id === 'string' && e.id !== '') {
      if (ReadabilityParser.REGEXPS.negative.test(e.id)) weight -= 25;
      if (ReadabilityParser.REGEXPS.positive.test(e.id)) weight += 25;
    }
    return weight;
  }

  private _clean(e: HTMLElement, tag: string) {
    const isEmbed = ['object', 'embed', 'iframe'].includes(tag);
    this._removeNodes(this._getAllNodesWithTag(e, [tag]), (element) => {
      if (isEmbed) {
          for(let i=0; i<element.attributes.length; i++) {
              if(this._allowedVideoRegex.test(element.attributes[i].value)) return false;
          }
          if(element.tagName === 'object' && this._allowedVideoRegex.test(element.innerHTML)) return false;
      }
      return true;
    });
  }

  private _hasAncestorTag(node: Element, tagName: string, maxDepth = 3, filterFn?: (n: Element) => boolean) {
    tagName = tagName.toUpperCase();
    let depth = 0;
    while (node.parentNode) {
      if (maxDepth > 0 && depth > maxDepth) return false;
      const parent = node.parentNode as Element;
      if (parent.tagName === tagName && (!filterFn || filterFn(parent))) return true;
      node = parent;
      depth++;
    }
    return false;
  }

  private _getRowAndColumnCount(table: HTMLTableElement) {
    let rows = 0;
    let columns = 0;
    const trs = table.getElementsByTagName('tr');
    for (let i = 0; i < trs.length; i++) {
      let rowspan = parseInt(trs[i].getAttribute('rowspan') || '0');
      rows += rowspan || 1;
      let columnsInThisRow = 0;
      const cells = trs[i].getElementsByTagName('td');
      for(let j=0; j<cells.length; j++) {
          let colspan = parseInt(cells[j].getAttribute('colspan') || '0');
          columnsInThisRow += colspan || 1;
      }
      columns = Math.max(columns, columnsInThisRow);
    }
    return { rows, columns };
  }

  private _markDataTables(root: HTMLElement) {
    const tables = root.getElementsByTagName('table');
    for(let i=0; i<tables.length; i++) {
        const table = tables[i];
        if(table.getAttribute('role') === 'presentation') { (table as any)._readabilityDataTable = false; continue; }
        if(table.getAttribute('datatable') === '0') { (table as any)._readabilityDataTable = false; continue; }
        if(table.getAttribute('summary')) { (table as any)._readabilityDataTable = true; continue; }

        const caption = table.getElementsByTagName('caption')[0];
        if(caption && caption.childNodes.length) { (table as any)._readabilityDataTable = true; continue; }
        
        const dataTableDescendants = ['col', 'colgroup', 'tfoot', 'thead', 'th'];
        if(dataTableDescendants.some(tag => !!table.getElementsByTagName(tag)[0])) {
            (table as any)._readabilityDataTable = true;
            continue;
        }
        if(table.getElementsByTagName('table')[0]) { (table as any)._readabilityDataTable = false; continue; }
        
        const sizeInfo = this._getRowAndColumnCount(table);
        if(sizeInfo.rows >= 10 || sizeInfo.columns > 4) { (table as any)._readabilityDataTable = true; continue; }
        (table as any)._readabilityDataTable = sizeInfo.rows * sizeInfo.columns > 10;
    }
  }

  private _fixLazyImages(root: HTMLElement) {
    this._forEachNode(this._getAllNodesWithTag(root, ['img', 'picture', 'figure']), (elem) => {
        const src = (elem as HTMLImageElement).src;
        if(src && ReadabilityParser.REGEXPS.b64DataUrl.test(src)) {
            const parts = ReadabilityParser.REGEXPS.b64DataUrl.exec(src);
            if(parts && parts[1] === 'image/svg+xml') return;
            let srcCouldBeRemoved = false;
            for(let i=0; i<elem.attributes.length; i++) {
                if(elem.attributes[i].name === 'src') continue;
                if(/\.(jpg|jpeg|png|webp)/i.test(elem.attributes[i].value)) {
                    srcCouldBeRemoved = true; break;
                }
            }
            if(srcCouldBeRemoved) {
                 const b64starts = parts![0].length;
                 const b64length = src.length - b64starts;
                 if(b64length < 133) elem.removeAttribute('src');
            }
        }
        
        if((elem.getAttribute('src') || (elem.getAttribute('srcset') && elem.getAttribute('srcset') !== 'null')) && !elem.className.toLowerCase().includes('lazy')) {
            return;
        }

        for(let j=0; j<elem.attributes.length; j++) {
            const attr = elem.attributes[j];
            if(['src', 'srcset', 'alt'].includes(attr.name)) continue;
            let copyTo: string | null = null;
            if(/\.(jpg|jpeg|png|webp)\s+\d/.test(attr.value)) copyTo = 'srcset';
            else if (/^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/.test(attr.value)) copyTo = 'src';

            if(copyTo) {
                if(elem.tagName === 'IMG' || elem.tagName === 'PICTURE') elem.setAttribute(copyTo, attr.value);
                else if (elem.tagName === 'FIGURE' && !this._getAllNodesWithTag(elem, ['img', 'picture']).length) {
                    const img = this._doc.createElement('img');
                    img.setAttribute(copyTo, attr.value);
                    elem.appendChild(img);
                }
            }
        }
    });
  }

  private _getTextDensity(e: HTMLElement, tags: string[]) {
      const textLength = this._getInnerText(e, true).length;
      if(textLength === 0) return 0;
      let childrenLength = 0;
      const children = this._getAllNodesWithTag(e, tags);
      this._forEachNode(children, (child) => childrenLength += this._getInnerText(child as HTMLElement, true).length);
      return childrenLength / textLength;
  }

  private _cleanConditionally(e: HTMLElement, tag: string) {
    if(!this._flagIsActive(ReadabilityParser.FLAG_CLEAN_CONDITIONALLY)) return;
    this._removeNodes(this._getAllNodesWithTag(e, [tag]), (node) => {
        const isDataTable = (t: HTMLElement) => (t as any)._readabilityDataTable;
        let isList = tag === 'ul' || tag === 'ol';
        if(!isList) {
            let listLength = 0;
            const listNodes = this._getAllNodesWithTag(node, ['ul', 'ol']);
            this._forEachNode(listNodes, list => listLength += this._getInnerText(list as HTMLElement).length);
            isList = listLength / this._getInnerText(node as HTMLElement).length > 0.9;
        }

        if(tag === 'table' && isDataTable(node as HTMLElement)) return false;
        if(this._hasAncestorTag(node, 'table', -1, isDataTable)) return false;
        if(this._hasAncestorTag(node, 'code')) return false;
        
        // keep element if it has a data tables
        if(Array.from(node.getElementsByTagName('table')).some(tbl => (tbl as any)._readabilityDataTable)) {
            return false;
        }

        const weight = this._getClassWeight(node as HTMLElement);
        if(weight + 0 < 0) return true; // contentScore is assumed 0 here as per original source logic flow

        if(this._getCharCount(node as HTMLElement, ',') < 10) {
            const p = node.getElementsByTagName('p').length;
            const img = node.getElementsByTagName('img').length;
            const li = node.getElementsByTagName('li').length - 100;
            const input = node.getElementsByTagName('input').length;
            const headingDensity = this._getTextDensity(node as HTMLElement, ['h1','h2','h3','h4','h5','h6']);
            
            let embedCount = 0;
            const embeds = this._getAllNodesWithTag(node, ['object', 'embed', 'iframe']);
            for(let i=0; i<embeds.length; i++) {
                let ok = false;
                for(let j=0; j<embeds[i].attributes.length; j++) {
                    if(this._allowedVideoRegex.test(embeds[i].attributes[j].value)) ok = true;
                }
                if(embeds[i].tagName === 'object' && this._allowedVideoRegex.test(embeds[i].innerHTML)) ok = true;
                if(!ok) embedCount++;
            }

            const innerText = this._getInnerText(node as HTMLElement);
            if(ReadabilityParser.REGEXPS.adWords.test(innerText) || ReadabilityParser.REGEXPS.loadingWords.test(innerText)) return true;

            const contentLength = innerText.length;
            const linkDensity = this._getLinkDensity(node as HTMLElement);
            const textishTags = ['SPAN', 'LI', 'TD', 'BLOCKQUOTE', 'DL', 'DIV', 'IMG', 'OL', 'P', 'PRE', 'TABLE', 'UL'];
            const textDensity = this._getTextDensity(node as HTMLElement, textishTags);
            const isFigureChild = this._hasAncestorTag(node, 'figure');

            const shouldRemoveNode = () => {
                const errs = [];
                if(!isFigureChild && img > 1 && p/img < 0.5) errs.push('Bad p to img ratio');
                if(!isList && li > p) errs.push('Too many li\'s outside of a list');
                if(input > Math.floor(p/3)) errs.push('Too many inputs');
                if(!isList && !isFigureChild && headingDensity < 0.9 && contentLength < 25 && (img === 0 || img > 2) && linkDensity > 0) errs.push('Suspiciously short');
                if(!isList && weight < 25 && linkDensity > 0.2 + this._linkDensityModifier) errs.push('Low weight and linky');
                if(weight >= 25 && linkDensity > 0.5 + this._linkDensityModifier) errs.push('High weight and linky');
                if((embedCount === 1 && contentLength < 75) || embedCount > 1) errs.push('Suspicious embed');
                if(img === 0 && textDensity === 0) errs.push('No useful content');
                
                return errs.length > 0;
            };

            const haveToRemove = shouldRemoveNode();

            // Allow simple lists of images to remain in pages
            if (isList && haveToRemove) {
                for (let x = 0; x < node.children.length; x++) {
                    let child = node.children[x];
                    // Don't filter in lists with li's that contain more than one child
                    if (child.children.length > 1) {
                        return haveToRemove;
                    }
                }
                let li_count = node.getElementsByTagName("li").length;
                // Only allow the list to remain if every li contains an image
                if (img === li_count) {
                    return false;
                }
            }
            return haveToRemove;
        }
        return false;
    });
  }

  private _cleanMatchedNodes(e: Element, filter: (node: Element, matchString: string) => boolean) {
    const endOfSearchMarkerNode = this._getNextNode(e, true);
    let next = this._getNextNode(e);
    while (next && next !== endOfSearchMarkerNode) {
      if (next.nodeType === ReadabilityParser.ELEMENT_NODE && filter(next as Element, (next as Element).className + ' ' + (next as Element).id)) {
        next = this._removeAndGetNext(next);
      } else {
        next = this._getNextNode(next);
      }
    }
  }

  private _cleanHeaders(e: HTMLElement) {
    const headingNodes = this._getAllNodesWithTag(e, ['h1', 'h2']);
    this._removeNodes(headingNodes, (node) => {
      return this._getClassWeight(node as HTMLElement) < 0;
    });
  }

  private _headerDuplicatesTitle(node: HTMLElement) {
      if(node.tagName !== 'H1' && node.tagName !== 'H2') return false;
      const heading = this._getInnerText(node, false);
      return this._textSimilarity(this._articleTitle || '', heading) > 0.75;
  }

  private _flagIsActive(flag: number) {
    return (this._flags & flag) > 0;
  }

  private _removeFlag(flag: number) {
    this._flags = this._flags & ~flag;
  }

  private _isProbablyVisible(node: HTMLElement) {
    return (
      (!node.style || node.style.display !== 'none') &&
      (!node.style || node.style.visibility !== 'hidden') &&
      !node.hasAttribute('hidden') &&
      (node.getAttribute('aria-hidden') !== 'true' ||
        (node.className &&
          node.className.includes &&
          node.className.includes('fallback-image')))
    );
  }
}
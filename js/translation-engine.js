/**
 * CYBERPUNK MULTI-LANGUAGE TRANSLATION ENGINE
 * Provides instant HUD UI localization and neural document translation
 * for English (Default), Assamese (অসমীয়া), Chinese (中文), and Japanese (日本語).
 */

class CyberTranslationEngine {
  constructor() {
    this.currentLang = localStorage.getItem('cyber_lang') || 'en';
    this.cache = new Map(); // In-memory translation cache
    this.originalDocHtml = null;
    this.originalDocPath = null;
    this.isShowingOriginal = false;
    this.isTranslating = false;

    // Comprehensive UI Localization Dictionary
    this.i18n = {
      en: {
        brandSub: '// システム管理者 // NEURAL ARCHIVE',
        searchPlaceholder: '[CTRL+K] Search 600+ docs...',
        tabDocs: '// ALL DOCS',
        tabBookmarks: '// BOOKMARKS',
        btnExpand: '+ EXPAND ALL',
        btnCollapse: '- COLLAPSE',
        graphView: 'GRAPH VIEW',
        syncGithub: 'SYNC GITHUB',
        bookmark: 'BOOKMARK',
        bookmarked: 'BOOKMARKED',
        openGithub: 'OPEN IN GITHUB',
        onThisPage: '// ON THIS PAGE',
        soundDeck: 'CYBER SOUND DECK',
        readTime: 'MIN READ',
        words: 'WORDS',
        graphTitle: '// NEURAL KNOWLEDGE GRAPH',
        allCategories: 'ALL CATEGORIES',
        resetView: 'RESET VIEW',
        dragPan: 'DRAG PAN VIEW',
        wheelZoom: 'WHEEL ZOOM',
        clickOpen: 'CLICK OPEN DOCUMENT',
        escExit: 'ESC EXIT GRAPH',
        translatingIntel: 'TRANSLATING NEURAL INTEL TO',
        translatedIntel: 'NEURAL INTEL LOCALIZED TO',
        showOriginal: 'SHOW ORIGINAL (EN)',
        showTranslated: 'SHOW TRANSLATED',
        settingsTitle: '// GITHUB NEURAL REPOSITORY SETTINGS',
        applySync: 'APPLY & SYNC',
        statusOnline: 'ONLINE',
        statusDocsLoaded: 'DOCS LOADED'
      },
      as: {
        brandSub: '// ছিষ্টেম প্ৰশাসক // নিউৰেল আৰ্কাইভ (অসম)',
        searchPlaceholder: '[CTRL+K] ৬০০+ নথি সন্ধান কৰক...',
        tabDocs: '// সকলো নথি',
        tabBookmarks: '// বুকমাৰ্কসমূহ',
        btnExpand: '+ সকলো বিস্তাৰ',
        btnCollapse: '- সংকুচিত',
        graphView: 'গ্ৰাফ দৰ্শন',
        syncGithub: 'গিটহাব চিংক',
        bookmark: 'বুকমাৰ্ক',
        bookmarked: 'বুকমাৰ্ক কৰা হ\'ল',
        openGithub: 'গিটহাবত খোলক',
        onThisPage: '// এই পৃষ্ঠাত',
        soundDeck: 'ছাইবাৰ ছাউণ্ড ডেক',
        readTime: 'মিনিট পঢ়ক',
        words: 'শব্দ',
        graphTitle: '// নিউৰেল জ্ঞানৰ গ্ৰাফ',
        allCategories: 'সকলো বিভাগ',
        resetView: 'দৰ্শন ৰিছেট',
        dragPan: 'টানি লৰচৰ কৰক',
        wheelZoom: 'জুম কৰক',
        clickOpen: 'নথি খোলক',
        escExit: 'প্ৰস্থান কৰক',
        translatingIntel: 'অনুবাদ চলি আছে:',
        translatedIntel: 'অনুবাদ সম্পন্ন:',
        showOriginal: 'মূল ইংৰাজী দেখুৱাওক (EN)',
        showTranslated: 'অনুবাদ দেখুৱাওক',
        settingsTitle: '// গিটহাব নিউৰেল সংহিতা ছেটিংছ',
        applySync: 'প্ৰয়োগ আৰু চিংক',
        statusOnline: 'অনলাইন',
        statusDocsLoaded: 'নথি সংগ্ৰহ'
      },
      zh: {
        brandSub: '// 系统管理员 // 神经系统档案',
        searchPlaceholder: '[CTRL+K] 搜索 600+ 篇系统文档...',
        tabDocs: '// 全部文档',
        tabBookmarks: '// 我的书签',
        btnExpand: '+ 展开全部',
        btnCollapse: '- 全部折叠',
        graphView: '图谱视图',
        syncGithub: '同步 GITHUB',
        bookmark: '加入书签',
        bookmarked: '已收藏',
        openGithub: '在 GITHUB 中打开',
        onThisPage: '// 本页导读',
        soundDeck: '赛博音频面板',
        readTime: '分钟阅读',
        words: '字',
        graphTitle: '// 神经网络知识图谱',
        allCategories: '全部分类',
        resetView: '重置视图',
        dragPan: '拖拽平移视图',
        wheelZoom: '滚轮缩放',
        clickOpen: '点击打开文档',
        escExit: 'ESC 退出图谱',
        translatingIntel: '正在翻译神经情报至',
        translatedIntel: '情报已本地化为',
        showOriginal: '显示英文原文 (EN)',
        showTranslated: '显示翻译内容',
        settingsTitle: '// GITHUB 神经知识库配置',
        applySync: '应用并同步',
        statusOnline: '在线',
        statusDocsLoaded: '篇文档已加载'
      },
      ja: {
        brandSub: '// システム管理者 // ニューラルアーカイブ',
        searchPlaceholder: '[CTRL+K] 600件以上の技術文書を検索...',
        tabDocs: '// すべての文書',
        tabBookmarks: '// ブックマーク',
        btnExpand: '+ すべて展開',
        btnCollapse: '- 折りたたむ',
        graphView: 'グラフ表示',
        syncGithub: 'GITHUB同期',
        bookmark: 'ブックマーク',
        bookmarked: '保存済み',
        openGithub: 'GITHUBで開く',
        onThisPage: '// 目次',
        soundDeck: 'サイバーサウンドデッキ',
        readTime: '分で読める',
        words: '文字',
        graphTitle: '// ニューラルナレッジグラフ',
        allCategories: 'すべてのカテゴリ',
        resetView: 'ビューをリセット',
        dragPan: 'ドラッグで移動',
        wheelZoom: 'ホイールで拡大',
        clickOpen: 'クリックで開く',
        escExit: 'ESCで閉じる',
        translatingIntel: 'ニューラルデータを翻訳中:',
        translatedIntel: 'ローカライズ完了:',
        showOriginal: '英語の原文を表示 (EN)',
        showTranslated: '翻訳を表示',
        settingsTitle: '// GITHUB ニューラルリポジトリ設定',
        applySync: '適用して同期',
        statusOnline: 'オンライン',
        statusDocsLoaded: '件の文書を読込'
      }
    };
  }

  init() {
    this.applyLanguage(this.currentLang, false);
    this.initEventListeners();
  }

  t(key) {
    const dict = this.i18n[this.currentLang] || this.i18n.en;
    return dict[key] || this.i18n.en[key] || key;
  }

  applyLanguage(langCode, notify = true) {
    if (!this.i18n[langCode]) langCode = 'en';
    this.currentLang = langCode;
    localStorage.setItem('cyber_lang', langCode);
    document.documentElement.setAttribute('lang', langCode);

    // Update Select Dropdown
    const select = document.getElementById('language-selector');
    if (select) select.value = langCode;

    // Update Static UI Text
    this.updateStaticUI();

    // If a document is currently active and language is not English, translate it
    if (window.cyberApp && window.cyberApp.currentDocPath) {
      if (langCode === 'en') {
        this.restoreOriginalDocument();
      } else {
        this.translateCurrentDocument(langCode);
      }
    }

    if (notify && window.cyberApp) {
      const langNames = { en: 'English', as: 'অসমীয়া (Assamese)', zh: '中文 (Chinese)', ja: '日本語 (Japanese)' };
      window.cyberApp.showToast(`🌐 LANGUAGE SET: ${langNames[langCode]}`, 'success');
      if (window.cyberSFX) window.cyberSFX.playConfirm();
    }
  }

  updateStaticUI() {
    const d = this.i18n[this.currentLang] || this.i18n.en;

    // Subtitle
    const brandSub = document.querySelector('.brand-sub');
    if (brandSub) {
      brandSub.textContent = d.brandSub;
    }

    // Search Box Placeholder
    const searchInput = document.getElementById('nav-search-input');
    if (searchInput) searchInput.placeholder = d.searchPlaceholder;

    // Tabs
    const tabDocs = document.getElementById('tab-btn-docs');
    const tabBookmarks = document.getElementById('tab-btn-bookmarks');
    if (tabDocs) tabDocs.textContent = d.tabDocs;
    if (tabBookmarks) tabBookmarks.textContent = d.tabBookmarks;

    // Tree Controls
    const btnExpand = document.getElementById('btn-expand-all');
    const btnCollapse = document.getElementById('btn-collapse-all');
    if (btnExpand) btnExpand.textContent = d.btnExpand;
    if (btnCollapse) btnCollapse.textContent = d.btnCollapse;

    // Header Action Buttons
    const graphBtnText = document.querySelector('#btn-open-graph .btn-text-label');
    if (graphBtnText) graphBtnText.textContent = d.graphView;

    const syncBtnText = document.querySelector('#btn-sync-github .btn-text-label');
    if (syncBtnText) syncBtnText.textContent = d.syncGithub;

    // Document Action Buttons
    const bookmarkSpan = document.querySelector('#btn-doc-bookmark span');
    if (bookmarkSpan) bookmarkSpan.textContent = d.bookmark;

    const githubEditSpan = document.querySelector('#btn-github-edit span');
    if (githubEditSpan) githubEditSpan.textContent = d.openGithub;

    // TOC Header
    const tocHeader = document.querySelector('#doc-toc-wrapper .toc-header');
    if (tocHeader) tocHeader.textContent = d.onThisPage;

    // Sound Deck Tag
    const deckTag = document.querySelector('.deck-tag span:nth-child(2)');
    if (deckTag) deckTag.textContent = d.soundDeck;

    // Graph HUD Text
    const graphTitle = document.querySelector('.graph-title');
    if (graphTitle) graphTitle.textContent = d.graphTitle;

    const resetBtn = document.getElementById('btn-graph-reset-view');
    if (resetBtn) resetBtn.textContent = d.resetView;

    // Graph Bottom Bar
    const graphBottomBar = document.querySelector('.graph-bottom-bar');
    if (graphBottomBar) {
      graphBottomBar.innerHTML = `
        <span><kbd>DRAG</kbd> ${d.dragPan}</span>
        <span><kbd>WHEEL</kbd> ${d.wheelZoom}</span>
        <span><kbd>CLICK</kbd> ${d.clickOpen}</span>
        <span><kbd>ESC</kbd> ${d.escExit}</span>
      `;
    }

    // Settings Modal
    const settingsHeader = document.querySelector('#cyber-settings-modal .modal-header h3');
    if (settingsHeader) settingsHeader.textContent = d.settingsTitle;
    const settingsBtn = document.getElementById('btn-save-settings');
    if (settingsBtn) settingsBtn.textContent = d.applySync;
  }

  /* ================= DYNAMIC DOCUMENT TRANSLATION ================= */
  async translateCurrentDocument(targetLang) {
    if (!targetLang || targetLang === 'en') {
      this.restoreOriginalDocument();
      return;
    }

    const container = document.getElementById('doc-markdown-container');
    if (!container || !container.children.length) return;

    const currentDoc = window.cyberApp ? window.cyberApp.currentDocPath : 'current';
    const cacheKey = `cyber_trans_${targetLang}_${currentDoc}`;

    // Store original English HTML once per document load
    if (this.originalDocPath !== currentDoc || !this.originalDocHtml) {
      this.originalDocHtml = container.innerHTML;
      this.originalDocPath = currentDoc;
    }

    // Check Local Storage / Memory Cache
    const cachedHtml = localStorage.getItem(cacheKey) || this.cache.get(cacheKey);
    if (cachedHtml) {
      container.innerHTML = cachedHtml;
      this.renderTranslationBanner(targetLang, true);
      this.refreshTOCAfterTranslation();
      return;
    }

    // Show Translating Banner
    this.renderTranslationBanner(targetLang, false);
    this.isTranslating = true;

    try {
      // Find all translatable blocks (paragraphs, list items, headings, blockquotes, table cells)
      const translatableSelector = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th';
      const nodes = Array.from(container.querySelectorAll(translatableSelector));

      const itemsToTranslate = [];
      nodes.forEach(node => {
        // Skip code blocks, preformatted text, or already translated elements
        if (node.closest('pre') || node.closest('.no-translate') || node.tagName === 'CODE') return;

        // Extract text while preserving inline code placeholders
        const text = node.innerText.trim();
        if (text && text.length > 1 && !/^\d+$/.test(text)) {
          itemsToTranslate.push({ node, text });
        }
      });

      if (itemsToTranslate.length === 0) {
        this.renderTranslationBanner(targetLang, true);
        this.isTranslating = false;
        return;
      }

      // Batch requests into chunks of ~12 items separated by unique token
      const CHUNK_SIZE = 12;
      const DELIMITER = '\n§§§\n';

      for (let i = 0; i < itemsToTranslate.length; i += CHUNK_SIZE) {
        const chunk = itemsToTranslate.slice(i, i + CHUNK_SIZE);
        const combinedText = chunk.map(item => item.text).join(DELIMITER);

        const translatedChunkText = await this.fetchTranslation(combinedText, targetLang);
        if (translatedChunkText) {
          const parts = translatedChunkText.split('§§§');
          chunk.forEach((item, idx) => {
            if (parts[idx] && parts[idx].trim()) {
              item.node.innerText = parts[idx].trim();
            }
          });
        }
      }

      // Cache the result
      const translatedHtml = container.innerHTML;
      this.cache.set(cacheKey, translatedHtml);
      try {
        localStorage.setItem(cacheKey, translatedHtml);
      } catch (e) {
        // Handle storage quota gracefully
      }

      this.renderTranslationBanner(targetLang, true);
      this.refreshTOCAfterTranslation();
      this.isShowingOriginal = false;

    } catch (err) {
      console.error('Translation failed:', err);
      if (window.cyberApp) {
        window.cyberApp.showToast('[ERROR] Translation API unreachable. Displaying original English.', 'danger');
      }
      this.restoreOriginalDocument();
    } finally {
      this.isTranslating = false;
    }
  }

  async fetchTranslation(text, targetLang) {
    // Mapping for standard language codes
    const langMap = {
      as: 'as',
      zh: 'zh-CN',
      ja: 'ja',
      en: 'en'
    };
    const tl = langMap[targetLang] || targetLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();

    if (data && data[0]) {
      return data[0].map(segment => segment[0]).join('');
    }
    return null;
  }

  renderTranslationBanner(targetLang, isComplete) {
    const container = document.getElementById('doc-markdown-container');
    if (!container) return;

    let banner = document.getElementById('cyber-translation-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'cyber-translation-banner';
      banner.className = 'cyber-trans-banner';
      container.insertBefore(banner, container.firstChild);
    }

    const langNames = { as: 'অসমীয়া (Assamese)', zh: '中文 (Chinese)', ja: '日本語 (Japanese)', en: 'English' };
    const langName = langNames[targetLang] || targetLang.toUpperCase();
    const d = this.i18n[this.currentLang] || this.i18n.en;

    if (!isComplete) {
      banner.innerHTML = `
        <div class="trans-banner-left">
          <span class="pulsing-dot-spin"></span>
          <span>${d.translatingIntel} <strong>${langName}</strong>...</span>
        </div>
        <div class="trans-progress-line"></div>
      `;
    } else {
      banner.innerHTML = `
        <div class="trans-banner-left">
          <span class="trans-check">✓</span>
          <span>${d.translatedIntel} <strong>${langName}</strong></span>
        </div>
        <div class="trans-banner-right">
          <button id="btn-toggle-original-doc" class="cyber-btn small">
            ${this.isShowingOriginal ? d.showTranslated : d.showOriginal}
          </button>
        </div>
      `;

      const toggleBtn = document.getElementById('btn-toggle-original-doc');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          this.toggleOriginalView();
        });
      }
    }
  }

  toggleOriginalView() {
    const container = document.getElementById('doc-markdown-container');
    if (!container || !this.originalDocHtml) return;

    const d = this.i18n[this.currentLang] || this.i18n.en;
    const toggleBtn = document.getElementById('btn-toggle-original-doc');

    if (this.isShowingOriginal) {
      // Switch back to translated
      const currentDoc = window.cyberApp ? window.cyberApp.currentDocPath : 'current';
      const cacheKey = `cyber_trans_${this.currentLang}_${currentDoc}`;
      const cached = localStorage.getItem(cacheKey) || this.cache.get(cacheKey);
      if (cached) {
        container.innerHTML = cached;
        this.renderTranslationBanner(this.currentLang, true);
        this.isShowingOriginal = false;
        if (toggleBtn) toggleBtn.textContent = d.showOriginal;
      }
    } else {
      // Switch to original English
      container.innerHTML = this.originalDocHtml;
      this.renderTranslationBanner(this.currentLang, true);
      this.isShowingOriginal = true;
      if (toggleBtn) toggleBtn.textContent = d.showTranslated;
    }
    this.refreshTOCAfterTranslation();
  }

  restoreOriginalDocument() {
    const container = document.getElementById('doc-markdown-container');
    if (container && this.originalDocHtml) {
      container.innerHTML = this.originalDocHtml;
    }
    const banner = document.getElementById('cyber-translation-banner');
    if (banner) banner.remove();
    this.isShowingOriginal = false;
  }

  refreshTOCAfterTranslation() {
    if (!window.cyberApp) return;
    const headings = document.querySelectorAll('#doc-markdown-container .cyber-heading');
    const tocItems = [];
    headings.forEach(h => {
      tocItems.push({
        id: h.id,
        text: h.textContent.replace(/^#+\s*/, ''),
        level: parseInt(h.tagName.replace('H', ''), 10)
      });
    });
    if (tocItems.length > 0) {
      window.cyberApp.renderTableOfContents(tocItems);
    }
  }

  initEventListeners() {
    const select = document.getElementById('language-selector');
    if (select) {
      select.addEventListener('change', (e) => {
        this.applyLanguage(e.target.value, true);
      });
    }
  }
}

window.cyberI18n = new CyberTranslationEngine();

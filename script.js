/* ============================================
   个人简历与作品集网站 - 脚本文件
   封面页 | 个人信息 | AI匹配器(iframe嵌入) | 作品集
   ============================================ */

(function () {
  'use strict';

  // ==========================================
  // 默认数据（fetch 失败时的回退）
  // ==========================================
  var DEFAULT_DATA = {
    site: { title: '待填写', subtitle: '待填写' },
    navLinks: [
      { id: 'cover', label: 'Hiii' },
      { id: 'personal', label: '个人信息' },
      { id: 'matcher', label: 'AI匹配器' },
      { id: 'skills', label: '个人技能' },
      { id: 'experience', label: '工作&项目经历' },
      { id: 'portfolio', label: '作品集' }
    ],
    cover: {
      title: "welcome my channel, I've been waiting for you a long time",
      buttonText: "let's explore more"
    },
    personalInfo: {
      title: '个人信息', tagline: '待填写', avatar: '待填写',
      name: '待填写', birthday: '待填写', age: '待填写',
      photos: [],
      contact: { email: '待填写', phone: '待填写', wechat: '待填写' },
      awards: [], education: [], hobbies: []
    },
    workExperience: {
      title: '工作经验',
      items: [
        { photo: '待填写', company: '待填写', position: '待填写', period: '待填写', details: [] },
        { photo: '待填写', company: '待填写', position: '待填写', period: '待填写', details: [] },
        { photo: '待填写', company: '待填写', position: '待填写', period: '待填写', details: [] }
      ]
    },
    projectExperience: {
      title: '项目经验',
      items: [
        { photo: '待填写', name: '待填写', role: '待填写', details: '待填写' },
        { photo: '待填写', name: '待填写', role: '待填写', details: '待填写' },
        { photo: '待填写', name: '待填写', role: '待填写', details: '待填写' }
      ]
    },
    aiMatcher: { title: 'AI 岗位匹配器 — 项目作品集' },
    portfolio: {
      title: '作品集',
      tabs: [
        { id: 'xiaohongshu', label: '小红书账号' },
        { id: 'photography', label: '摄影集' },
        { id: 'video', label: '剪辑作品' }
      ],
      xiaohongshu: [], photography: [], video: []
    },
    pdfDownloads: [
      { name: '待填写', url: 'downloads/待填写.pdf' },
      { name: '待填写', url: 'downloads/待填写.pdf' },
      { name: '待填写', url: 'downloads/待填写.pdf' },
      { name: '待填写', url: 'downloads/待填写.pdf' },
      { name: '待填写', url: 'downloads/待填写.pdf' }
    ],
    coreResume: { summary: '待填写', highlights: [] },
    footer: { text: '待填写' }
  };

  // 捕获 data.js 中预设的全局 APP_DATA（在 script.js 覆盖之前保存）
 var _predefinedData = (typeof window.APP_DATA !== 'undefined' && window.APP_DATA && window.APP_DATA.site) ? window.APP_DATA : null;
 var APP_DATA = deepMerge(DEFAULT_DATA, _predefinedData || {});

  // ==========================================
  // 数据加载
  // ==========================================
  function loadData() {
    if (_predefinedData) {
      console.log("Data loaded from data.js");
    }
    init();
  }

  function deepMerge(target, source) {
    var output = JSON.parse(JSON.stringify(target));
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          output[key] = deepMerge(output[key] || {}, source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }
    return output;
  }

  // ==========================================
  // DOM 引用缓存
  // ==========================================
  var DOM = {};

  function cacheDOM() {
    DOM.navbar = document.getElementById('navbar');
    DOM.navLinks = document.getElementById('navLinks');
    DOM.navLogo = document.getElementById('navLogo');
    DOM.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    DOM.coverTitle = document.getElementById('coverTitle');
    DOM.coverExploreBtn = document.getElementById('coverExploreBtn');
    DOM.coverNavButtons = document.getElementById('coverNavButtons');
    DOM.personalInfo = document.getElementById('personalInfo');
    DOM.skillsSection = document.getElementById('mySkills');
    DOM.experienceSection = document.getElementById('experienceSection');
    DOM.portfolioContent = document.getElementById('portfolioContent');
    DOM.lightbox = document.getElementById('lightbox');
    DOM.lightboxImg = document.getElementById('lightboxImg');
    DOM.lightboxClose = document.getElementById('lightboxClose');
  }

  // ==========================================
  // 初始化
  // ==========================================
  function init() {
    cacheDOM();
    renderNavigation();
    renderCover();
    renderCoverImages();
    renderPersonalInfo();
    renderExperience();
    renderResearch();
    renderAIMatcher();
    renderMySkills();
    renderPortfolio();
    renderFooter();
    initScrollAnimations();
    initNavScrollSpy();
    initMobileMenu();
    initLightbox();
    initCoverInteraction();
    initPortfolioTabs();
    initVariableProximityOnCover();
    initTextPressureOnAllTitles();
    applyTheme();
    tagResearchElements();
    tagVideoCardElements();
    applyTextStyles();
    applySectionBackgrounds();
  }

  // 为科研经历动态元素添加 data-ts-key
  function tagResearchElements() {
    var container = document.getElementById('researchSection');
    if (!container) return;
    // 科研区块标题 (.rr-title)
    var title = container.querySelector('.rr-title');
    if (title && !title.getAttribute('data-ts-key')) {
      title.setAttribute('data-ts-key', 'researchExperience.title');
    }
    // 模态框标题和描述
    var modalTitle = container.querySelector('.rr-modal-title');
    if (modalTitle && !modalTitle.getAttribute('data-ts-key')) {
      modalTitle.setAttribute('data-ts-key', 'researchExperience.items.0.title');
    }
    var modalDesc = container.querySelector('.rr-modal-desc');
    if (modalDesc && !modalDesc.getAttribute('data-ts-key')) {
      modalDesc.setAttribute('data-ts-key', 'researchExperience.items.0.description');
    }
    // 科研卡片内的文字（如果有的话）
    var cards = container.querySelectorAll('.rr-card');
    cards.forEach(function(card, idx) {
      var cardText = card.querySelector('[class*="text"], [class*="label"]');
      if (cardText && !cardText.getAttribute('data-ts-key')) {
        cardText.setAttribute('data-ts-key', 'researchExperience.items.' + idx + '.category');
      }
    });
  }

  // 为视频卡片动态元素添加 data-ts-key
  function tagVideoCardElements() {
    var container = document.getElementById('videoCardsContainer');
    if (!container) return;
    setTimeout(function() {
      var labels = container.querySelectorAll('.video-card-label');
      labels.forEach(function(label, idx) {
        if (!label.getAttribute('data-ts-key')) {
          label.setAttribute('data-ts-key', 'portfolio.video.' + idx + '.title');
        }
      });
    }, 600);
  }

  // ==========================================
  // 应用主题（CSS 变量）
  // ==========================================
  function applyTheme() {
    var theme = APP_DATA.theme;
    if (!theme) return;
    var root = document.documentElement;
    Object.keys(theme).forEach(function (key) {
      if (theme[key]) {
        root.style.setProperty(key, theme[key]);
      }
    });
  }

  // ==========================================
  // 逐元素文字样式引擎 (textStyles)
  // 使用 position:relative + top/left 偏移，不影响文档流和动画
  // ==========================================
  function applyTextStyles() {
    var styles = APP_DATA.textStyles || {};
    var els = document.querySelectorAll('[data-ts-key]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-ts-key');
      var s = styles[key];
      if (!s) continue;

      // 颜色
      if (s.color) el.style.color = s.color;
      else el.style.color = '';

      // 字号
      if (s.fontSize) el.style.fontSize = s.fontSize;
      else el.style.fontSize = '';

      // 字距
      if (s.letterSpacing) el.style.letterSpacing = s.letterSpacing;
      else el.style.letterSpacing = '';

      // 行高
      if (s.lineHeight) el.style.lineHeight = s.lineHeight;
      else el.style.lineHeight = '';

      // 字重
      if (s.fontWeight) el.style.fontWeight = s.fontWeight;
      else el.style.fontWeight = '';

      // 对齐
      if (s.textAlign) el.style.textAlign = s.textAlign;
      else el.style.textAlign = '';

      // 位置偏移 (relative 定位，不影响文档流)
      if (s.offsetX || s.offsetY) {
        el.style.position = 'relative';
        el.style.top = s.offsetY || '0px';
        el.style.left = s.offsetX || '0px';
      } else {
        el.style.position = '';
        el.style.top = '';
        el.style.left = '';
      }
    }
  }

  // ==========================================
  // 分板块背景图片/视频
  // ==========================================
  function applySectionBackgrounds() {
    var bgConfig = APP_DATA.sectionBackgrounds;
    if (!bgConfig) return;

    // 先清理旧的 group wrapper（恢复被包裹的 section）
    var oldWrappers = document.querySelectorAll('.bg-group-wrapper');
    for (var w = 0; w < oldWrappers.length; w++) {
      var wrapper = oldWrappers[w];
      var parent = wrapper.parentNode;
      while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, wrapper);
      }
      parent.removeChild(wrapper);
    }

    // 清理旧的探照灯层及残留内联样式（封面）
    var oldCoverSpots = document.querySelectorAll('.cover-spotlight');
    for (var cs = 0; cs < oldCoverSpots.length; cs++) {
      oldCoverSpots[cs].remove();
    }
    // 清除之前探照灯设置的内联 z-index
    var coverSticky = document.querySelector('#cover .cover-sticky');
    if (coverSticky) {
      var spotChildren = coverSticky.querySelectorAll('.cover-title, .cover-explore-btn, .cover-nav-buttons, .cover-img-layer');
      for (var sc = 0; sc < spotChildren.length; sc++) {
        spotChildren[sc].style.position = '';
        spotChildren[sc].style.zIndex = '';
      }
    }

    // 重置所有 section 的 has-bg-image
    var allBgSections = document.querySelectorAll('.has-bg-image');
    for (var s = 0; s < allBgSections.length; s++) {
      allBgSections[s].classList.remove('has-bg-image');
      allBgSections[s].style.backgroundImage = '';
      allBgSections[s].style.backgroundSize = '';
      allBgSections[s].style.backgroundPosition = '';
      allBgSections[s].style.backgroundRepeat = '';
    }

    var ALL_SECTION_IDS = ['cover','personal','matcher','skills','experience','research','portfolio','siteFooter'];
    var sectionLabels = {
      cover:'封面', personal:'个人信息', matcher:'AI匹配器', skills:'个人技能',
      experience:'工作&项目经历', research:'科研经历', portfolio:'作品集', siteFooter:'Lovely to meet u'
    };

    // ── 处理分组 ──
    var groups = bgConfig.groups || [];
    var groupedIds = {};  // 记录哪些 section 已被分组

    groups.forEach(function (group) {
      if (!group.sections || !group.sections.length) return;
      if (group.type === 'none' || !group.url) return;

      // 找到分组内的 section 元素，按 DOM 顺序排序
      var els = [];
      group.sections.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { els.push(el); groupedIds[id] = true; }
      });
      if (els.length === 0) return;

      // 按 DOM 位置排序
      els.sort(function (a, b) {
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

      // 创建包裹容器
      var wrapper = document.createElement('div');
      wrapper.className = 'bg-group-wrapper';
      wrapper.style.backgroundImage = 'url("' + group.url + '")';
      wrapper.style.backgroundSize = group.fillMode || 'cover';
      wrapper.style.backgroundPosition = 'center center';
      wrapper.style.backgroundRepeat = 'no-repeat';
      // 透明变量覆盖
      wrapper.style.setProperty('--surface', 'transparent');
      wrapper.style.setProperty('--bg-subtle', 'transparent');
      wrapper.style.setProperty('--bg', 'transparent');
      wrapper.style.setProperty('--border-color', 'transparent');
      wrapper.style.setProperty('--accent-subtle', 'transparent');
      wrapper.style.setProperty('--info-card-bg', 'transparent');
      wrapper.style.setProperty('--cb-fadeColor', 'transparent');

      // 将 wrapper 插入到第一个 section 之前
      var firstEl = els[0];
      firstEl.parentNode.insertBefore(wrapper, firstEl);

      // 将所有 section 移入 wrapper
      els.forEach(function (el) {
        wrapper.appendChild(el);
        el.classList.add('has-bg-image');
      });

      // matcher iframe 透明化
      els.forEach(function (el) {
        if (el.id === 'matcher') {
          var iframe = el.querySelector('iframe');
          if (iframe) makeMatcherTransparent(iframe);
        }
      });

      // ── 双层探照灯效果 ──
      if (group.topUrl !== undefined && group.topUrl !== '') {
        var topLayer = document.createElement('div');
        topLayer.className = 'bg-spotlight-top';
        topLayer.style.backgroundImage = 'url("' + group.topUrl + '")';
        topLayer.style.backgroundSize = group.fillMode || 'cover';
        topLayer.style.backgroundPosition = 'center center';
        wrapper.appendChild(topLayer);

        // 初始位置设在中心
        topLayer.style.setProperty('--sx', '50%');
        topLayer.style.setProperty('--sy', '50%');

        wrapper.addEventListener('mousemove', function(e) {
          var rect = wrapper.getBoundingClientRect();
          topLayer.style.setProperty('--sx', (e.clientX - rect.left) + 'px');
          topLayer.style.setProperty('--sy', (e.clientY - rect.top) + 'px');
        });

        // section 内容置于探照灯上方
        els.forEach(function(el) {
          el.style.position = 'relative';
          el.style.zIndex = '2';
        });
      }
    });

    // ── 处理独立板块 ──
    var singles = bgConfig.singles || {};
    Object.keys(singles).forEach(function (key) {
      if (groupedIds[key]) return;  // 已在分组中，跳过
      var config = singles[key];
      if (!config || config.type === 'none' || !config.url) return;

      // 封面特殊处理：背景放在 .cover-sticky 上
      var el;
      if (key === 'cover') {
        el = document.querySelector('#cover .cover-sticky');
      } else {
        el = document.getElementById(key);
      }
      if (!el) return;

      if (config.type === 'image') {
        el.style.backgroundImage = 'url("' + config.url + '")';
        el.style.backgroundSize = config.fillMode || 'cover';
        el.style.backgroundPosition = 'center center';
        el.style.backgroundRepeat = 'no-repeat';
        if (key !== 'cover') {
          el.classList.add('has-bg-image');
        }

        // ── 封面双层探照灯 ──
        if (key === 'cover' && config.topUrl !== undefined && config.topUrl !== '') {
          // 移除旧探照灯层
          var oldSpot = el.querySelector('.bg-spotlight-top');
          if (oldSpot) oldSpot.remove();

          var topLayer = document.createElement('div');
          topLayer.className = 'bg-spotlight-top cover-spotlight';
          topLayer.style.backgroundImage = 'url("' + config.topUrl + '")';
          topLayer.style.backgroundSize = config.fillMode || 'cover';
          topLayer.style.backgroundPosition = 'center center';
          // 初始位置
          topLayer.style.setProperty('--sx', '50%');
          topLayer.style.setProperty('--sy', '50%');
          el.appendChild(topLayer);

          el.addEventListener('mousemove', function(e) {
            var rect = el.getBoundingClientRect();
            topLayer.style.setProperty('--sx', (e.clientX - rect.left) + 'px');
            topLayer.style.setProperty('--sy', (e.clientY - rect.top) + 'px');
          });

          // 封面文字和浮动图片保持在探照灯上方
          var coverTextEls = el.querySelectorAll('.cover-title, .cover-explore-btn, .cover-nav-buttons');
          for (var ci2 = 0; ci2 < coverTextEls.length; ci2++) {
            coverTextEls[ci2].style.position = 'relative';
            coverTextEls[ci2].style.zIndex = '2';
          }
          // .cover-img-layer 保持 absolute 定位不变，只需确保 z-index 高于探照灯
          var imgLayer = el.querySelector('.cover-img-layer');
          if (imgLayer) { imgLayer.style.zIndex = '2'; }
        }
        // matcher iframe 透明化
        if (key === 'matcher') {
          var mIframe = el.querySelector('iframe');
          if (mIframe) makeMatcherTransparent(mIframe);
        }
      } else if (config.type === 'video') {
        var video = document.createElement('video');
        video.src = config.url;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.style.cssText =
          'position:absolute;top:0;left:0;width:100%;height:100%;' +
          'object-fit:' + (config.fillMode || 'cover') + ';' +
          'z-index:0;pointer-events:none;';
        el.style.position = el.style.position || 'relative';
        el.style.overflow = 'hidden';
        el.insertBefore(video, el.firstChild);
        for (var i = 0; i < el.children.length; i++) {
          var child = el.children[i];
          if (child !== video && child.tagName !== 'VIDEO') {
            child.style.position = 'relative';
            child.style.zIndex = '1';
          }
        }
      }
    });
  }

  function makeMatcherTransparent(iframe) {
    function inject() {
      try {
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc || !doc.head) return;
        var style = doc.createElement('style');
        style.textContent =
          ':root { --bg: transparent !important; --bg2: transparent !important; }' +
          'body { background: transparent !important; }' +
          'textarea { background: transparent !important; }' +
          '.result-card { background: transparent !important; }' +
          '.container { background: transparent !important; }' +
          '#questions-panel { background: transparent !important; }';
        doc.head.appendChild(style);
      } catch (e) { /* skip */ }
    }
    iframe.addEventListener('load', inject);
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      inject();
    }
  }

  // ==========================================
  // 封面 VariableProximity 光标文字效果
  // ==========================================
  function initVariableProximityOnCover() {
    var coverSection = document.getElementById('cover');
    var coverTitle = document.getElementById('coverTitle');
    if (!coverSection || !coverTitle) return;

    if (typeof initVariableProximity === 'function') {
      window._vpInstance = initVariableProximity(coverSection, coverTitle, {
        radius: 200,
        falloff: 'gaussian',
        fromWeight: 300,
        toWeight: 900
      });
    }
  }

  // ==========================================
  // 所有标题 TextPressure 光标压力效果
  // ==========================================
  function initTextPressureOnAllTitles() {
    if (typeof initTextPressure !== 'function') return;

    // All section titles, work/project/research titles
    var titles = document.querySelectorAll('.section-title, .scroll-stack-section-title, .proj-cards-title, .rr-title');
    for (var i = 0; i < titles.length; i++) {
      var titleEl = titles[i];
      if (titleEl.dataset.tpInit === 'true') continue;
      titleEl.dataset.tpInit = 'true';

      var containerEl = titleEl.closest('.section-header') || titleEl.closest('.scroll-stack-stage-title') || titleEl.parentElement;
      initTextPressure(containerEl, titleEl, {
        width: true,
        weight: true,
        italic: true,
        alpha: false
      });
    }
  }

  // ==========================================
  // 渲染：导航栏
  // ==========================================
  function renderNavigation() {
    if (!DOM.navLinks || !DOM.navLogo) return;
    DOM.navLogo.textContent = APP_DATA.site.title || '待填写';
    DOM.navLinks.innerHTML = '';
    var links = APP_DATA.navLinks || [];
    links.forEach(function (link, idx) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + link.id;
      a.textContent = link.label;
      a.setAttribute('data-ts-key', 'nav.link.' + idx);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(link.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
        DOM.navLinks.classList.remove('open');
      });
      li.appendChild(a);
      DOM.navLinks.appendChild(li);
    });
  }

  // ==========================================
  // 渲染：封面页
  // ==========================================
  function renderCover() {
    var cover = APP_DATA.cover || {};
    if (DOM.coverTitle) {
      // Split title into per-letter <span> for VariableProximity effect
      var titleText = cover.title || DEFAULT_DATA.cover.title;
      var lines = titleText.split('\n');
      var html = '';
      for (var l = 0; l < lines.length; l++) {
        if (l > 0) html += '<br>';
        var chars = lines[l].split('');
        for (var i = 0; i < chars.length; i++) {
          if (chars[i] === ' ') {
            html += '<span class="vp-space">&nbsp;</span>';
          } else {
            html += '<span class="vp-letter">' + esc(chars[i]) + '</span>';
          }
        }
      }
      DOM.coverTitle.innerHTML = html;
    }
    if (DOM.coverExploreBtn) {
      DOM.coverExploreBtn.textContent = cover.buttonText || DEFAULT_DATA.cover.buttonText;
    }

    // 渲染封面下的 5 个导航按钮（排除 Hiii）
    if (DOM.coverNavButtons) {
      DOM.coverNavButtons.innerHTML = '';
      var navItems = (APP_DATA.navLinks || []).filter(function (item) {
        return item.id !== 'cover';
      });
      navItems.forEach(function (item, idx) {
        var btn = document.createElement('button');
        btn.className = 'cover-nav-btn';
        btn.textContent = item.label;
        btn.setAttribute('data-ts-key', 'cover.navBtn.' + idx);
        btn.addEventListener('click', function () {
          var target = document.getElementById(item.id);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        });
        DOM.coverNavButtons.appendChild(btn);
      });
    }
  }

  // ==========================================
  // 封面交互："let's explore more" → 显示 5 按钮
  // ==========================================
  function initCoverInteraction() {
    var btn = DOM.coverExploreBtn;
    var navBtns = DOM.coverNavButtons;
    if (!btn || !navBtns) return;

    var revealed = false;

    btn.addEventListener('click', function () {
      if (revealed) return;
      revealed = true;

      // 按钮消失动画
      btn.classList.add('explored');
      setTimeout(function () {
        btn.style.display = 'none';
      }, 400);

      // 显示导航按钮
      navBtns.classList.add('revealed');
    });
  }

  // ==========================================
  // 渲染：封面浮动图片（从 data.js 动态生成）
  // ==========================================
  function renderCoverImages() {
    var layer = document.getElementById('coverImgLayer');
    if (!layer) return;
    var ci = APP_DATA.coverImages;
    if (!ci) return;

    layer.innerHTML = '';

    // 应用 CSS 变量（大小）
    if (ci.mainSize) layer.style.setProperty('--cover-main-size', ci.mainSize);
    if (ci.bgSize) layer.style.setProperty('--cover-bg-size', ci.bgSize);

    // 渲染主图
    (ci.main || []).forEach(function (img) {
      var div = document.createElement('div');
      div.className = 'cover-img-item cover-img-main';
      div.setAttribute('data-img', 'main');
      var style = '';
      if (img.top) style += 'top:' + img.top + ';';
      if (img.bottom) style += 'bottom:' + img.bottom + ';';
      if (img.left) style += 'left:' + img.left + ';';
      if (img.right) style += 'right:' + img.right + ';';
      div.setAttribute('style', style);
      var imgEl = document.createElement('img');
      imgEl.src = img.url || '';
      imgEl.alt = 'Cover';
      if (img === ci.main[0] || img === ci.main[1]) imgEl.setAttribute('fetchpriority', 'high');
      div.appendChild(imgEl);
      layer.appendChild(div);
    });

    // 渲染背景图
    (ci.bg || []).forEach(function (img) {
      var div = document.createElement('div');
      div.className = 'cover-img-item cover-img-bg';
      div.setAttribute('data-img', 'bg');
      var style = '';
      if (img.top) style += 'top:' + img.top + ';';
      if (img.bottom) style += 'bottom:' + img.bottom + ';';
      if (img.left) style += 'left:' + img.left + ';';
      if (img.right) style += 'right:' + img.right + ';';
      div.setAttribute('style', style);
      var imgEl = document.createElement('img');
      imgEl.src = img.url || '';
      imgEl.alt = 'Cover BG';
      div.appendChild(imgEl);
      layer.appendChild(div);
    });
  }

  // ==========================================
  // 渲染：个人信息（CircularGallery 照片 + 横行四卡片）
  // ==========================================
  function renderPersonalInfo() {
    var info = APP_DATA.personalInfo;
    if (!DOM.personalInfo) return;

    var html = '';
    html += '<div class="personal-new">';

    // 标题
    html += '  <div class="section-header fade-up">';
    html += '    <h2 class="section-title" data-ts-key="personalInfo.title">' + esc(info.title || '个人信息') + '</h2>';
    html += '  </div>';

    // ── CircularGallery 照片区 ──
    html += '  <div class="personal-gallery-wrapper">';
    html += '    <div id="personal-gallery"></div>';
    html += '  </div>';

    // ── 横行四卡片（悬停展开）──
    html += '  <div class="personal-info-row fade-up">';

    // 联系方式
    html += '    <div class="info-card">';
    html += '      <h4><span class="info-card-title-text" data-ts-key="personalInfo.card.title.0">联系方式</span><span class="info-card-indicator">+</span></h4>';
    html += '      <div class="info-card-body">';
    if (info.contact) {
      html += '        <ul>';
      html += '          <li><span class="info-lbl" data-ts-key="personalInfo.contact.email.label">邮箱</span><span data-ts-key="personalInfo.contact.email.value">' + esc(info.contact.email || '待填写') + '</span></li>';
      html += '          <li><span class="info-lbl" data-ts-key="personalInfo.contact.phone.label">电话</span><span data-ts-key="personalInfo.contact.phone.value">' + esc(info.contact.phone || '待填写') + '</span></li>';
      html += '          <li><span class="info-lbl" data-ts-key="personalInfo.contact.wechat.label">微信</span><span data-ts-key="personalInfo.contact.wechat.value">' + esc(info.contact.wechat || '待填写') + '</span></li>';
      html += '        </ul>';
    }
    html += '      </div>';
    html += '    </div>';

    // 教育背景
    html += '    <div class="info-card">';
    html += '      <h4><span class="info-card-title-text" data-ts-key="personalInfo.card.title.1">教育背景</span><span class="info-card-indicator">+</span></h4>';
    html += '      <div class="info-card-body">';
    html += '        <ul>';
    if (info.education && info.education.length > 0) {
      info.education.forEach(function (edu, eduIdx) { html += '<li data-ts-key="personalInfo.education.' + eduIdx + '">' + esc(String(edu)) + '</li>'; });
    } else { html += '          <li class="placeholder-text">待填写</li>'; }
    html += '        </ul>';
    html += '      </div>';
    html += '    </div>';

    // 获奖及证书
    html += '    <div class="info-card">';
    html += '      <h4><span class="info-card-title-text" data-ts-key="personalInfo.card.title.2">获奖及证书</span><span class="info-card-indicator">+</span></h4>';
    html += '      <div class="info-card-body">';
    html += '        <ul>';
    if (info.awards && info.awards.length > 0) {
      info.awards.forEach(function (award, awIdx) { html += '<li data-ts-key="personalInfo.awards.' + awIdx + '">' + esc(String(award)) + '</li>'; });
    } else { html += '          <li class="placeholder-text">待填写</li>'; }
    html += '        </ul>';
    html += '      </div>';
    html += '    </div>';

    // 爱好
    html += '    <div class="info-card">';
    html += '      <h4><span class="info-card-title-text" data-ts-key="personalInfo.card.title.3">爱好</span><span class="info-card-indicator">+</span></h4>';
    html += '      <div class="info-card-body">';
    html += '        <ul>';
    if (info.hobbies && info.hobbies.length > 0) {
      info.hobbies.forEach(function (hobby, hIdx) { html += '<li data-ts-key="personalInfo.hobbies.' + hIdx + '">' + esc(String(hobby)) + '</li>'; });
    } else { html += '          <li class="placeholder-text">待填写</li>'; }
    html += '        </ul>';
    html += '      </div>';
    html += '    </div>';

    html += '  </div>';

    

    html += '</div>';

 
    DOM.personalInfo.innerHTML = html;
   }

  // ==========================================
  // 渲染：科研经历 (Research Reel — 双排反向滑动)
  // ==========================================
  function renderResearch() {
    var researchSection = APP_DATA.researchExperience || {};
    var researchItems = researchSection.items || [];
    var researchContainer = document.getElementById('researchSection');
    if (!researchContainer || researchItems.length === 0) return;

    researchContainer.innerHTML = '';
    window._researchReel = createResearchReel(researchContainer, researchItems);
    // 覆盖 bundle.js 中硬编码的标题
    var rrTitle = researchContainer.querySelector('.rr-title');
    if (rrTitle) {
      rrTitle.textContent = researchSection.title || '科研经历';
      rrTitle.setAttribute('data-ts-key', 'researchExperience.title');
    }
  }


  // ==========================================
  // ==========================================
  // 渲染：工作 & 项目经历（两个独立 stack-stage）
  // 每个标题 + 各自卡片舞台，滚动锁定逐张覆盖
  // ==========================================
  function renderExperience() {
    var workSection = APP_DATA.workExperience || {};
    var projSection = APP_DATA.projectExperience || {};
    var workItems = workSection.items || [];
    var projItems = projSection.items || [];
    if (!DOM.experienceSection) return;

    var h = '';

    // ═══ 工作经历 ═══
    h += '<div class="stack-section" data-stack-id="experience-work">';
    h += '  <div class="stack-titles">';
    h += '    <h2 class="scroll-stack-section-title" data-ts-key="workExperience.title">' + esc(workSection.title || '工作经验') + '</h2>';
    h += '  </div>';
    h += '  <div class="stack-stage">';
    h +=    renderStackCards(workItems, 'work', workItems.length);
    h += '  </div>';
    h += '</div>';

    // ═══ 项目经验 — 四图横排 hover 展开 ═══
    h += renderProjectCards(projItems, projSection.title);

    DOM.experienceSection.innerHTML = h;

    // ── 分别初始化两个 Scroll-jacking ──
    setTimeout(function () {
      initScrollJacking('experience-work');
      initStackTitleObserver();
    }, 200);
  }


  // ==========================================
  // 项目经验 — 四图横排 hover 展开卡片
  // ==========================================
  function renderProjectCards(items, sectionTitle) {
    if (!items || items.length === 0) return '';
    var h = '';
    h += '<div class="proj-cards-section">';
    h += '  <h2 class="proj-cards-title" data-ts-key="projectExperience.title">' + esc(sectionTitle || '项目经验') + '</h2>';
    h += '  <div class="proj-cards-grid">';
    items.forEach(function(item, pIdx) {
      h += '    <div class="proj-card">';
      h += '      <div class="proj-card-img">';
      if (item.photo && item.photo !== '待填写') {
        h += '        <img src="' + urlSafe(item.photo) + '" alt="' + esc(item.name || '') + '" loading="lazy">';
      } else {
        h += '        <div class="proj-card-placeholder">📋</div>';
      }
      h += '      </div>';
      h += '      <div class="proj-card-body">';
      h += '        <div class="proj-card-body-inner">';
      h += '          <div class="proj-card-name" data-ts-key="projectExperience.items.' + pIdx + '.name">' + esc(item.name || '') + '</div>';
      h += '          <div class="proj-card-role" data-ts-key="projectExperience.items.' + pIdx + '.role">' + esc(item.role || '') + '</div>';
      if (item.details && Array.isArray(item.details)) {
        h += '          <ul class="proj-card-list">';
        item.details.forEach(function(d, dIdx) { h += '            <li data-ts-key="projectExperience.items.' + pIdx + '.details.' + dIdx + '">' + esc(d) + '</li>'; });
        h += '          </ul>';
      }
      h += '        </div>';
      h += '      </div>';
      h += '    </div>';
    });
    h += '  </div>';
    h += '</div>';
    return h;
  }


  // ── 渲染卡片列表 ──
  function renderStackCards(items, type, total) {
    var isWork = (type === 'work');
    var h = '';

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var photo = item.photo || '';
      var stepNum = i + 1;
      var stateCls = (i === 0) ? 'active' : 'below';

      h += '    <div class="scroll-stack-card ' + stateCls + '" data-card-index="' + i + '">';

      // 左侧照片
      h += '      <div class="scroll-stack-card-left">';
      if (photo && photo !== '待填写') {
        h += '        <img src="' + urlSafe(photo) + '" alt="照片 ' + stepNum + '" loading="lazy">';
      } else {
        h += '        <div class="scroll-stack-card-left-placeholder">待添加照片</div>';
      }
      h += '      </div>';

      // 右侧文字
      h += '      <div class="scroll-stack-card-right">';
      h += '        <div class="scroll-stack-card-info">';
      if (isWork) {
        h += '          <h3 data-ts-key="workExperience.items.' + i + '.company">' + esc(item.company || '待填写') + '</h3>';
        h += '          <div class="scroll-stack-card-role" data-ts-key="workExperience.items.' + i + '.position">' + esc(item.position || '待填写') + '</div>';
        h += '          <div class="scroll-stack-card-period" data-ts-key="workExperience.items.' + i + '.period">' + esc(item.period || '待填写') + '</div>';
      } else {
        h += '          <h3 data-ts-key="projectExperience.items.' + i + '.name">' + esc(item.name || '待填写') + '</h3>';
        h += '          <div class="scroll-stack-card-role" data-ts-key="projectExperience.items.' + i + '.role">' + esc(item.role || '待填写') + '</div>';
      }
      h += '        </div>';

      // 详情
      h += '        <div class="scroll-stack-card-details">';
      if (item.details) {
        if (Array.isArray(item.details)) {
          if (item.details.length > 0) {
            h += '          <ul>';
            var prefix = isWork ? 'workExperience' : 'projectExperience';
            item.details.forEach(function (d, dIdx) { h += '<li data-ts-key="' + prefix + '.items.' + i + '.details.' + dIdx + '">' + esc(String(d)) + '</li>'; });
            h += '          </ul>';
          } else { h += '          <p class="placeholder-text">待填写</p>'; }
        } else if (item.details !== '待填写') {
          h += '          <p data-ts-key="' + prefix + '.items.' + i + '.details.0">' + esc(String(item.details)) + '</p>';
        } else { h += '            <p class="placeholder-text">待填写</p>'; }
      } else { h += '            <p class="placeholder-text">待填写</p>'; }
      h += '        </div>';

      // 底部
      h += '        <div class="scroll-stack-card-footer">';
      h += '          <span class="scroll-stack-progress">' + stepNum + ' / ' + total + '</span>';
      if (i < total - 1) {
        h += '          <span class="scroll-stack-hint">↓ 继续滚动</span>';
      }
      h += '        </div>';
      h += '      </div>';

      h += '    </div>';
    }
    return h;
  }

  // ==========================================
  // Scroll-jacking 实例管理器
  // ==========================================
  var scrollJackInstances = {};

  function initScrollJacking(prefix) {
    // 清除旧实例
    destroyScrollJacking(prefix);

    var section = document.querySelector('[data-stack-id="' + prefix + '"]');
    if (!section) return;
    var stageEl = section.querySelector('.stack-stage');
    if (!stageEl) return;
    var cards = stageEl.querySelectorAll('.scroll-stack-card');
    if (cards.length === 0) return;

    var total = cards.length;
    var currentIdx = 0;
    var busy = false;
    var scrollAccum = 0;
    var SCROLL_THRESHOLD = 100;

    // 检测第一张卡片是否到达视口中央
    function isCardAtCenter() {
      var stageRect = stageEl.getBoundingClientRect();
      // 卡片在 stage 50% 处（absolute top:50%）
      var cardCenter = stageRect.top + stageRect.height * 0.5;
      var viewportCenter = window.innerHeight * 0.5;
      var tolerance = window.innerHeight * 0.12;
      return Math.abs(cardCenter - viewportCenter) < tolerance;
    }

    function setCardState(idx, state) {
      var card = cards[idx];
      if (!card) return;
      card.classList.remove('active', 'covered', 'below', 'above');
      card.classList.add(state);
    }

    function switchTo(newIdx, direction) {
      if (busy || newIdx === currentIdx || newIdx < 0 || newIdx >= total) return;
      busy = true;

      if (direction === 'next') {
        setCardState(newIdx, 'active');
        setCardState(currentIdx, 'covered');
      } else {
        setCardState(newIdx, 'active');
        setCardState(currentIdx, 'below');
      }

      currentIdx = newIdx;
      setTimeout(function () { busy = false; }, 550);
    }

    function onWheel(e) {
      if (busy) { e.preventDefault(); return; }
      if (!isCardAtCenter()) { scrollAccum = 0; return; }

      if (e.deltaY > 0) {
        if (currentIdx >= total - 1) {
          scrollAccum = 0;
          return;
        }
        e.preventDefault();
        scrollAccum += e.deltaY;
        if (scrollAccum >= SCROLL_THRESHOLD) {
          scrollAccum = 0;
          switchTo(currentIdx + 1, 'next');
        }
      } else if (e.deltaY < 0) {
        if (currentIdx <= 0) {
          scrollAccum = 0;
          return;
        }
        e.preventDefault();
        scrollAccum += Math.abs(e.deltaY);
        if (scrollAccum >= SCROLL_THRESHOLD) {
          scrollAccum = 0;
          switchTo(currentIdx - 1, 'prev');
        }
      }
    }

    function onTouchStart(e) { touchStartY = e.touches[0].clientY; }
    var touchStartY = 0;
    function onTouchEnd(e) {
      if (!isCardAtCenter() || busy) return;
      var dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 30) return;
      if (dy > 0 && currentIdx < total - 1) {
        e.preventDefault();
        switchTo(currentIdx + 1, 'next');
      } else if (dy < 0 && currentIdx > 0) {
        e.preventDefault();
        switchTo(currentIdx - 1, 'prev');
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    section.addEventListener('touchstart', onTouchStart, { passive: true });
    section.addEventListener('touchend', onTouchEnd, { passive: false });

    // 保存以便销毁
    scrollJackInstances[prefix] = {
      onWheel: onWheel,
      onTouchStart: onTouchStart,
      onTouchEnd: onTouchEnd,
      section: section
    };
  }

  function destroyScrollJacking(prefix) {
    var inst = scrollJackInstances[prefix];
    if (!inst) return;
    if (inst.onWheel) window.removeEventListener('wheel', inst.onWheel, { passive: false });
    if (inst.onTouchStart && inst.section) inst.section.removeEventListener('touchstart', inst.onTouchStart, { passive: true });
    if (inst.onTouchEnd && inst.section) inst.section.removeEventListener('touchend', inst.onTouchEnd, { passive: false });
    delete scrollJackInstances[prefix];
  }

  // 标题淡入观察
  function initStackTitleObserver() {
    var titles = DOM.experienceSection.querySelectorAll('.scroll-stack-section-title');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '500px 0px 500px 0px' });
    titles.forEach(function (el) { observer.observe(el); });
  }

  // ==========================================
  // 渲染：AI 匹配器（iframe 嵌入，无需动态渲染）
  // ==========================================
  function renderAIMatcher() {
    // Content is served via iframe in index.html — nothing to render dynamically
  }

  // ==========================================
  // 渲染：我的技能
  // ==========================================
  function renderMySkills() {
    var skills = APP_DATA.mySkills || {};
    var container = DOM.skillsSection;
    if (!container) return;

    var html = '';
    html += '<div class="skills-container">';
    html += '  <div class="section-header fade-up">';
    html += '    <h2 class="section-title" data-ts-key="mySkills.title">' + esc(skills.title || '我的技能') + '</h2>';
    if (skills.description) {
      html += '    <p class="skills-description" data-ts-key="mySkills.description">' + esc(skills.description) + '</p>';
    }
    html += '    <div class="section-underline"></div>';
    html += '  </div>';
    html += '  <div class="skills-categories">';

    var categories = skills.categories || [];
    categories.forEach(function (cat, catIdx) {
      var catName = cat.name || '';
      var items = cat.items || [];
      var iconPlaceholder = cat.iconPlaceholder !== false;

      html += '    <div class="skills-category-row fade-up">';
      if (catName) {
        html += '      <div class="skills-category-name" data-ts-key="mySkills.categories.' + catIdx + '.name">' + esc(catName) + '</div>';
      }
      html += '      <div class="skills-loop-wrapper" id="skillsLoop' + catIdx + '"></div>';
      html += '    </div>';
    });

    html += '  </div>';
    html += '</div>';

    container.innerHTML = html;

    // ── Initialize LogoLoop for each category ──
    setTimeout(function () {
      categories.forEach(function (cat, catIdx) {
        var wrapper = document.getElementById('skillsLoop' + catIdx);
        if (!wrapper) return;

        var items = (cat.items || []).map(function (item) {
          return {
            name: item.name || '',
            url: item.url || '',
            label: item.name || ''
          };
        });

        if (items.length === 0) return;

        window.createLogoLoop(wrapper, {
          items: items,
          speed: 100,
          direction: 'left',
          logoHeight: 44,
          gap: 48,
          fadeOut: true,
          fadeOutColor: '#ffffff',
          scaleOnHover: true,
          hoverSpeed: 0
        });
      });
    }, 50);
  }

  // ==========================================
  // 渲染：作品集
  // ==========================================
  function renderPortfolio() {
    var pf = APP_DATA.portfolio || {};
    var container = document.getElementById('portfolioSection');
    if (!container) return;

    var tabs = pf.tabs || [
      { id: 'xiaohongshu', label: '小红书账号' },
      { id: 'photography', label: '摄影集' },
      { id: 'video', label: '剪辑作品' }
    ];

    var html = '';
    html += '<div class="section-header fade-up">';
    html += '  <h2 class="section-title" data-ts-key="portfolio.title">' + esc(pf.title || '作品集') + '</h2>';
    html += '  <div class="section-underline"></div>';
    html += '</div>';
    html += '<div class="portfolio-container">';
    // Tabs - GooeyNav
    html += '  <div class="gooey-nav-container fade-up" id="portfolioTabs">';
    html += '    <nav><ul>';
    tabs.forEach(function (tab, i) {
      html += '      <li><a href="#" data-tab="' + tab.id + '" data-ts-key="portfolio.tabs.' + i + '.label">' + esc(tab.label) + '</a></li>';
    });
    html += '    </ul></nav>';
    html += '    <span class="effect filter"></span>';
    html += '    <span class="effect text"></span>';
    html += '  </div>';
    // Content area
    html += '  <div class="portfolio-content-area" id="portfolioContentArea">';

            // Xiaohongshu panel — 左图右树杂志布局（2×2 爆款IP网格）
    html += '    <div class="portfolio-panel" data-panel="xiaohongshu" id="panel-xiaohongshu">';
    var xhsData = pf.xiaohongshu || {};
    // ── 新版 featuredIPs 优先，旧版 photos 做 fallback ──
    var featuredIPs = xhsData.featuredIPs || [];
    var xhsPhotos = xhsData.photos || [];
    var xhsSections = xhsData.sections || [];
    // 兼容旧数据：如果没有 featuredIPs 但有 photos，自动转为单 IP
    if (featuredIPs.length === 0 && xhsPhotos.length > 0) {
      featuredIPs = [{ name: '运营配图', photos: xhsPhotos }];
    }
    // 补齐到 4 个占位
    while (featuredIPs.length < 4) {
      featuredIPs.push({ name: '爆款IP ' + (featuredIPs.length + 1), photos: [] });
    }
    if (xhsSections.length > 0 || featuredIPs.some(function(ip) { return ip.photos && ip.photos.length > 0; })) {
      html += '      <div class="xhs-magazine" id="xhsMagazine">';
      // ── 左栏：2×2 IP 轮播网格（sticky）──
      html += '        <div class="xhs-magazine-left">';
      html += '          <div class="xhs-magazine-ip-grid">';
      featuredIPs.forEach(function(ip, i) {
        var ipPhotos = ip.photos || [];
        html += '            <div class="xhs-magazine-ip-card">';
        html += '              <div class="xhs-magazine-ip-label">' + esc(ip.name) + '</div>';
        html += '              <div class="xhs-magazine-stage" id="xhsMagazineStage-' + i + '">';
        if (ipPhotos.length > 0) {
          ipPhotos.forEach(function(src, j) {
            html += '<img class="xhs-magazine-photo' + (j === 0 ? ' active' : '') + '" src="' + urlSafe(src) + '" alt="' + esc(ip.name) + ' ' + (j + 1) + '" data-index="' + j + '">';
          });
        } else {
          html += '                <div class="xhs-magazine-placeholder">待上传</div>';
        }
        html += '              </div>';
        html += '              <div class="xhs-magazine-counter" id="xhsMagazineCounter-' + i + '">' + (ipPhotos.length > 0 ? '1 / ' + ipPhotos.length : '0 / 0') + '</div>';
        html += '            </div>';
      });
      html += '          </div>';
      html += '        </div>';
      // ── 右栏：树形内容 ──
      html += '        <div class="xhs-magazine-right">';
      html += '          <div class="xhs-tree">';
      // 树根
      html += '            <div class="xhs-tree-root">';
            html += '              <span class="xhs-tree-label" data-ts-key="portfolio.xiaohongshu.treeLabel">运营作品集</span>';
      html += '            </div>';
            var sectionSubItems = [
        null,
        null, 
        null,
        null,
        null
      ];
      xhsSections.forEach(function(sec, i) {
        html += '        <div class="xhs-tree-branch">';
        html += '          <div class="xhs-tree-connector"></div>';
        html += '          <div class="xhs-tree-node">';
        html += '            <span class="xhs-tree-label" data-ts-key="portfolio.xiaohongshu.sections.' + i + '.title">' + esc(sec.title || '') + '</span>';
        html += '          </div>';
        // 内容默认展开
        html += '          <div class="xhs-tree-content" style="display:block">';
        html += '            <p data-ts-key="portfolio.xiaohongshu.sections.' + i + '.content">' + esc(sec.content || '') + '</p>';
        if (sec.url) {
          html += '            <a class="xhs-link" href="' + esc(sec.url) + '" target="_blank" rel="noopener noreferrer">查看详情 →</a>';
        }
        // 图片网格
        if (sec.images && sec.images.length > 0) {
          html += '            <div class="xhs-image-grid">';
          sec.images.forEach(function(imgItem) {
            var imgUrl = typeof imgItem === 'string' ? imgItem : (imgItem.url || '');
            var imgTitle = (typeof imgItem === 'object' && imgItem.title) ? imgItem.title : '';
            html += '              <div class="xhs-image-grid-item">';
            html += '                <img src="' + urlSafe(imgUrl) + '" alt="' + esc(imgTitle) + '" loading="lazy">';
            if (imgTitle) {
              html += '                <span class="xhs-image-grid-title">' + esc(imgTitle) + '</span>';
            }
            html += '              </div>';
          });
          html += '            </div>';
        }
        html += '          </div>';
        // 二级节点
        var subs = sectionSubItems[i];
        if (subs) {
          subs.forEach(function(subItem) {
            var subLabel = typeof subItem === 'string' ? subItem : subItem.label;
            var subImage = (typeof subItem === 'object' && subItem.image) ? subItem.image : null;
            html += '          <div class="xhs-tree-sub">';
            html += '            <div class="xhs-tree-sub-connector"></div>';
            html += '            <div class="xhs-tree-sub-node">';
            html += '              <span class="xhs-tree-sub-icon">└</span>';
            html += '              <span class="xhs-tree-label sub">' + esc(subLabel) + '</span>';
            html += '            </div>';
            if (subImage) {
              html += '            <div class="xhs-tree-sub-image">';
              html += '              <img src="' + urlSafe(subImage) + '" alt="' + esc(subLabel) + '" loading="lazy">';
              html += '            </div>';
            }
            html += '          </div>';
          });
        }
        html += '        </div>';
      });
      html += '          </div>';
      html += '        </div>';
      html += '      </div>';
    } else {
      html += '      <div class="empty-state">📱 小红书作品数据待填写<br><small>请在 data.json 的 portfolio.xiaohongshu 中添加内容</small></div>';
    }
    html += '    </div>';
// Photography panel (Category Sections)
	    html += '    <div class="portfolio-panel" data-panel="photography" id="panel-photography">';
	    var photoCategories = (pf.photography && pf.photography.categories) || [];
	    if (photoCategories.length > 0) {
	      html += '      <div class="photo-quote" data-ts-key="portfolio.photography.quote">More daily scenes today. Nothing unusual, just worth keeping.</div>';
	      html += '      <div class="photo-sections">';
	      photoCategories.forEach(function(cat, catIdx) {
	        html += '        <div class="photo-section">';
	        html += '          <h3 class="photo-section-title" data-ts-key="portfolio.photography.categories." + catIdx + ".name">' + esc(cat.name) + '</h3>';
	        html += '          <div class="photo-grid">';
	        cat.photos.forEach(function(photo) {
	          html += '            <div class="photo-card">';
	          html += '              <img src="' + urlSafe(photo.image) + '" alt="' + esc(photo.title || '') + '" loading="lazy">';
	          html += '            </div>';
	        });
	        html += '          </div>';
	        html += '        </div>';
	      });
	      html += '      </div>';
	    } else {
	      html += '      <div class="empty-state">📷 摄影作品数据待填写<br><small>请在 data.json 的 portfolio.photography 中添加内容</small></div>';
	    }
	    html += '    </div>';


    // Video panel - 3D Card Carousel
    html += '    <div class="portfolio-panel" data-panel="video" id="panel-video">';
    html += '      <div id="videoCardsContainer"></div>';
    html += '    </div>';

    html += '  </div>';
    html += '</div>';
    container.innerHTML = html;
  }

  function renderXHSCard(item, index) {
    var h = '';
    h += '<div class="xhs-card narrative-item" data-narrative="' + index + '">';
    if (item.image && item.image !== '待填写') {
      h += '  <img class="xhs-card-image lightbox-trigger" src="' + urlSafe(item.image) + '" alt="' + esc(item.title || '') + '" loading="lazy">';
    } else {
      h += '  <div class="xhs-card-image" style="background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;aspect-ratio:4/3;color:var(--text-muted);font-size:0.85rem;">待添加图片</div>';
    }
    h += '  <div class="xhs-card-body">';
    h += '    <h4>' + esc(item.title || '待填写') + '</h4>';
    if (item.operation) { h += '    <p><span class="xhs-label">运营思路：</span>' + esc(item.operation) + '</p>'; }
    if (item.positioning) { h += '    <p><span class="xhs-label">定位分析：</span>' + esc(item.positioning) + '</p>'; }
    if (item.competitor) { h += '    <p><span class="xhs-label">竞品分析：</span>' + esc(item.competitor) + '</p>'; }
    if (item.contentPlan) { h += '    <p><span class="xhs-label">选题库：</span>' + esc(item.contentPlan) + '</p>'; }
    if (item.highlight) { h += '    <p><span class="xhs-label">优质笔记：</span>' + esc(item.highlight) + '</p>'; }
    h += '  </div>';
    h += '</div>';
    return h;
  }

  function renderCarousel(type, items) {
    var h = '';
    h += '<div class="narrative-item" data-narrative="carousel">';
    h += '  <div class="carousel-container" data-carousel="' + type + '">';
    h += '    <button class="carousel-arrow prev" aria-label="上一个">◀</button>';
    h += '    <div class="carousel-track-wrapper">';
    h += '      <div class="carousel-track">';
    items.forEach(function (item) {
      h += '        <div class="carousel-slide">';
      if (type === 'video') {
        h += '          <video src="' + urlSafe(item.src || '') + '" controls preload="metadata" playsinline></video>';
      } else {
        h += '          <img class="lightbox-trigger" src="' + urlSafe(item.src || '') + '" alt="' + esc(item.title || '') + '" loading="lazy">';
      }
      if (item.title || item.description) {
        h += '          <div class="carousel-caption">';
        h += '            <h4>' + esc(item.title || '') + '</h4>';
        h += '            <p>' + esc(item.description || '') + '</p>';
        h += '          </div>';
      }
      h += '        </div>';
    });
    h += '      </div>';
    h += '    </div>';
    h += '    <button class="carousel-arrow next" aria-label="下一个">▶</button>';
    h += '  </div>';
    h += '  <div class="carousel-dots" data-carousel-dots="' + type + '">';
    items.forEach(function (_, i) {
      h += '    <button class="carousel-dot' + (i === 0 ? ' active' : '') + '" data-index="' + i + '"></button>';
    });
    h += '  </div>';
    h += '</div>';
    return h;
  }

  // ==========================================
  // 渲染：Footer
  // ==========================================
  function renderFooter() {
    var footer = document.getElementById('siteFooter');
    if (!footer) return;
    footer.setAttribute('data-ts-key', 'footer.text');
    footer.textContent = APP_DATA.footer && APP_DATA.footer.text ? APP_DATA.footer.text : '待填写';
  }

  // ==========================================
  // 滚动动画（Intersection Observer）
  // ==========================================
  function initScrollAnimations() {
    var fadeUpEls = document.querySelectorAll('.fade-up');
    var staggerEls = document.querySelectorAll('.stagger-children');

    var observerOptions = { threshold: 0, rootMargin: '500px 0px 500px 0px' };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    fadeUpEls.forEach(function (el) { observer.observe(el); });

    // 处理 stagger-children（如果存在）
    staggerEls.forEach(function (el) { observer.observe(el); });

    // Observe narrative items
    setTimeout(function () {
      var narrativeObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0, rootMargin: '500px 0px 500px 0px' });

      document.querySelectorAll('.narrative-item').forEach(function (el) {
        narrativeObserver.observe(el);
      });
    }, 100);
  }

  function refreshNarrativeObserver() {
    var narrativeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0, rootMargin: '500px 0px 500px 0px' });

    document.querySelectorAll('.narrative-item:not(.visible)').forEach(function (el) {
      narrativeObserver.observe(el);
    });
  }

  // ==========================================
  // 导航滚动高亮
  // ==========================================
  function initNavScrollSpy() {
    var sections = [];
    (APP_DATA.navLinks || []).forEach(function (link) {
      var el = document.getElementById(link.id);
      if (el) sections.push({ id: link.id, el: el });
    });
    if (sections.length === 0) return;

    var navAnchors = DOM.navLinks ? DOM.navLinks.querySelectorAll('a') : [];

    window.addEventListener('scroll', function () {
      var scrollPos = window.scrollY + 120;
      var current = '';
      sections.forEach(function (sec) {
        if (sec.el.offsetTop <= scrollPos) {
          current = sec.id;
        }
      });
      navAnchors.forEach(function (a) {
        a.classList.remove('active');
        if (a.getAttribute('href') === '#' + current) {
          a.classList.add('active');
        }
      });
    });
  }

  // ==========================================
  // 移动端菜单
  // ==========================================
  function initMobileMenu() {
    if (!DOM.mobileMenuBtn || !DOM.navLinks) return;
    DOM.mobileMenuBtn.addEventListener('click', function () {
      DOM.navLinks.classList.toggle('open');
    });
    DOM.navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        DOM.navLinks.classList.remove('open');
      });
    });
  }

  // ==========================================
  // 作品集 Tab 切换
  // ==========================================
  function initPortfolioTabs() {
    var container = document.getElementById('portfolioTabs');
    var panels = document.querySelectorAll('.portfolio-panel');
    if (!container || panels.length === 0) return;



    // ── 小红书左侧 JS sticky 滚动（仅桌面端）──
    function initXhsStickyScroll() {
      var left = document.querySelector('.xhs-magazine-left');
      var magazine = document.getElementById('xhsMagazine');
      if (!left || !magazine) return;

      // 移除旧监听
      if (window._xhsStickyHandler) {
        window.removeEventListener('scroll', window._xhsStickyHandler);
        window._xhsStickyHandler = null;
      }

      // 移动端不启用 sticky（网格已堆叠为单列）
      if (window.innerWidth <= 768) {
        left.style.transform = '';
        return;
      }

      function stickyLoop() {
        // 窗口大小变化时重新检查
        if (window.innerWidth <= 768) {
          left.style.transform = '';
          return;
        }

        var magazineRect = magazine.getBoundingClientRect();
        var leftHeight = left.offsetHeight;
        var offset = 100; // top offset (navbar + breathing room)

        // 左栏能滚动的最大距离 = 杂志总高 - 左栏自身高
        var maxScroll = magazineRect.height - leftHeight;
        if (maxScroll < 0) maxScroll = 0;

        // 杂志顶部相对于视口：当 magazineRect.top < offset 时开始跟随
        var scrolled = offset - magazineRect.top;

        if (scrolled <= 0) {
          left.style.transform = 'translateY(0px)';
        } else if (scrolled >= maxScroll) {
          left.style.transform = 'translateY(' + maxScroll + 'px)';
        } else {
          left.style.transform = 'translateY(' + scrolled + 'px)';
        }
      }

      window._xhsStickyHandler = stickyLoop;
      window.addEventListener('scroll', window._xhsStickyHandler, { passive: true });
      stickyLoop();
    }

    // ── 杂志轮播（多实例：2×2 IP 网格）──
    function initXhsMagazineCarousel() {
      // 销毁旧实例
      if (window._xhsMagazineIntervals) {
        window._xhsMagazineIntervals.forEach(function(id) { clearInterval(id); });
      }
      window._xhsMagazineIntervals = [];

      // 查找所有 stage
      var stages = document.querySelectorAll('[id^="xhsMagazineStage-"]');
      if (stages.length === 0) {
        var oldStage = document.getElementById('xhsMagazineStage');
        if (oldStage) stages = [oldStage];
      }
      if (stages.length === 0) return;

      // 将 NodeList 转数组，避免 live-collection 问题
      var stageList = [];
      for (var si = 0; si < stages.length; si++) {
        stageList.push(stages[si]);
      }

      stageList.forEach(function(stage) {
        var suffix = stage.id.replace('xhsMagazineStage', '');
        var counter = document.getElementById('xhsMagazineCounter' + suffix);
        // 转静态数组
        var photoList = [];
        var rawPhotos = stage.querySelectorAll('.xhs-magazine-photo');
        for (var pi = 0; pi < rawPhotos.length; pi++) {
          photoList.push(rawPhotos[pi]);
        }

        if (photoList.length < 2) {
          if (counter && photoList.length === 1) counter.textContent = '1 / 1';
          return;
        }

        // 全部重置为不可见
        for (var p = 0; p < photoList.length; p++) {
          photoList[p].classList.remove('active');
          photoList[p].style.zIndex = '1';
        }

        // 状态对象（挂在 stage 上，避免闭包陷阱）
        var state = { idx: 0, len: photoList.length, timer: null };

        // 展示第一张
        photoList[0].classList.add('active');
        photoList[0].style.zIndex = '3';
        if (counter) counter.textContent = '1 / ' + state.len;

        function advance() {
          var oldIdx = state.idx;
          var newIdx = (state.idx + 1) % state.len;

          // 新图上浮到顶层再激活
          photoList[newIdx].style.zIndex = '4';
          photoList[newIdx].classList.add('active');

          // 旧图下沉
          photoList[oldIdx].classList.remove('active');
          photoList[oldIdx].style.zIndex = '2';

          state.idx = newIdx;

          // 把所有非当前图归位到 z-index:1（500ms 后，等过渡完成）
          var cur = newIdx;
          setTimeout(function() {
            for (var i = 0; i < photoList.length; i++) {
              if (i !== cur) photoList[i].style.zIndex = '1';
            }
            photoList[cur].style.zIndex = '3';
          }, 550);

          if (counter) counter.textContent = (state.idx + 1) + ' / ' + state.len;
        }

        var intervalId = setInterval(advance, 2000);
        window._xhsMagazineIntervals.push(intervalId);
        stage._xhsState = state;
      });
    }

    // Store the GooeyNav instance for potential later use
    window._portfolioGooeyNav = initGooeyNav(container, {
      initialActiveIndex: 1,
      particleCount: 15,
      particleDistances: [90, 10],
      particleR: 100,
      animationTime: 600,
      timeVariance: 300,
      colors: [1, 2, 3, 1, 2, 3, 1, 4],
      onChange: function (index, liEl) {
        var link = liEl.querySelector('a');
        var tabId = link ? link.getAttribute('data-tab') : null;
        if (!tabId) return;

        panels.forEach(function (panel) {
          if (panel.getAttribute('data-panel') === tabId) {
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
          }
        });


        // Init xiaohongshu magazine carousel on tab switch
        if (tabId === 'xiaohongshu') {
          setTimeout(initXhsMagazineCarousel, 150);
          setTimeout(initXhsStickyScroll, 200);
        }

        // Init 3D video carousel
        if (tabId === 'video') {
          var vc = document.getElementById('videoCardsContainer');
          var vi = (APP_DATA.portfolio && APP_DATA.portfolio.video) || [];
          if (vc && vc.children.length === 0 && typeof Video3DCards !== 'undefined') {
            Video3DCards.init(vc, vi);
          }
        }

        setTimeout(refreshNarrativeObserver, 400);
        setTimeout(function () { initCarousels(); }, 50);
      }
    });

    // Show default panel on load, remove all other active states
    panels.forEach(function(p) { p.classList.remove('active'); });
    // Activate default panel (photography = index 1)
    var defaultPanel = document.getElementById('panel-photography');
    if (defaultPanel) defaultPanel.classList.add('active');

    // ── 小红书 JS sticky 兜底（绕过 CSS transform containing-block 陷阱）──
    initXhsStickyScroll();
    // ── 轮播仅当 panel 可见时初始化 ──
    var xhsPanel = document.getElementById('panel-xiaohongshu');
    if (xhsPanel && xhsPanel.classList.contains('active')) {
      setTimeout(initXhsMagazineCarousel, 100);
    }
    initCarousels();
  }

  // ==========================================
  // 小红书照片自动轮播


  // ==========================================
  // 轮播图（Carousel）
  // ==========================================
  function initCarousels() {
    document.querySelectorAll('.carousel-container').forEach(function (container) {
      if (container.dataset.carouselInit === 'true') return;
      container.dataset.carouselInit = 'true';

      var carouselType = container.dataset.carousel;
      var track = container.querySelector('.carousel-track');
      var slides = container.querySelectorAll('.carousel-slide');
      var prevBtn = container.querySelector('.carousel-arrow.prev');
      var nextBtn = container.querySelector('.carousel-arrow.next');
      var dotsContainer = document.querySelector('[data-carousel-dots="' + carouselType + '"]');
      var dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];

      if (!track || slides.length === 0) return;

      var currentIndex = 0;
      var slideCount = slides.length;
      var startX = 0;
      var isDragging = false;
      var dragOffset = 0;

      function goToSlide(index) {
        if (index < 0) index = slideCount - 1;
        if (index >= slideCount) index = 0;
        currentIndex = index;
        track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
        dots.forEach(function (dot, i) {
          dot.classList.toggle('active', i === currentIndex);
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', function () { goToSlide(currentIndex - 1); });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function () { goToSlide(currentIndex + 1); });
      }

      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          var idx = parseInt(dot.getAttribute('data-index'));
          goToSlide(idx);
        });
      });

      // Drag support
      track.addEventListener('mousedown', function (e) {
        isDragging = true;
        startX = e.clientX;
        track.style.transition = 'none';
        e.preventDefault();
      });

      track.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        dragOffset = e.clientX - startX;
        var offset = -(currentIndex * 100) + (dragOffset / track.offsetWidth) * 100;
        track.style.transform = 'translateX(' + offset + '%)';
      });

      track.addEventListener('mouseup', function () {
        if (!isDragging) return;
        isDragging = false;
        track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        if (Math.abs(dragOffset) > 60) {
          goToSlide(dragOffset < 0 ? currentIndex + 1 : currentIndex - 1);
        } else {
          goToSlide(currentIndex);
        }
        dragOffset = 0;
      });

      track.addEventListener('mouseleave', function () {
        if (isDragging) {
          isDragging = false;
          track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
          goToSlide(currentIndex);
          dragOffset = 0;
        }
      });

      // Touch support
      track.addEventListener('touchstart', function (e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        track.style.transition = 'none';
      }, { passive: true });

      track.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        dragOffset = e.touches[0].clientX - startX;
        var offset = -(currentIndex * 100) + (dragOffset / track.offsetWidth) * 100;
        track.style.transform = 'translateX(' + offset + '%)';
      }, { passive: true });

      track.addEventListener('touchend', function () {
        if (!isDragging) return;
        isDragging = false;
        track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        if (Math.abs(dragOffset) > 60) {
          goToSlide(dragOffset < 0 ? currentIndex + 1 : currentIndex - 1);
        } else {
          goToSlide(currentIndex);
        }
        dragOffset = 0;
      });
    });
  }

  // ==========================================
  // 图片灯箱
  // ==========================================
  function initLightbox() {
    var lb = DOM.lightbox;
    var lbImg = DOM.lightboxImg;
    var lbClose = DOM.lightboxClose;
    if (!lb || !lbImg || !lbClose) return;

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('.lightbox-trigger');
      if (!trigger) return;
      var src = trigger.src || '';
      if (src && trigger.tagName === 'IMG') {
        lbImg.src = src;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });

    function closeLightbox() {
      lb.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(function () { lbImg.src = ''; }, 300);
    }

    lbClose.addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // ==========================================
  // 工具函数
  // ==========================================
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // URL-safe path encoding — encodes spaces and non-ASCII, preserves valid URL chars
  function urlSafe(path) {
    if (!path) return '';
    return encodeURI(String(path));
  }

  // ==========================================
  // 启动
  // ==========================================
  document.addEventListener('DOMContentLoaded', loadData);
  // ==========================================
  // ==========================================
  // Cover Image Stack — GSAP ScrollTrigger float-in
  // Sticky pin covers viewport for 300vh wrapper.
  // Images + button float up from below as user scrolls,
  // reaching their target positions when scrolled through.
  // ==========================================
  function initCoverImageStack() {
    var items = document.querySelectorAll('.cover-img-item');
    var wrapper = document.getElementById('coverWrapper');
    var btn = document.getElementById('coverExploreBtn');
    if (!items.length || !wrapper) return;

    // 从 data 读取透明度
    var ci = APP_DATA.coverImages || {};
    var mainOpacity = (ci.mainOpacity !== undefined) ? ci.mainOpacity : 1;
    var bgOpacity = (ci.bgOpacity !== undefined) ? ci.bgOpacity : 0.45;

    // Fallback: show everything if GSAP is missing
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      items.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
      if (btn) { btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; }
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Group items by role
    var mainItems = [];
    var bgItems = [];
    items.forEach(function (el) {
      if (el.getAttribute('data-img') === 'main') mainItems.push(el);
      else bgItems.push(el);
    });

    // Set initial states (below target, invisible)
    mainItems.forEach(function (el, i) {
      var startY = 130 + i * 25;
      gsap.set(el, { y: startY, opacity: 0 });
    });

    bgItems.forEach(function (el, i) {
      var startY = 80 + i * 15;
      gsap.set(el, { y: startY, opacity: 0 });
    });

    if (btn) {
      gsap.set(btn, { y: 50, opacity: 0 });
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        markers: false
      }
    });

    // Main images — data-driven opacity
    mainItems.forEach(function (el, i) {
      tl.to(el, { y: 0, opacity: mainOpacity, duration: 0.4, ease: 'power2.out' }, i * 0.06);
    });

    // Background images — data-driven opacity
    bgItems.forEach(function (el, i) {
      tl.to(el, { y: 0, opacity: bgOpacity, duration: 0.4, ease: 'power2.out' }, 0.05 + i * 0.04);
    });

    if (btn) {
      tl.to(btn, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.1);
    }
  }

  // Schedule init after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(initCoverImageStack, 100); });
  } else {
    setTimeout(initCoverImageStack, 100);
  }

})();

// === Image preloader: prefetch images 800px before they enter viewport ===
(function() {
  var prefetched = {};
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var section = entry.target;
      var imgs = section.querySelectorAll('img[loading="lazy"]');
      imgs.forEach(function(img) {
        var src = img.getAttribute('src') || img.dataset.src;
        if (!src || prefetched[src]) return;
        prefetched[src] = true;
        // Use link prefetch to warm browser cache
        var link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      });
      observer.unobserve(section);
    });
  }, { rootMargin: '800px 0px 800px 0px' });

  function observeSections() {
    var sections = document.querySelectorAll('.section');
    sections.forEach(function(section) {
      observer.observe(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeSections);
  } else {
    observeSections();
  }
})();

// === Image fade-in on load ===
(function() {
  function markLoaded(img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    }
  }
  // Mark already-loaded images
  document.querySelectorAll('img[src]').forEach(markLoaded);
  // Observe dynamically added images
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.tagName === 'IMG') markLoaded(node);
        if (node.querySelectorAll) {
          node.querySelectorAll('img[src]').forEach(markLoaded);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // Also listen for load events on images
  document.addEventListener('load', function(e) {
    if (e.target.tagName === 'IMG') markLoaded(e.target);
  }, true);
})();
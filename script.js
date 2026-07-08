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

    // All section titles and experience titles
    var titles = document.querySelectorAll('.section-title, .scroll-stack-section-title');
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
    links.forEach(function (link) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + link.id;
      a.textContent = link.label;
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
      navItems.forEach(function (item) {
        var btn = document.createElement('button');
        btn.className = 'cover-nav-btn';
        btn.textContent = item.label;
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
  // 渲染：个人信息（CircularGallery 照片 + 横行四卡片）
  // ==========================================
  function renderPersonalInfo() {
    var info = APP_DATA.personalInfo;
    if (!DOM.personalInfo) return;

    var html = '';
    html += '<div class="personal-new">';

    // 标题
    html += '  <div class="section-header fade-up">';
    html += '    <h2 class="section-title">' + esc(info.title || '个人信息') + '</h2>';
    html += '  </div>';

    // ── CircularGallery 照片区 ──
    html += '  <div class="personal-gallery-wrapper">';
    html += '    <div id="personal-gallery"></div>';
    html += '  </div>';

    // ── 横行四卡片（悬停展开）──
    html += '  <div class="personal-info-row fade-up">';

    // 联系方式
    html += '    <div class="info-card">';
    html += '      <h4><span class="info-card-title-text">联系方式</span><span class="info-card-indicator">+</span></h4>';
    html += '      <div class="info-card-body">';
    if (info.contact) {
      html += '        <ul>';
      html += '          <li><span class="info-lbl">邮箱</span>' + esc(info.contact.email || '待填写') + '</li>';
      html += '          <li><span class="info-lbl">电话</span>' + esc(info.contact.phone || '待填写') + '</li>';
      html += '          <li><span class="info-lbl">微信</span>' + esc(info.contact.wechat || '待填写') + '</li>';
      html += '        </ul>';
    }
    html += '      </div>';
    html += '    </div>';

    // 教育背景
    html += '    <div class="info-card">';
    html += '      <h4><span class="info-card-title-text">教育背景</span><span class="info-card-indicator">+</span></h4>';
    html += '      <div class="info-card-body">';
    html += '        <ul>';
    if (info.education && info.education.length > 0) {
      info.education.forEach(function (edu) { html += '<li>' + esc(String(edu)) + '</li>'; });
    } else { html += '          <li class="placeholder-text">待填写</li>'; }
    html += '        </ul>';
    html += '      </div>';
    html += '    </div>';

    // 获奖及证书
    html += '    <div class="info-card">';
    html += '      <h4><span class="info-card-title-text">获奖及证书</span><span class="info-card-indicator">+</span></h4>';
    html += '      <div class="info-card-body">';
    html += '        <ul>';
    if (info.awards && info.awards.length > 0) {
      info.awards.forEach(function (award) { html += '<li>' + esc(String(award)) + '</li>'; });
    } else { html += '          <li class="placeholder-text">待填写</li>'; }
    html += '        </ul>';
    html += '      </div>';
    html += '    </div>';

    // 爱好
    html += '    <div class="info-card">';
    html += '      <h4><span class="info-card-title-text">爱好</span><span class="info-card-indicator">+</span></h4>';
    html += '      <div class="info-card-body">';
    html += '        <ul>';
    if (info.hobbies && info.hobbies.length > 0) {
      info.hobbies.forEach(function (hobby) { html += '<li>' + esc(String(hobby)) + '</li>'; });
    } else { html += '          <li class="placeholder-text">待填写</li>'; }
    html += '        </ul>';
    html += '      </div>';
    html += '    </div>';

    html += '  </div>';

    

    html += '</div>';

 
    DOM.personalInfo.innerHTML = html;
   }

  // ==========================================
  // 渲染：科研经历 (Research Browser)
  // ==========================================
  function renderResearch() {
    var researchSection = APP_DATA.researchExperience || {};
    var researchItems = researchSection.items || [];
    var researchContainer = document.getElementById('researchSection');
    if (!researchContainer || researchItems.length === 0) return;

    var h = '';
    h += '<div class="research-section">';
    h += '  <div class="research-title">' + esc(researchSection.title || '科研经验') + '</div>';
    h += '  <div class="research-browser">';

    // 左侧预览
    h += '    <div class="research-preview" id="researchPreview">';
    h += '      <div class="research-preview-inner">';
    h += '        <div class="research-preview-image" id="researchPreviewImage">';
    var firstItem = researchItems[0];
    if (firstItem && firstItem.photo) {
      h += '          <img src="' + urlSafe(firstItem.photo) + '" alt="" loading="lazy">';
    }
    h += '        </div>';
    h += '        <div class="research-preview-info">';
    if (firstItem && firstItem.category) {
      h += '          <span class="research-preview-category">' + esc(firstItem.category) + '</span>';
    }
    h += '          <div class="research-preview-title" id="researchPreviewTitle">' + esc((firstItem && firstItem.title) || '') + '</div>';
    var dateEl = '';
    if (firstItem && firstItem.date) dateEl = firstItem.date;
    h += '          <div class="research-preview-date" id="researchPreviewDate">' + esc(dateEl) + '</div>';
    h += '          <div class="research-preview-desc" id="researchPreviewDesc">' + esc((firstItem && firstItem.description) || '').replace(/\n/g, '<br>') + '</div>';
    h += '        </div>';
    h += '      </div>';
    h += '    </div>';

    // 右侧文件列表
    h += '    <div class="research-file-list" id="researchFileList">';
    h += '      <div class="research-file-list-header">文件列表</div>';
    researchItems.forEach(function(item, i) {
      h += '      <div class="research-file-item' + (i === 0 ? ' active' : '') + '" data-research-index="' + i + '">';
      h += '        <span class="research-file-title">' + esc(item.title || '未命名') + '</span>';
      if (item.date) {
        h += '        <span class="research-file-meta">' + esc(item.date) + '</span>';
      }
      h += '      </div>';
      if (i < researchItems.length - 1) {
        h += '      <div class="research-file-divider"></div>';
      }
    });
    h += '    </div>';
    h += '  </div>';
    h += '</div>';

    researchContainer.innerHTML = h;

    // 交互
    var fileItems = researchContainer.querySelectorAll('.research-file-item');
    var previewImage = document.getElementById('researchPreviewImage');
    var previewTitle = document.getElementById('researchPreviewTitle');
    var previewDate = document.getElementById('researchPreviewDate');
    var previewDesc = document.getElementById('researchPreviewDesc');

    fileItems.forEach(function(fi) {
      fi.addEventListener('click', function() {
        var idx = parseInt(fi.getAttribute('data-research-index'));
        var item = researchItems[idx];
        if (!item) return;

        fileItems.forEach(function(f) { f.classList.remove('active'); });
        fi.classList.add('active');

        if (previewImage && item.photo) {
          previewImage.innerHTML = '<img src="' + urlSafe(item.photo) + '" alt="" loading="lazy">';
        }
        if (previewTitle) previewTitle.textContent = item.title || '';
        if (previewDate) previewDate.textContent = item.date || '';
        if (previewDesc) previewDesc.innerHTML = (item.description || '').replace(/\n/g, '<br>');
      });
    });

    // 标题动画
    setTimeout(function() {
      var title = researchContainer.querySelector('.research-title');
      if (title) title.classList.add('visible');
    }, 100);
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
    h += '    <h2 class="scroll-stack-section-title">' + esc(workSection.title || '工作经验') + '</h2>';
    h += '  </div>';
    h += '  <div class="stack-stage">';
    h +=    renderStackCards(workItems, 'work', workItems.length);
    h += '  </div>';
    h += '</div>';

    // ═══ 项目经验 — 小猫滑滑梯 ═══
    h += renderProjectSlide(projItems);

    DOM.experienceSection.innerHTML = h;

    // ── 分别初始化两个 Scroll-jacking ──
    setTimeout(function () {
      initScrollJacking('experience-work');
      initStackTitleObserver();
      initProjectSlide();
    }, 200);
  }


  // ==========================================
  // 小猫滑滑梯 — 项目经历滑动动画
  // ==========================================
  function renderProjectSlide(items) {
    if (!items || items.length === 0) return '';
    var total = items.length;
    var h = '';
    h += '<div class="slide-section" id="projectSlide">';
    h += '  <div class="slide-sticky">';
    h += '    <div class="slide-section-title">' + esc('项目经验') + '</div>';

    // SVG 滑梯轨道
    h += '    <svg class="slide-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet">';
    // 滑梯曲线：从左上(100,100) 经控制点 到右下(1050,650)
    h += '      <path d="M 200 100 C 420 -40, 700 840, 1000 700" class="slide-track-edge"/>';
    h += '      <path d="M 200 100 C 420 -40, 700 840, 1000 700" class="slide-track-inner"/>';
    // 支架柱
    h += '      <line x1="200" y1="100" x2="200" y2="800" class="slide-posts"/>';
    h += '      <line x1="1000" y1="700" x2="1000" y2="800" class="slide-posts"/>';
    h += '    </svg>';

    // 小猫
    h += '    <div class="slide-cat" id="slideCat"><span class="slide-cat-body">🐱</span><div class="slide-cat-sled"></div></div>';

    // 节点
    items.forEach(function(item, i) {
      h += '    <div class="slide-node" data-slide-index="' + i + '"></div>';
    });

    // 卡片
    items.forEach(function(item, i) {
      var side = (i % 2 === 0) ? 'side-left' : 'side-right';
      h += '    <div class="slide-card ' + side + '" data-slide-index="' + i + '" data-card="true">';
      h += '      <div class="slide-card-role">' + esc(item.role || '') + '</div>';
      h += '      <div class="slide-card-name">' + esc(item.name || '') + '</div>';
      if (item.period) {
        h += '      <div class="slide-card-period"><span class="slide-card-dot"></span>' + esc(item.period) + '</div>';
      }
      h += '    </div>';
    });

    // 详情弹窗
    h += '    <div class="slide-detail-overlay" id="slideDetailOverlay">';
    h += '      <div class="slide-detail-card">';
    h += '        <button class="slide-detail-close" id="slideDetailClose">&times;</button>';
    h += '        <div class="slide-detail-left" id="slideDetailImage"></div>';
    h += '        <div class="slide-detail-right">';
    h += '          <div class="slide-detail-role" id="slideDetailRole"></div>';
    h += '          <h4 id="slideDetailName"></h4>';
    h += '          <div class="slide-detail-period" id="slideDetailPeriod"></div>';
    h += '          <ul class="slide-detail-list" id="slideDetailList"></ul>';
    h += '        </div>';
    h += '      </div>';
    h += '    </div>';

    h += '  </div>';
    h += '</div>';
    return h;
  }

  function initProjectSlide() {
    var slideSection = document.getElementById('projectSlide');
    if (!slideSection) return;

    var sticky = slideSection.querySelector('.slide-sticky');
    var cat = document.getElementById('slideCat');
    var nodes = slideSection.querySelectorAll('.slide-node');
    var cards = slideSection.querySelectorAll('.slide-card[data-card]');
    var overlay = document.getElementById('slideDetailOverlay');
    var closeBtn = document.getElementById('slideDetailClose');

    if (!sticky || !cat || nodes.length === 0 || cards.length === 0) return;

    var total = nodes.length;

    // SVG 路径采样点（与 viewBox 中的曲线对应）
    var path = document.querySelector('.slide-track-edge');
    var pathLength = path ? path.getTotalLength() : 0;
    var pathPoints = [];
    var sampleCount = 200;
    for (var i = 0; i <= sampleCount; i++) {
      var pt = path.getPointAtLength(pathLength * i / sampleCount);
      pathPoints.push({ x: pt.x / 1200, y: pt.y / 800 });
    }

    // 更新位置
    function updatePositions(progress) {
      progress = Math.max(0, Math.min(1, progress));

      // 小猫位置（沿曲线）
      var catIdx = Math.floor(progress * (sampleCount - 1));
      var catPt = pathPoints[catIdx];
      var stickyRect = sticky.getBoundingClientRect();
      cat.style.left = (catPt.x * 100) + '%';
      cat.style.top = (catPt.y * 100) + '%';

      // 旋转猫朝向（面朝右下）
      var nextPt = pathPoints[Math.min(catIdx + 3, sampleCount - 1)];
      var angle = Math.atan2(nextPt.y - catPt.y, nextPt.x - catPt.x) * 180 / Math.PI;
      cat.style.transform = 'translate(-50%, -50%) rotate(' + angle + 'deg)';

      // 节点和卡片位置（均匀分布在曲线上）
      for (var i = 0; i < total; i++) {
        var t = (i + 0.5) / total;
        var idx = Math.floor(t * (sampleCount - 1));
        var pt = pathPoints[idx];

        if (nodes[i]) {
          nodes[i].style.left = (pt.x * 100) + '%';
          nodes[i].style.top = (pt.y * 100) + '%';
        }

        if (cards[i]) {
          var isRight = cards[i].classList.contains('side-right');
          if (isRight) {
            cards[i].style.left = (pt.x * 100) + '%';
            cards[i].style.top = (pt.y * 100) + '%';
            cards[i].style.transform = 'translateY(-50%)';
          } else {
            cards[i].style.left = (pt.x * 100) + '%';
            cards[i].style.top = (pt.y * 100) + '%';
            cards[i].style.transform = 'translate(-100%, -50%)';
          }

          // 高亮最近的卡片
          var cardT = (i + 0.5) / total;
          var dist = Math.abs(progress - cardT);
          if (dist < 0.08) {
            cards[i].classList.add('active');
          } else {
            cards[i].classList.remove('active');
          }
        }
      }
    }

    // 滚动驱动
    function onScroll() {
      var sectionRect = slideSection.getBoundingClientRect();
      var sectionTop = sectionRect.top;
      var sectionHeight = sectionRect.height;
      var viewportHeight = window.innerHeight;

      // Progress: 0 when section enters, 1 when it leaves
      var progress = (-sectionTop) / (sectionHeight - viewportHeight);
      updatePositions(progress);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 卡片点击 → 弹窗
    cards.forEach(function(card) {
      card.addEventListener('click', function() {
        var index = parseInt(card.getAttribute('data-slide-index'));
        var items = (APP_DATA.projectExperience || {}).items || [];
        var item = items[index];
        if (!item || !overlay) return;

        document.getElementById('slideDetailRole').textContent = item.role || '';
        document.getElementById('slideDetailName').textContent = item.name || '';
        document.getElementById('slideDetailPeriod').textContent = item.period || '';

        var detailLeft = document.getElementById('slideDetailImage');
        if (item.photo && item.photo !== '待填写') {
          detailLeft.innerHTML = '<img src="' + urlSafe(item.photo) + '" alt="">';
        } else {
          detailLeft.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">📋</div>';
        }

        var listEl = document.getElementById('slideDetailList');
        listEl.innerHTML = '';
        if (item.details && Array.isArray(item.details)) {
          item.details.forEach(function(d) { listEl.innerHTML += '<li>' + d + '</li>'; });
        }

        overlay.classList.add('active');
      });
    });

    // 关闭弹窗
    if (closeBtn) {
      closeBtn.addEventListener('click', function() { overlay.classList.remove('active'); });
    }
    if (overlay) {
      overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.classList.remove('active'); });
    }

    // 存储清理引用
    window._slideProject = { onScroll: onScroll };
  }


  // ── 渲染卡片列表 ──
  function renderStackCards(items, type, total) {
    var isWork = (type === 'work');
    var badgeLabel = isWork ? 'WORK' : 'PROJECT';
    var badgeClass = isWork ? 'work' : 'project';
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
      h += '        <span class="scroll-stack-card-badge ' + badgeClass + '">' + badgeLabel + '</span>';
      h += '        <div class="scroll-stack-card-info">';
      if (isWork) {
        h += '          <h3>' + esc(item.company || '待填写') + '</h3>';
        h += '          <div class="scroll-stack-card-role">' + esc(item.position || '待填写') + '</div>';
        h += '          <div class="scroll-stack-card-period">' + esc(item.period || '待填写') + '</div>';
      } else {
        h += '          <h3>' + esc(item.name || '待填写') + '</h3>';
        h += '          <div class="scroll-stack-card-role">' + esc(item.role || '待填写') + '</div>';
      }
      h += '        </div>';

      // 详情
      h += '        <div class="scroll-stack-card-details">';
      if (item.details) {
        if (Array.isArray(item.details)) {
          if (item.details.length > 0) {
            h += '          <ul>';
            item.details.forEach(function (d) { h += '<li>' + esc(String(d)) + '</li>'; });
            h += '          </ul>';
          } else { h += '          <p class="placeholder-text">待填写</p>'; }
        } else if (item.details !== '待填写') {
          h += '          <p>' + esc(String(item.details)) + '</p>';
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
    }, { threshold: 0.2 });
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
    html += '    <h2 class="section-title">' + esc(skills.title || '我的技能') + '</h2>';
    if (skills.description) {
      html += '    <p class="skills-description">' + esc(skills.description) + '</p>';
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
        html += '      <div class="skills-category-name">' + esc(catName) + '</div>';
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
    html += '  <h2 class="section-title">' + esc(pf.title || '作品集') + '</h2>';
    html += '  <div class="section-underline"></div>';
    html += '</div>';
    html += '<div class="portfolio-container">';
    // Tabs - GooeyNav
    html += '  <div class="gooey-nav-container fade-up" id="portfolioTabs">';
    html += '    <nav><ul>';
    tabs.forEach(function (tab, i) {
      html += '      <li><a href="#" data-tab="' + tab.id + '">' + esc(tab.label) + '</a></li>';
    });
    html += '    </ul></nav>';
    html += '    <span class="effect filter"></span>';
    html += '    <span class="effect text"></span>';
    html += '  </div>';
    // Content area
    html += '  <div class="portfolio-content-area" id="portfolioContentArea">';

            // Xiaohongshu panel — 左图右树杂志布局
    html += '    <div class="portfolio-panel" data-panel="xiaohongshu" id="panel-xiaohongshu">';
    var xhsData = pf.xiaohongshu || {};
    var xhsPhotos = xhsData.photos || [];
    var xhsSections = xhsData.sections || [];
    if (xhsSections.length > 0 || xhsPhotos.length > 0) {
      html += '      <div class="xhs-magazine" id="xhsMagazine">';
      // ── 左栏：轮播图（sticky）──
      html += '        <div class="xhs-magazine-left">';
      html += '          <div class="xhs-magazine-stage" id="xhsMagazineStage">';
      if (xhsPhotos.length > 0) {
        xhsPhotos.forEach(function(src, i) {
          html += '<img class="xhs-magazine-photo' + (i === 0 ? ' active' : '') + '" src="' + urlSafe(src) + '" alt="运营配图 ' + (i + 1) + '" data-index="' + i + '">';
        });
      } else {
        html += '            <div class="xhs-magazine-placeholder">封面图</div>';
      }
      html += '          </div>';
      html += '          <div class="xhs-magazine-counter" id="xhsMagazineCounter">1 / ' + (xhsPhotos.length || 0) + '</div>';
      html += '        </div>';
      // ── 右栏：树形内容 ──
      html += '        <div class="xhs-magazine-right">';
      html += '          <div class="xhs-tree">';
      // 树根
      html += '            <div class="xhs-tree-root">';
            html += '              <span class="xhs-tree-label">运营作品集</span>';
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
                        html += '            <span class="xhs-tree-label">' + esc(sec.title || '') + '</span>';
        html += '          </div>';
        // 内容默认展开
        html += '          <div class="xhs-tree-content" style="display:block">';
        html += '            <p>' + esc(sec.content || '') + '</p>';
        if (sec.url) {
          html += '            <a class="xhs-link" href="' + esc(sec.url) + '" target="_blank" rel="noopener noreferrer">查看详情 →</a>';
        }
        // 图片网格
        if (sec.images && sec.images.length > 0) {
          html += '            <div class="xhs-image-grid">';
          sec.images.forEach(function(imgSrc) {
            html += '              <div class="xhs-image-grid-item">';
            html += '                <img src="' + urlSafe(imgSrc) + '" alt="" loading="lazy">';
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
	      html += '      <div class="photo-quote">More daily scenes today. Nothing unusual, just worth keeping.</div>';
	      html += '      <div class="photo-sections">';
	      photoCategories.forEach(function(cat) {
	        html += '        <div class="photo-section">';
	        html += '          <h3 class="photo-section-title">' + esc(cat.name) + '</h3>';
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
    footer.textContent = APP_DATA.footer && APP_DATA.footer.text ? APP_DATA.footer.text : '待填写';
  }

  // ==========================================
  // 滚动动画（Intersection Observer）
  // ==========================================
  function initScrollAnimations() {
    var fadeUpEls = document.querySelectorAll('.fade-up');
    var staggerEls = document.querySelectorAll('.stagger-children');

    var observerOptions = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };

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
      }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

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
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

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
    // ── 杂志轮播 ──
    function initXhsMagazineCarousel() {
      var stage = document.getElementById('xhsMagazineStage');
      var counter = document.getElementById('xhsMagazineCounter');
      if (!stage || !counter) return;
      if (stage.dataset.carouselInit === 'true') return;
      stage.dataset.carouselInit = 'true';

      var photos = stage.querySelectorAll('.xhs-magazine-photo');
      if (photos.length < 2) return;

      var current = 0;
      var total = photos.length;

      function show(index) {
        photos[current].classList.remove('active');
        current = ((index % total) + total) % total;
        photos[current].classList.add('active');
        counter.textContent = (current + 1) + ' / ' + total;
      }

      // Auto-advance every 1 second
      window._xhsMagazineInterval = setInterval(function () {
        show(current + 1);
      }, 1000);
    }

    initXhsMagazineCarousel();
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
    // Main images: larger offset, final full opacity
    mainItems.forEach(function (el, i) {
      var startY = 130 + i * 25;
      gsap.set(el, { y: startY, opacity: 0 });
    });

    // Background images: smaller offset, final muted opacity
    bgItems.forEach(function (el, i) {
      var startY = 80 + i * 15;
      gsap.set(el, { y: startY, opacity: 0 });
    });

    // Explore button
    if (btn) {
      gsap.set(btn, { y: 50, opacity: 0 });
    }

    // Single timeline driven by wrapper scroll
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        markers: false
      }
    });

    // Main images — each slightly staggered
    mainItems.forEach(function (el, i) {
      tl.to(el, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, i * 0.06);
    });

    // Background images — same timeline, different opacity target
    bgItems.forEach(function (el, i) {
      tl.to(el, { y: 0, opacity: 0.45, duration: 0.4, ease: 'power2.out' }, 0.05 + i * 0.04);
    });

    // Explore button
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
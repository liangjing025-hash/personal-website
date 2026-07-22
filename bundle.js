// Bundle: 8 JS files merged

// --- gallery-init.js ---
// gallery-init.js — Pure CSS 3D Circular Gallery
// No WebGL dependencies — uses CSS perspective + 3D transforms
// This is a regular script (not a module)

(function () {
  function createCircularGallery(containerEl, options) {
    options = options || {};
    var items = options.items || [];
    var autoRotate = options.autoRotate !== false;
    var radius = options.radius || 320;

    var currentIndex = 0;
    var totalItems = items.length;
    var touchStartX = 0;
    var isDragging = false;
    var autoTimer = null;

    // Build HTML
    containerEl.innerHTML = '';

    // Stage & ring
    var stage = document.createElement('div');
    stage.className = 'cg-stage';

    var ring = document.createElement('div');
    ring.className = 'cg-ring';

    for (var i = 0; i < totalItems; i++) {
      var item = items[i];
      var el = document.createElement('div');
      el.className = 'cg-item';
      el.setAttribute('data-index', i);

      if (item.image && item.image !== '待填写') {
        var img = document.createElement('img');
        img.src = item.image;
        img.alt = item.text || ('Photo ' + (i + 1));
        img.decoding = 'sync';
        el.appendChild(img);

        if (item.text) {
          var label = document.createElement('div');
          label.className = 'cg-item-label';
          label.textContent = item.text;
          el.appendChild(label);
        }
      } else {
        var ph = document.createElement('div');
        ph.className = 'cg-item-placeholder';
        ph.textContent = '待添加照片';
        el.appendChild(ph);
      }

      ring.appendChild(el);
    }

    stage.appendChild(ring);
    containerEl.appendChild(stage);


    // Navigation dots
    if (totalItems > 1) {
      var nav = document.createElement('div');
      nav.className = 'cg-nav';
      for (var j = 0; j < totalItems; j++) {
        var dot = document.createElement('button');
        dot.className = 'cg-dot' + (j === 0 ? ' active' : '');
        dot.setAttribute('data-dot', j);
        dot.addEventListener('click', (function (idx) {
          return function () { goTo(idx); };
        })(j));
        nav.appendChild(dot);
      }
      containerEl.appendChild(nav);

      // Arrow buttons
      var prevBtn = document.createElement('button');
      prevBtn.className = 'cg-arrow prev';
      prevBtn.innerHTML = '&#8249;';
      prevBtn.addEventListener('click', function () { goTo((currentIndex - 1 + totalItems) % totalItems); });
      containerEl.appendChild(prevBtn);

      var nextBtn = document.createElement('button');
      nextBtn.className = 'cg-arrow next';
      nextBtn.innerHTML = '&#8250;';
      nextBtn.addEventListener('click', function () { goTo((currentIndex + 1) % totalItems); });
      containerEl.appendChild(nextBtn);
    }

    // Initial render
    renderPositions();

    function renderPositions() {
      var children = ring.children;
      for (var i = 0; i < children.length; i++) {
        var offset = i - currentIndex;
        // Wrap offset for circular effect
        if (offset > Math.floor(totalItems / 2)) offset -= totalItems;
        if (offset < -Math.floor(totalItems / 2)) offset += totalItems;

        var angle = offset * (90 / totalItems); // degrees per item
        var rad = (Math.PI / 180) * angle;
        var x = Math.sin(rad) * radius;
        var z = Math.cos(rad) * radius - radius * 0.5;
        var rotateY = -angle;
        var opacity = 1 - Math.min(Math.abs(offset) / (totalItems / 2), 1) * 0.55;
        var offsetFactor = 1 - Math.min(Math.abs(offset) / (totalItems / 2), 1) * 0.15;
        // CSS 尺寸从 240→360 (1.5x)，用 scale(0.667) 抵消，保持 3D 轮播中视觉大小不变
        var finalScale = offsetFactor * (240 / 360);

        children[i].style.transform =
          'translate3d(' + x.toFixed(1) + 'px, 0, ' + z.toFixed(1) + 'px) ' +
          'rotateY(' + rotateY.toFixed(1) + 'deg) ' +
          'scale(' + finalScale.toFixed(3) + ')';
        children[i].style.opacity = opacity.toFixed(2);
        children[i].style.zIndex = totalItems - Math.abs(offset);
      }

      // Update dots
      var dots = containerEl.querySelectorAll('.cg-dot');
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === currentIndex);
      });
    }

    function goTo(idx) {
      if (idx === currentIndex) return;
      currentIndex = idx;
      renderPositions();
      resetAutoRotate();
    }

    // Touch / drag support
    containerEl.addEventListener('mousedown', function (e) {
      isDragging = true;
      touchStartX = e.clientX;
      containerEl.style.cursor = 'grabbing';
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var dx = e.clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) {
          goTo((currentIndex - 1 + totalItems) % totalItems);
        } else {
          goTo((currentIndex + 1) % totalItems);
        }
        touchStartX = e.clientX;
        isDragging = false;
        containerEl.style.cursor = 'grab';
      }
    });

    window.addEventListener('mouseup', function () {
      isDragging = false;
      containerEl.style.cursor = 'grab';
      resetAutoRotate();
    });

    // Touch
    containerEl.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }, { passive: true });

    containerEl.addEventListener('touchend', function (e) {
      var dx = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 40) {
        if (dx > 0) {
          goTo((currentIndex + 1) % totalItems);
        } else {
          goTo((currentIndex - 1 + totalItems) % totalItems);
        }
      }
      resetAutoRotate();
    });

    function resetAutoRotate() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
      if (autoRotate && totalItems > 1) {
        autoTimer = setInterval(function () {
          goTo((currentIndex + 1) % totalItems);
        }, 4000);
      }
    }

    // Start auto-rotate
    if (autoRotate && totalItems > 1) {
      autoTimer = setInterval(function () {
        goTo((currentIndex + 1) % totalItems);
      }, 4000);
    }

    // Return API
    return {
      goTo: goTo,
      destroy: function () {
        if (autoTimer) clearInterval(autoTimer);
        containerEl.innerHTML = '';
      }
    };
  }

  // Simple init: run on DOM ready
  function initPersonalGallery(photos) {
    var container = document.getElementById('personal-gallery');
    if (!container) return;

    if (window._galleryInstance) {
      window._galleryInstance.destroy();
      window._galleryInstance = null;
    }

    var items = [];
    if (photos && photos.length > 0) {
      photos.forEach(function (photo, i) {
        // 支持两种格式：字符串 URL 或 { url, title } 对象
        var src = typeof photo === 'string' ? photo : (photo.url || '');
        var title = typeof photo === 'string' ? ('Photo ' + (i + 1)) : (photo.title || 'Photo ' + (i + 1));
        items.push({ image: src, text: title });
      });
    }

    window._galleryInstance = createCircularGallery(container, {
      items: items,
      radius: 420,
      autoRotate: true
    });
  }

  // Expose globally
  window.createCircularGallery = createCircularGallery;
  window.initPersonalGallery = initPersonalGallery;

  // 注意：gallery 的初始化统一由 script.js 中的 renderPersonalInfo() 负责，
  // 不再在此处自动初始化，以避免和 script.js 的数据合并流程发生冲突。
})();


// --- logo-loop.js ---
﻿(function () {
  function createLogoLoop(containerEl, options) {
    options = options || {};
    var items = options.items || [];
    var speed = (options.speed !== undefined) ? options.speed : 120;
    var direction = options.direction || 'left';
    var logoHeight = options.logoHeight || 48;
    var gap = options.gap || 40;
    var fadeOut = options.fadeOut !== false;
    var fadeOutColor = options.fadeOutColor || '#ffffff';
    var scaleOnHover = options.scaleOnHover !== false;
    var hoverSpeed = (options.hoverSpeed !== undefined) ? options.hoverSpeed : 0;

    if (items.length === 0) return { destroy: function () {} };

    // ── Calculate copies needed for seamless looping ──
    // Build a single sequence
    var seqHTML = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      seqHTML += '<div class="logoloop__item">';
      if (item.src) {
        seqHTML += '<img src="' + escAttr(item.src) + '" alt="' + escAttr(item.alt || item.label || item.name || '') + '" '
                + 'style="height:' + logoHeight + 'px;width:' + logoHeight + 'px;object-fit:contain;border-radius:4px;">';
      } else if (item.url && item.url !== '待填写') {
        // 首字母图标（始终显示）
        var initial = (item.label || item.name || '?').charAt(0).toUpperCase();
        var color = getColorForInitial(initial);
        seqHTML += '<div class="logoloop__icon" style="width:' + logoHeight + 'px;height:' + logoHeight + 'px;background:' + color + ';display:flex;">'
                + '<span style="color:#fff;font-weight:700;font-size:calc(' + logoHeight + 'px * 0.45);line-height:1;">' + esc(initial) + '</span>'
                + '</div>';
        // favicon 图片作为增强（加载成功则覆盖在首字母图标之上）
        var faviconUrl = getFaviconUrl(item.url, logoHeight);
        seqHTML += '<img src="' + escAttr(faviconUrl) + '" alt="' + escAttr(item.label || item.name || '') + '" '
                + 'style="height:' + logoHeight + 'px;width:' + logoHeight + 'px;border-radius:4px;position:absolute;top:0;left:0;object-fit:contain;background:rgba(255,255,255,0.85);" '
                + 'onerror="this.style.display=\'none\';" '
                + 'onload="this.style.opacity=\'1\';var p=this.previousElementSibling;if(p)p.style.opacity=\'0\';" '
                + '>';
      } else if (item.icon) {
        seqHTML += '<div class="logoloop__icon" style="width:' + logoHeight + 'px;height:' + logoHeight + 'px;background:var(--accent-subtle);display:flex;">'
                + '<span style="color:var(--text-primary);font-weight:500;font-size:calc(' + logoHeight + 'px * 0.4);line-height:1;">' + esc(item.icon) + '</span>'
                + '</div>';
      } else if (item.label || item.name) {
        var txt = (item.label || item.name || '');
        var initial2 = txt.charAt(0).toUpperCase();
        var color2 = getColorForInitial(initial2);
        if (txt === '待填写' || txt === '') {
          seqHTML += '<div class="logoloop__icon" style="width:' + logoHeight + 'px;height:' + logoHeight + 'px;background:var(--accent-subtle);display:flex;">'
                  + '<span style="color:var(--text-muted);font-size:calc(' + logoHeight + 'px * 0.35);line-height:1;">?</span>'
                  + '</div>';
        } else {
          seqHTML += '<div class="logoloop__icon" style="width:' + logoHeight + 'px;height:' + logoHeight + 'px;background:' + color2 + ';display:flex;">'
                  + '<span style="color:#fff;font-weight:700;font-size:calc(' + logoHeight + 'px * 0.45);line-height:1;">' + esc(initial2) + '</span>'
                  + '</div>';
        }
      } else {
        seqHTML += '<div class="logoloop__icon" style="width:' + logoHeight + 'px;height:' + logoHeight + 'px;background:var(--accent-subtle);display:flex;">'
                + '<span style="color:var(--text-muted);font-size:calc(' + logoHeight + 'px * 0.35);line-height:1;">?</span>'
                + '</div>';
      }
      if (item.label || item.name) {
        seqHTML += '<span class="logoloop__label">' + esc(item.label || item.name || '') + '</span>';
      }
      seqHTML += '</div>';
    }

    // ── 根据首字母生成柔和颜色 ──
    function getColorForInitial(ch) {
      var colors = [
        '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#EC4899', '#F97316', '#84CC16', '#14B8A6',
        '#6366F1', '#D946EF', '#0EA5E9', '#EAB308', '#22C55E'
      ];
      var code = ch.charCodeAt(0) || 65;
      return colors[code % colors.length];
    }

    // Build container and measure
    containerEl.innerHTML = '';

    var rootClasses = ['logoloop'];
    if (fadeOut) rootClasses.push('logoloop--fade');
    if (scaleOnHover) rootClasses.push('logoloop--scale-hover');

    containerEl.className = rootClasses.join(' ');
    containerEl.style.setProperty('--ll-gap', gap + 'px');
    containerEl.style.setProperty('--ll-logoHeight', logoHeight + 'px');
    if (fadeOutColor) {
      containerEl.style.setProperty('--ll-fadeColor', fadeOutColor);
    }

    var track = document.createElement('div');
    track.className = 'logoloop__track';

    var listEl = document.createElement('div');
    listEl.className = 'logoloop__list';
    listEl.innerHTML = seqHTML;
    track.appendChild(listEl);
    containerEl.appendChild(track);

    containerEl.offsetHeight;
    var seqWidth = listEl.getBoundingClientRect().width;
    var containerWidth = containerEl.getBoundingClientRect().width;

    if (seqWidth <= 0) {
      setTimeout(function () { createLogoLoop(containerEl, options); }, 100);
      return { destroy: function () {} };
    }

    var copiesNeeded = Math.max(2, Math.ceil((containerWidth * 2) / seqWidth) + 2);

    while (track.children.length < copiesNeeded) {
      var clone = document.createElement('div');
      clone.className = 'logoloop__list';
      clone.innerHTML = seqHTML;
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    }

    // ── Animation state ──
    var offset = 0;
    var velocity = 0;
    var isHovered = false;
    var rafId = null;
    var lastTime = null;
    var dirSign = (direction === 'right') ? -1 : 1;
    var effectiveSpeed = speed * dirSign * (speed < 0 ? -1 : 1);
    if (speed < 0) effectiveSpeed = speed * dirSign;
    else effectiveSpeed = speed * dirSign;
    var totalSeqWidth = seqWidth;

    function clampOffset(o) {
      return ((o % totalSeqWidth) + totalSeqWidth) % totalSeqWidth;
    }

    function animate(timestamp) {
      if (lastTime === null) { lastTime = timestamp; }
      var dt = Math.max(0, (timestamp - lastTime) / 1000);
      lastTime = timestamp;
      var target = isHovered ? hoverSpeed : effectiveSpeed;
      var easing = 1 - Math.exp(-dt / 0.25);
      velocity += (target - velocity) * easing;
      if (totalSeqWidth > 0) {
        offset = clampOffset(offset + velocity * dt);
        track.style.transform = 'translate3d(' + (-offset) + 'px, 0, 0)';
      }
      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    containerEl.addEventListener('mouseenter', function () { isHovered = true; });
    containerEl.addEventListener('mouseleave', function () { isHovered = false; });

    var resizeTimer;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var newSeqWidth = listEl.getBoundingClientRect().width;
        var newContainerWidth = containerEl.getBoundingClientRect().width;
        if (newSeqWidth > 0) {
          totalSeqWidth = newSeqWidth;
          var newCopies = Math.max(2, Math.ceil((newContainerWidth * 2) / newSeqWidth) + 2);
          while (track.children.length < newCopies) {
            var extra = document.createElement('div');
            extra.className = 'logoloop__list';
            extra.innerHTML = seqHTML;
            extra.setAttribute('aria-hidden', 'true');
            track.appendChild(extra);
          }
          while (track.children.length > newCopies) {
            track.removeChild(track.lastChild);
          }
        }
        offset = clampOffset(offset);
      }, 200);
    }
    window.addEventListener('resize', onResize);

    return {
      destroy: function () {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        containerEl.innerHTML = '';
        containerEl.className = '';
      }
    };
  }

  function esc(s) {
    if (!s) return '';
    s = String(s);
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escAttr(s) {
    if (!s) return '';
    s = String(s);
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function getFaviconUrl(url, size) {
    var domain = '';
    try {
      var parsed = new URL(url);
      domain = parsed.hostname;
    } catch (e) {
      try {
        var parsed2 = new URL('https://' + url);
        domain = parsed2.hostname;
      } catch (e2) {
        domain = url;
      }
    }
    // 移除 www. 前缀以便匹配 favicon
    domain = domain.replace(/^www\./, '');
    size = size || 44;
    return 'https://favicon.im/' + encodeURIComponent(domain) + '?size=' + size;
  }

  window.createLogoLoop = createLogoLoop;
})();


// --- gooey-nav.js ---
/* ============================================
   GooeyNav - Gooey Navigation Effect (Vanilla JS)
   Adapted from React Bits
   ============================================ */

(function () {
  'use strict';

  /**
   * Initialize a GooeyNav on a container element.
   *
   * @param {HTMLElement} containerEl - The .gooey-nav-container element
   * @param {Object}      options
   * @param {number}      [options.animationTime=600]    - Duration (ms) of the main animation
   * @param {number}      [options.particleCount=15]     - Number of bubble particles per transition
   * @param {number[]}    [options.particleDistances=[90, 10]] - Outer and inner distances of bubble spread
   * @param {number}      [options.particleR=100]        - Radius factor influencing random particle rotation
   * @param {number}      [options.timeVariance=300]     - Random time variance (ms) for particle animations
   * @param {number[]}    [options.colors=[1, 2, 3, 1, 2, 3, 1, 4]] - Color indices used when creating bubble particles
   * @param {number}      [options.initialActiveIndex=0] - Which item is selected on mount
   * @param {Function}    [options.onChange]             - Callback when active item changes: fn(index, item)
   * @returns {Object}    Control API: { setActive, getActive, destroy }
   */
  window.initGooeyNav = function (containerEl, options) {
    if (!containerEl) {
      console.warn('GooeyNav: container element is required');
      return null;
    }

    var opts = options || {};

    var animationTime    = opts.animationTime    || 600;
    var particleCount    = opts.particleCount    || 15;
    var particleDistances = opts.particleDistances || [90, 10];
    var particleR        = opts.particleR        || 100;
    var timeVariance     = opts.timeVariance     || 300;
    var colors           = opts.colors           || [1, 2, 3, 1, 2, 3, 1, 4];
    var initialActiveIndex = opts.initialActiveIndex || 0;
    var onChange         = opts.onChange         || null;

    // ---------- internal state ----------
    var activeIndex = initialActiveIndex;
    var navRef      = containerEl.querySelector('nav ul');
    var filterRef   = containerEl.querySelector('.effect.filter');
    var textRef     = containerEl.querySelector('.effect.text');
    var liElements  = navRef ? navRef.querySelectorAll('li') : [];
    var resizeObserver = null;

    // ---------- helpers ----------
    function noise(n) {
      n = n || 1;
      return n / 2 - Math.random() * n;
    }

    function getXY(distance, pointIndex, totalPoints) {
      var angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
      return [distance * Math.cos(angle), distance * Math.sin(angle)];
    }

    function createParticle(i, t, d, r) {
      var rotate = noise(r / 10);
      return {
        start: getXY(d[0], particleCount - i, particleCount),
        end: getXY(d[1] + noise(7), particleCount - i, particleCount),
        time: t,
        scale: 1 + noise(0.2),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
      };
    }

    function makeParticles(element) {
      var d = particleDistances;
      var r = particleR;
      var bubbleTime = animationTime * 2 + timeVariance;
      element.style.setProperty('--time', bubbleTime + 'ms');

      for (var i = 0; i < particleCount; i++) {
        (function (idx) {
          var t = animationTime * 2 + noise(timeVariance * 2);
          var p = createParticle(idx, t, d, r);
          element.classList.remove('active');

          setTimeout(function () {
            var particle = document.createElement('span');
            var point = document.createElement('span');
            particle.classList.add('particle');
            particle.style.setProperty('--start-x', p.start[0] + 'px');
            particle.style.setProperty('--start-y', p.start[1] + 'px');
            particle.style.setProperty('--end-x', p.end[0] + 'px');
            particle.style.setProperty('--end-y', p.end[1] + 'px');
            particle.style.setProperty('--time', p.time + 'ms');
            particle.style.setProperty('--scale', String(p.scale));
            particle.style.setProperty('--color', 'var(--gooey-color-' + p.color + ', white)');
            particle.style.setProperty('--rotate', p.rotate + 'deg');

            point.classList.add('point');
            particle.appendChild(point);
            element.appendChild(particle);
            requestAnimationFrame(function () {
              element.classList.add('active');
            });
            setTimeout(function () {
              try {
                element.removeChild(particle);
              } catch (e) {
                // already removed
              }
            }, t);
          }, 30);
        })(i);
      }
    }

    function updateEffectPosition(element) {
      if (!containerEl || !filterRef || !textRef) return;
      var containerRect = containerEl.getBoundingClientRect();
      var pos = element.getBoundingClientRect();

      filterRef.style.left = (pos.x - containerRect.x) + 'px';
      filterRef.style.top = (pos.y - containerRect.y) + 'px';
      filterRef.style.width = pos.width + 'px';
      filterRef.style.height = pos.height + 'px';

      textRef.style.left = (pos.x - containerRect.x) + 'px';
      textRef.style.top = (pos.y - containerRect.y) + 'px';
      textRef.style.width = pos.width + 'px';
      textRef.style.height = pos.height + 'px';

      textRef.innerText = element.innerText;
    }

    // ---------- event handlers ----------
    function handleClick(e, index) {
      var liEl = e.currentTarget;
      if (activeIndex === index) return;

      // Update internal state
      var prevIndex = activeIndex;
      activeIndex = index;

      // Update LI classes
      for (var j = 0; j < liElements.length; j++) {
        if (j === index) {
          liElements[j].classList.add('active');
        } else {
          liElements[j].classList.remove('active');
        }
      }

      // Reposition effects
      updateEffectPosition(liEl);

      // Clear old particles
      if (filterRef) {
        var particles = filterRef.querySelectorAll('.particle');
        for (var p = 0; p < particles.length; p++) {
          filterRef.removeChild(particles[p]);
        }
      }

      // Trigger text effect
      if (textRef) {
        textRef.classList.remove('active');
        void textRef.offsetWidth; // force reflow
        textRef.classList.add('active');
      }

      // Make new particles
      if (filterRef) {
        makeParticles(filterRef);
      }

      // Callback
      if (onChange && prevIndex !== activeIndex) {
        onChange(activeIndex, liEl);
      }
    }

    function handleKeyDown(e, index) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var liEl = e.currentTarget.parentElement || e.currentTarget.closest('li');
        if (liEl) {
          handleClick({ currentTarget: liEl }, index);
        }
      }
    }

    // ---------- init ----------
    function init() {
      if (!navRef || !filterRef || !textRef) {
        console.warn('GooeyNav: missing required sub-elements (nav ul, .effect.filter, .effect.text)');
        return;
      }

      // Re-query liElements after DOM might have changed
      liElements = navRef.querySelectorAll('li');

      // Set initial active state
      var activeIndexClamped = Math.min(initialActiveIndex, liElements.length - 1);
      activeIndex = activeIndexClamped;

      for (var i = 0; i < liElements.length; i++) {
        if (i === activeIndex) {
          liElements[i].classList.add('active');
        }
        var link = liElements[i].querySelector('a');
        if (link) {
          (function (idx) {
            link.addEventListener('click', function (e) {
              e.preventDefault();
              handleClick({ currentTarget: liElements[idx] }, idx);
            });
            link.addEventListener('keydown', function (e) {
              handleKeyDown(e, idx);
            });
          })(i);
        }
      }

      // Position effects on current active element
      var activeLi = liElements[activeIndex];
      if (activeLi) {
        updateEffectPosition(activeLi);
        if (textRef) {
          textRef.classList.add('active');
        }
      }

      // Observe container size changes
      resizeObserver = new ResizeObserver(function () {
        var currentActiveLi = navRef.querySelectorAll('li')[activeIndex];
        if (currentActiveLi) {
          updateEffectPosition(currentActiveLi);
        }
      });
      resizeObserver.observe(containerEl);
    }

    // ---------- public API ----------
    function setActive(index) {
      if (index < 0 || index >= liElements.length) return;
      if (index === activeIndex) return;

      var liEl = liElements[index];
      handleClick({ currentTarget: liEl }, index);
    }

    function getActive() {
      return activeIndex;
    }

    function destroy() {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    }

    // Run init
    init();

    return {
      setActive: setActive,
      getActive: getActive,
      destroy: destroy
    };
  };

})();


// --- chroma-grid.js ---
/* ============================================
   ChromaGrid - Spotlight Grid (Vanilla JS)
   Adapted from React Bits
   Dependencies: GSAP 3
   ============================================ */

(function () {
  'use strict';

  /**
   * Initialize a ChromaGrid on a container element.
   *
   * @param {HTMLElement} containerEl - The .chroma-grid element
   * @param {Object}      options
   * @param {Array}       options.items      - Array of { image, title, subtitle, borderColor, gradient, url }
   * @param {number}      [options.radius=300]     - Spotlight radius in px
   * @param {number}      [options.damping=0.45]   - Cursor follow animation duration (seconds)
   * @param {number}      [options.fadeOut=0.6]    - Fade-out duration when mouse leaves
   * @param {string}      [options.ease='power3.out'] - GSAP easing
   * @returns {Object}    Control API: { destroy }
   */
  window.initChromaGrid = function (containerEl, options) {
    if (!containerEl) return null;

    var opts = options || {};
    var items = opts.items || [];
    var radius = opts.radius || 300;
    var damping = opts.damping || 0.45;
    var fadeOut = opts.fadeOut || 0.6;
    var ease = opts.ease || 'power3.out';

    // GSAP check
    if (typeof gsap === 'undefined') {
      console.warn('ChromaGrid: GSAP is not loaded. Please add the GSAP CDN script before chroma-grid.js');
      return null;
    }

    // Build cards
    var setX, setY;
    var pos = { x: 0, y: 0 };
    var fadeEl = null;
    var isDestroyed = false;

    // --- Build HTML ---
    containerEl.style.setProperty('--r', radius + 'px');

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var c = items[i];
      html += '<article class="chroma-card" style="--card-border: ' + (c.borderColor || 'transparent') +
              '; --card-gradient: ' + (c.gradient || '#111') +
              '; cursor: ' + (c.url ? 'pointer' : 'default') + ';">';
      html += '  <div class="chroma-img-wrapper">';
      html += '    <img src="' + esc(c.image || '') + '" alt="' + esc(c.title || '') + '" loading="lazy">';
      html += '  </div>';
      html += '  <footer class="chroma-info">';
      html += '    <h3 class="name">' + esc(c.title || '') + '</h3>';
      if (c.subtitle) {
        html += '    <p class="role">' + esc(c.subtitle) + '</p>';
      }
      html += '  </footer>';
      html += '</article>';
    }
    html += '<div class="chroma-overlay"></div>';
    html += '<div class="chroma-fade" ref-fade></div>';

    containerEl.innerHTML = html;

    // --- Query elements ---
    fadeEl = containerEl.querySelector('.chroma-fade');
    var cards = containerEl.querySelectorAll('.chroma-card');

    // --- GSAP Setup ---
    setX = gsap.quickSetter(containerEl, '--x', 'px');
    setY = gsap.quickSetter(containerEl, '--y', 'px');

    var rect = containerEl.getBoundingClientRect();
    pos.x = rect.width / 2;
    pos.y = rect.height / 2;
    setX(pos.x);
    setY(pos.y);

    // --- Cursor movement ---
    function moveTo(x, y) {
      gsap.to(pos, {
        x: x,
        y: y,
        duration: damping,
        ease: ease,
        onUpdate: function () {
          if (setX) setX(pos.x);
          if (setY) setY(pos.y);
        },
        overwrite: true
      });
    }

    function handleMove(e) {
      if (isDestroyed) return;
      var r = containerEl.getBoundingClientRect();
      moveTo(e.clientX - r.left, e.clientY - r.top);
      if (fadeEl) {
        gsap.to(fadeEl, { opacity: 0, duration: 0.25, overwrite: true });
      }
    }

    function handleLeave() {
      if (isDestroyed) return;
      if (fadeEl) {
        gsap.to(fadeEl, {
          opacity: 1,
          duration: fadeOut,
          overwrite: true
        });
      }
    }

    // --- Card-level mouse tracking ---
    function handleCardMove(e) {
      if (isDestroyed) return;
      var card = e.currentTarget;
      var cr = card.getBoundingClientRect();
      var x = e.clientX - cr.left;
      var y = e.clientY - cr.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
    }

    function handleCardClick(e) {
      if (isDestroyed) return;
      var card = e.currentTarget;
      // Look up the item by index
      var idx = Array.prototype.indexOf.call(cards, card);
      if (idx >= 0 && items[idx] && items[idx].url) {
        window.open(items[idx].url, '_blank', 'noopener,noreferrer');
      }
    }

    // --- Bind Events ---
    containerEl.addEventListener('pointermove', handleMove);
    containerEl.addEventListener('pointerleave', handleLeave);

    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('mousemove', handleCardMove);
      cards[i].addEventListener('click', handleCardClick);
    }

    // --- Public API ---
    function destroy() {
      isDestroyed = true;
      containerEl.removeEventListener('pointermove', handleMove);
      containerEl.removeEventListener('pointerleave', handleLeave);
      for (var j = 0; j < cards.length; j++) {
        cards[j].removeEventListener('mousemove', handleCardMove);
        cards[j].removeEventListener('click', handleCardClick);
      }
      setX = null;
      setY = null;
      fadeEl = null;
    }

    return {
      destroy: destroy
    };
  };

  /* Helper */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();


// --- variable-proximity.js ---
/* ============================================
   VariableProximity — 封面文字光标邻近变重效果
   Adapted from React Bits for vanilla JS
   ============================================ */
(function () {
  'use strict';

  /**
   * Initialize VariableProximity effect on a title element.
   *
   * @param {HTMLElement}  containerEl - The cover section (used for relative mouse position)
   * @param {HTMLElement}  textEl      - The text container with per-letter <span> children
   * @param {Object}       options
   * @param {number}       [options.radius=150]  - Proximity radius in pixels
   * @param {string}       [options.falloff='linear'] - 'linear' | 'exponential' | 'gaussian'
   * @param {number}       [options.fromWeight=300] - Starting font weight (far from cursor)
   * @param {number}       [options.toWeight=900]   - Target font weight (near cursor)
   * @returns {Object|null} Control API: { destroy }
   */
  window.initVariableProximity = function (containerEl, textEl, options) {
    if (!containerEl || !textEl) return null;

    var opts = options || {};
    var radius = opts.radius || 150;
    var falloff = opts.falloff || 'linear';
    var fromWeight = opts.fromWeight || 300;
    var toWeight = opts.toWeight || 900;

    var letters = textEl.querySelectorAll('.vp-letter');
    if (letters.length === 0) return null;

    var mouseX = 0;
    var mouseY = 0;
    var lastX = -9999;
    var lastY = -9999;
    var rafId = null;
    var isDestroyed = false;

    // Cache letter positions
    var letterRects = [];

    function updateLetterRects() {
      var containerRect = containerEl.getBoundingClientRect();
      letterRects = [];
      for (var i = 0; i < letters.length; i++) {
        var rect = letters[i].getBoundingClientRect();
        letterRects.push({
          cx: rect.left + rect.width / 2 - containerRect.left,
          cy: rect.top + rect.height / 2 - containerRect.top
        });
      }
    }

    function calculateFalloff(distance) {
      var norm = Math.min(Math.max(1 - distance / radius, 0), 1);
      switch (falloff) {
        case 'exponential': return norm * norm;
        case 'gaussian': return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
        case 'linear':
        default: return norm;
      }
    }

    function update() {
      if (isDestroyed) return;

      // Skip if mouse hasn't moved
      if (mouseX === lastX && mouseY === lastY) return;
      lastX = mouseX;
      lastY = mouseY;

      updateLetterRects();

      for (var i = 0; i < letters.length; i++) {
        var lr = letterRects[i];
        var dx = mouseX - lr.cx;
        var dy = mouseY - lr.cy;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= radius) {
          letters[i].style.fontVariationSettings = "'wght' " + fromWeight;
          continue;
        }

        var t = calculateFalloff(distance);
        var weight = fromWeight + (toWeight - fromWeight) * t;
        letters[i].style.fontVariationSettings = "'wght' " + Math.round(weight);
      }
    }

    function onMouseMove(e) {
      if (isDestroyed) return;
      var rect = containerEl.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }

    function loop() {
      if (isDestroyed) return;
      update();
      rafId = requestAnimationFrame(loop);
    }

    // Bind events and start loop
    window.addEventListener('mousemove', onMouseMove);
    // Initial position at center
    var initialRect = containerEl.getBoundingClientRect();
    mouseX = initialRect.width / 2;
    mouseY = initialRect.height / 2;
    rafId = requestAnimationFrame(loop);

    // Recalculate on resize
    var resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!isDestroyed) {
          updateLetterRects();
          lastX = -9999; // force update
        }
      }, 200);
    }
    window.addEventListener('resize', onResize);

    // Public API
    function destroy() {
      isDestroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      rafId = null;
    }

    return { destroy: destroy };
  };

})();


// --- text-pressure.js ---
/* ============================================
   TextPressure — 光标邻近文字压力效果 (Vanilla JS)
   Adapted from React Bits / CodePen by JuanFuentes
   ============================================ */
(function () {
  'use strict';

  function dist(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getAttr(distance, maxDist, minVal, maxVal) {
    var val = maxVal - Math.abs((maxVal * distance) / maxDist);
    return Math.max(minVal, val + minVal);
  }

  /**
   * Initialize TextPressure on a section-title element.
   * Splits text into per-character <span> and varies variable-font axes
   * (wght, wdth, ital) + opacity based on cursor distance.
   *
   * @param {HTMLElement} containerEl - The section-header (or nearest positioned ancestor)
   * @param {HTMLElement} titleEl     - The h2.section-title element
   * @param {Object}      options
   * @param {boolean}     [options.width=true]   - Vary variable-font 'wdth' axis
   * @param {boolean}     [options.weight=true]  - Vary variable-font 'wght' axis
   * @param {boolean}     [options.italic=true]  - Vary variable-font 'ital' axis
   * @param {boolean}     [options.alpha=false]  - Vary opacity based on distance
   * @returns {Object|null}  Control API: { destroy }
   */
  window.initTextPressure = function (containerEl, titleEl, options) {
    if (!containerEl || !titleEl) return null;

    var opts = options || {};
    var enableWidth = opts.width !== false;
    var enableWeight = opts.weight !== false;
    var enableItalic = opts.italic !== false;
    var enableAlpha = opts.alpha === true;

    // Split text into character spans
    var text = titleEl.textContent || '';
    var chars = text.split('');
    var html = '';
    for (var i = 0; i < chars.length; i++) {
      if (chars[i] === ' ') {
        html += '<span class="tp-char tp-space" data-char=" " style="width:0.35em;">&nbsp;</span>';
      } else {
        html += '<span class="tp-char" data-char="' + chars[i].replace(/&/g,'&amp;').replace(/"/g,'&quot;') + '">' + chars[i] + '</span>';
      }
    }
    titleEl.innerHTML = html;

    var spans = titleEl.querySelectorAll('.tp-char');
    if (spans.length === 0) return null;

    var spansArr = [];
    for (var j = 0; j < spans.length; j++) {
      spansArr.push(spans[j]);
    }

    // Mouse tracking with smoothing
    var cursor = { x: 0, y: 0 };
    var mouse = { x: 0, y: 0 };
    var rafId = null;
    var isDestroyed = false;

    // Init cursor to center of viewport
    cursor.x = window.innerWidth / 2;
    cursor.y = window.innerHeight / 2;
    mouse.x = cursor.x;
    mouse.y = cursor.y;

    function onMouseMove(e) {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    }

    function onTouchMove(e) {
      var t = e.touches[0];
      cursor.x = t.clientX;
      cursor.y = t.clientY;
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    function animate() {
      if (isDestroyed) return;

      // Smooth follow
      mouse.x += (cursor.x - mouse.x) / 15;
      mouse.y += (cursor.y - mouse.y) / 15;

      var titleRect = titleEl.getBoundingClientRect();
      var maxDist = titleRect.width / 2;

      for (var i = 0; i < spansArr.length; i++) {
        var span = spansArr[i];
        if (!span || span.classList.contains('tp-space')) continue;

        var rect = span.getBoundingClientRect();
        var charCenter = {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2
        };

        var d = dist(mouse, charCenter);

        var wdth = enableWidth ? Math.floor(getAttr(d, maxDist, 5, 200)) : 100;
        var wght = enableWeight ? Math.floor(getAttr(d, maxDist, 100, 900)) : 400;
        var italVal = enableItalic ? getAttr(d, maxDist, 0, 1).toFixed(2) : 0;
        var alphaVal = enableAlpha ? getAttr(d, maxDist, 0, 1).toFixed(2) : 1;

        var newSettings = "'wght' " + wght + ", 'wdth' " + wdth + ", 'ital' " + italVal;

        if (span.style.fontVariationSettings !== newSettings) {
          span.style.fontVariationSettings = newSettings;
        }
        if (enableAlpha && span.style.opacity !== alphaVal) {
          span.style.opacity = alphaVal;
        }
      }

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    // Public API
    function destroy() {
      isDestroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      rafId = null;
    }

    return { destroy: destroy };
  };

})();


// --- video-3d-cards.js ---
/* ============================================
   Video 3D Card Carousel
   Drag/swipe-controlled 3D card rotation
   Inspired by gobzzzmusicplayer icon-cards
   ============================================ */

var Video3DCards = (function () {
  'use strict';

  var currentIndex = 0;
  var currentAngle = 0;
  var totalCards = 0;
  var angleStep = 0;
  var translateZVal = '-52vw';

  // Generate CSS rule string for card positions
  function generateCardPositions(count, dist) {
    var css = '';
    var step = 360 / count;
    for (var i = 0; i < count; i++) {
      var angle = (step * i).toFixed(1);
      css += '.video-cards__item:nth-child(' + (i + 1) + ') { transform: rotateY(' + angle + 'deg) translateZ(' + dist + '); }\n';
    }
    return css;
  }

  // Build the 3D card carousel HTML
  function buildHTML(items) {
    var html = '<div class="video-cards-wrap">';
    html += '<figure class="video-cards">';
    html += '  <div class="video-cards__content">';

    items.forEach(function (item, i) {
      var cover = item.cover || '';
      var title = item.title || '';
      html += '    <div class="video-cards__item" data-index="' + i + '">';
      html += '      <img src="' + escAttr(cover) + '" alt="' + escAttr(title) + '" loading="lazy" draggable="false">';
      html += '      <span class="video-card-label">' + escHtml(title) + '</span>';
      html += '    </div>';
    });

    html += '  </div>';
    html += '</figure>';
    html += '<p class="video-drag-hint" id="videoDragHint">拖拽或点击卡片浏览</p>';

    // Navigation
    html += '<div class="video-cards-nav">';
    html += '  <button class="video-cards-arrow video-cards-prev" aria-label="上一个">&#10094;</button>';
    html += '  <div class="video-cards-dots">';
    for (var j = 0; j < items.length; j++) {
      html += '    <button class="video-cards-dot' + (j === 0 ? ' active' : '') + '" data-dot="' + j + '" aria-label="第' + (j + 1) + '个"></button>';
    }
    html += '  </div>';
    html += '  <button class="video-cards-arrow video-cards-next" aria-label="下一个">&#10095;</button>';
    html += '</div>';

    // Detail overlay
    html += '<div class="video-detail-overlay" id="videoDetailOverlay">';
    html += '  <div class="video-detail-panel">';
    html += '    <div class="video-detail-visual">';
    html += '      <button class="video-detail-close" id="videoDetailClose">&times;</button>';
    html += '      <img id="videoDetailImg" src="" alt="">';
    html += '      <video id="videoDetailPlayer" controls playsinline style="display:none; width:100%; max-height:50vh; border-radius:12px;" preload="metadata"></video>';
    html += '    </div>';
    html += '    <div class="video-detail-info">';
    html += '      <h3 class="video-detail-title" id="videoDetailTitle"></h3>';
    html += '      <div class="video-detail-divider"></div>';
    html += '      <p class="video-detail-desc" id="videoDetailDesc"></p>';
    html += '      <button class="video-detail-play-btn play-disabled" id="videoDetailPlayBtn">&#9654; 播放视频</button>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function escAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function updateTranslateZ() {
    var w = window.innerWidth;
    if (w <= 480) translateZVal = '-52vw';
    else if (w <= 768) translateZVal = '-60vw';
    else translateZVal = '-52vw';
  }

  function setContentTransform(angle) {
    var el = document.querySelector('.video-cards__content');
    if (!el) return;
    el.style.transform = 'translateZ(' + translateZVal + ') rotateY(' + angle + 'deg)';
  }

  // Inject dynamic card position styles
  function injectCardStyles(count) {
    var dist = window.innerWidth <= 768 ? '60vw' : '52vw';
    if (window.innerWidth <= 480) dist = '52vw';

    var css = generateCardPositions(count, dist);
    css += '@media (max-width: 768px) {';
    css += generateCardPositions(count, '60vw');
    css += '}';
    css += '@media (max-width: 480px) {';
    css += generateCardPositions(count, '52vw');
    css += '}';

    var styleEl = document.getElementById('video-cards-dynamic-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'video-cards-dynamic-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  }

  // Initialize the carousel
  function init(containerEl, items) {
    if (!containerEl || !items || items.length === 0) return;

    totalCards = items.length;
    angleStep = 360 / totalCards;
    currentIndex = 0;
    currentAngle = 0;
    updateTranslateZ();

    // Inject dynamic CSS for card positions
    injectCardStyles(totalCards);

    // Render HTML
    containerEl.innerHTML = buildHTML(items);

    // Set initial transform
    setContentTransform(0);

    // Get DOM refs
    var content = containerEl.querySelector('.video-cards__content');
    var cards = containerEl.querySelectorAll('.video-cards__item');
    var dots = containerEl.querySelectorAll('.video-cards-dot');
    var prevBtn = containerEl.querySelector('.video-cards-prev');
    var nextBtn = containerEl.querySelector('.video-cards-next');
    var hint = document.getElementById('videoDragHint');

    // Detail overlay refs
    var overlay = document.getElementById('videoDetailOverlay');
    var detailImg = document.getElementById('videoDetailImg');
    var detailPlayer = document.getElementById('videoDetailPlayer');
    var detailTitle = document.getElementById('videoDetailTitle');
    var detailDesc = document.getElementById('videoDetailDesc');
    var detailClose = document.getElementById('videoDetailClose');
    var detailPlayBtn = document.getElementById('videoDetailPlayBtn');

    // ====== Rotation ======
    function rotateTo(index, animate) {
      if (index < 0) index = 0;
      if (index >= totalCards) index = totalCards - 1;
      currentIndex = index;

      var targetAngle = -(angleStep * index);
      currentAngle = targetAngle;

      if (animate !== false && typeof gsap !== 'undefined') {
        var endTransform = 'translateZ(' + translateZVal + ') rotateY(' + targetAngle + 'deg)';
        gsap.to(content, {
          duration: 0.55,
          ease: 'power3.out',
          transform: endTransform,
          onUpdate: function () {
            currentAngle = targetAngle;
          }
        });
      } else {
        setContentTransform(targetAngle);
      }

      // Update dots
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });

      // Update active card
      cards.forEach(function (card, i) {
        card.classList.toggle('active-card', i === index);
      });

      // Auto-hide hint
      if (hint && !hint.classList.contains('hidden')) {
        hint.classList.add('hidden');
      }
    }

    // ====== Drag/Swipe ======
    var isDragging = false;
    var dragStartX = 0;
    var dragDeltaX = 0;
    var dragThreshold = 30;

    function onPointerDown(e) {
      isDragging = true;
      var point = e.touches ? e.touches[0] : e;
      dragStartX = point.clientX;
      dragDeltaX = 0;
      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(content);
      }
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      var point = e.touches ? e.touches[0] : e;
      var delta = point.clientX - dragStartX;
      dragDeltaX = delta;

      var newAngle = currentAngle + delta * 0.12;
      setContentTransform(newAngle);
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;

      var absDelta = Math.abs(dragDeltaX);
      if (absDelta > dragThreshold) {
        if (dragDeltaX > 0) {
          rotateTo(currentIndex - 1);
        } else {
          rotateTo(currentIndex + 1);
        }
      } else {
        rotateTo(currentIndex);
      }
    }

    // Mouse events
    var carouselEl = containerEl.querySelector('.video-cards');
    if (carouselEl) {
      carouselEl.addEventListener('mousedown', onPointerDown);
      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup', onPointerUp);
    }

    // Touch events
    if (carouselEl) {
      carouselEl.addEventListener('touchstart', onPointerDown, { passive: true });
      carouselEl.addEventListener('touchmove', onPointerMove, { passive: true });
      carouselEl.addEventListener('touchend', onPointerUp);
    }

    // ====== Card click ======
    // 单击任意卡片：先旋转到正面（如需要），然后直接打开视频详情
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var idx = parseInt(card.getAttribute('data-index'), 10);
        if (idx !== currentIndex) {
          rotateTo(idx);
        }
        // 立即打开详情面板查看视频
        openDetail(idx);
      });
    });

    // ====== Navigation buttons ======
    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        rotateTo(currentIndex - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        rotateTo(currentIndex + 1);
      });
    }

    // ====== Dots ======
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.getAttribute('data-dot'), 10);
        rotateTo(idx);
      });
    });

    // ====== Detail overlay ======
    function openDetail(idx) {
      var item = items[idx];
      if (!item) return;

      if (detailImg) detailImg.src = item.cover || '';
      if (detailTitle) detailTitle.textContent = item.title || '';
      if (detailDesc) detailDesc.textContent = item.description || '';

      // Video player
      if (detailPlayer) {
        if (item.src) {
          detailPlayer.src = item.src;
          detailPlayer.style.display = 'block';
          detailImg.style.display = 'none';
        } else {
          detailPlayer.style.display = 'none';
          detailImg.style.display = '';
          detailPlayer.src = '';
        }
      }

      if (detailPlayBtn) {
        if (item.src) {
          detailPlayBtn.classList.remove('play-disabled');
          detailPlayBtn.textContent = '\u25B6 播放视频';
          detailPlayBtn.onclick = function () {
            if (detailPlayer) {
              detailPlayer.style.display = 'block';
              detailImg.style.display = 'none';
              detailPlayer.play();
            }
          };
        } else {
          detailPlayBtn.classList.add('play-disabled');
          detailPlayBtn.onclick = null;
        }
      }

      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeDetail() {
      if (detailPlayer) {
        detailPlayer.pause();
        detailPlayer.src = '';
        detailPlayer.style.display = 'none';
      }
      if (detailImg) detailImg.style.display = '';
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (detailClose) detailClose.addEventListener('click', closeDetail);
    if (overlay) overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeDetail();
    });

    // Escape key
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') closeDetail();
    });

    // Arrow keys for navigation
    document.addEventListener('keydown', function onArrow(e) {
      if (e.key === 'ArrowLeft') { rotateTo(currentIndex - 1); }
      else if (e.key === 'ArrowRight') { rotateTo(currentIndex + 1); }
    });

    // ====== Window resize ======
    window.addEventListener('resize', function () {
      updateTranslateZ();
      injectCardStyles(totalCards);
      setContentTransform(currentAngle);
    });

    // Return API
    return {
      goTo: rotateTo,
      next: function () { rotateTo(currentIndex + 1); },
      prev: function () { rotateTo(currentIndex - 1); },
      currentIndex: function () { return currentIndex; }
    };
  }

  return {
    init: init
  };
})();

// --- conveyor-belt.js ---
// ============================================
// Conveyor Belt — JS-driven scroll
// Fade-out edges (CSS) • pause-on-hover • zoom 1.5× (CSS)
// ============================================

(function () {
  'use strict';

  function createConveyorBelt(container, options) {
    if (!container) return null;

    var opts = options || {};
    var items = opts.items || [];
    var speed = opts.speed || 0.2;        // px per frame (~60fps)
    var gap = opts.gap || 24;
    var cardW = opts.cardWidth || 280;
    var cardH = opts.cardHeight || 210;
    var destroyed = false;
    var paused = false;
    var offset = 0;
    var rafId = null;

    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:24px;text-align:center;color:var(--text-muted);">No photos yet</div>';
      return { destroy: function() {} };
    }

    // Build DOM
    container.classList.add('cb-container');
    container.style.height = cardH + 'px';
    container.innerHTML = '';

    // Backdrop overlay for hover zoom (replaces ::before)
    var backdrop = document.createElement('div');
    backdrop.className = 'cb-backdrop';
    container.appendChild(backdrop);

    var track = document.createElement('div');
    track.className = 'cb-track';

    var loopItems = items.concat(items); // duplicate for seamless wrap
    var halfWidth = (cardW + gap) * items.length;

    loopItems.forEach(function (item, i) {
      var card = document.createElement('div');
      card.className = 'cb-card';
      card.style.width = cardW + 'px';
      card.style.height = cardH + 'px';
      card.style.marginRight = gap + 'px';
      card.setAttribute('data-index', i % items.length);

      var img = document.createElement('img');
      img.src = item.image || '';
      img.alt = item.title || '';
      img.draggable = false;
      card.appendChild(img);

      if (item.title) {
        var label = document.createElement('div');
        label.className = 'cb-card-label';
        label.textContent = item.title;
        card.appendChild(label);
      }

      track.appendChild(card);
    });

    container.appendChild(track);

    // Animation loop
    function animate() {
      if (destroyed) return;
      if (!paused) {
        offset -= speed;
        // Seamless wrap
        if (offset <= -halfWidth) offset += halfWidth;
        if (offset > 0) offset -= halfWidth;
        track.style.transform = 'translate3d(' + offset.toFixed(2) + 'px, 0, 0)';
      }
      rafId = requestAnimationFrame(animate);
    }

    // Hover — pause + show backdrop
    container.addEventListener('mouseenter', function () {
      paused = true;
      container.classList.add('cb-paused');
    });
    container.addEventListener('mouseleave', function () {
      paused = false;
      container.classList.remove('cb-paused');
    });

    // Start
    rafId = requestAnimationFrame(animate);

    return {
      destroy: function () {
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        container.innerHTML = '';
        container.className = '';
      }
    };
  }

  window.createConveyorBelt = createConveyorBelt;
})();


// ============================================
// Research Reel — 双排反向滑动
// 上排向右 → 下排向左 ←
// 鼠标滚轮驱动横滑，点击弹出详情
// ============================================
(function () {
  'use strict';

  function createResearchReel(container, items) {
    if (!container || !items || items.length === 0) return null;

    var cardWidth = 140;
    var cardHeight = 190;
    var gap = 47;

    // Responsive sizing
    if (window.innerWidth <= 480) {
      cardWidth = 85; cardHeight = 120; gap = 28;
    } else if (window.innerWidth <= 860) {
      cardWidth = 105; cardHeight = 145; gap = 35;
    }

    // Split items: first half → top, second half → bottom
    var mid = Math.ceil(items.length / 2);
    var topItems = items.slice(0, mid);
    var bottomItems = items.slice(mid);

    // ── Build DOM ──
    container.innerHTML = '';

    var section = document.createElement('div');
    section.className = 'rr-section';

    // Top track wrapper
    var topWrapper = document.createElement('div');
    topWrapper.className = 'rr-track-wrapper';

    var topTrack = document.createElement('div');
    topTrack.className = 'rr-track';
    topTrack.id = 'rrTrackTop';

    topItems.forEach(function (item, i) {
      var card = createCard(item, i);
      topTrack.appendChild(card);
    });
    topWrapper.appendChild(topTrack);

    // Title
    var title = document.createElement('div');
    title.className = 'rr-title';
    title.textContent = '科研经历';

    // Bottom track wrapper
    var bottomWrapper = document.createElement('div');
    bottomWrapper.className = 'rr-track-wrapper';

    var bottomTrack = document.createElement('div');
    bottomTrack.className = 'rr-track rr-track--bottom';
    bottomTrack.id = 'rrTrackBottom';

    bottomItems.forEach(function (item, i) {
      var card = createCard(item, mid + i);
      card.setAttribute('data-index', mid + i);
      bottomTrack.appendChild(card);
    });
    bottomWrapper.appendChild(bottomTrack);

    // Hint
    var hint = document.createElement('div');
    hint.className = 'rr-hint';
    hint.textContent = '⟵ 滚动查看更多 ⟶';

    section.appendChild(topWrapper);
    section.appendChild(title);
    section.appendChild(bottomWrapper);
    section.appendChild(hint);
    container.appendChild(section);

    // ── Modal ──
    var modal = document.createElement('div');
    modal.className = 'rr-modal';
    modal.id = 'rrModal';
    modal.innerHTML =
      '<div class="rr-modal-card">' +
      '  <button class="rr-modal-close">&times;</button>' +
      '  <img class="rr-modal-img" src="" alt="">' +
      '  <div class="rr-modal-body">' +
      '    <h2 class="rr-modal-title"></h2>' +
      '    <p class="rr-modal-desc"></p>' +
      '  </div>' +
      '</div>';
    container.appendChild(modal);

    // ── Helper: create card ──
    function createCard(item, index) {
      var card = document.createElement('div');
      card.className = 'rr-card';
      card.setAttribute('data-index', index);
      card.style.width = cardWidth + 'px';
      card.style.height = cardHeight + 'px';

      var img = document.createElement('img');
      img.src = item.photo || '';
      img.alt = item.title || '';
      img.loading = 'lazy';
      img.draggable = false;
      card.appendChild(img);

      return card;
    }

    // ── Scroll-jacking state ──
    var progress = 0;         // 0: 图全在屏外；1: 全展示，两排居中对齐
    var maxScroll = 0;        // 图片从屏外滑入的偏移距离
    var scrollDist = 0;       // 滚轮需要滚动的像素数（控制速度）
    var locked = false;
    var unlockAt = 0;         // 0=无, 1=上次下滑解锁, -1=上次上滑解锁
    var sectionEl = document.getElementById('research');
    var titleEl = section.querySelector('.rr-title');

    function recalc() {
      var totalW = topItems.length * cardWidth + (topItems.length - 1) * gap;
      var vw = window.innerWidth;
      // 初始偏移：足够把所有图推到屏外 + 一张卡的余量
      maxScroll = (vw + totalW) / 2 + cardWidth;
      // 滚动速度：调慢（系数越大越慢）
      scrollDist = totalW * 1.8;
    }

    // 标题离开视口中央足够远时，重置状态
    function resetIfOffScreen() {
      if (!titleEl) return;
      var rect = titleEl.getBoundingClientRect();
      var titleCenter = rect.top + rect.height / 2;
      var viewCenter = window.innerHeight / 2;
      var vh = window.innerHeight;
      if (Math.abs(titleCenter - viewCenter) > vh * 0.5) {
        if (progress !== 0) {
          progress = 0;
          applyTransform();
        }
        locked = false;
        unlockAt = 0;
      }
    }

    setTimeout(recalc, 150);
    setTimeout(recalc, 500);
    window.addEventListener('resize', function () {
      if (window.innerWidth <= 480) {
        cardWidth = 85; cardHeight = 120; gap = 28;
      } else if (window.innerWidth <= 860) {
        cardWidth = 105; cardHeight = 145; gap = 35;
      } else {
        cardWidth = 140; cardHeight = 190; gap = 47;
      }
      [topTrack, bottomTrack].forEach(function (track) {
        var cards = track.querySelectorAll('.rr-card');
        cards.forEach(function (c) {
          c.style.width = cardWidth + 'px';
          c.style.height = cardHeight + 'px';
        });
      });
      topTrack.style.gap = gap + 'px';
      bottomTrack.style.gap = gap + 'px';
      recalc();
      progress = Math.min(progress, 1);
      applyTransform();
    });

    function applyTransform() {
      if (scrollDist <= 0) {
        topTrack.style.transform = '';
        bottomTrack.style.transform = '';
        hint.classList.remove('visible');
        return;
      }
      // progress 0: 上排极左(tx=-maxScroll) 下排极右(tx=+maxScroll)，全在屏外
      // progress 1: tx=0，两排居中，卡片一一对齐
      var txTop = -(1 - progress) * maxScroll;
      var txBottom = (1 - progress) * maxScroll;
      topTrack.style.transform = 'translate3d(' + txTop.toFixed(1) + 'px, 0, 0)';
      bottomTrack.style.transform = 'translate3d(' + txBottom.toFixed(1) + 'px, 0, 0)';

      if (progress > 0.02 && progress < 0.98) {
        hint.classList.add('visible');
      } else {
        hint.classList.remove('visible');
      }
    }

    // ── Lock: 「科研经历」标题到达视口中央 ──
    function shouldLock() {
      if (!titleEl || scrollDist <= 0) return false;
      var rect = titleEl.getBoundingClientRect();
      var titleCenter = rect.top + rect.height / 2;
      var viewCenter = window.innerHeight / 2;
      return Math.abs(titleCenter - viewCenter) < window.innerHeight * 0.18;
    }

    function onWheel(e) {
      if (!locked) {
        resetIfOffScreen();
        if (!shouldLock() || scrollDist <= 0) return;
        // 解锁后禁止同方向立即重锁
        if (e.deltaY > 0 && unlockAt === 1) return;
        if (e.deltaY < 0 && unlockAt === -1) return;
        locked = true;
        unlockAt = 0;
      }

      e.preventDefault();

      if (e.deltaY > 0) {
        // 下滑 → 图片从两侧滑入
        if (progress >= 1) { locked = false; unlockAt = 1; return; }
        progress = Math.min(1, progress + Math.abs(e.deltaY) / scrollDist);
        if (progress >= 1) { locked = false; unlockAt = 1; }
      } else if (e.deltaY < 0) {
        // 上滑 → 图片反向滚出
        if (progress <= 0) { locked = false; unlockAt = -1; return; }
        progress = Math.max(0, progress - Math.abs(e.deltaY) / scrollDist);
        if (progress <= 0) { locked = false; unlockAt = -1; }
      }

      applyTransform();
    }

    // 兜底：scroll 事件补锁（仅下滑场景）
    function onScroll() {
      resetIfOffScreen();
      if (!locked && shouldLock() && scrollDist > 0 && unlockAt !== 1 && progress < 1) {
        locked = true;
        unlockAt = 0;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Click → Modal ──
    section.addEventListener('click', function (e) {
      var card = e.target.closest('.rr-card');
      if (!card) return;

      var index = parseInt(card.getAttribute('data-index'));
      var item = items[index];
      if (!item) return;

      var modalImg = modal.querySelector('.rr-modal-img');
      var modalTitle = modal.querySelector('.rr-modal-title');
      var modalDesc = modal.querySelector('.rr-modal-desc');

      if (item.photo) {
        modalImg.src = '';
        modalImg.style.display = 'none';
      } else {
        modalImg.style.display = 'none';
      }
      modalTitle.textContent = item.title || '';
      modalDesc.textContent = item.description || '';

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    modal.querySelector('.rr-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // ── Touch support ──
    var touchStartX = 0;
    var touchStartY = 0;
    var touchProgressStart = 0;
    var touchLocked = false;

    section.addEventListener('touchstart', function (e) {
      if (scrollDist <= 0) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchProgressStart = progress;
      touchLocked = true;
    }, { passive: true });

    section.addEventListener('touchmove', function (e) {
      if (!touchLocked || scrollDist <= 0) return;
      var dx = touchStartX - e.touches[0].clientX;
      var dy = touchStartY - e.touches[0].clientY;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        e.preventDefault();
        // 手指左滑(dx>0) → 推进；手指右滑(dx<0) → 回退
        var deltaProgress = dx / scrollDist;
        progress = Math.max(0, Math.min(1, touchProgressStart + deltaProgress));
        applyTransform();
      }
    }, { passive: false });

    section.addEventListener('touchend', function () {
      touchLocked = false;
    });

    // ── Attach wheel listener ──
    window.addEventListener('wheel', onWheel, { passive: false });

    // ── Initial apply ──
    recalc();
    applyTransform();

    // ── Return API ──
    return {
      destroy: function () {
        window.removeEventListener('wheel', onWheel, { passive: false });
        window.removeEventListener('scroll', onScroll, { passive: true });
        container.innerHTML = '';
      },
      recalc: recalc
    };
  }

  window.createResearchReel = createResearchReel;
})();


// ============================================
// Auto-init: attach to #personal-gallery when DOM ready
// Runs after script.js finishes rendering
// ============================================
(function () {
  'use strict';

  function tryInit() {
    var el = document.getElementById('personal-gallery');
    var data = window.APP_DATA || window.DEFAULT_DATA || {};
    var photos = (data.personalInfo && data.personalInfo.photos) || [];
    if (!el || !photos.length) return;
    var items = photos.map(function (p) {
      return { image: typeof p === 'string' ? p : (p.url || ''), title: '' };
    });
    window._conveyorBelt = window.createConveyorBelt(el, {
      items: items, speed: 0.2, gap: 24, cardWidth: 420, cardHeight: 315
    });
  }

  // Retry with increasing delays (JSON fetch may delay APP_DATA)
  setTimeout(tryInit, 100);
  setTimeout(tryInit, 300);
  setTimeout(tryInit, 800);
})();


(function () {
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

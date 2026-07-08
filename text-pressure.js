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

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

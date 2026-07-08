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

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

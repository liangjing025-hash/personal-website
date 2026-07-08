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

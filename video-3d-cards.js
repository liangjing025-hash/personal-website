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
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var idx = parseInt(card.getAttribute('data-index'), 10);
        if (idx === currentIndex) {
          openDetail(idx);
        } else {
          rotateTo(idx);
        }
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
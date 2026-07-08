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

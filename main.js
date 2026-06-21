// =====================================================
//  Cloud Create — Main JavaScript
//  Config: edit SERVER_IP and DISCORD_URL below
// =====================================================

const CONFIG = {
  SERVER_IP:   'play.cloudcreate.net',
  IS_IP_PLACEHOLDER: true,
  DISCORD_URL: 'https://discord.gg/N54MhNbZEM',
  TIKTOK_URL:  'https://www.tiktok.com/@cloudcreatemc',
  TELEGRAM_URL: 'https://t.me/CloudCreatee',
  MRPACK_URL:  '#', // Google Drive link for .mrpack
  ZIP_URL:     '#', // Google Drive link for .zip
};

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------
  // 1. Fill dynamic config values into the DOM
  // --------------------------------------------------
  document.querySelectorAll('[data-server-ip]').forEach(el => {
    el.textContent = CONFIG.SERVER_IP;
  });
  document.querySelectorAll('[data-discord-url]').forEach(el => {
    el.href = CONFIG.DISCORD_URL;
  });
  document.querySelectorAll('[data-tiktok-url]').forEach(el => {
    el.href = CONFIG.TIKTOK_URL;
  });
  document.querySelectorAll('[data-telegram-url]').forEach(el => {
    el.href = CONFIG.TELEGRAM_URL;
  });
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // --------------------------------------------------
  // 1.2. Theme Toggle Button
  // --------------------------------------------------
  const themeToggles = document.querySelectorAll('.theme-toggle');
  themeToggles.forEach(toggleBtn => {
    toggleBtn.addEventListener('click', () => {
      const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      };
      
      if (document.startViewTransition) {
        document.startViewTransition(toggleTheme);
      } else {
        toggleTheme();
      }
    });
  });  // --------------------------------------------------
  // 1.3. Flying Cloud Logo Easter Egg
  // --------------------------------------------------
  const logoLink = document.querySelector('.logo a');
  let isFlying = false;
  let isLanding = false;
  let animFrameId = null;

  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();

      if (isLanding) return; // Prevent clicks during landing transition

      if (isFlying) {
        // Boost velocity on subsequent clicks
        logoLink.dataset.vx = parseFloat(logoLink.dataset.vx || 0) + (Math.random() - 0.5) * 15;
        logoLink.dataset.vy = parseFloat(logoLink.dataset.vy || 0) + (Math.random() - 0.5) * 15;
        
        // Visual click feedback (scale bump)
        const x = parseFloat(logoLink.dataset.x || 0);
        const y = parseFloat(logoLink.dataset.y || 0);
        const rot = parseFloat(logoLink.dataset.vx) * 2;
        logoLink.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(1.15)`;
        setTimeout(() => {
          if (isFlying && !isLanding) {
            const curX = parseFloat(logoLink.dataset.x || 0);
            const curY = parseFloat(logoLink.dataset.y || 0);
            const curRot = parseFloat(logoLink.dataset.vx) * 2;
            logoLink.style.transform = `translate3d(${curX}px, ${curY}px, 0) rotate(${curRot}deg) scale(1)`;
          }
        }, 120);
        return;
      }

      isFlying = true;
      isLanding = false;
      const rect = logoLink.getBoundingClientRect();

      // Create hidden placeholder to preserve header layout
      const placeholder = logoLink.cloneNode(true);
      placeholder.style.visibility = 'hidden';
      placeholder.style.pointerEvents = 'none';
      placeholder.classList.add('logo-placeholder');
      
      // We append placeholder first so it immediately occupies the space
      logoLink.parentNode.appendChild(placeholder);

      // Move the original logo link to document.body to escape the sticky header and backdrop-filter container,
      // avoiding positioning offset jumps during fixed positioning.
      document.body.appendChild(logoLink);

      // Align logo link to fixed 0, 0 viewport coordinates and use translate3d for hardware-accelerated movement
      logoLink.style.position = 'fixed';
      logoLink.style.left = '0px';
      logoLink.style.top = '0px';
      logoLink.style.width = rect.width + 'px';
      logoLink.style.height = rect.height + 'px';
      logoLink.style.zIndex = '99999';
      logoLink.style.pointerEvents = 'auto';
      logoLink.style.transition = 'none';
      logoLink.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) rotate(0deg)`;

      let x = rect.left;
      let y = rect.top;
      let vx = (Math.random() - 0.5) * 6 + (Math.random() > 0.5 ? 3.5 : -3.5);
      let vy = (Math.random() - 0.5) * 6 + (Math.random() > 0.5 ? 3.5 : -3.5);

      logoLink.dataset.x = x;
      logoLink.dataset.y = y;
      logoLink.dataset.vx = vx;
      logoLink.dataset.vy = vy;

      const duration = 13000; // Fly for 13 seconds
      let startTime = performance.now();

      function updatePhysics(timestamp) {
        if (!isFlying) return;

        const elapsed = timestamp - startTime;
        
        vx = parseFloat(logoLink.dataset.vx);
        vy = parseFloat(logoLink.dataset.vy);

        // Apply friction to slow down boosts
        vx *= 0.988;
        vy *= 0.988;

        // Maintain minimum speed
        if (Math.abs(vx) < 1.8) vx = vx > 0 ? 1.8 : -1.8;
        if (Math.abs(vy) < 1.8) vy = vy > 0 ? 1.8 : -1.8;

        logoLink.dataset.vx = vx;
        logoLink.dataset.vy = vy;

        x += vx;
        y += vy;

        logoLink.dataset.x = x;
        logoLink.dataset.y = y;

        const w = rect.width;
        const h = rect.height;

        // Boundary collisions
        if (x < 0) {
          x = 0;
          vx = -vx;
          logoLink.dataset.vx = vx;
        } else if (x > window.innerWidth - w) {
          x = window.innerWidth - w;
          vx = -vx;
          logoLink.dataset.vx = vx;
        }

        if (y < 0) {
          y = 0;
          vy = -vy;
          logoLink.dataset.vy = vy;
        } else if (y > window.innerHeight - h) {
          y = window.innerHeight - h;
          vy = -vy;
          logoLink.dataset.vy = vy;
        }

        const rot = vx * 2;
        logoLink.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;

        if (elapsed < duration) {
          animFrameId = requestAnimationFrame(updatePhysics);
        } else {
          landLogo();
        }
      }

      function landLogo() {
        cancelAnimationFrame(animFrameId);
        isLanding = true;
        
        // Smooth return animation via CSS transition on transform
        logoLink.style.transition = 'transform 1.4s cubic-bezier(0.25, 1, 0.3, 1)';
        const targetRect = placeholder.getBoundingClientRect();
        
        logoLink.style.transform = `translate3d(${targetRect.left}px, ${targetRect.top}px, 0) rotate(0deg)`;

        setTimeout(() => {
          // Move back to header and remove placeholder
          if (placeholder.parentNode) {
            placeholder.parentNode.insertBefore(logoLink, placeholder);
          }
          
          logoLink.style.position = '';
          logoLink.style.left = '';
          logoLink.style.top = '';
          logoLink.style.width = '';
          logoLink.style.height = '';
          logoLink.style.zIndex = '';
          logoLink.style.transition = '';
          logoLink.style.transform = '';
          
          placeholder.remove();
          isFlying = false;
          isLanding = false;
        }, 1400);
      }

      // Start physics loop in the next animation frame to avoid any jump
      requestAnimationFrame((timestamp) => {
        startTime = timestamp; // Reset start time to actual frame start
        animFrameId = requestAnimationFrame(updatePhysics);
      });
    });
  }

  // --------------------------------------------------
  // 1.1. Direct Google Drive downloads for Modpack & Interactive Error Effects
  // --------------------------------------------------
  function getDirectDownloadUrl(url) {
    if (!url || url === '#') return '#';
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
    return url;
  }

  const mrpackBtn = document.getElementById('download-mrpack');
  const zipBtn = document.getElementById('download-zip');
  const downloadToast = document.getElementById('download-toast');

  let toastTimeout;
  let buttonTimeouts = new Map();

  function triggerUnavailableState(btn) {
    if (!btn) return;

    // 1. Shake animation
    btn.classList.remove('btn-shake');
    void btn.offsetWidth; // force reflow to restart animation
    btn.classList.add('btn-shake');
    setTimeout(() => {
      btn.classList.remove('btn-shake');
    }, 400);

    // 2. Red state
    btn.classList.add('btn-unavailable');
    if (buttonTimeouts.has(btn)) {
      clearTimeout(buttonTimeouts.get(btn));
    }
    const btnTimeout = setTimeout(() => {
      btn.classList.remove('btn-unavailable');
      buttonTimeouts.delete(btn);
    }, 3000);
    buttonTimeouts.set(btn, btnTimeout);

    // 3. Show bottom toast
    if (downloadToast) {
      clearTimeout(toastTimeout);
      downloadToast.classList.add('show');
      toastTimeout = setTimeout(() => {
        downloadToast.classList.remove('show');
      }, 3500);
    }
  }

  if (mrpackBtn) {
    const directUrl = getDirectDownloadUrl(CONFIG.MRPACK_URL);
    mrpackBtn.href = directUrl;
    if (directUrl === '#') {
      mrpackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerUnavailableState(mrpackBtn);
      });
    }
  }
  if (zipBtn) {
    const directUrl = getDirectDownloadUrl(CONFIG.ZIP_URL);
    zipBtn.href = directUrl;
    if (directUrl === '#') {
      zipBtn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerUnavailableState(zipBtn);
      });
    }
  }

  // --------------------------------------------------
  // 2. Active nav link highlight
  // --------------------------------------------------
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // --------------------------------------------------
  // 3. Mobile nav toggle
  // --------------------------------------------------
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu');

  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        navMenu.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --------------------------------------------------
  // 4. Copy IP to clipboard
  // --------------------------------------------------
  const ipBox   = document.getElementById('ip-box');
  const ipToast = document.getElementById('ip-toast');

  let ipTimeout;
  if (ipBox) {
    ipBox.addEventListener('click', async () => {
      if (CONFIG.IS_IP_PLACEHOLDER) {
        // Shake animation
        ipBox.classList.remove('btn-shake');
        void ipBox.offsetWidth; // force reflow
        ipBox.classList.add('btn-shake');
        setTimeout(() => ipBox.classList.remove('btn-shake'), 400);

        // Red state
        ipBox.classList.add('ip-unavailable');
        if (ipTimeout) clearTimeout(ipTimeout);
        ipTimeout = setTimeout(() => {
          ipBox.classList.remove('ip-unavailable');
        }, 3000);

        // Update toast content to warning and show
        if (ipToast) {
          ipToast.textContent = 'Справжній IP ще невідомий (це приклад)!';
          ipToast.classList.add('ip-warning');
          showIPToast();
        }
        return;
      }

      // Normal Copy flow
      if (ipToast) {
        ipToast.textContent = 'Скопійовано!';
        ipToast.classList.remove('ip-warning');
      }

      try {
        await navigator.clipboard.writeText(CONFIG.SERVER_IP);
        showIPToast();
      } catch {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = CONFIG.SERVER_IP;
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showIPToast();
      }
    });
  }

  let toastTimer;
  function showIPToast() {
    if (!ipToast) return;
    clearTimeout(toastTimer);
    ipToast.classList.add('show');
    toastTimer = setTimeout(() => ipToast.classList.remove('show'), 2800);
  }

  // --------------------------------------------------
  // 5. Server status monitoring
  // --------------------------------------------------
  const statusDot  = document.getElementById('server-status-dot');
  const statusText = document.getElementById('server-status-text');

  async function checkServerStatus() {
    if (!statusDot || !statusText) return;

    statusDot.className  = 'status-dot checking';
    statusText.textContent = 'Перевірка статусу...';

    try {
      const res  = await fetch(
        `https://api.mcsrvstat.us/3/${encodeURIComponent(CONFIG.SERVER_IP)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (data.online) {
        statusDot.className   = 'status-dot online';
        const players = data.players ? `${data.players.online}/${data.players.max} гравців` : 'Онлайн';
        statusText.textContent = players;
      } else {
        statusDot.className   = 'status-dot offline';
        statusText.textContent = 'Сервер офлайн';
      }
    } catch {
      statusDot.className   = 'status-dot offline';
      statusText.textContent = 'Статус недоступний';
    }
  }

  checkServerStatus();
  // Refresh every 60 seconds
  setInterval(checkServerStatus, 60_000);

  // --------------------------------------------------
  // 6. Accordion (Rules page)
  // --------------------------------------------------
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item    = trigger.closest('.accordion-item');
      const content = item.querySelector('.accordion-content');
      const isOpen  = item.classList.contains('open');

      // Close all open items first (single-open accordion)
      document.querySelectorAll('.accordion-item.open').forEach(open => {
        open.classList.remove('open');
        open.querySelector('.accordion-content').hidden = true;
        open.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked item
      if (!isOpen) {
        item.classList.add('open');
        content.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // --------------------------------------------------
  // 7. Gear decorations — interactive hover speed-up
  // --------------------------------------------------
  document.querySelectorAll('.gear-deco').forEach(gear => {
    gear.addEventListener('mouseenter', () => {
      gear.style.animationDuration = '4s';
    });
    gear.addEventListener('mouseleave', () => {
      gear.style.animationDuration = '';
    });
  });

  // --------------------------------------------------
  // 8. Intersection Observer — fade-in on scroll
  // --------------------------------------------------
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.observe').forEach(el => observer.observe(el));

  // --------------------------------------------------
  // 9. Modpack tab switcher
  // --------------------------------------------------
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Deactivate all buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      // Hide all panes
      tabPanes.forEach(pane => {
        pane.style.display = 'none';
        pane.classList.remove('active');
      });

      // Activate clicked button
      btn.classList.add('active');
      // Show targeted pane
      const activePane = document.getElementById(targetTab);
      if (activePane) {
        activePane.style.display = 'flex';
        activePane.classList.add('active');
      }
    });
  });

  // --------------------------------------------------
  // 10. Rules page tab switcher & mobile dropdown
  // --------------------------------------------------
  const rulesMenuItems = document.querySelectorAll('.rules-menu-item');
  const rulesSections = document.querySelectorAll('.rules-section');
  const rulesMobileBtn = document.getElementById('rules-mobile-btn');
  const rulesMobileMenu = document.getElementById('rules-mobile-menu');
  const rulesMobileItems = document.querySelectorAll('.rules-mobile-item');
  const activeCategoryMobileText = document.getElementById('active-category-mobile-text');
  const rulesContentCard = document.getElementById('rules-content-card');

  function switchRulesSection(sectionId, categoryText, iconSvgHtml) {
    // 1. Update active states on desktop menu
    rulesMenuItems.forEach(item => {
      if (item.getAttribute('data-section') === sectionId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 2. Update active states on mobile menu
    rulesMobileItems.forEach(item => {
      if (item.getAttribute('data-section') === sectionId) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      }
    });

    // 3. Switch active content section
    rulesSections.forEach(section => {
      if (section.id === sectionId) {
        section.classList.add('active');
        section.style.display = 'block';
      } else {
        section.classList.remove('active');
        section.style.display = 'none';
      }
    });

    // 4. Update mobile button label
    if (activeCategoryMobileText) {
      activeCategoryMobileText.textContent = categoryText;
    }
    // Also copy the icon from selected item to mobile trigger
    if (rulesMobileBtn && iconSvgHtml) {
      const triggerIcon = rulesMobileBtn.querySelector('.select-icon');
      if (triggerIcon) {
        triggerIcon.outerHTML = iconSvgHtml.replace('class="icon"', 'class="icon select-icon"');
      }
    }
  }

  // Desktop sidebar event listeners
  rulesMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.getAttribute('data-section');
      const categoryText = item.textContent.trim();
      const iconSvg = item.querySelector('svg');
      const iconHtml = iconSvg ? iconSvg.outerHTML : '';
      switchRulesSection(sectionId, categoryText, iconHtml);
    });
  });

  // Mobile menu trigger toggle
  if (rulesMobileBtn && rulesMobileMenu) {
    rulesMobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = rulesMobileMenu.classList.toggle('open');
      rulesMobileBtn.classList.toggle('open');
      rulesMobileBtn.setAttribute('aria-expanded', String(isOpen));
    });

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
      if (rulesMobileMenu.classList.contains('open') && !rulesMobileMenu.contains(e.target) && !rulesMobileBtn.contains(e.target)) {
        rulesMobileMenu.classList.remove('open');
        rulesMobileBtn.classList.remove('open');
        rulesMobileBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Mobile item click listeners
  rulesMobileItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.getAttribute('data-section');
      const categoryText = item.textContent.trim();
      
      // Find matching icon from desktop menu
      const desktopItem = document.querySelector(`.rules-menu-item[data-section="${sectionId}"]`);
      const iconSvg = desktopItem ? desktopItem.querySelector('svg') : null;
      const iconHtml = iconSvg ? iconSvg.outerHTML : '';

      switchRulesSection(sectionId, categoryText, iconHtml);

      // Close dropdown
      if (rulesMobileMenu && rulesMobileBtn) {
        rulesMobileMenu.classList.remove('open');
        rulesMobileBtn.classList.remove('open');
        rulesMobileBtn.setAttribute('aria-expanded', 'false');
      }

      // Smooth scroll to content card on mobile
      if (rulesContentCard) {
        const offset = 120; // top offset for header
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = rulesContentCard.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Dynamically assign IDs to rule items based on their category prefix and rule number
  // e.g. rp-7 and number 7.4 -> id="rp-7.4"
  const rulesToast = document.getElementById('rules-toast');
  let rulesToastTimer;

  function showRulesToast() {
    if (!rulesToast) return;
    clearTimeout(rulesToastTimer);
    rulesToast.classList.add('show');
    rulesToastTimer = setTimeout(() => rulesToast.classList.remove('show'), 2800);
  }

  if (rulesSections && rulesSections.length > 0) {
    rulesSections.forEach(section => {
      const sectionId = section.id; // e.g. "mc-1" or "rp-7"
      const prefix = sectionId.split('-')[0]; // "mc" or "rp"
      
      // Standard rule items
      section.querySelectorAll('.rule-item').forEach(item => {
        const numEl = item.querySelector('.rule-num');
        if (numEl) {
          const numText = numEl.textContent.trim(); // e.g. "7.4"
          item.id = `${prefix}-${numText}`;

          item.addEventListener('click', async (e) => {
            if (e.target.closest('a') || e.target.closest('button')) return;

            const ruleUrl = `https://cloud-create-mc.github.io/rules.html#${item.id}`;

            try {
              await navigator.clipboard.writeText(ruleUrl);
              showRulesToast();
            } catch (err) {
              const ta = document.createElement('textarea');
              ta.value = ruleUrl;
              ta.style.position = 'fixed';
              ta.style.opacity = '0';
              document.body.appendChild(ta);
              ta.focus(); ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              showRulesToast();
            }

            // Brief highlight visual feedback
            item.classList.remove('highlight-pulse');
            void item.offsetWidth; // trigger reflow
            item.classList.add('highlight-pulse');
          });
        }
      });

      // Forbidden rule items
      section.querySelectorAll('.rule-forbidden-item').forEach((item, idx) => {
        item.id = `${sectionId}-forbidden-${idx + 1}`;

        item.addEventListener('click', async (e) => {
          if (e.target.closest('a') || e.target.closest('button')) return;

          const ruleUrl = `https://cloud-create-mc.github.io/rules.html#${item.id}`;

          try {
            await navigator.clipboard.writeText(ruleUrl);
            showRulesToast();
          } catch (err) {
            const ta = document.createElement('textarea');
            ta.value = ruleUrl;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus(); ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showRulesToast();
          }

          // Brief highlight visual feedback
          item.classList.remove('highlight-pulse');
          void item.offsetWidth; // trigger reflow
          item.classList.add('highlight-pulse');
        });
      });
    });
  }

  // Hash-routing for rules page
  function handleUrlHash() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    let targetSectionId = '';
    let targetElementId = '';

    // Check if the hash matches a specific rule (e.g., mc-1.9 or rp-7.4)
    if (hash.includes('.')) {
      const parts = hash.split('.');
      const sectionExists = document.getElementById(parts[0]);
      if (sectionExists && sectionExists.classList.contains('rules-section')) {
        targetSectionId = parts[0];
        targetElementId = hash;
      }
    } else if (hash === 'mc') {
      targetSectionId = 'mc-1';
    } else if (hash === 'rp') {
      targetSectionId = 'rp-1';
    } else {
      const exists = document.getElementById(hash);
      if (exists && exists.classList.contains('rules-section')) {
        targetSectionId = hash;
      } else {
        // Check if it matches a dynamically generated rule item ID (e.g. rp-Основи or mc-2.4)
        const el = document.getElementById(hash);
        if (el && el.closest('.rules-section')) {
          targetSectionId = el.closest('.rules-section').id;
          targetElementId = hash;
        }
      }
    }

    if (targetSectionId) {
      const desktopItem = document.querySelector(`.rules-menu-item[data-section="${targetSectionId}"]`);
      if (desktopItem) {
        const categoryText = desktopItem.textContent.trim();
        const iconSvg = desktopItem.querySelector('svg');
        const iconHtml = iconSvg ? iconSvg.outerHTML : '';
        switchRulesSection(targetSectionId, categoryText, iconHtml);
        
        // Scroll to target element or content card
        const scrollTarget = targetElementId ? document.getElementById(targetElementId) : rulesContentCard;
        if (scrollTarget) {
          // Use setTimeout to ensure section is fully displayed before measuring scroll offset
          setTimeout(() => {
            const offset = 120; // top offset for header
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = scrollTarget.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            // Add highlight-pulse animation to the target rule item
            if (targetElementId) {
              const ruleItem = document.getElementById(targetElementId);
              if (ruleItem) {
                ruleItem.classList.remove('highlight-pulse');
                void ruleItem.offsetWidth; // trigger reflow
                ruleItem.classList.add('highlight-pulse');
              }
            }
          }, 60);
        }
      }
    }
  }

  // Handle hash on initial load
  handleUrlHash();
  // Handle hash when it changes dynamically
  window.addEventListener('hashchange', handleUrlHash);

});

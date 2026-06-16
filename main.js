// =====================================================
//  Cloud Create — Main JavaScript
//  Config: edit SERVER_IP and DISCORD_URL below
// =====================================================

const CONFIG = {
  SERVER_IP:   'play.cloudcreate.net',
  IS_IP_PLACEHOLDER: true,
  DISCORD_URL: 'https://discord.gg/N54MhNbZEM',
  TIKTOK_URL:  'https://www.tiktok.com/@cloudcreatemc',
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
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // --------------------------------------------------
  // 1.2. Secret Dark Theme Toggle on Logo Click
  // --------------------------------------------------
  const logoLink = document.querySelector('.logo a');
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      
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

});

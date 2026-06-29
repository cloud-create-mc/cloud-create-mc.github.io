// =====================================================
//  Cloud Create — RP Parliament script
// =====================================================

// 1. DATA DEFINITIONS

const PARTIES = {
  israel: {
    id: 'israel',
    name: '«Єдиний Ізраїль»',
    color: '#0ea5e9',
    logo: 'yediniy_israel.svg',
    leader: 'T1dy_',
    seats: 0,
    desc: 'Ми - партія миру і порядку, поєднавши дві безперечно великі пустельні держави - ВЛНР і Республіка Сходу. Ми зробили партію, яка відстоюватиме права всіх євреїв сервера, партію яка служитиме виключно на благо сервера та його народу, партію яка покаже що таке справжній прогрес!'
  }
};

const STATES = {
  fkn: { name: 'Федерація Китайських Народів (ФКН)', flag: 'fkn.svg' },
  frm: { name: 'Федеративна Республіка Меркантія (ФРМ)', flag: 'frm.svg' },
  verchovensk: { name: 'Верховенськ', flag: 'verchovensk.svg' },
  rnr: { name: 'Ронкова Народна Республіка (РНР)', flag: null },
  vlnr: { name: 'ВЛНР', flag: 'vlnr.jpg' },
  r_shodu: { name: 'Республіка Сходу', flag: 'r_shodu.jpg' },
  sunshine: { name: 'Саншайн', flag: 'sunshine.svg' },
  kar: { name: 'Камчатська Автономна Республіка (КАР)', flag: 'kar_new.jpg' },
  maxico: { name: 'Махісо', flag: 'maxico.jpg' },
  tech_empire: { name: 'Технократична Імперія', flag: 'tech_empire.jpg' }
};

const DEPUTIES = [];

const LAWS = [];

const PROTOCOLS = [];

// 2. DOM MANIPULATION & INTERACTIVITY

document.addEventListener('DOMContentLoaded', () => {
  initSeatingChart();
  initPartiesList();
  initLawsList();
  initProtocolsAccordion();
});

// Render the 16 seats dynamically and setup events
function initSeatingChart() {
  const leftRowContainer = document.querySelector('.seating-row.left-row');
  const rightRowContainer = document.querySelector('.seating-row.right-row');
  const speakerSeatBtn = document.getElementById('seat-speaker');

  if (!leftRowContainer || !rightRowContainer) return;

  // Clear placeholders
  leftRowContainer.innerHTML = '';
  rightRowContainer.innerHTML = '';

  // Setup Speaker Desk Button
  const speakerData = DEPUTIES.find(d => d.seatId === 'speaker');
  if (speakerSeatBtn) {
    if (speakerData) {
      setupSeatElement(speakerSeatBtn, speakerData);
    } else {
      speakerSeatBtn.className = 'parliament-seat speaker-seat vacant-seat';
      speakerSeatBtn.innerHTML = `
        <div class="vacant-cross" style="font-size: 1.25rem; font-weight: 300; opacity: 0.25; color: var(--text-muted);">+</div>
        <span class="seat-tooltip">Вільне місце Спікера</span>
      `;
      speakerSeatBtn.addEventListener('click', () => {
        showVacantProfile('speaker');
      });
    }
  }

  // Generate 8 seats for Left Row and 8 seats for Right Row
  // Left Row seats: left-1 to left-8
  for (let i = 1; i <= 8; i++) {
    const seatId = `left-${i}`;
    const deputy = DEPUTIES.find(d => d.seatId === seatId);
    const seatBtn = createSeatDOM(seatId, deputy);
    leftRowContainer.appendChild(seatBtn);
  }

  // Right Row seats: right-1 to right-8
  for (let i = 1; i <= 8; i++) {
    const seatId = `right-${i}`;
    const deputy = DEPUTIES.find(d => d.seatId === seatId);
    const seatBtn = createSeatDOM(seatId, deputy);
    rightRowContainer.appendChild(seatBtn);
  }
}

// Create a seat button element
function createSeatDOM(seatId, deputy) {
  const btn = document.createElement('button');
  btn.className = 'parliament-seat';
  btn.id = `seat-${seatId}`;
  btn.setAttribute('data-seat-id', seatId);

  // If seat is occupied, setup info and party color variables
  if (deputy) {
    setupSeatElement(btn, deputy);
  } else {
    // Vacant seat styling
    btn.className += ' vacant-seat';
    btn.setAttribute('aria-label', `Вільне місце (Ряд ${seatId.split('-')[0] === 'left' ? 'Лівий' : 'Правий'}, №${seatId.split('-')[1]})`);
    btn.innerHTML = `
      <div class="vacant-cross" style="font-size: 1.25rem; font-weight: 300; opacity: 0.25; color: var(--text-muted);">+</div>
      <span class="seat-tooltip">Вільний мандат</span>
    `;
    btn.addEventListener('click', () => {
      showVacantProfile(seatId);
    });
  }

  return btn;
}

// Common setup for occupied seat buttons
function setupSeatElement(btn, deputy) {
  btn.style.setProperty('--party-color', deputy.party.color);
  btn.setAttribute('aria-label', `Депутат ${deputy.nickname} (${deputy.party.name})`);
  
  // Custom class for party styling if needed
  btn.classList.add(`party-${deputy.party.id}`);
  
  // Minecraft avatar heads are loaded direct from mc-heads.net API using nickname
  // Fallback styling is a text initials indicator
  const avatarUrl = `https://mc-heads.net/avatar/${deputy.nickname}/64`;
  
  btn.innerHTML = `
    <div class="seat-avatar-container" style="width: 100%; height: 100%; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative;">
      <img class="seat-skin-head" src="${avatarUrl}" alt="${deputy.nickname}" style="width: 72%; height: 72%; object-fit: contain; image-rendering: pixelated; transition: transform 0.2s ease;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="seat-fallback-initials" style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; color: #fff; background: linear-gradient(135deg, ${deputy.party.color}, rgba(0,0,0,0.4)); text-transform: uppercase;">
        ${deputy.nickname.substring(0, 2)}
      </div>
    </div>
    <span class="seat-tooltip">${deputy.nickname} <span style="font-size: 0.7rem; opacity: 0.7; display: block;">${deputy.party.name}</span></span>
  `;

  // Selection click handler
  btn.addEventListener('click', () => {
    selectSeat(btn, deputy);
  });
}

// Handle deputy seat selection and fill profile card
function selectSeat(seatBtn, deputy) {
  // Toggle active class on seats
  document.querySelectorAll('.parliament-seat').forEach(s => s.classList.remove('active'));
  seatBtn.classList.add('active');

  const emptyPanel = document.getElementById('deputy-profile-empty');
  const contentPanel = document.getElementById('deputy-profile-content');

  if (emptyPanel) emptyPanel.style.display = 'none';
  if (contentPanel) contentPanel.style.display = 'flex';

  // Fill details dynamically
  document.getElementById('deputy-name').textContent = deputy.nickname;
  document.getElementById('deputy-role').textContent = deputy.role;
  document.getElementById('deputy-state-name').textContent = deputy.state.name;
  document.getElementById('deputy-party-name').textContent = deputy.party.name;

  // Avatar skin head in details card
  const avatarImg = document.getElementById('deputy-avatar');
  if (avatarImg) {
    avatarImg.src = `https://mc-heads.net/avatar/${deputy.nickname}/128`;
    avatarImg.alt = deputy.nickname;
  }

  // Status Badge
  const statusBadge = document.getElementById('deputy-status-badge');
  if (statusBadge) {
    if (deputy.status === 'Present') {
      statusBadge.textContent = 'Присутній';
      statusBadge.className = 'badge badge-green';
      statusBadge.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
      statusBadge.style.borderColor = 'rgba(34, 197, 94, 0.3)';
      statusBadge.style.color = '#22c55e';
    } else if (deputy.status === 'Absent') {
      statusBadge.textContent = 'Відсутній';
      statusBadge.className = 'badge badge-red';
      statusBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      statusBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      statusBadge.style.color = '#ef4444';
    } else {
      statusBadge.textContent = 'У відпустці';
      statusBadge.className = 'badge badge-gold';
      statusBadge.style.backgroundColor = 'rgba(234, 179, 8, 0.1)';
      statusBadge.style.borderColor = 'rgba(234, 179, 8, 0.3)';
      statusBadge.style.color = '#eab308';
    }
  }

  // State Flag
  const flagWrapper = document.getElementById('deputy-state-flag-wrapper');
  if (flagWrapper) {
    flagWrapper.innerHTML = '';
    if (deputy.state.flag) {
      flagWrapper.style.background = `url('${deputy.state.flag}') center/cover no-repeat`;
    } else {
      flagWrapper.style.background = `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.15))`;
      flagWrapper.innerHTML = `<span style="font-size: 0.6rem; font-weight:800; color:var(--text-muted);">N/A</span>`;
    }
  }

  // Party dot color
  const partyDot = document.getElementById('deputy-party-color-dot');
  if (partyDot) {
    partyDot.style.backgroundColor = deputy.party.color;
    partyDot.style.boxShadow = `0 0 8px ${deputy.party.color}`;
  }

  // Smooth scroll to profile on mobile devices (width <= 768px)
  if (window.innerWidth <= 768) {
    const profilePanel = document.getElementById('deputy-profile-panel');
    if (profilePanel) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = profilePanel.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}

// Show vacant seat info in dossier card
function showVacantProfile(seatId) {
  document.querySelectorAll('.parliament-seat').forEach(s => s.classList.remove('active'));
  const seatBtn = document.getElementById(`seat-${seatId}`);
  if (seatBtn) seatBtn.classList.add('active');

  const emptyPanel = document.getElementById('deputy-profile-empty');
  const contentPanel = document.getElementById('deputy-profile-content');

  if (emptyPanel) emptyPanel.style.display = 'none';
  if (contentPanel) contentPanel.style.display = 'flex';

  if (seatId === 'speaker') {
    document.getElementById('deputy-name').textContent = 'Посада Спікера вакантна';
    document.getElementById('deputy-role').textContent = 'Голова Парламенту';
    document.getElementById('deputy-state-name').textContent = '—';
    document.getElementById('deputy-party-name').textContent = '—';
  } else {
    document.getElementById('deputy-name').textContent = 'Вільний мандат';
    document.getElementById('deputy-role').textContent = 'Вільне місце';
    document.getElementById('deputy-state-name').textContent = '—';
    document.getElementById('deputy-party-name').textContent = '—';
  }

  const avatarImg = document.getElementById('deputy-avatar');
  if (avatarImg) {
    avatarImg.src = 'logo_s.png'; 
    avatarImg.alt = 'Vacant';
  }

  const statusBadge = document.getElementById('deputy-status-badge');
  if (statusBadge) {
    statusBadge.textContent = 'Вакантне';
    statusBadge.className = 'badge';
    statusBadge.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    statusBadge.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    statusBadge.style.color = 'var(--text-muted)';
  }

  const flagWrapper = document.getElementById('deputy-state-flag-wrapper');
  if (flagWrapper) {
    flagWrapper.innerHTML = `<span style="font-size: 0.65rem; font-weight:800; color:var(--text-muted); opacity: 0.5;">?</span>`;
    flagWrapper.style.background = `rgba(0,0,0,0.15)`;
  }

  const partyDot = document.getElementById('deputy-party-color-dot');
  if (partyDot) {
    partyDot.style.backgroundColor = 'rgba(255,255,255,0.1)';
    partyDot.style.boxShadow = 'none';
  }
}

// Render parties grid and setup highlight events
function initPartiesList() {
  const container = document.querySelector('.parties-list-grid');
  if (!container) return;

  container.innerHTML = '';

  const partiesArray = Object.values(PARTIES);
  if (partiesArray.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.95rem;">
        Партії ще не зареєстровані. Подати заявку на реєстрацію партії можна через Discord.
      </div>
    `;
    return;
  }

  partiesArray.forEach(party => {
    const card = document.createElement('div');
    card.className = 'party-card card';
    card.style.borderColor = `rgba(${hexToRgb(party.color)}, 0.18)`;
    card.style.background = `linear-gradient(135deg, rgba(${hexToRgb(party.color)}, 0.04) 0%, rgba(255,255,255,0.01) 100%), var(--bg-card)`;

    const logoHtml = party.logo
      ? `<div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.06); border: 1px solid var(--border-item); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
           <img src="${party.logo}" alt="" style="width: 100%; height: 100%; object-fit: cover;">
         </div>`
      : '';

    card.innerHTML = `
      <div class="party-card-header" style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 0.75rem; gap: 0.5rem; width: 100%;">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          ${logoHtml}
          <span class="party-badge badge" style="background: rgba(${hexToRgb(party.color)}, 0.1); border: 1px solid rgba(${hexToRgb(party.color)}, 0.3); color: ${party.color}; font-size: 0.7rem; font-weight:800;">
            ${party.name}
          </span>
        </div>
        <span style="font-size:0.75rem; font-weight: 700; color: var(--text-muted); background: rgba(255,255,255,0.03); border: 1px solid var(--border-item); border-radius: var(--radius-sm); padding: 0.15rem 0.5rem; flex-shrink: 0;">
          ${party.seats} місць
        </span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-body); line-height: 1.5; margin: 0 0 1rem; flex: 1;">${party.desc}</p>
      <div style="font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border-item); padding-top: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
        <span>Голова фракції:</span>
        <strong style="color: var(--text-main);">${party.leader}</strong>
      </div>
    `;

    // Interactive hovering to highlight seats
    card.addEventListener('mouseenter', () => {
      document.querySelectorAll(`.parliament-seat.party-${party.id}`).forEach(seat => {
        seat.classList.add('highlighted-party');
      });
      // Dim other seats
      document.querySelectorAll(`.parliament-seat:not(.party-${party.id})`).forEach(seat => {
        seat.classList.add('dimmed-party');
      });
    });

    card.addEventListener('mouseleave', () => {
      document.querySelectorAll('.parliament-seat').forEach(seat => {
        seat.classList.remove('highlighted-party', 'dimmed-party');
      });
    });

    container.appendChild(card);
  });
}

// Render laws list
function initLawsList() {
  const container = document.querySelector('.passed-laws-list');
  if (!container) return;

  container.innerHTML = '';

  if (LAWS.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
        Закони ще не прийняті.
      </div>
    `;
    return;
  }

  LAWS.forEach(law => {
    const item = document.createElement('div');
    item.className = 'law-item-card';
    item.style.padding = '1.25rem';
    item.style.background = 'rgba(255, 255, 255, 0.01)';
    item.style.border = '1px solid var(--border-item)';
    item.style.borderRadius = 'var(--radius-md)';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '0.5rem';
    item.style.cursor = 'pointer';
    item.style.transition = 'all 0.25s var(--ease-out-expo)';

    item.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap: 0.5rem;">
        <div style="display:flex; align-items:center; gap: 0.5rem;">
          <span style="font-family: 'Minecraft', monospace; font-size: 0.75rem; padding: 0.15rem 0.5rem; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.25); color: #fbbf24; border-radius: 4px;">
            ${law.num}
          </span>
          <h4 style="margin: 0; font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${law.title}</h4>
        </div>
        <span style="font-size: 0.72rem; color: var(--text-muted);">${law.date}</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-body); line-height: 1.5; margin: 0.25rem 0 0.5rem;">${law.desc}</p>
      <div style="font-size: 0.72rem; color: var(--text-muted); display:flex; align-items:center; gap: 0.35rem;">
        <span>Ініціатор:</span>
        <strong style="color: var(--text-main);">${law.sponsor}</strong>
      </div>
    `;

    // Click effect to copy link to rule
    item.addEventListener('click', async () => {
      const toast = document.getElementById('parliament-toast');
      const url = `${window.location.origin}/parliament#${law.id}`;
      
      try {
        await navigator.clipboard.writeText(url);
        showToast(toast);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(toast);
      }

      // Add a quick visual pulse
      item.classList.add('law-pulse');
      setTimeout(() => item.classList.remove('law-pulse'), 500);
    });

    item.id = law.id;
    container.appendChild(item);
  });
}

// Render protocols as an Accordion
function initProtocolsAccordion() {
  const container = document.querySelector('.accordion-list-wrapper');
  if (!container) return;

  container.innerHTML = '';

  if (PROTOCOLS.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
        Протоколи засідань відсутні.
      </div>
    `;
    return;
  }

  PROTOCOLS.forEach(proto => {
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';
    accordionItem.style.background = 'rgba(255,255,255,0.01)';
    accordionItem.style.border = '1px solid var(--border-item)';
    accordionItem.style.borderRadius = 'var(--radius-md)';
    accordionItem.style.overflow = 'hidden';
    accordionItem.style.transition = 'all 0.25s var(--ease-out-expo)';

    accordionItem.innerHTML = `
      <button class="accordion-trigger" aria-expanded="false" style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 1.15rem; background: none; border: none; cursor: pointer; text-align: left; color: inherit;">
        <span style="display:flex; flex-direction:column; gap:0.2rem;">
          <strong style="font-family: var(--font-display); font-size: 0.98rem; font-weight: 700; color: var(--text-main);">${proto.title}</strong>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${proto.date}</span>
        </span>
        <svg class="icon accordion-chevron" viewBox="0 0 24 24" style="width:16px; height:16px; transition: transform 0.3s var(--ease-out-expo);"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="accordion-content" hidden style="padding: 0 1.15rem 1.15rem; font-size: 0.88rem; line-height: 1.6; color: var(--text-body); border-top: 1px dashed var(--border-item); padding-top: 1rem; background: rgba(0,0,0,0.05);">
        ${proto.content}
      </div>
    `;

    const trigger = accordionItem.querySelector('.accordion-trigger');
    const content = accordionItem.querySelector('.accordion-content');

    trigger.addEventListener('click', () => {
      const isOpen = accordionItem.classList.contains('open');

      // Close all open ones first
      document.querySelectorAll('.protocols-section .accordion-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.accordion-content').hidden = true;
        openItem.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked
      if (!isOpen) {
        accordionItem.classList.add('open');
        content.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    container.appendChild(accordionItem);
  });
}

// Helper to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : '255, 255, 255';
}

// Show copying toasts
let toastTimer;
function showToast(toastEl) {
  if (!toastEl) return;
  clearTimeout(toastTimer);
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

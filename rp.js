// =====================================================
//  Cloud Create — RP Diplomatic Relations Map script
// =====================================================

// CONFIG: Paste your published Google Sheets CSV URL here.
// To get this URL: In Google Sheets -> File -> Share -> Publish to web -> Select "Entire Document" or "Sheet1" -> Select "CSV" -> Click Publish.
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1lI2u0Kl4NsXo60jLD4PE1XILlwgcL0rKOJTmVDod9eM/export?format=csv'; 

// Fallback Mock Data (Everyone is 0/Neutral by default as requested, but can be updated via Sheet)
const DEFAULT_MOCK_STATES = [
  { name: 'Федерація Китайських Народів (ФКН)', leader: 'Yurk0', color: '#ef4444', flag: 'fkn.svg' },
  { name: 'Федеративна Республіка Меркантія (ФРМ)', leader: 'vert0s', color: '#eab308', flag: 'frm.svg' },
  { name: 'Верховенськ', leader: 'InvisibleFear', color: '#38bdf8', flag: 'verchovensk.svg' },
  { name: 'Ронкова Народна Республіка (РНР)', leader: 'ronki', color: '#10b981', flag: null },
  { name: 'Республіка Голта', leader: 'ElShardoo', color: '#a855f7', flag: 'golta.svg' },
  { name: 'Республіка Сходу', leader: 'vskiy', color: '#f97316', flag: 'r_shodu.jpg' },
  { name: 'Саншайн', leader: 'Cloudysunny35', color: '#facc15', flag: 'sunshine.svg' }
];

// All relations are 0 (Neutral) initially as requested
const DEFAULT_MOCK_RELATIONS = [];

// App State
let states = [];
let relations = [];
let selectedNode = null;
let hoveredNode = null;
let draggedNode = null;

// Canvas & Physics Variables
let canvas, ctx;
let nodes = [];
const flagImageCache = {};
const flagColorCache = {};

function getFlagImage(flagPath) {
  if (!flagPath) return null;
  if (flagImageCache[flagPath]) {
    return flagImageCache[flagPath];
  }
  const img = new Image();
  img.src = flagPath;
  // When the image loads, compute its dominant color and cache it
  img.onload = () => {
    // Create a temporary canvas to sample the image pixels
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    try {
      tempCtx.drawImage(img, 0, 0);
      const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < imgData.length; i += 4) {
        r += imgData[i];
        g += imgData[i + 1];
        b += imgData[i + 2];
        count++;
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      // Store as an rgb string for later use
      flagColorCache[flagPath] = `rgb(${r},${g},${b})`;
    } catch (e) {
      // In case of CORS or other errors, fall back to original state color
      console.warn('Could not compute dominant color for', flagPath, e);
    }
  };
  flagImageCache[flagPath] = img;
  return img;
}

const nodeRadius = 26;
const targetLinkDist = 180;
const repulsionDist = 120;

// Helper to generate dynamic deterministic colors for states if not provided
function getColorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 55%)`;
}

// Extract acronym/abbreviation dynamically (e.g. "ФКН" from "Федерація Китайських Народів (ФКН)")
function getAbbreviation(name) {
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].toUpperCase();
  }
  
  const words = name.split(/[\s-]+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
}

// Translate numeric level into descriptive badge details
function getRelationDetails(level) {
  switch (level) {
    case 3:
      return { class: 'badge-rel-p3', text: 'Альянс +3', desc: 'Військово-політичний альянс.', color: '#22c55e' };
    case 2:
      return { class: 'badge-rel-p2', text: 'Партнерство +2', desc: 'Дружні відносини.', color: '#10b981' };
    case 1:
      return { class: 'badge-rel-p1', text: 'Сприятливі +1', desc: 'Сприятливі відносини.', color: '#06b6d4' };
    case -1:
      return { class: 'badge-rel-n1', text: 'Напружені -1', desc: 'Напружені відносини.', color: '#facc15' };
    case -2:
      return { class: 'badge-rel-n2', text: 'Конфліктні -2', desc: 'Конфліктні відносини.', color: '#fb923c' };
    case -3:
      return { class: 'badge-rel-n3', text: 'Війна -3', desc: 'Війна.', color: '#ef4444' };
    default:
      return { class: 'badge-rel-0', text: 'Нейтралітет 0', desc: 'Базовий стан відносин.', color: 'rgba(255,255,255,0.5)' };
  }
}

// Get relationship level between two states
function getRelationLevel(stateA, stateB) {
  const rel = relations.find(r => 
    (r.state1 === stateA && r.state2 === stateB) || 
    (r.state1 === stateB && r.state2 === stateA)
  );
  return rel ? rel.level : 0;
}

// Fetch and Parse Data
async function loadData() {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');

  if (!GOOGLE_SHEET_CSV_URL) {
    console.log('No Google Sheets URL configured. Using default mock data (neutral 0 levels).');
    states = [...DEFAULT_MOCK_STATES];
    relations = [...DEFAULT_MOCK_RELATIONS];
    positionNodes();
    updateSidebar();
    return;
  }

  try {
    if (statusDot) statusDot.className = 'status-dot';
    if (statusText) statusText.textContent = 'Завантаження...';

    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) throw new Error('Network error fetching CSV');
    
    const csvText = await response.text();
    parseCSV(csvText);

    if (statusDot) statusDot.className = 'status-dot online';
    if (statusText) statusText.textContent = 'Google Таблиця синхронізована';
  } catch (error) {
    console.error('Failed to load Google Sheets data:', error);
    if (statusDot) statusDot.className = 'status-dot';
    if (statusText) statusText.textContent = 'Помилка оновлення (локальні дані)';
    
    states = [...DEFAULT_MOCK_STATES];
    relations = [...DEFAULT_MOCK_RELATIONS];
  }
  
  positionNodes();
  updateSidebar();
}

// CSV Parser supporting:
// Relations: State1, State2, Level
// Meta info: #STATE, StateName, LeaderName, ColorHex
function parseCSV(text) {
  const lines = text.split('\n');
  const parsedRelations = [];
  const parsedStates = [];
  const statesSet = new Set();

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const cols = trimmed.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 3) return;

    if (cols[0] === '#STATE' || cols[0] === '#') {
      // Parse state metadata
      const name = cols[1];
      const defaultState = DEFAULT_MOCK_STATES.find(s => s.name === name);
      const leader = cols[2] || (defaultState ? defaultState.leader : 'Невідомо');
      const color = cols[3] || (defaultState ? defaultState.color : getColorForName(name));
      const flag = defaultState ? defaultState.flag : null;
      if (name) {
        parsedStates.push({ name, leader, color, flag });
        statesSet.add(name);
      }
    } else {
      // Parse relationship pair
      const state1 = cols[0];
      const state2 = cols[1];
      const level = parseInt(cols[2], 10);
      if (state1 && state2 && !isNaN(level)) {
        parsedRelations.push({ state1, state2, level: Math.max(-3, Math.min(3, level)) });
        statesSet.add(state1);
        statesSet.add(state2);
      }
    }
  });

  // If metadata was not specified for some states, auto-fill it (using fallback defaults if available)
  statesSet.forEach(name => {
    const exists = parsedStates.find(s => s.name === name);
    if (!exists) {
      const defaultState = DEFAULT_MOCK_STATES.find(s => s.name === name);
      parsedStates.push({
        name: name,
        leader: defaultState ? defaultState.leader : 'Невідомо',
        color: defaultState ? defaultState.color : getColorForName(name),
        flag: defaultState ? defaultState.flag : null
      });
    } else if (exists && !exists.flag) {
      const defaultState = DEFAULT_MOCK_STATES.find(s => s.name === name);
      if (defaultState) {
        exists.flag = defaultState.flag;
      }
    }
  });

  states = parsedStates.length > 0 ? parsedStates : [...DEFAULT_MOCK_STATES];
  relations = parsedRelations;
}

// Position nodes randomly and initialize drift variables, preserving them across resizes
function positionNodes() {
  if (!canvas) return;
  
  const width = canvas.width / window.devicePixelRatio;
  const height = canvas.height / window.devicePixelRatio;
  
  const oldNodesMap = new Map();
  nodes.forEach(n => {
    oldNodesMap.set(n.name, n);
  });
  
  const newNodes = [];
  
  states.forEach((state, idx) => {
    const oldNode = oldNodesMap.get(state.name);
    
    let normX, normY;
    let angleX, angleY, speedX, speedY, ampX, ampY;
    let hoverProgress = 0;
    let selectProgress = 0;
    
    if (oldNode) {
      normX = oldNode.normX;
      normY = oldNode.normY;
      angleX = oldNode.angleX;
      angleY = oldNode.angleY;
      speedX = oldNode.speedX;
      speedY = oldNode.speedY;
      ampX = oldNode.ampX;
      ampY = oldNode.ampY;
      hoverProgress = oldNode.hoverProgress || 0;
      selectProgress = oldNode.selectProgress || 0;
    } else {
      // Generate random normalized positions that are spread out (no overlapping)
      let found = false;
      let minDistance = 0.23;
      let attempts = 0;
      while (!found) {
        // Keep them away from margins (between 0.15 and 0.85)
        normX = 0.15 + Math.random() * 0.7;
        normY = 0.15 + Math.random() * 0.7;
        
        let tooClose = false;
        for (let i = 0; i < newNodes.length; i++) {
          const other = newNodes[i];
          const dx = normX - other.normX;
          const dy = normY - other.normY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < minDistance) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) {
          found = true;
        }
        
        attempts++;
        if (attempts > 40) {
          minDistance -= 0.02; // reduce constraint slightly to prevent hang
          attempts = 0;
        }
      }
      
      // Initialize drifting parameters (very gentle floating)
      angleX = Math.random() * Math.PI * 2;
      angleY = Math.random() * Math.PI * 2;
      speedX = 0.005 + Math.random() * 0.008;
      speedY = 0.005 + Math.random() * 0.008;
      ampX = 10 + Math.random() * 12; // 10-22px drift amplitude
      ampY = 10 + Math.random() * 12;
    }
    
    newNodes.push({
      name: state.name,
      leader: state.leader,
      color: state.color,
      flag: state.flag,
      normX,
      normY,
      baseX: normX * width,
      baseY: normY * height,
      x: normX * width,
      y: normY * height,
      angleX,
      angleY,
      speedX,
      speedY,
      ampX,
      ampY,
      hoverProgress,
      selectProgress
    });
  });
  
  nodes = newNodes;
}

// Update Sidebar info
function updateSidebar() {
  const sidebar = document.getElementById('diplomatic-sidebar');
  const emptyPanel = document.getElementById('diplomatic-profile-empty');
  const contentPanel = document.getElementById('diplomatic-profile-content');
  const backdrop = document.getElementById('sidebar-backdrop');
  
  if (!selectedNode) {
    if (sidebar) {
      sidebar.classList.remove('active');
    }
    if (backdrop) {
      backdrop.classList.remove('active');
    }
    return;
  }
  
  if (sidebar) {
    sidebar.classList.add('active');
  }
  if (backdrop) {
    backdrop.classList.add('active');
  }
  if (emptyPanel) emptyPanel.style.display = 'none';
  if (contentPanel) contentPanel.style.display = 'flex';
  
  // Fill State Profile
  document.getElementById('profile-name').textContent = selectedNode.name;
  document.getElementById('profile-leader').textContent = selectedNode.leader;
  
  const avatar = document.getElementById('profile-avatar-char');
  if (avatar) {
    if (selectedNode.flag) {
      avatar.textContent = '';
      avatar.style.background = `url('${selectedNode.flag}') center/cover no-repeat`;
      avatar.style.boxShadow = `0 4px 12px ${selectedNode.color}40`;
    } else {
      avatar.textContent = selectedNode.name.charAt(0).toUpperCase();
      avatar.style.background = `linear-gradient(135deg, ${selectedNode.color}, rgba(0,0,0,0.4))`;
      avatar.style.boxShadow = `0 4px 12px ${selectedNode.color}40`;
    }
  }
  
  // Fill Relations list
  const listEl = document.getElementById('profile-relations-list');
  
  // Calculate stats for dashboard
  let alliesCount = 0;
  let neutralsCount = 0;
  let enemiesCount = 0;
  
  const otherStates = states.filter(s => s.name !== selectedNode.name);
  
  otherStates.forEach(other => {
    const lvl = getRelationLevel(selectedNode.name, other.name);
    if (lvl > 0) alliesCount++;
    else if (lvl < 0) enemiesCount++;
    else neutralsCount++;
  });
  
  const statAllies = document.getElementById('stat-allies');
  const statNeutrals = document.getElementById('stat-neutrals');
  const statEnemies = document.getElementById('stat-enemies');
  
  if (statAllies) statAllies.textContent = alliesCount;
  if (statNeutrals) statNeutrals.textContent = neutralsCount;
  if (statEnemies) statEnemies.textContent = enemiesCount;
  
  if (listEl) {
    listEl.innerHTML = '';
    
    otherStates.forEach(other => {
      const level = getRelationLevel(selectedNode.name, other.name);
      const rel = getRelationDetails(level);
      
      const card = document.createElement('div');
      card.className = 'relation-mini-card';
      card.style.cursor = 'pointer';
      
      const otherFlag = other.flag;
      const avatarHtml = otherFlag 
        ? `<span style="width: 18px; height: 18px; border-radius:50%; background: url('${otherFlag}') center/cover no-repeat; border: 1px solid var(--border-item); display: inline-block; flex-shrink: 0;"></span>`
        : `<span style="width: 18px; height: 18px; border-radius:50%; background-color:${other.color}; border: 1px solid rgba(255,255,255,0.1); display: inline-block; box-shadow:0 0 6px ${other.color}60; flex-shrink: 0;"></span>`;
      
      card.innerHTML = `
        <div class="relation-mini-state-info" style="display:flex; align-items:center; gap: 0.6rem; min-width: 0; flex: 1;">
          ${avatarHtml}
          <span class="relation-mini-state" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${other.name}</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.25rem; flex-shrink: 0;">
          <span class="relation-mini-badge ${rel.class}">${rel.text}</span>
        </div>
      `;
      
      // Interactive Hover & Navigation
      card.addEventListener('mouseenter', () => {
        const matchingNode = nodes.find(n => n.name === other.name);
        if (matchingNode) {
          hoveredNode = matchingNode;
        }
      });
      
      card.addEventListener('mouseleave', () => {
        if (hoveredNode && hoveredNode.name === other.name) {
          hoveredNode = null;
        }
      });
      
      card.addEventListener('click', () => {
        const matchingNode = nodes.find(n => n.name === other.name);
        if (matchingNode) {
          selectedNode = matchingNode;
          updateSidebar();
        }
      });
      
      listEl.appendChild(card);
    });
  }
}

// Canvas Rendering & Simulation Loop
function tick() {
  if (!canvas || !ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Dynamic theme colors
  const isDark = document.documentElement.classList.contains('dark-theme');
  const neutralLineColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.07)';
  const innerBorderColor = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.75)';
  
  // 1. Update positions for gentle drift/float and smooth hover/select progress
  let anyFocus = 0;
  nodes.forEach(node => {
    node.angleX += node.speedX;
    node.angleY += node.speedY;
    node.x = node.baseX + Math.sin(node.angleX) * node.ampX;
    node.y = node.baseY + Math.cos(node.angleY) * node.ampY;
    
    // Update progress variables smoothly (lerp)
    const isHovered = hoveredNode === node;
    const isSelected = selectedNode === node;
    
    if (node.hoverProgress === undefined) node.hoverProgress = 0;
    if (node.selectProgress === undefined) node.selectProgress = 0;
    
    node.hoverProgress += ((isHovered ? 1 : 0) - node.hoverProgress) * 0.15;
    node.selectProgress += ((isSelected ? 1 : 0) - node.selectProgress) * 0.15;
    
    const f = Math.max(node.hoverProgress, node.selectProgress);
    if (f > anyFocus) anyFocus = f;
  });

  // 2. Draw Clear
  ctx.clearRect(0, 0, width, height);
  
  // 3. Draw relations lines (links)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];
      const level = getRelationLevel(n1.name, n2.name);
      
      const lineFocus = Math.max(
        n1.hoverProgress, n1.selectProgress,
        n2.hoverProgress, n2.selectProgress
      );
      
      let opacity = 0.35;
      if (level === 0) {
        if (lineFocus <= 0.01) continue; // Don't draw neutral lines unless highlighted
        opacity = 0.08 * lineFocus;
      } else {
        const normalOpacity = 0.35;
        const fadedOpacity = 0.06;
        const unfocusedOpacity = normalOpacity - (normalOpacity - fadedOpacity) * anyFocus;
        const highlightedOpacity = 0.6;
        
        opacity = unfocusedOpacity + (highlightedOpacity - unfocusedOpacity) * lineFocus;
      }
      
      const rel = getRelationDetails(level);
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      
      // Style link line
      ctx.lineWidth = level !== 0 ? (1.5 + lineFocus * 2) : 1;
      ctx.strokeStyle = level === 0 ? neutralLineColor : rel.color;
      ctx.globalAlpha = opacity;
      
      if (level === 0) {
        ctx.setLineDash([4, 4]); // dashed lines for neutrals
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      ctx.setLineDash([]);
    }
  }
  
  // 4. Draw nodes
  nodes.forEach(node => {
    const size = nodeRadius + (node.hoverProgress * 3);
    const hoverOrSelect = Math.max(node.hoverProgress, node.selectProgress);
    
    // Draw expanding pulsating outer orbit ring
    if (hoverOrSelect > 0.01) {
      ctx.beginPath();
      const maxPulseSize = size + 8 + Math.sin(Date.now() * 0.005) * 3;
      const pulseSize = nodeRadius + (maxPulseSize - nodeRadius) * hoverOrSelect;
      ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4 * hoverOrSelect;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Check if flag image is loaded
    const flagImg = node.flag ? getFlagImage(node.flag) : null;
    const isImgLoaded = flagImg && flagImg.complete && flagImg.naturalWidth !== 0;
    
    // Determine fill color: dominant flag color if available, else default
    const fillColor = isImgLoaded && flagColorCache[node.flag] ? flagColorCache[node.flag] : node.color;
    
    // Draw outer glow shadow
    ctx.shadowColor = fillColor;
    ctx.shadowBlur = 4 + (node.hoverProgress * 8) + (node.selectProgress * 14);
    
    // Draw base circle to cast the shadow and provide background
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
    ctx.fillStyle = isImgLoaded ? '#1e293b' : fillColor;
    ctx.fill();
    
    // Reset shadow immediately
    ctx.shadowBlur = 0;
    
    // Draw flag image (clipped to circle)
    if (isImgLoaded) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(flagImg, node.x - size, node.y - size, size * 2, size * 2);
      ctx.restore();
    }
    
    // Smooth translucent selection overlay
    if (node.selectProgress > 0.01) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = node.selectProgress * 0.35;
      ctx.fill();
      ctx.globalAlpha = 1.0; // reset
    }
    
    // Inner center border (blend from innerBorderColor to node.color on selection)
    ctx.lineWidth = 2 + (node.selectProgress * 2);
    ctx.strokeStyle = innerBorderColor;
    ctx.stroke();
    
    if (node.selectProgress > 0.01) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.strokeStyle = node.color;
      ctx.globalAlpha = node.selectProgress;
      ctx.stroke();
      ctx.globalAlpha = 1.0; // reset
    }
    
    // Fallback: Text drawing inside node if flag is not loaded
    if (!isImgLoaded) {
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const abbr = getAbbreviation(node.name);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(abbr, node.x, node.y);
      
      if (node.selectProgress > 0.01) {
        ctx.fillStyle = '#1e293b';
        ctx.globalAlpha = node.selectProgress;
        ctx.fillText(abbr, node.x, node.y);
        ctx.globalAlpha = 1.0; // reset
      }
    }
  });
  
  requestAnimationFrame(tick);
}

// Mouse events and interactivity
function setupInteractivity() {
  if (!canvas) return;
  
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }
  
  function getNodeAt(pos) {
    return nodes.find(node => {
      const dx = node.x - pos.x;
      const dy = node.y - pos.y;
      return Math.sqrt(dx*dx + dy*dy) < nodeRadius + 8;
    });
  }

  // Pointer Move (hover selection only)
  function handleMove(e) {
    const pos = getMousePos(e);
    const node = getNodeAt(pos);
    if (node !== hoveredNode) {
      hoveredNode = node;
      canvas.style.cursor = node ? 'pointer' : 'default';
    }
  }
  
  // Pointer Down (selection only, no dragging)
  function handleDown(e) {
    const pos = getMousePos(e);
    const node = getNodeAt(pos);
    
    if (node) {
      selectedNode = node;
      updateSidebar();
    } else {
      selectedNode = null;
      updateSidebar();
    }
  }

  // Event Listeners
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mousedown', handleDown);
  
  // Touch support for mobile
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleMove(e);
  }, { passive: false });
  canvas.addEventListener('touchstart', (e) => {
    handleDown(e);
  });

  // Resize handler
  function handleResize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    positionNodes();
  }
  
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => {
      handleResize();
    });
    observer.observe(canvas.parentElement);
  } else {
    window.addEventListener('resize', handleResize);
  }
  
  // Run initial resize to set dimensions
  handleResize();
}

// Teleport sidebar to/from <body> based on viewport
function syncSidebarTeleport() {
  const sidebar = document.getElementById('diplomatic-sidebar');
  const container = document.querySelector('.rp-diplomatic-container');
  if (!sidebar || !container) return;

  const isMobile = window.innerWidth <= 768;

  if (isMobile && sidebar.parentElement !== document.body) {
    // Save original parent so we can restore on desktop resize
    sidebar._dpOriginalParent = container;
    document.body.appendChild(sidebar);
  } else if (!isMobile && sidebar._dpOriginalParent && sidebar.parentElement === document.body) {
    sidebar._dpOriginalParent.appendChild(sidebar);
    sidebar._dpOriginalParent = null;
  }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('diplomatic-canvas');
  if (canvas) {
    ctx = canvas.getContext('2d');
    setupInteractivity();
    loadData();
    requestAnimationFrame(tick);
  }

  // Teleport sidebar on load and resize
  syncSidebarTeleport();
  window.addEventListener('resize', syncSidebarTeleport);

  // Close floating sidebar button event
  const closeBtn = document.getElementById('profile-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedNode = null;
      updateSidebar();
    });
  }

  // Close floating sidebar by clicking backdrop
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedNode = null;
      updateSidebar();
    });
  }
});

/* ════════════════════════════════════════
   HabitTracker — script.js
   ════════════════════════════════════════ */

const DAYS_S  = ['D','L','M','X','J','V','S'];
const DAYS_F  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS  = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

const CATS = {
  escolar:  { label:'Escolar',  color:'#4FC3F7' },
  personal: { label:'Personal', color:'#F06292' },
  salud:    { label:'Salud',    color:'#81C784' },
  finanzas: { label:'Finanzas', color:'#FFB74D' },
};

const PRIORITY_COLOR = { alta:'#ff3c3c', media:'#FFB74D', baja:'#81C784' };

/* ── State ── */
let weekOffset = 0;
let currentView = 'dashboard';
let currentCat  = 'escolar';
let selectedColor = '#4FC3F7';
let dragSrcId = null;

let habits = load('ht_habits') || [
  { id:101, name:'Estudiar / repasar apuntes',         emoji:'📖', cat:'escolar',  type:'habit', priority:'alta',  color:'#4FC3F7', days:'all',      notes:'' },
  { id:102, name:'Hacer tareas pendientes',             emoji:'✏️', cat:'escolar',  type:'habit', priority:'alta',  color:'#4FC3F7', days:'all',      notes:'' },
  { id:103, name:'Repasar antes de dormir',             emoji:'🌙', cat:'escolar',  type:'habit', priority:'media', color:'#4FC3F7', days:'all',      notes:'' },
  { id:104, name:'Planificar el día escolar',           emoji:'📅', cat:'escolar',  type:'habit', priority:'media', color:'#4FC3F7', days:'all',      notes:'' },

  { id:201, name:'Día productivo (sin procrastinar)',   emoji:'🎯', cat:'personal', type:'habit', priority:'alta',  color:'#F06292', days:'all',      notes:'' },
  { id:202, name:'Leer 20 minutos',                     emoji:'📚', cat:'personal', type:'habit', priority:'media', color:'#F06292', days:'all',      notes:'' },
  { id:203, name:'Despertarme a tiempo',                emoji:'⏰', cat:'personal', type:'habit', priority:'alta',  color:'#F06292', days:'all',      notes:'' },
  { id:204, name:'Desintoxicación de redes sociales',   emoji:'📵', cat:'personal', type:'habit', priority:'media', color:'#F06292', days:'all',      notes:'' },
  { id:205, name:'Trabajar en proyectos personales',    emoji:'🔧', cat:'personal', type:'habit', priority:'baja',  color:'#F06292', days:'all',      notes:'' },

  { id:301, name:'Lavarme los dientes (mañana y noche)',emoji:'🦷', cat:'salud',    type:'habit', priority:'alta',  color:'#81C784', days:'all',      notes:'2 veces al día' },
  { id:302, name:'Bañarme',                             emoji:'🚿', cat:'salud',    type:'habit', priority:'alta',  color:'#81C784', days:'all',      notes:'' },
  { id:303, name:'Skin care rutina',                    emoji:'🧴', cat:'salud',    type:'habit', priority:'media', color:'#81C784', days:'all',      notes:'' },
  { id:304, name:'Comer bien',                          emoji:'🥗', cat:'salud',    type:'habit', priority:'media', color:'#81C784', days:'all',      notes:'' },
  { id:305, name:'Tomar suficiente agua',               emoji:'💧', cat:'salud',    type:'habit', priority:'alta',  color:'#81C784', days:'all',      notes:'' },
  { id:306, name:'Vitamina D (mañana)',                 emoji:'☀️', cat:'salud',    type:'habit', priority:'alta',  color:'#81C784', days:'all',      notes:'Tomar en la mañana' },
  { id:307, name:'Omega 3 (antes de Vastianin)',        emoji:'🐟', cat:'salud',    type:'habit', priority:'alta',  color:'#81C784', days:'all',      notes:'Antes de la pastilla de isotretinoína' },
  { id:308, name:'Vastianin / isotretinoína (cena)',    emoji:'💊', cat:'salud',    type:'habit', priority:'alta',  color:'#81C784', days:'all',      notes:'Después de la cena, con comida' },
  { id:309, name:'Creatina',                            emoji:'🥄', cat:'salud',    type:'habit', priority:'media', color:'#81C784', days:'all',      notes:'Todos los días' },
  { id:310, name:'Proteína',                            emoji:'🥛', cat:'salud',    type:'habit', priority:'media', color:'#81C784', days:'weekdays', notes:'Solo días de entreno (L-V)' },
  { id:311, name:'Hacer ejercicio',                     emoji:'🏋️', cat:'salud',    type:'habit', priority:'alta',  color:'#81C784', days:'weekdays', notes:'' },
  { id:312, name:'Dormir 7-8 horas',                    emoji:'😴', cat:'salud',    type:'habit', priority:'alta',  color:'#81C784', days:'all',      notes:'' },

  { id:401, name:'Control de gastos del día',           emoji:'💸', cat:'finanzas', type:'habit', priority:'media', color:'#FFB74D', days:'all',      notes:'' },
  { id:402, name:'Ahorrar algo hoy',                    emoji:'🏦', cat:'finanzas', type:'habit', priority:'media', color:'#FFB74D', days:'all',      notes:'' },
];

let done = load('ht_done') || {};

let gymDays = load('ht_gym') || [
  { label:'Lunes',     muscles:'Pecho, Hombro, Tríceps',        rest:false },
  { label:'Martes',    muscles:'Espalda, Bíceps',               rest:false },
  { label:'Miércoles', muscles:'Pierna, Glúteo',                rest:false },
  { label:'Jueves',    muscles:'Pecho, Hombro, Tríceps',        rest:false },
  { label:'Viernes',   muscles:'Espalda, Bíceps, Abdomen',      rest:false },
  { label:'Sábado',    muscles:'',                              rest:true  },
  { label:'Domingo',   muscles:'',                              rest:true  },
];

let gymLog = load('ht_gymlog') || {};

/* ── Persistence ── */
function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function save() {
  localStorage.setItem('ht_habits', JSON.stringify(habits));
  localStorage.setItem('ht_done',   JSON.stringify(done));
  localStorage.setItem('ht_gym',    JSON.stringify(gymDays));
  localStorage.setItem('ht_gymlog', JSON.stringify(gymLog));
}

/* ── Date helpers ── */
function dateKey(d) { return d.toISOString().slice(0,10); }
function today()    { const d = new Date(); d.setHours(0,0,0,0); return d; }

function getWeekDates(offset) {
  const t   = today();
  const dow = t.getDay();
  const mon = new Date(t);
  mon.setDate(t.getDate() - dow + (dow===0 ? -6 : 1) + offset*7);
  return Array.from({length:7}, (_,i) => { const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
}

function streak(hid) {
  let s=0; const t=today();
  for (let i=0;i<365;i++) {
    const d=new Date(t); d.setDate(t.getDate()-i);
    if (done[hid+'_'+dateKey(d)]) s++; else break;
  }
  return s;
}

function isHabitActiveOnDate(h, d) {
  const dow = d.getDay();
  if (h.days === 'weekdays') return dow >= 1 && dow <= 5;
  if (h.days === 'weekend')  return dow === 0 || dow === 6;
  return true;
}

/* ════════════ NAVIGATION ════════════ */
function navigate(view, cat) {
  currentView = view;
  if (cat) currentCat = cat;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item, .nav-sub').forEach(el => el.classList.remove('active'));

  const viewEl = document.getElementById('view-' + (view==='cat'?'cat':view));
  if (viewEl) viewEl.classList.add('active');

  if (view === 'cat') {
    document.querySelectorAll('.nav-sub').forEach(el => {
      if (el.textContent.trim().toLowerCase() === currentCat) el.classList.add('active');
    });
    renderCatView();
  } else if (view === 'dashboard') {
    renderDashboard();
  } else if (view === 'gym') {
    renderGym();
  } else if (view === 'stats') {
    renderStats();
  }

  // auto-close sidebar on mobile
  if (window.innerWidth <= 680) closeSidebar();
}

/* ════════════ SIDEBAR TOGGLE ════════════ */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}
function toggleGroup(name) {
  document.getElementById('ng-' + name).classList.toggle('open');
}

/* ════════════ WEEK NAV ════════════ */
function changeWeek(d) { weekOffset += d; reRender(); }
function goToday2()    { weekOffset  = 0; reRender(); }
function reRender() {
  if (currentView === 'cat')       renderCatView();
  else if (currentView === 'dashboard') renderDashboard();
}

/* ════════════ TOGGLE DAY ════════════ */
function toggleDay(hid, dk) {
  const k = hid+'_'+dk; done[k] = !done[k]; save(); reRender();
}

function toggleTask(hid) {
  const k = hid+'_done'; done[k] = !done[k]; save(); reRender();
}

/* ════════════ REMOVE HABIT ════════════ */
function removeHabit(id) {
  if (!confirm('¿Eliminar este hábito?')) return;
  habits = habits.filter(h => h.id !== id); save(); reRender();
}

/* ════════════ ADD / EDIT MODAL ════════════ */
function openAddModal(prefillCat) {
  document.getElementById('h-edit-id').value = '';
  document.getElementById('modal-habit-title').textContent = 'Nuevo hábito';
  document.getElementById('h-name').value    = '';
  document.getElementById('h-emoji').value   = '';
  document.getElementById('h-notes').value   = '';
  document.getElementById('h-priority').value= 'media';
  document.getElementById('h-days').value    = 'all';
  document.getElementById('h-type').value    = 'habit';
  document.getElementById('h-cat').value     = prefillCat || currentCat || 'escolar';
  pickColorById('#4FC3F7');
  document.getElementById('modal-habit').classList.add('open');
}

function openEditModal(id) {
  const h = habits.find(x => x.id === id); if (!h) return;
  document.getElementById('h-edit-id').value  = id;
  document.getElementById('modal-habit-title').textContent = 'Editar hábito';
  document.getElementById('h-name').value     = h.name;
  document.getElementById('h-emoji').value    = h.emoji || '';
  document.getElementById('h-notes').value    = h.notes || '';
  document.getElementById('h-priority').value = h.priority || 'media';
  document.getElementById('h-days').value     = h.days || 'all';
  document.getElementById('h-type').value     = h.type || 'habit';
  document.getElementById('h-cat').value      = h.cat;
  pickColorById(h.color || '#4FC3F7');
  document.getElementById('modal-habit').classList.add('open');
}

function closeAddModal() { document.getElementById('modal-habit').classList.remove('open'); }

function pickColor(el) {
  document.querySelectorAll('.cp').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedColor = el.dataset.color;
  document.getElementById('h-color').value = selectedColor;
}

function pickColorById(color) {
  selectedColor = color;
  document.getElementById('h-color').value = color;
  document.querySelectorAll('.cp').forEach(c => {
    c.classList.toggle('selected', c.dataset.color === color);
  });
}

function saveHabit() {
  const name = document.getElementById('h-name').value.trim();
  if (!name) { document.getElementById('h-name').focus(); return; }
  const id    = document.getElementById('h-edit-id').value;
  const data  = {
    name,
    emoji:    document.getElementById('h-emoji').value.trim() || '●',
    cat:      document.getElementById('h-cat').value,
    type:     document.getElementById('h-type').value,
    priority: document.getElementById('h-priority').value,
    days:     document.getElementById('h-days').value,
    color:    document.getElementById('h-color').value || selectedColor,
    notes:    document.getElementById('h-notes').value.trim(),
  };
  if (id) {
    const idx = habits.findIndex(h => h.id === +id);
    if (idx > -1) habits[idx] = { ...habits[idx], ...data };
  } else {
    habits.push({ id: Date.now(), ...data });
  }
  save(); closeAddModal(); reRender();
}

/* ════════════ DRAG & DROP ════════════ */
function setupDrag(list, catFilter) {
  list.querySelectorAll('.habit-card').forEach(card => {
    card.setAttribute('draggable','true');

    card.addEventListener('dragstart', e => {
      dragSrcId = +card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      list.querySelectorAll('.habit-card').forEach(c => c.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      list.querySelectorAll('.habit-card').forEach(c => c.classList.remove('drag-over'));
      card.classList.add('drag-over');
    });

    card.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrcId === +card.dataset.id) return;
      const srcIdx  = habits.findIndex(h => h.id === dragSrcId);
      const dstIdx  = habits.findIndex(h => h.id === +card.dataset.id);
      if (srcIdx < 0 || dstIdx < 0) return;
      const [moved] = habits.splice(srcIdx, 1);
      habits.splice(dstIdx, 0, moved);
      save(); reRender();
    });
  });
}

/* ════════════ BUILD WEEK ROW ════════════ */
function buildDayBtns(h, dates) {
  const t = today();
  return dates.map(d => {
    const dk      = dateKey(d);
    const isDone  = h.type==='task' ? !!done[h.id+'_done'] : !!done[h.id+'_'+dk];
    const isToday = d.getTime() === t.getTime();
    const fut     = d > t;
    const active  = isHabitActiveOnDate(h, d);

    if (h.type === 'task') {
      if (d !== dates[0]) return ''; // task shows only 1 toggle
    }

    const doneClass = isDone ? 'done' : '';
    const style     = isDone ? `style="background:${h.color||'#4FC3F7'};border-color:${h.color||'#4FC3F7'}"` : '';
    const disabled  = (fut || !active) ? 'disabled' : '';
    const onclick   = h.type==='task'
      ? `onclick="toggleTask(${h.id})"`
      : `onclick="toggleDay(${h.id},'${dk}')"`;

    return `<button class="day-btn${isToday?' today-btn':''} ${doneClass}" ${style} ${onclick} ${disabled} title="${DAYS_F[d.getDay()]} ${dk}">
      <span class="dlabel">${h.type==='task'?'✓':DAYS_S[d.getDay()]}</span>
      ${isDone?'<span class="dcheck">✓</span>':''}
    </button>`;
  }).join('');
}

/* ════════════ HABIT CARD HTML ════════════ */
function habitCardHTML(h, dates) {
  const t     = today();
  const s     = streak(h.id);
  const isDoneToday = h.type==='task'
    ? !!done[h.id+'_done']
    : !!done[h.id+'_'+dateKey(t)];

  const taskDoneClass = (h.type==='task' && isDoneToday) ? 'task-done' : '';
  const dayBtns = h.type==='task'
    ? `<button class="day-btn ${isDoneToday?'done':''}" ${isDoneToday?`style="background:${h.color};border-color:${h.color}"`:''} onclick="toggleTask(${h.id})">
        <span class="dlabel">${isDoneToday?'✓':'○'}</span>
       </button>`
    : buildDayBtns(h, dates);

  const streakEl = h.type==='habit'
    ? `<span class="streak-badge">${s>0?'🔥'+s:'—'}</span>` : '';

  const daysLabel = h.days==='weekdays' ? 'L-V' : h.days==='weekend' ? 'S-D' : '';
  const notesEl   = h.notes ? `<span title="${h.notes}">📝</span>` : '';

  return `<div class="habit-card ${taskDoneClass}" data-id="${h.id}" draggable="true">
    <span class="drag-handle">⠿</span>
    <div class="habit-left">
      <span class="habit-emoji">${h.emoji||'●'}</span>
      <div class="habit-info">
        <div class="habit-name">${h.name}</div>
        <div class="habit-meta">
          <span class="priority-dot" style="background:${PRIORITY_COLOR[h.priority||'media']}"></span>
          ${h.type==='task'?'<span class="task-badge">tarea</span>':''}
          ${daysLabel?`<span style="color:var(--text3);font-size:10px">${daysLabel}</span>`:''}
          ${notesEl}
        </div>
      </div>
    </div>
    <div class="days-grid">${dayBtns}</div>
    ${streakEl}
    <div class="habit-actions">
      <button class="icon-btn" onclick="openEditModal(${h.id})" title="Editar">✎</button>
      <button class="icon-btn danger" onclick="removeHabit(${h.id})" title="Eliminar">✕</button>
    </div>
  </div>`;
}

/* ════════════ WEEK BAR HTML ════════════ */
function weekBarHTML() {
  const dates = getWeekDates(weekOffset);
  const fmt = d => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `<div class="week-bar">
    <button onclick="changeWeek(-1)">←</button>
    <span>${fmt(dates[0])} – ${fmt(dates[6])} ${dates[6].getFullYear()}</span>
    <button onclick="changeWeek(1)">→</button>
    <button class="btn-today-pill" onclick="goToday2()">hoy</button>
  </div>`;
}

/* ════════════ DASHBOARD ════════════ */
function renderDashboard() {
  const t     = today();
  const dates = getWeekDates(weekOffset);
  const allH  = habits.filter(h=>h.type==='habit');

  let totalPoss=0, totalDone=0;
  dates.forEach(d => {
    if (d<=t) allH.forEach(h => {
      if (!isHabitActiveOnDate(h,d)) return;
      totalPoss++;
      if (done[h.id+'_'+dateKey(d)]) totalDone++;
    });
  });
  const pct = totalPoss>0 ? Math.round(totalDone/totalPoss*100) : 0;
  const todayDone = allH.filter(h=>done[h.id+'_'+dateKey(t)] && isHabitActiveOnDate(h,t)).length;
  const todayTotal= allH.filter(h=>isHabitActiveOnDate(h,t)).length;
  const bestS     = habits.reduce((m,h)=>Math.max(m,streak(h.id)),0);
  const tasks     = habits.filter(h=>h.type==='task');
  const tasksDone = tasks.filter(h=>done[h.id+'_done']).length;

  const el = document.getElementById('view-dashboard');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Dashboard</div>
      <div class="page-sub">${t.toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">hoy</div><div class="stat-value">${todayDone}/${todayTotal}</div></div>
      <div class="stat-card"><div class="stat-label">semana</div><div class="stat-value accent">${pct}%</div></div>
      <div class="stat-card"><div class="stat-label">mejor racha</div><div class="stat-value">${bestS}d</div></div>
      <div class="stat-card"><div class="stat-label">tareas</div><div class="stat-value">${tasksDone}/${tasks.length}</div></div>
    </div>

    ${weekBarHTML()}

    <div class="prog-wrap">
      <div class="prog-bg"><div class="prog-fill" style="width:${pct}%"></div></div>
      <span class="prog-label">${totalDone}/${totalPoss} · ${pct}%</span>
    </div>

    ${Object.entries(CATS).map(([cat, cfg]) => {
      const hs = habits.filter(h=>h.cat===cat);
      if (!hs.length) return '';
      const catDone = hs.filter(h=>h.type==='habit'&&done[h.id+'_'+dateKey(t)]&&isHabitActiveOnDate(h,t)).length;
      const catTotal= hs.filter(h=>h.type==='habit'&&isHabitActiveOnDate(h,t)).length;
      return `
        <div class="section-header">
          <span class="section-dot" style="background:${cfg.color}"></span>
          <span class="section-title" style="color:${cfg.color}">${cfg.label}</span>
          <span class="section-count">${catDone}/${catTotal} hoy</span>
        </div>
        <div class="habit-list" id="list-dash-${cat}">
          ${hs.slice(0,3).map(h=>habitCardHTML(h,dates)).join('')}
          ${hs.length>3?`<div style="font-size:12px;color:var(--text3);padding:6px 0 4px 14px;cursor:pointer" onclick="navigate('cat','${cat}')">+ ${hs.length-3} más →</div>`:''}
        </div>`;
    }).join('')}
  `;

  Object.keys(CATS).forEach(cat => {
    const list = document.getElementById('list-dash-'+cat);
    if (list) setupDrag(list, cat);
  });
}

/* ════════════ CAT VIEW ════════════ */
function renderCatView() {
  const cfg   = CATS[currentCat] || { label:currentCat, color:'#888' };
  const dates = getWeekDates(weekOffset);
  const t     = today();
  const hs    = habits.filter(h=>h.cat===currentCat);
  const habitList = hs.filter(h=>h.type==='habit');
  const taskList  = hs.filter(h=>h.type==='task');

  let totalPoss=0, totalDone=0;
  dates.forEach(d => {
    if (d<=t) habitList.forEach(h => {
      if (!isHabitActiveOnDate(h,d)) return;
      totalPoss++; if (done[h.id+'_'+dateKey(d)]) totalDone++;
    });
  });
  const pct = totalPoss>0 ? Math.round(totalDone/totalPoss*100) : 0;

  const el = document.getElementById('view-cat');
  el.innerHTML = `
    <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div class="page-title" style="color:${cfg.color}">${cfg.label}</div>
        <div class="page-sub">${hs.length} hábitos / tareas</div>
      </div>
      <button class="sidebar-add-btn" style="width:auto;padding:8px 16px" onclick="openAddModal('${currentCat}')">+ Agregar</button>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">hoy</div>
        <div class="stat-value">${habitList.filter(h=>done[h.id+'_'+dateKey(t)]&&isHabitActiveOnDate(h,t)).length}/${habitList.filter(h=>isHabitActiveOnDate(h,t)).length}</div>
      </div>
      <div class="stat-card"><div class="stat-label">semana</div><div class="stat-value">${pct}%</div></div>
      <div class="stat-card"><div class="stat-label">hábitos</div><div class="stat-value">${habitList.length}</div></div>
      <div class="stat-card"><div class="stat-label">tareas</div><div class="stat-value">${taskList.filter(h=>done[h.id+'_done']).length}/${taskList.length}</div></div>
    </div>

    ${weekBarHTML()}

    <div class="prog-wrap">
      <div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:${cfg.color}"></div></div>
      <span class="prog-label">${totalDone}/${totalPoss} · ${pct}%</span>
    </div>

    ${habitList.length ? `
      <div class="section-header">
        <span class="section-dot" style="background:${cfg.color}"></span>
        <span class="section-title">Hábitos diarios</span>
        <span class="section-count">${habitList.length}</span>
      </div>
      <div class="habit-list" id="list-cat-habit">
        ${habitList.map(h=>habitCardHTML(h,dates)).join('')}
      </div>` : ''}

    ${taskList.length ? `
      <div class="section-header" style="margin-top:1.25rem">
        <span class="section-dot" style="background:#FFB74D"></span>
        <span class="section-title">Tareas</span>
        <span class="section-count">${taskList.filter(h=>done[h.id+'_done']).length}/${taskList.length}</span>
      </div>
      <div class="habit-list" id="list-cat-task">
        ${taskList.map(h=>habitCardHTML(h,dates)).join('')}
      </div>` : ''}

    ${!hs.length ? `<div class="empty-state"><div class="es-icon">◎</div>No hay hábitos aquí aún.<br>Agrega uno con el botón de arriba.</div>` : ''}
  `;

  const hl = document.getElementById('list-cat-habit');
  const tl = document.getElementById('list-cat-task');
  if (hl) setupDrag(hl, currentCat);
  if (tl) setupDrag(tl, currentCat);
}

/* ════════════ GYM VIEW ════════════ */
function renderGym() {
  const t   = today();
  const dow = t.getDay(); // 0=Dom
  const gymDayIdx = dow === 0 ? 6 : dow - 1;
  const todayKey  = dateKey(t);

  const logEntries = Object.entries(gymLog)
    .sort((a,b) => b[0].localeCompare(a[0]))
    .slice(0,14);

  const el = document.getElementById('view-gym');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Gym</div>
      <div class="page-sub">Registro de entrenamientos</div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">esta semana</div>
        <div class="stat-value">${countGymWeek()}d</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">este mes</div>
        <div class="stat-value">${countGymMonth()}d</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">racha actual</div>
        <div class="stat-value">${gymStreak()}d</div>
      </div>
    </div>

    <div class="section-header">
      <span class="section-dot" style="background:#81C784"></span>
      <span class="section-title">Rutina semanal</span>
    </div>

    <div class="gym-grid">
      ${gymDays.map((day,i) => {
        const isToday   = i === gymDayIdx;
        const completed = !!gymLog[todayKey] && isToday || gymLog[dateKey(getMonday(i))];
        const dayKey    = getGymDayKey(i);
        const isDone    = !!gymLog[dayKey];

        return `<div class="gym-day-card${day.rest?' rest-day':''}${isDone?' completed':''}">
          <div class="gym-day-name">${day.label}${isToday?' <span style="font-size:10px;color:#ff6b6b">● HOY</span>':''}</div>
          <div class="gym-day-muscles">${day.rest?'Descanso':day.muscles||'Sin configurar'}</div>
          <div class="gym-day-footer">
            ${!day.rest ? `<button class="gym-check-btn" onclick="toggleGym(${i},'${dayKey}')">
              ${isDone?'✓ Hecho':'Marcar'}
            </button>` : `<span class="gym-rest-label">descanso</span>`}
            <button class="gym-edit-btn" onclick="openGymModal(${i})">✎</button>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="section-header" style="margin-top:1.25rem">
      <span class="section-dot" style="background:#4FC3F7"></span>
      <span class="section-title">Historial reciente</span>
    </div>

    <div class="gym-week-log">
      <div class="gym-log-header">últimas sesiones</div>
      ${logEntries.length ? logEntries.map(([k,v]) => `
        <div class="gym-log-row">
          <span class="gym-log-date">${k}</span>
          <span class="gym-log-muscles">${v.muscles||'—'}</span>
          <span class="gym-log-status" style="color:#81C784">✓</span>
        </div>`).join('') : `<div class="gym-log-row" style="color:var(--text3)">Sin registros aún</div>`}
    </div>
  `;
}

function getMonday(dayIdx) {
  const t   = today();
  const dow = t.getDay();
  const mon = new Date(t);
  mon.setDate(t.getDate() - dow + (dow===0?-6:1));
  const d = new Date(mon);
  d.setDate(mon.getDate() + dayIdx);
  return d;
}

function getGymDayKey(dayIdx) {
  return dateKey(getMonday(dayIdx));
}

function toggleGym(idx, dk) {
  if (gymLog[dk]) {
    delete gymLog[dk];
  } else {
    gymLog[dk] = { muscles: gymDays[idx].muscles, date: dk };
  }
  save(); renderGym();
}

function countGymWeek() {
  const dates = getWeekDates(0);
  return dates.filter(d => gymLog[dateKey(d)]).length;
}

function countGymMonth() {
  const t = today();
  return Object.keys(gymLog).filter(k => k.startsWith(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}`)).length;
}

function gymStreak() {
  let s=0; const t=today();
  for (let i=0;i<365;i++) {
    const d=new Date(t); d.setDate(t.getDate()-i);
    const day = d.getDay();
    const gymIdx = day===0?6:day-1;
    if (gymDays[gymIdx]&&gymDays[gymIdx].rest) continue;
    if (gymLog[dateKey(d)]) s++; else break;
  }
  return s;
}

/* ── Gym modal ── */
function openGymModal(idx) {
  const day = gymDays[idx];
  document.getElementById('gym-edit-idx').value  = idx;
  document.getElementById('gym-day-label').value = day.label;
  document.getElementById('gym-muscles').value   = day.muscles;
  document.getElementById('gym-rest').value      = day.rest ? 'yes' : 'no';
  document.getElementById('modal-gym').classList.add('open');
}

function closeGymModal() { document.getElementById('modal-gym').classList.remove('open'); }

function saveGymDay() {
  const idx = +document.getElementById('gym-edit-idx').value;
  gymDays[idx] = {
    label:   document.getElementById('gym-day-label').value.trim() || gymDays[idx].label,
    muscles: document.getElementById('gym-muscles').value.trim(),
    rest:    document.getElementById('gym-rest').value === 'yes',
  };
  save(); closeGymModal(); renderGym();
}

/* ════════════ STATS VIEW ════════════ */
function renderStats() {
  const t = today();
  const last30 = Array.from({length:30}, (_,i) => { const d=new Date(t); d.setDate(t.getDate()-29+i); return d; });

  const allHabits = habits.filter(h=>h.type==='habit');
  let total30=0, done30=0;
  last30.forEach(d => {
    allHabits.forEach(h => {
      if (!isHabitActiveOnDate(h,d)) return;
      total30++;
      if (done[h.id+'_'+dateKey(d)]) done30++;
    });
  });
  const pct30 = total30>0?Math.round(done30/total30*100):0;

  const bestS = habits.reduce((m,h)=>Math.max(m,streak(h.id)),0);
  const tasks = habits.filter(h=>h.type==='task');
  const tasksDone = tasks.filter(h=>done[h.id+'_done']).length;

  // per-cat stats
  const catStats = Object.entries(CATS).map(([cat,cfg]) => {
    const hs = habits.filter(h=>h.cat===cat&&h.type==='habit');
    let p=0, d=0;
    last30.forEach(day => hs.forEach(h => {
      if (!isHabitActiveOnDate(h,day)) return;
      p++; if (done[h.id+'_'+dateKey(day)]) d++;
    }));
    return { cat, cfg, pct: p>0?Math.round(d/p*100):0 };
  });

  // heatmap
  const heatCells = last30.map(d => {
    const dk    = dateKey(d);
    const total = allHabits.filter(h=>isHabitActiveOnDate(h,d)).length;
    const doneN = allHabits.filter(h=>isHabitActiveOnDate(h,d)&&done[h.id+'_'+dk]).length;
    const pct   = total>0?doneN/total:0;
    const alpha = (0.15 + pct*0.85).toFixed(2);
    return `<div class="heat-cell" style="background:rgba(255,60,60,${alpha})" title="${dk}: ${doneN}/${total}"></div>`;
  }).join('');

  const el = document.getElementById('view-stats');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Estadísticas</div>
      <div class="page-sub">Últimos 30 días</div>
    </div>

    <div class="stats-grid">
      <div class="stats-big-card">
        <div class="stats-big-label">Cumplimiento 30d</div>
        <div class="stats-big-value ${pct30>=70?'green':pct30>=40?'orange':'red'}">${pct30}%</div>
      </div>
      <div class="stats-big-card">
        <div class="stats-big-label">Mejor racha</div>
        <div class="stats-big-value">${bestS}<span style="font-size:16px;font-weight:400"> días</span></div>
      </div>
      <div class="stats-big-card">
        <div class="stats-big-label">Tareas completadas</div>
        <div class="stats-big-value green">${tasksDone}/${tasks.length}</div>
      </div>
      <div class="stats-big-card">
        <div class="stats-big-label">Días gym (mes)</div>
        <div class="stats-big-value">${countGymMonth()}</div>
      </div>
    </div>

    <div class="stats-bar-section">
      <div class="stats-bar-title">Cumplimiento por categoría</div>
      ${catStats.map(({cat,cfg,pct}) => `
        <div class="cat-stat-row">
          <span class="cat-stat-name" style="color:${cfg.color}">${cfg.label}</span>
          <div class="cat-stat-bar-bg">
            <div class="cat-stat-bar" style="width:${pct}%;background:${cfg.color}"></div>
          </div>
          <span class="cat-stat-pct">${pct}%</span>
        </div>`).join('')}
    </div>

    <div class="stats-bar-section">
      <div class="stats-bar-title">Mapa de calor — últimos 30 días</div>
      <div class="heatmap-grid">${heatCells}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:8px">Más oscuro = más hábitos completados ese día</div>
    </div>

    <div class="stats-bar-section">
      <div class="stats-bar-title">Rachas actuales</div>
      ${habits.filter(h=>h.type==='habit'&&streak(h.id)>0)
        .sort((a,b)=>streak(b.id)-streak(a.id))
        .slice(0,10)
        .map(h=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:14px">${h.emoji}</span>
          <span style="font-size:12px;color:var(--text);flex:1">${h.name}</span>
          <span style="font-size:12px;color:#FFB74D;font-family:'DM Mono',monospace">🔥${streak(h.id)}d</span>
        </div>`).join('')}
    </div>
  `;
}

/* ════════════ INIT ════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Open habits group by default
  document.getElementById('ng-habitos').classList.add('open');
  navigate('dashboard');
});

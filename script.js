const DAYS_SHORT = ['D','L','M','X','J','V','S'];
const DAYS_FULL  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS     = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

const CATS = {
  escolar:  { label: 'Escolar',  color: '#4FC3F7' },
  personal: { label: 'Personal', color: '#F06292' },
  salud:    { label: 'Salud',    color: '#81C784' },
  finanzas: { label: 'Finanzas', color: '#FFB74D' },
};

let weekOffset = 0;
let collapsed  = JSON.parse(localStorage.getItem('collapsed_v1') || '{}');

let habits = JSON.parse(localStorage.getItem('habits_v3') || 'null') || [
  /* ── Escolar ── */
  { id: 101, name: 'Estudiar / repasar apuntes',        emoji: '📖', cat: 'escolar'  },
  { id: 102, name: 'Hacer tareas pendientes',            emoji: '✏️', cat: 'escolar'  },
  { id: 103, name: 'Repasar antes de dormir',            emoji: '🌙', cat: 'escolar'  },
  { id: 104, name: 'Planificar el día escolar',          emoji: '📅', cat: 'escolar'  },

  /* ── Personal ── */
  { id: 201, name: 'Día productivo (sin procrastinar)',  emoji: '🎯', cat: 'personal' },
  { id: 202, name: 'Leer 20 minutos',                    emoji: '📚', cat: 'personal' },
  { id: 203, name: 'Despertarme a tiempo',               emoji: '⏰', cat: 'personal' },
  { id: 204, name: 'Desintoxicación de redes sociales',  emoji: '📵', cat: 'personal' },
  { id: 205, name: 'Trabajar en proyectos personales',   emoji: '🔧', cat: 'personal' },

  /* ── Salud ── */
  { id: 301, name: 'Lavarme los dientes (mañana y noche)', emoji: '🦷', cat: 'salud' },
  { id: 302, name: 'Bañarme',                              emoji: '🚿', cat: 'salud' },
  { id: 303, name: 'Skin care rutina',                     emoji: '🧴', cat: 'salud' },
  { id: 304, name: 'Comer bien',                           emoji: '🥗', cat: 'salud' },
  { id: 305, name: 'Tomar suficiente agua',                emoji: '💧', cat: 'salud' },
  { id: 306, name: 'Vitamina D (mañana)',                  emoji: '☀️', cat: 'salud' },
  { id: 307, name: 'Omega 3 (antes de Vastianin)',         emoji: '🐟', cat: 'salud' },
  { id: 308, name: 'Vastianin / isotretinoína (cena)',     emoji: '💊', cat: 'salud' },
  { id: 309, name: 'Creatina',                             emoji: '🥄', cat: 'salud' },
  { id: 310, name: 'Proteína (días de entreno L-V)',       emoji: '🥛', cat: 'salud' },
  { id: 311, name: 'Hacer ejercicio',                      emoji: '🏋️', cat: 'salud' },
  { id: 312, name: 'Dormir 7-8 horas',                     emoji: '😴', cat: 'salud' },

  /* ── Finanzas ── */
  { id: 401, name: 'Control de gastos del día',           emoji: '💸', cat: 'finanzas' },
  { id: 402, name: 'Ahorrar algo hoy',                    emoji: '🏦', cat: 'finanzas' },
];

let done = JSON.parse(localStorage.getItem('done_v3') || '{}');

/* ────────── Helpers ────────── */

function save() {
  localStorage.setItem('habits_v3',    JSON.stringify(habits));
  localStorage.setItem('done_v3',      JSON.stringify(done));
  localStorage.setItem('collapsed_v1', JSON.stringify(collapsed));
}

function dateKey(d) { return d.toISOString().slice(0, 10); }

function getWeekDates(offset) {
  const today = new Date(); today.setHours(0,0,0,0);
  const dow    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow + (dow === 0 ? -6 : 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return d;
  });
}

function streak(habitId) {
  let s = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    if (done[habitId + '_' + dateKey(d)]) s++; else break;
  }
  return s;
}

/* ────────── Actions ────────── */

function toggleDay(habitId, dateStr) {
  const k = habitId + '_' + dateStr;
  done[k] = !done[k];
  save(); render();
}

function toggleCat(cat) {
  collapsed[cat] = !collapsed[cat];
  save(); render();
}

function removeHabit(id) {
  if (confirm('¿Eliminar este hábito?')) {
    habits = habits.filter(h => h.id !== id);
    save(); render();
  }
}

function changeWeek(delta) { weekOffset += delta; render(); }
function goToday()         { weekOffset  = 0;     render(); }

function openModal()  { document.getElementById('modal').classList.add('open'); }
function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('new-name').value  = '';
  document.getElementById('new-emoji').value = '';
}

function addHabit() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) { document.getElementById('new-name').focus(); return; }
  const emoji = document.getElementById('new-emoji').value.trim() || '●';
  const cat   = document.getElementById('new-cat').value;
  habits.push({ id: Date.now(), name, emoji, cat });
  save(); closeModal(); render();
}

/* ────────── Render ────────── */

function render() {
  const today = new Date(); today.setHours(0,0,0,0);
  const dates = getWeekDates(weekOffset);

  document.getElementById('today-date').textContent =
    today.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const fmt = d => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  document.getElementById('week-label').textContent =
    `${fmt(dates[0])} – ${fmt(dates[6])} ${dates[6].getFullYear()}`;

  let totalPossible = 0, totalDone = 0;
  dates.forEach(d => {
    if (d <= today) habits.forEach(h => {
      totalPossible++;
      if (done[h.id + '_' + dateKey(d)]) totalDone++;
    });
  });
  const pct = totalPossible > 0 ? Math.round(totalDone / totalPossible * 100) : 0;
  document.getElementById('prog-bar').style.width = pct + '%';
  document.getElementById('prog-label').textContent = `${totalDone}/${totalPossible} · ${pct}%`;

  const todayDone  = habits.filter(h => done[h.id + '_' + dateKey(today)]).length;
  const bestStreak = habits.reduce((m, h) => Math.max(m, streak(h.id)), 0);
  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card"><div class="stat-label">hoy</div><div class="stat-value">${todayDone}/${habits.length}</div></div>
    <div class="stat-card"><div class="stat-label">semana</div><div class="stat-value">${pct}%</div></div>
    <div class="stat-card"><div class="stat-label">mejor racha</div><div class="stat-value">${bestStreak}d</div></div>
    <div class="stat-card"><div class="stat-label">hábitos</div><div class="stat-value">${habits.length}</div></div>
  `;

  const container = document.getElementById('habits-container');
  const bycat = {};
  habits.forEach(h => { if (!bycat[h.cat]) bycat[h.cat] = []; bycat[h.cat].push(h); });

  container.innerHTML = Object.entries(bycat).map(([cat, hs]) => {
    const cfg    = CATS[cat] || { label: cat, color: '#888' };
    const isOpen = !collapsed[cat];
    const catDone = hs.filter(h => done[h.id + '_' + dateKey(today)]).length;

    const rows = hs.map(h => {
      const s = streak(h.id);
      const dayBtns = dates.map((d, i) => {
        const dk       = dateKey(d);
        const isDone   = !!done[h.id + '_' + dk];
        const isToday  = d.getTime() === today.getTime();
        const isFuture = d > today;
        return `
          <button
            class="day-btn${isToday ? ' today-btn' : ''} ${isDone ? 'done-' + h.cat : ''}"
            onclick="toggleDay(${h.id},'${dk}')"
            ${isFuture ? 'disabled' : ''}
            title="${DAYS_FULL[d.getDay()]} ${dk}"
          >
            <span class="dlabel">${DAYS_SHORT[d.getDay()]}</span>
            ${isDone ? '<span class="dcheck">✓</span>' : ''}
          </button>`;
      }).join('');

      return `
        <div class="habit-row">
          <span class="habit-emoji">${h.emoji || '●'}</span>
          <span class="habit-name" title="${h.name}">${h.name}</span>
          <div class="days-grid">${dayBtns}</div>
          <span class="streak-badge">${s > 0 ? '🔥' + s : '—'}</span>
          <button class="remove-btn" onclick="removeHabit(${h.id})" title="eliminar">×</button>
        </div>`;
    }).join('');

    return `
      <div class="cat-section${isOpen ? ' open' : ''}">
        <div class="cat-header" onclick="toggleCat('${cat}')">
          <span class="cat-dot" style="background:${cfg.color}"></span>
          <span class="cat-name" style="color:${cfg.color}">${cfg.label}</span>
          <span class="cat-meta">${catDone}/${hs.length} hoy</span>
          <span class="cat-chevron">▾</span>
        </div>
        <div class="cat-body">${rows}</div>
      </div>`;
  }).join('');
}

render();

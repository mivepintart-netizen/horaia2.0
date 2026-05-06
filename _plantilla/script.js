/* ===== NAVBAR ===== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ===== HAMBURGER ===== */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  const [s1, s2, s3] = hamburger.querySelectorAll('span');
  if (open) {
    s1.style.transform = 'rotate(45deg) translate(5px, 5px)';
    s2.style.opacity   = '0';
    s3.style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    [s1, s2, s3].forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ===== SCROLL REVEAL ===== */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity   = '1';
      e.target.style.transform = 'translateY(0)';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
  '.servicio-card, .testimonio-card, .galeria-item, .info-item, .feature, .contacto-card'
).forEach((el, i) => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(28px)';
  el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
  observer.observe(el);
});

/* ===== ACTIVE NAV LINK ===== */
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
  navLinks.querySelectorAll('a[href^="#"]').forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--dark)' : '';
  });
}, { passive: true });


/* ============================================================
   SISTEMA DE RESERVAS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CAMBIAR POR CLIENTE:
     1. Array EMPLOYEES  → nombres, especialidades, horarios
     2. N8N_GET_URL      → webhook GET del cliente
     3. N8N_POST_URL     → webhook POST del cliente
   ============================================================ */

const EMPLOYEES = [
  {
    id: 1,
    name:      'EMPLEADO_1',           // ← cambiar
    specialty: 'ESPECIALIDAD_1',       // ← cambiar
    avatar:    'E',                    // ← inicial del nombre
    color:     '#1a1a1a',
    workDays:  [1, 2, 3, 4, 5, 6],    // 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb 0=Dom
    startHour:  9.5,                   // 9:30
    endHour:   20.5,                   // 20:30
    satEndHour: 19.5,                  // sábados hasta las 19:30 (0 = igual que endHour)
    lunchStart: 0,                     // 0 = sin pausa comida
    lunchEnd:   0,
  },
  {
    id: 2,
    name:      'EMPLEADO_2',
    specialty: 'ESPECIALIDAD_2',
    avatar:    'E',
    color:     '#1a1a1a',
    workDays:  [1, 2, 3, 4, 5, 6],
    startHour:  9.5,
    endHour:   20.5,
    satEndHour: 19.5,
    lunchStart: 0,
    lunchEnd:   0,
  },
  {
    id: 3,
    name:      'EMPLEADO_3',
    specialty: 'ESPECIALIDAD_3',
    avatar:    'E',
    color:     '#1a1a1a',
    workDays:  [1, 2, 3, 4, 5, 6],
    startHour:  9.5,
    endHour:   20.5,
    satEndHour: 19.5,
    lunchStart: 0,
    lunchEnd:   0,
  },
];

// ── Webhooks n8n ─────────────────────────────────────────────
// Duplicar los flujos en n8n y pegar aquí las nuevas URLs
const N8N_GET_URL  = 'N8N_WEBHOOK_GET_URL';   // ← cambiar
const N8N_POST_URL = 'N8N_WEBHOOK_POST_URL';  // ← cambiar
const NEGOCIO_NOMBRE = 'NOMBRE_NEGOCIO';      // ← cambiar (debe coincidir con admin.html)
// ─────────────────────────────────────────────────────────────

const SLOT_MINUTES   = 30;
const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_LONG  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES     = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

let sel = { barber: null, date: null, time: null };
let weekOffset = 0;

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function mondayOf(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return date;
}

function generateSlots(barber, date) {
  const slots = [];
  const start = barber.startHour * 60;
  const isSat = date && date.getDay() === 6;
  const end   = (isSat && barber.satEndHour ? barber.satEndHour : barber.endHour) * 60;
  const ls = barber.lunchStart * 60;
  const le = barber.lunchEnd   * 60;
  for (let m = start; m < end; m += SLOT_MINUTES) {
    if (ls < le && m >= ls && m < le) continue;
    slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return slots;
}

function getBooked(id, dk)       { return JSON.parse(localStorage.getItem(`negocio_${id}_${dk}`) || '[]'); }
function saveBooking(id, dk, t)  { const l = getBooked(id, dk); if (!l.includes(t)) { l.push(t); localStorage.setItem(`negocio_${id}_${dk}`, JSON.stringify(l)); } }

function goToStep(n) {
  document.querySelectorAll('.booking-step-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`bookStep${n}`).classList.add('active');
  document.querySelectorAll('.progress-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'completed');
    if (s === n)      el.classList.add('active');
    else if (s < n)   el.classList.add('completed');
  });
  if (n === 2) renderDays();
  if (n === 3) renderSlots();
  if (n === 4) renderSummaryCard();
}

function renderBarbers() {
  const grid = document.getElementById('barbersGrid');
  if (!grid) return;
  grid.innerHTML = EMPLOYEES.map(b => `
    <div class="barber-card" data-id="${b.id}" onclick="selectBarber(${b.id})">
      <div class="barber-avatar-lg">${b.avatar}</div>
      <div class="barber-details">
        <strong>${b.name}</strong>
        <span>${b.specialty}</span>
      </div>
      <span class="barber-schedule">${b.workDays.map(d => DAY_NAMES_SHORT[d]).join(', ')} &middot; ${String(Math.floor(b.startHour)).padStart(2,'0')}:${b.startHour%1?'30':'00'}&ndash;${String(Math.floor(b.endHour)).padStart(2,'0')}:${b.endHour%1?'30':'00'}</span>
      <div class="barber-check">&#10003;</div>
    </div>`).join('');
}

function selectBarber(id) {
  sel.barber = EMPLOYEES.find(b => b.id === id);
  sel.date = null; sel.time = null; weekOffset = 0;
  document.querySelectorAll('.barber-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.barber-card[data-id="${id}"]`).classList.add('selected');
  setTimeout(() => goToStep(2), 350);
}

function renderDays() {
  const grid  = document.getElementById('daysGrid');
  const label = document.getElementById('weekLabel');
  if (!grid || !sel.barber) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const base  = mondayOf(today);
  base.setDate(base.getDate() + weekOffset * 7);
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(base); d.setDate(base.getDate() + i); return d; });
  label.textContent = `${days[0].getDate()} ${MONTH_NAMES[days[0].getMonth()]} – ${days[13].getDate()} ${MONTH_NAMES[days[13].getMonth()]}`;
  grid.innerHTML = days.map(d => {
    const isPast = d < today, isWork = sel.barber.workDays.includes(d.getDay()), disabled = isPast || !isWork;
    const dk = dateKey(d), isSel = sel.date && dateKey(sel.date) === dk;
    return `<button class="day-btn ${disabled ? 'disabled' : 'available'}${isSel ? ' selected' : ''}" data-date="${dk}" ${disabled ? 'disabled' : `onclick="selectDate('${dk}')"`}>
      <span class="day-name">${DAY_NAMES_SHORT[d.getDay()]}</span>
      <span class="day-num">${d.getDate()}</span>
    </button>`;
  }).join('');
  document.getElementById('prevWeek').disabled      = weekOffset <= 0;
  document.getElementById('prevWeek').style.opacity = weekOffset <= 0 ? '0.3' : '1';
}

document.getElementById('prevWeek').addEventListener('click', () => { if (weekOffset > 0) { weekOffset--; renderDays(); } });
document.getElementById('nextWeek').addEventListener('click', () => { if (weekOffset < 6) { weekOffset++; renderDays(); } });

function selectDate(dk) {
  sel.date = parseDate(dk); sel.time = null;
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector(`.day-btn[data-date="${dk}"]`)?.classList.add('selected');
  setTimeout(() => goToStep(3), 300);
}

async function renderSlots() {
  const grid = document.getElementById('slotsGrid');
  const mini = document.getElementById('summaryMini');
  if (!grid || !sel.barber || !sel.date) return;
  const dk = dateKey(sel.date);
  grid.innerHTML = '<p class="slots-loading">Consultando disponibilidad...</p>';
  let serverBooked = [], serverClosed = false;
  try {
    const res = await fetch(`${N8N_GET_URL}?barbero=${encodeURIComponent(sel.barber.name)}&fecha=${dk}`);
    if (res.ok) { const data = await res.json(); if (data.diaCerrado) { serverClosed = true; } else { serverBooked = Array.isArray(data) ? data : (data.horasOcupadas || data.booked || []); } }
  } catch (_) {}
  const adminBlocks = JSON.parse(localStorage.getItem(`rl_admin_blocks_${NEGOCIO_NOMBRE.replace(/\s/g,'_')}`) || '[]');
  const adminDayClosed = adminBlocks.some(b => b.fecha === dk && b.tipo === 'dia_completo' && (b.empleadoId === 0 || b.empleadoId === sel.barber.id));
  if (adminDayClosed || serverClosed) { grid.innerHTML = '<p class="no-slots" style="color:#dc2626;font-weight:600;">🔒 Este día está cerrado.</p>'; return; }
  const adminHourBlocks = adminBlocks.filter(b => b.fecha === dk && b.tipo === 'horas' && (b.empleadoId === 0 || b.empleadoId === sel.barber.id));
  const booked = [...new Set([...serverBooked, ...getBooked(sel.barber.id, dk)])];
  const slots  = generateSlots(sel.barber, sel.date);
  const now    = new Date(), isToday = dateKey(now) === dk;
  mini.innerHTML = `<div class="mini-summary">
    <span class="mini-barber" style="background:var(--cream-darker);color:var(--dark);border-color:var(--border-dark)">&#9986; ${sel.barber.name}</span>
    <span class="mini-date">&#128197; ${DAY_NAMES_LONG[sel.date.getDay()]}, ${sel.date.getDate()} de ${MONTH_NAMES[sel.date.getMonth()]}</span>
  </div>`;
  if (!slots.length) { grid.innerHTML = '<p class="no-slots">Sin horario disponible este día.</p>'; return; }
  grid.innerHTML = slots.map(t => {
    const [h, m] = t.split(':').map(Number);
    const past   = isToday && (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes()));
    const adminBlocked = adminHourBlocks.some(b => t >= b.inicio && t < b.fin);
    const taken  = booked.includes(t) || adminBlocked, isSel = sel.time === t;
    const cls    = 'slot-btn' + (past || taken ? (taken ? ' taken' : ' past') : ' available') + (isSel ? ' selected' : '');
    return `<button class="${cls}" data-time="${t}" ${past || taken ? 'disabled' : `onclick="selectTime('${t}')"`}>${t}</button>`;
  }).join('');
}

function selectTime(t) {
  sel.time = t;
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector(`.slot-btn[data-time="${t}"]`)?.classList.add('selected');
  setTimeout(() => goToStep(4), 300);
}

function renderSummaryCard() {
  const card = document.getElementById('summaryCard');
  if (!card || !sel.barber || !sel.date || !sel.time) return;
  card.innerHTML = `<div class="summary-card">
    <div class="summary-row"><span class="summary-label">Profesional</span><span class="summary-value">${sel.barber.name}</span></div>
    <div class="summary-row"><span class="summary-label">Fecha</span><span class="summary-value">${DAY_NAMES_LONG[sel.date.getDay()]}, ${sel.date.getDate()} de ${MONTH_NAMES[sel.date.getMonth()]}</span></div>
    <div class="summary-row"><span class="summary-label">Hora</span><span class="summary-value">${sel.time}</span></div>
  </div>`;
}

document.getElementById('reservaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre   = document.getElementById('nombre').value;
  const telefono = document.getElementById('telefono').value;
  const servicio = document.getElementById('servicio').value;
  const nota     = document.getElementById('nota').value;
  const dk       = dateKey(sel.date);
  saveBooking(sel.barber.id, dk, sel.time);
  try {
    await fetch(N8N_POST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono, servicio, empleado: sel.barber.name, empleadoId: sel.barber.id, fecha: dk, hora: sel.time, nota }),
    });
  } catch (_) {}
  document.getElementById('confirmedDetails').innerHTML = `
    <div class="confirmed-row">&#128100; <strong>${nombre}</strong></div>
    <div class="confirmed-row">&#9986;&#65039; ${sel.barber.name} &middot; ${servicio}</div>
    <div class="confirmed-row">&#128197; ${DAY_NAMES_LONG[sel.date.getDay()]}, ${sel.date.getDate()} de ${MONTH_NAMES[sel.date.getMonth()]}</div>
    <div class="confirmed-row">&#128336; ${sel.time}</div>`;
  goToStep(5);
});

function resetBooking() {
  sel = { barber: null, date: null, time: null };
  weekOffset = 0;
  document.getElementById('reservaForm').reset();
  renderBarbers();
  goToStep(1);
}

renderBarbers();

/* ===== NAVBAR ===== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ===== HAMBURGER ===== */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  const [s1, s2, s3] = hamburger.querySelectorAll('span');
  if (open) {
    s1.style.transform = 'rotate(45deg) translate(5px, 5px)';
    s2.style.opacity = '0';
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
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
  '.servicio-card, .testimonio-card, .galeria-item, .info-item, .feature, .contacto-card'
).forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
  observer.observe(el);
});

/* ===== ACTIVE NAV LINK ===== */
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
  navLinks.querySelectorAll('a[href^="#"]').forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}` ? 'white' : '';
  });
}, { passive: true });


/* ============================================================
   SISTEMA DE RESERVAS CON BARBEROS Y HORARIOS
   ============================================================ */

const BARBERS = [
  {
    id: 1,
    name: 'Nestor',
    specialty: 'Barbero Profesional',
    avatar: 'N',
    color: '#2563eb',
    workDays: [1, 2, 3, 4, 5, 6],   // Lun–Sáb
    startHour: 9.5,                  // 09:30
    endHour: 20.5,                   // 20:30
    satEndHour: 19.5,                // 19:30 los sábados
    lunchStart: 0,
    lunchEnd: 0,
  },
  {
    id: 2,
    name: 'Sebastián',
    specialty: 'Barbero Profesional',
    avatar: 'S',
    color: '#7c3aed',
    workDays: [1, 2, 3, 4, 5, 6],
    startHour: 9.5,
    endHour: 20.5,
    satEndHour: 19.5,
    lunchStart: 0,
    lunchEnd: 0,
  },
  {
    id: 3,
    name: 'Alfonso',
    specialty: 'Barbero Profesional',
    avatar: 'A',
    color: '#059669',
    workDays: [1, 2, 3, 4, 5, 6],
    startHour: 9.5,
    endHour: 20.5,
    satEndHour: 19.5,
    lunchStart: 0,
    lunchEnd: 0,
  },
];

// ── URLs de n8n ──────────────────────────────────────────────
const N8N_GET_URL = 'https://n8n-n8n.zouxyy.easypanel.host/webhook/85644a93-3bf3-4258-b1a6-50ea52a40d8f';
const N8N_POST_URL = 'https://n8n-n8n.zouxyy.easypanel.host/webhook/bf382f5b-f8f5-4df4-b98d-669d4fddb362';
const NEGOCIO_NOMBRE = 'Barberia Aveiro'; // debe coincidir con admin.html
// ─────────────────────────────────────────────────────────────

const SLOT_MINUTES = 30;
const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Estado actual de la reserva
let sel = { barber: null, date: null, time: null };
let weekOffset = 0; // semanas desde hoy

/* ---- Utilidades ---- */
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(str) {
  // str: 'YYYY-MM-DD'
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function mondayOf(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function generateSlots(barber, date) {
  const slots = [];
  const start = barber.startHour * 60;
  const isSat = date && date.getDay() === 6;
  const end = (isSat && barber.satEndHour ? barber.satEndHour : barber.endHour) * 60;
  const ls = barber.lunchStart * 60;
  const le = barber.lunchEnd * 60;
  for (let m = start; m < end; m += SLOT_MINUTES) {
    if (ls < le && m >= ls && m < le) continue;
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

function getBooked(barberId, dk) {
  return JSON.parse(localStorage.getItem(`aveiro_${barberId}_${dk}`) || '[]');
}

function saveBooking(barberId, dk, time) {
  const list = getBooked(barberId, dk);
  if (!list.includes(time)) {
    list.push(time);
    localStorage.setItem(`aveiro_${barberId}_${dk}`, JSON.stringify(list));
  }
}

/* ---- Pasos del wizard ---- */
function goToStep(n) {
  document.querySelectorAll('.booking-step-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`bookStep${n}`).classList.add('active');

  document.querySelectorAll('.progress-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'completed');
    if (s === n) el.classList.add('active');
    else if (s < n) el.classList.add('completed');
  });

  if (n === 2) renderDays();
  if (n === 3) renderSlots();
  if (n === 4) renderSummaryCard();
}

/* ---- Paso 1: Barberos ---- */
function renderBarbers() {
  const grid = document.getElementById('barbersGrid');
  if (!grid) return;
  grid.innerHTML = BARBERS.map(b => {
    const days = b.workDays.map(d => DAY_NAMES_SHORT[d]).join(', ');
    const hours = `${b.startHour}:00–${b.endHour}:00`;
    return `
      <div class="barber-card" data-id="${b.id}" onclick="selectBarber(${b.id})">
        <div class="barber-avatar-lg" style="background:${b.color}18;border-color:${b.color}55;color:${b.color}">${b.avatar}</div>
        <div class="barber-details">
          <strong>${b.name}</strong>
          <span>${b.specialty}</span>
        </div>
        <span class="barber-schedule">${days} · ${hours}</span>
        <div class="barber-check">✓</div>
      </div>`;
  }).join('');
}

function selectBarber(id) {
  sel.barber = BARBERS.find(b => b.id === id);
  sel.date = null;
  sel.time = null;
  weekOffset = 0;
  document.querySelectorAll('.barber-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.barber-card[data-id="${id}"]`).classList.add('selected');
  setTimeout(() => goToStep(2), 350);
}

/* ---- Paso 2: Días ---- */
function renderDays() {
  const grid = document.getElementById('daysGrid');
  const label = document.getElementById('weekLabel');
  if (!grid || !sel.barber) return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const base = mondayOf(today);
  base.setDate(base.getDate() + weekOffset * 7);

  // Mostrar 14 días (2 semanas) a partir de lunes
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });

  label.textContent = `${days[0].getDate()} ${MONTH_NAMES[days[0].getMonth()]} – ${days[13].getDate()} ${MONTH_NAMES[days[13].getMonth()]}`;

  grid.innerHTML = days.map(d => {
    const isPast = d < today;
    const isWork = sel.barber.workDays.includes(d.getDay());
    const disabled = isPast || !isWork;
    const dk = dateKey(d);
    const isSelected = sel.date && dateKey(sel.date) === dk;

    return `<button
      class="day-btn ${disabled ? 'disabled' : 'available'}${isSelected ? ' selected' : ''}"
      data-date="${dk}"
      ${disabled ? 'disabled' : `onclick="selectDate('${dk}')"`}
    >
      <span class="day-name">${DAY_NAMES_SHORT[d.getDay()]}</span>
      <span class="day-num">${d.getDate()}</span>
    </button>`;
  }).join('');

  // Botones semana anterior/siguiente
  document.getElementById('prevWeek').disabled = weekOffset <= 0;
  document.getElementById('prevWeek').style.opacity = weekOffset <= 0 ? '0.3' : '1';
}

document.getElementById('prevWeek').addEventListener('click', () => {
  if (weekOffset > 0) { weekOffset--; renderDays(); }
});

document.getElementById('nextWeek').addEventListener('click', () => {
  if (weekOffset < 6) { weekOffset++; renderDays(); }
});

function selectDate(dk) {
  sel.date = parseDate(dk);
  sel.time = null;
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.querySelector(`.day-btn[data-date="${dk}"]`);
  if (btn) btn.classList.add('selected');
  setTimeout(() => goToStep(3), 300);
}

/* ---- Paso 3: Horas ---- */
async function renderSlots() {
  const grid = document.getElementById('slotsGrid');
  const mini = document.getElementById('summaryMini');
  if (!grid || !sel.barber || !sel.date) return;

  const dk = dateKey(sel.date);

  // Spinner mientras consulta n8n
  grid.innerHTML = '<p class="slots-loading">Consultando disponibilidad...</p>';

  // GET a n8n → devuelve horas ocupadas guardadas en Google Sheets
  let serverBooked = [];
  let serverClosed = false;
  try {
    const res = await fetch(`${N8N_GET_URL}?barbero=${encodeURIComponent(sel.barber.name)}&fecha=${dk}`);
    if (res.ok) {
      const data = await res.json();
      if (data.diaCerrado) { serverClosed = true; }
      else { serverBooked = Array.isArray(data) ? data : (data.horasOcupadas || data.booked || []); }
    }
  } catch (_) {
    // Sin conexión: usa solo localStorage
  }

  // Comprobar bloqueos del panel de admin (localStorage)
  const adminBlocks = JSON.parse(localStorage.getItem(`rl_admin_blocks_${NEGOCIO_NOMBRE?.replace(/\s/g,'_') || 'negocio'}`) || '[]');
  const adminDayClosed = adminBlocks.some(b =>
    b.fecha === dk && b.tipo === 'dia_completo' && (b.empleadoId === 0 || b.empleadoId === sel.barber.id)
  );
  if (adminDayClosed || serverClosed) {
    grid.innerHTML = '<p class="no-slots" style="color:var(--red,#dc2626);font-weight:600;">🔒 Este día está cerrado.</p>';
    return;
  }
  const adminHourBlocks = adminBlocks.filter(b =>
    b.fecha === dk && b.tipo === 'horas' && (b.empleadoId === 0 || b.empleadoId === sel.barber.id)
  );

  // Combinar horas del servidor + reservas locales (sin duplicados)
  const localBooked = getBooked(sel.barber.id, dk);
  const booked = [...new Set([...serverBooked, ...localBooked])];

  const slots = generateSlots(sel.barber, sel.date);
  const now = new Date();
  const isToday = dateKey(now) === dk;

  mini.innerHTML = `<div class="mini-summary">
    <span class="mini-barber" style="background:${sel.barber.color}18;color:${sel.barber.color};border-color:${sel.barber.color}55">✂ ${sel.barber.name}</span>
    <span class="mini-date">📅 ${DAY_NAMES_LONG[sel.date.getDay()]}, ${sel.date.getDate()} de ${MONTH_NAMES[sel.date.getMonth()]}</span>
  </div>`;

  if (!slots.length) {
    grid.innerHTML = '<p class="no-slots">Sin horario disponible este día.</p>';
    return;
  }

  grid.innerHTML = slots.map(t => {
    const [h, m] = t.split(':').map(Number);
    const past = isToday && (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes()));
    const adminBlocked = adminHourBlocks.some(b => t >= b.inicio && t < b.fin);
    const taken = booked.includes(t) || adminBlocked;
    const isSelected = sel.time === t;

    let cls = 'slot-btn';
    if (past || taken) cls += taken ? ' taken' : ' past';
    else cls += ' available';
    if (isSelected) cls += ' selected';

    const disabled = past || taken;
    return `<button class="${cls}" data-time="${t}" ${disabled ? 'disabled' : `onclick="selectTime('${t}')"`}>${t}</button>`;
  }).join('');
}

function selectTime(t) {
  sel.time = t;
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.querySelector(`.slot-btn[data-time="${t}"]`);
  if (btn) btn.classList.add('selected');
  setTimeout(() => goToStep(4), 300);
}

/* ---- Paso 4: Datos ---- */
function renderSummaryCard() {
  const card = document.getElementById('summaryCard');
  if (!card || !sel.barber || !sel.date || !sel.time) return;
  card.innerHTML = `
    <div class="summary-card">
      <div class="summary-row">
        <span class="summary-label">Barbero</span>
        <span class="summary-value">${sel.barber.name}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Fecha</span>
        <span class="summary-value">${DAY_NAMES_LONG[sel.date.getDay()]}, ${sel.date.getDate()} de ${MONTH_NAMES[sel.date.getMonth()]}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Hora</span>
        <span class="summary-value">${sel.time}</span>
      </div>
    </div>`;
}

/* ---- Paso 5: Confirmación ---- */
document.getElementById('reservaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const telefono = document.getElementById('telefono').value;
  const servicio = document.getElementById('servicio').value;
  const nota = document.getElementById('nota').value;
  const dk = dateKey(sel.date);

  // Bloquear hora localmente de inmediato
  saveBooking(sel.barber.id, dk, sel.time);

  // Enviar reserva a n8n → Google Sheets + WhatsApp
  try {
    await fetch(N8N_POST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        telefono,
        servicio,
        barbero: sel.barber.name,
        barberoId: sel.barber.id,
        fecha: dk,
        hora: sel.time,
        nota,
      }),
    });
  } catch (_) {
    // La reserva queda guardada localmente aunque falle la red
  }

  document.getElementById('confirmedDetails').innerHTML = `
    <div class="confirmed-row">👤 <strong>${nombre}</strong></div>
    <div class="confirmed-row">✂️ ${sel.barber.name} · ${servicio}</div>
    <div class="confirmed-row">📅 ${DAY_NAMES_LONG[sel.date.getDay()]}, ${sel.date.getDate()} de ${MONTH_NAMES[sel.date.getMonth()]}</div>
    <div class="confirmed-row">🕐 ${sel.time}</div>
  `;

  goToStep(5);
});

function resetBooking() {
  sel = { barber: null, date: null, time: null };
  weekOffset = 0;
  document.getElementById('reservaForm').reset();
  renderBarbers();
  goToStep(1);
}

/* ---- Inicializar ---- */
renderBarbers();

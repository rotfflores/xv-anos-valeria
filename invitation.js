const event = window.EVENT;
const requestedPasses = new URLSearchParams(window.location.search).get('pases');
const parsedPasses = Number(requestedPasses || event.passes);
const passes = Number.isInteger(parsedPasses) && parsedPasses >= 1 && parsedPasses <= 100 ? parsedPasses : event.passes;
const put = (id, value) => { const element = document.getElementById(id); if (value && element) element.textContent = value; };
put('event-name', event.name);
put('pass-count', `${passes} ${passes === 1 ? 'persona' : 'personas'}`);
document.title = `${event.name} · Mis XV años`;
put('event-time', event.time);
put('event-venue', event.venue);
if (/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
  const date = new Date(`${event.date}T12:00:00`);
  if (!Number.isNaN(date.getTime())) {
    const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1);
    put('event-weekday', capitalize(date.toLocaleDateString('es-MX', { weekday: 'long' })));
    put('event-month', capitalize(date.toLocaleDateString('es-MX', { month: 'long' })));
    put('event-day', date.getDate());
  }
}
const externalLink = (id, url) => {
  const link = document.getElementById(id);
  if (/^https:\/\//.test(url)) { link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
};
externalLink('reception-link', event.mapsUrl);
externalLink('church-link', event.churchUrl);
// Los botones de la portada navegan dentro de la invitación.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.invitation a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const section = document.getElementById(link.hash.slice(1));
    if (!section) return;
    e.preventDefault();
    section.classList.remove('is-waiting');
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', link.hash);
  });
});
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.remove('is-waiting');
      else if (entry.boundingClientRect.top >= window.innerHeight && !entry.target.contains(document.activeElement)) entry.target.classList.add('is-waiting');
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal, .location-card, .detail-grid article, .family > div').forEach(section => {
    section.classList.add('reveal');
    if (section.getBoundingClientRect().top > window.innerHeight) section.classList.add('is-waiting');
    observer.observe(section);
  });
}
// Confirmación local; el panel y la base de datos se conectarán después.
const form = document.getElementById('rsvp-form');
const nameInput = document.getElementById('guest-name');
const attendanceInput = document.getElementById('attendance');
const countInput = document.getElementById('guest-count');
const countField = document.getElementById('guest-count-field');
for (let n = 1; n <= passes; n++) {
  const option = document.createElement('option');
  option.value = String(n);
  option.textContent = `${n} ${n === 1 ? 'persona' : 'personas'}`;
  countInput.appendChild(option);
}
countInput.value = String(passes);
put('pass-help', `Puedes confirmar hasta ${passes} ${passes === 1 ? 'persona' : 'personas'} con este pase.`);
const updateAttendance = () => {
  const attending = attendanceInput.value === 'yes';
  countField.hidden = !attending;
  countInput.disabled = !attending;
};
attendanceInput.addEventListener('change', updateAttendance);
const invitationId = new URLSearchParams(window.location.search).get('invitacion') || 'general';
const storageKey = `xv-rsvp:${event.name}:${event.date}:${invitationId}:${passes}`;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && typeof saved.name === 'string' && ['yes', 'no'].includes(saved.attendance) && Number.isInteger(saved.count) && saved.count >= 0 && saved.count <= passes) {
    nameInput.value = saved.name;
    attendanceInput.value = saved.attendance;
    if (saved.count > 0) countInput.value = String(saved.count);
    put('confirmation-status', 'Tienes una respuesta guardada en este navegador. Puedes modificarla; aún no se ha enviado a la anfitriona.');
  }
} catch { /* El formulario sigue disponible si no hay almacenamiento local. */ }
updateAttendance();
nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
form.addEventListener('submit', e => {
  e.preventDefault();
  nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Escribe tu nombre completo.');
  if (!form.reportValidity()) return;
  const count = attendanceInput.value === 'yes' ? Number(countInput.value) : 0;
  if (!['yes', 'no'].includes(attendanceInput.value) || !Number.isInteger(count) || count < 0 || count > passes || (attendanceInput.value === 'yes' && count < 1)) {
    put('confirmation-status', 'Selecciona una cantidad válida dentro de los pases asignados.');
    return;
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify({ name: nameInput.value.trim(), attendance: attendanceInput.value, count, passes, updatedAt: new Date().toISOString() }));
    put('confirmation-status', count ? `Respuesta guardada en este navegador para ${count} ${count === 1 ? 'persona' : 'personas'}. Aún no se envía a la anfitriona.` : 'Tu respuesta de que no podrás asistir se guardó en este navegador. Aún no se envía a la anfitriona.');
  } catch {
    put('confirmation-status', 'No fue posible guardar tu respuesta en este navegador. Inténtalo de nuevo con el almacenamiento local habilitado.');
  }
});
// La hora incluye la zona de Durango para coincidir en cualquier dispositivo.
const countdownTarget = new Date(event.startsAt).getTime();
const countdownParts = now => {
  const remaining = Math.max(0, Math.floor((countdownTarget - now) / 1000));
  return { days: Math.floor(remaining / 86400), hours: Math.floor(remaining / 3600) % 24, minutes: Math.floor(remaining / 60) % 60, seconds: remaining % 60, remaining };
};
const updateCountdown = () => {
  const parts = countdownParts(Date.now());
  for (const unit of ['days', 'hours', 'minutes', 'seconds']) put(`count-${unit}`, String(parts[unit]).padStart(2, '0'));
  if (!parts.remaining) put('countdown-note', '¡Llegó el gran día! Gracias por acompañarme.');
};
if (Number.isFinite(countdownTarget)) {
  updateCountdown();
  const countdownInterval = setInterval(() => {
    updateCountdown();
    if (Date.now() >= countdownTarget) clearInterval(countdownInterval);
  }, 1000);
}

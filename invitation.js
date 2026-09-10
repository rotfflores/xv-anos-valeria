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
put('event-address', event.address);
if (/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
  const date = new Date(`${event.date}T12:00:00`);
  if (!Number.isNaN(date.getTime())) {
    const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1);
    put('event-weekday', capitalize(date.toLocaleDateString('es-MX', { weekday: 'long' })));
    put('event-month', capitalize(date.toLocaleDateString('es-MX', { month: 'long' })));
    put('event-day', date.getDate());
  }
}
const dialog = document.getElementById('pending-dialog');
const bind = (id, url, title, message) => {
  const link = document.getElementById(id);
  if (url) {
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  } else {
    link.addEventListener('click', e => {
      e.preventDefault();
      put('dialog-title', title);
      put('dialog-message', message);
      dialog.showModal();
    });
  }
};
const mapsUrl = /^https:\/\//.test(event.mapsUrl) ? event.mapsUrl : event.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venue, event.address].filter(Boolean).join(', '))}` : '';
const phone = event.whatsapp.replace(/\D/g, '');
bind('map-link', mapsUrl, 'Ubicación por confirmar', 'Pronto compartiremos la dirección para que nos acompañes.');
bind('reception-link', mapsUrl);
bind('church-link', event.churchUrl);
bind('rsvp-link', /^\d{10,15}$/.test(phone) ? `https://wa.me/${phone}?text=${encodeURIComponent(`¡Hola! Quiero confirmar mi asistencia a los XV años de ${event.name}. Mi pase es para ${passes} ${passes === 1 ? 'persona' : 'personas'}. Mi nombre es: `)}` : '', 'Confirmación de asistencia', 'Pronto estará disponible el contacto para confirmar tu asistencia.');
document.querySelectorAll('.close, .dialog-ok').forEach(button => button.addEventListener('click', () => dialog.close()));

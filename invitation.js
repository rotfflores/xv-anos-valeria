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
  const revealElements = [...document.querySelectorAll('.reveal, .location-card, .detail-grid article, .family > div')];
  const setRevealState = section => {
    if (section.contains(document.activeElement)) return;
    section.classList.add('reveal');
    const rect = section.getBoundingClientRect();
    if (rect.bottom < -12) {
      section.classList.add('is-waiting', 'from-above');
      section.classList.remove('from-below');
    } else if (rect.top > window.innerHeight + 12) {
      section.classList.add('is-waiting', 'from-below');
      section.classList.remove('from-above');
    } else if (rect.bottom > 24 && rect.top < window.innerHeight - 24) {
      section.classList.remove('is-waiting', 'from-above', 'from-below');
    }
  };
  let revealFrame = 0;
  const refreshReveals = () => {
    revealElements.forEach(setRevealState);
    revealFrame = 0;
  };
  const requestRevealRefresh = () => {
    if (!revealFrame) revealFrame = requestAnimationFrame(refreshReveals);
  };
  const observer = new IntersectionObserver(requestRevealRefresh, { threshold: [0, 0.08], rootMargin: '-4% 0px -4% 0px' });
  revealElements.forEach(section => {
    setRevealState(section);
    observer.observe(section);
  });
  addEventListener('scroll', requestRevealRefresh, { passive: true });
  addEventListener('resize', requestRevealRefresh, { passive: true });
}
// Confirmación local; el panel y la base de datos se conectarán después.
const form = document.getElementById('rsvp-form');
const acceptButton = document.getElementById('accept-invitation');
const nameInput = document.getElementById('guest-name');
const attendanceInput = document.getElementById('attendance');
const countInput = document.getElementById('guest-count');
const countField = document.getElementById('guest-count-field');
const attendeeNames = document.getElementById('attendee-names');
const primaryGuestLabel = document.getElementById('primary-guest-label');
const guestNames = document.getElementById('guest-names');
const messageInput = document.getElementById('guest-message');
const thankYou = document.getElementById('thank-you');

const launchFireworks = () => {
  if (reducedMotion.matches) return;
  const canvas = document.getElementById('celebration-canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const pixelRatio = Math.min(devicePixelRatio || 1, 2);
  const resizeCanvas = () => {
    canvas.width = innerWidth * pixelRatio;
    canvas.height = innerHeight * pixelRatio;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };
  resizeCanvas();
  canvas.classList.add('is-active');
  const colors = ['#f6c66f', '#f39a8f', '#fff3d0', '#d66e67', '#c49a5a'];
  const particles = [];
  const burst = (x, y, amount = 54) => {
    for (let index = 0; index < amount; index += 1) {
      const angle = Math.PI * 2 * index / amount + Math.random() * .12;
      const speed = 2.1 + Math.random() * 4.8;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, decay: .012 + Math.random() * .011, size: 1.5 + Math.random() * 2.4, color: colors[index % colors.length] });
    }
  };
  burst(innerWidth * .28, innerHeight * .32);
  setTimeout(() => burst(innerWidth * .72, innerHeight * .26, 60), 180);
  setTimeout(() => burst(innerWidth * .5, innerHeight * .46, 64), 390);
  const startedAt = performance.now();
  const draw = now => {
    context.clearRect(0, 0, innerWidth, innerHeight);
    particles.forEach(particle => {
      particle.vy += .045;
      particle.vx *= .992;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      if (particle.life <= 0) return;
      context.globalAlpha = particle.life;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });
    context.globalAlpha = 1;
    if (now - startedAt < 2600 && particles.some(particle => particle.life > 0)) requestAnimationFrame(draw);
    else {
      context.clearRect(0, 0, innerWidth, innerHeight);
      canvas.classList.remove('is-active');
    }
  };
  requestAnimationFrame(draw);
};

acceptButton.addEventListener('click', () => {
  launchFireworks();
  form.hidden = false;
  form.classList.remove('form-opening');
  void form.offsetWidth;
  form.classList.add('form-opening');
  acceptButton.setAttribute('aria-expanded', 'true');
  acceptButton.classList.add('is-accepted');
  acceptButton.innerHTML = '<span aria-hidden="true">✓</span> Invitación aceptada';
  setTimeout(() => {
    form.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    nameInput.focus({ preventScroll: true });
  }, reducedMotion.matches ? 0 : 480);
}, { once: true });
for (let n = 1; n <= passes; n++) {
  const option = document.createElement('option');
  option.value = String(n);
  option.textContent = `${n} ${n === 1 ? 'persona' : 'personas'}`;
  countInput.appendChild(option);
}
countInput.value = String(passes);
put('pass-help', `Puedes confirmar hasta ${passes} ${passes === 1 ? 'persona' : 'personas'} con este pase.`);
const renderGuestInputs = (count, values = []) => {
  const currentValues = [...guestNames.querySelectorAll('input')].map(input => input.value);
  guestNames.replaceChildren();
  for (let number = 2; number <= count; number += 1) {
    const field = document.createElement('div');
    field.className = 'guest-name-field';
    const label = document.createElement('label');
    label.htmlFor = `guest-name-${number}`;
    label.textContent = `Nombre de la persona ${number}`;
    const input = document.createElement('input');
    input.id = `guest-name-${number}`;
    input.name = `guest-${number}`;
    input.autocomplete = 'name';
    input.required = true;
    input.maxLength = 100;
    input.placeholder = 'Escribe el nombre completo';
    input.value = values[number - 2] || currentValues[number - 2] || '';
    input.addEventListener('input', () => input.setCustomValidity(''));
    field.append(label, input);
    guestNames.appendChild(field);
  }
};
renderGuestInputs(passes);
countInput.addEventListener('change', () => renderGuestInputs(Number(countInput.value)));
const updateAttendance = () => {
  const attending = attendanceInput.value === 'yes';
  countField.hidden = !attending;
  guestNames.hidden = !attending;
  primaryGuestLabel.textContent = attending ? 'Nombre de la persona 1' : 'Tu nombre completo';
  attendeeNames.classList.toggle('is-declining', !attending);
  countInput.disabled = !attending;
  guestNames.querySelectorAll('input').forEach(input => { input.disabled = !attending; });
};
attendanceInput.addEventListener('change', updateAttendance);
const invitationId = new URLSearchParams(window.location.search).get('invitacion') || 'general';
const storageKey = `xv-rsvp:${event.name}:${event.date}:${invitationId}:${passes}`;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && typeof saved.name === 'string' && ['yes', 'no'].includes(saved.attendance) && Number.isInteger(saved.count) && saved.count >= 0 && saved.count <= passes) {
    nameInput.value = saved.name;
    attendanceInput.value = saved.attendance;
    if (saved.count > 0) {
      countInput.value = String(saved.count);
      renderGuestInputs(saved.count, Array.isArray(saved.guests) ? saved.guests.slice(1) : []);
    }
    if (typeof saved.message === 'string') messageInput.value = saved.message;
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
  const additionalInputs = [...guestNames.querySelectorAll('input')];
  const guests = attendanceInput.value === 'yes' ? [nameInput.value.trim(), ...additionalInputs.map(input => input.value.trim())] : [nameInput.value.trim()];
  const emptyGuest = additionalInputs.find(input => !input.value.trim());
  additionalInputs.forEach(input => input.setCustomValidity(input.value.trim() ? '' : 'Escribe el nombre completo.'));
  if (attendanceInput.value === 'yes' && emptyGuest) {
    emptyGuest.reportValidity();
    emptyGuest.focus();
    return;
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify({ name: nameInput.value.trim(), guests, attendance: attendanceInput.value, count, passes, message: messageInput.value.trim(), updatedAt: new Date().toISOString() }));
    put('confirmation-status', count ? `Respuesta guardada en este navegador para ${count} ${count === 1 ? 'persona' : 'personas'}. Aún no se envía a la anfitriona.` : 'Tu respuesta de que no podrás asistir se guardó en este navegador. Aún no se envía a la anfitriona.');
    put('thank-you-copy', count ? `Gracias, ${nameInput.value.trim()}. Será una alegría compartir este día con ${count === 1 ? 'contigo' : 'ustedes'}.` : `Gracias por avisarnos, ${nameInput.value.trim()}. Agradecemos mucho tu respuesta.`);
    thankYou.hidden = false;
    thankYou.classList.remove('is-visible');
    void thankYou.offsetWidth;
    thankYou.classList.add('is-visible');
    form.classList.remove('form-opening');
    form.classList.add('form-complete');
    acceptButton.hidden = true;
    if (reducedMotion.matches) form.hidden = true;
    else setTimeout(() => { form.hidden = true; }, 440);
    thankYou.focus({ preventScroll: true });
    thankYou.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
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
  for (const unit of ['days', 'hours', 'minutes', 'seconds']) {
    const digit = document.getElementById(`count-${unit}`);
    const value = String(parts[unit]).padStart(2, '0');
    if (digit && digit.textContent !== value) {
      digit.textContent = value;
      if (!reducedMotion.matches) {
        digit.classList.remove('digit-change');
        void digit.offsetWidth;
        digit.classList.add('digit-change');
      }
    }
  }
  if (!parts.remaining) put('countdown-note', '¡Llegó el gran día! Gracias por acompañarme.');
};
if (Number.isFinite(countdownTarget)) {
  updateCountdown();
  const countdownInterval = setInterval(() => {
    updateCountdown();
    if (Date.now() >= countdownTarget) clearInterval(countdownInterval);
  }, 1000);
}

// El pronóstico detallado se consulta cuando la fecha entra en el rango de 16 días.
const weatherSummary = document.getElementById('weather-summary');
const weatherFacts = document.getElementById('weather-facts');
const weatherAdvice = document.getElementById('weather-advice');
const weatherUpdate = document.getElementById('weather-update');
const weatherDescription = code => {
  if (code === 0) return 'cielo despejado';
  if (code <= 3) return 'cielo parcialmente nublado';
  if (code <= 48) return 'niebla';
  if (code <= 67) return 'posible lluvia';
  if (code <= 77) return 'precipitación fría';
  if (code <= 82) return 'chubascos';
  return 'posibles tormentas';
};
const weatherDate = new Date(`${event.date}T12:00:00-06:00`);
const forecastAvailable = new Date(weatherDate);
forecastAvailable.setDate(forecastAvailable.getDate() - 16);
const daysUntilEvent = Math.ceil((weatherDate.getTime() - Date.now()) / 86400000);
const showForecast = async () => {
  try {
    const endpoint = new URL('https://api.open-meteo.com/v1/forecast');
    endpoint.search = new URLSearchParams({ latitude: '24.0393', longitude: '-104.6035', hourly: 'temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m', timezone: 'America/Mexico_City', start_date: event.date, end_date: event.date });
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('forecast unavailable');
    const data = await response.json();
    const indices = data.hourly.time.map((time, index) => ({ time, index })).filter(item => /T(19|20|21):00$/.test(item.time)).map(item => item.index);
    if (!indices.length) throw new Error('event hours unavailable');
    const values = key => indices.map(index => Number(data.hourly[key][index])).filter(Number.isFinite);
    const temperatures = values('temperature_2m');
    const rain = Math.max(...values('precipitation_probability'));
    const wind = Math.max(...values('wind_speed_10m'));
    const codes = values('weather_code');
    if (!temperatures.length || !Number.isFinite(rain) || !Number.isFinite(wind) || !codes.length) throw new Error('forecast data incomplete');
    const minTemperature = Math.round(Math.min(...temperatures));
    const maxTemperature = Math.round(Math.max(...temperatures));
    weatherSummary.textContent = `Se espera ${weatherDescription(Math.max(...codes))} durante la celebración.`;
    put('weather-temperature', `${minTemperature}–${maxTemperature} °C`);
    put('weather-rain', `${Math.round(rain)}%`);
    put('weather-wind', `${Math.round(wind)} km/h`);
    const recommendations = [];
    if (minTemperature <= 14) recommendations.push('lleva un chal o abrigo ligero');
    if (rain >= 35) recommendations.push('considera un paraguas compacto');
    if (wind >= 25) recommendations.push('elige un peinado resistente al viento');
    if (!recommendations.length) recommendations.push('elige un atuendo cómodo para disfrutar toda la noche');
    weatherAdvice.textContent = `Recomendación: ${recommendations.join(' y ')}.`;
    weatherFacts.hidden = false;
    weatherUpdate.textContent = 'Pronóstico para las 7:00–9:00 p. m., actualizado automáticamente con Open-Meteo.';
  } catch {
    weatherSummary.textContent = 'El pronóstico todavía no se puede consultar.';
    weatherUpdate.textContent = 'Vuelve a revisar esta sección más cerca de la celebración.';
  }
};
if (weatherSummary && Number.isFinite(weatherDate.getTime())) {
  if (daysUntilEvent >= 0 && daysUntilEvent <= 16) showForecast();
  else if (daysUntilEvent > 16) {
    weatherSummary.textContent = `El pronóstico detallado estará disponible desde el ${forecastAvailable.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}.`;
  } else {
    weatherSummary.textContent = 'La celebración ya tuvo lugar. Gracias por acompañarnos.';
    weatherAdvice.hidden = true;
  }
}

// Movimiento muy ligero de los adornos florales durante el recorrido.
if (!reducedMotion.matches) {
  const parallaxDecorations = [...document.querySelectorAll('[data-parallax]')];
  let parallaxFrame = 0;
  const updateParallax = () => {
    const viewportMiddle = window.innerHeight / 2;
    parallaxDecorations.forEach(decoration => {
      const rect = decoration.parentElement.getBoundingClientRect();
      const distance = rect.top + rect.height / 2 - viewportMiddle;
      const speed = Number(decoration.dataset.parallax) || 0;
      decoration.style.setProperty('--parallax-y', `${Math.max(-24, Math.min(24, -distance * speed))}px`);
    });
    parallaxFrame = 0;
  };
  const requestParallax = () => {
    if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
  };
  updateParallax();
  addEventListener('scroll', requestParallax, { passive: true });
  addEventListener('resize', requestParallax, { passive: true });
}

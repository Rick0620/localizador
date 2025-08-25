// Formato localizado (por defecto, el del navegador)
const locale = navigator.language || "es-PE";

const $time   = document.getElementById("time");
const $date   = document.getElementById("date");
const $tz     = document.getElementById("tz");
const $loc    = document.getElementById("location");
const $coords = document.getElementById("coords");
const $btn    = document.getElementById("locBtn");

// ====== HORA y FECHA ======
function updateClock() {
  const now = new Date();

  // Hora con segundos (ej. 14:05:09)
  const timeStr = new Intl.DateTimeFormat(locale, {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false
  }).format(now);
  $time.textContent = timeStr;

  // Fecha larga (ej. lunes, 25 de agosto de 2025)
  const dateStr = new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(now);
  $date.textContent = dateStr;

  // Zona horaria legible
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "—";
  $tz.textContent = `Zona horaria: ${tz}`;
}
updateClock();
setInterval(updateClock, 1000);

// ====== UBICACIÓN ======
async function reverseGeocode(lat, lon) {
  // Intento de obtener ciudad/país usando Nominatim (OpenStreetMap).
  // Nota: requiere conexión a Internet y puede fallar por políticas del servicio.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=${encodeURIComponent(locale)}&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, {
    headers: {
      // Ayuda a ser un buen ciudadano al consumir el servicio
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error("Falló la geocodificación");
  const data = await res.json();

  // Intentar campos útiles: city/town/village + state + country
  const addr = data.address || {};
  const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb;
  const state = addr.state || addr.region;
  const country = addr.country;
  return [city, state, country].filter(Boolean).join(", ");
}

async function getLocation() {
  $loc.textContent = "Detectando…";
  $coords.textContent = "—";

  if (!("geolocation" in navigator)) {
    $loc.textContent = "Geolocalización no disponible en este navegador.";
    return;
  }

  // Obtener coordenadas
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude: lat, longitude: lon } = pos.coords;
    $coords.textContent = `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`;

    try {
      const place = await reverseGeocode(lat, lon);
      $loc.textContent = place || "Ubicación aproximada no disponible.";
    } catch (e) {
      // Fallback: mostrar sólo coordenadas y zona horaria
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "—";
      $loc.textContent = `Ubicación aproximada (zona: ${tz})`;
    }
  }, (err) => {
    // Manejo de errores de permiso o precisión
    let msg = "No se pudo obtener la ubicación.";
    if (err.code === err.PERMISSION_DENIED) msg = "Permiso de ubicación denegado.";
    if (err.code === err.POSITION_UNAVAILABLE) msg = "Ubicación no disponible.";
    if (err.code === err.TIMEOUT) msg = "Tiempo de espera agotado.";
    $loc.textContent = msg;
  }, {
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 60_000
  });
}

// Botón para refrescar manualmente
$btn.addEventListener("click", getLocation);

// Primer intento al cargar
getLocation();

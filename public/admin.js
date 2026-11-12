// Dropdowns en cascada: al elegir el padre, el hijo se carga desde la API JSON.
// (La coherencia padre-hijo se vuelve a verificar en el servidor al guardar.)
(function () {
  const selects = document.querySelectorAll('select[data-depends-on]');

  async function load(child, keepSelected) {
    const parent = document.getElementById(child.dataset.dependsOn);
    const selected = keepSelected ? child.dataset.selected : '';
    child.innerHTML = '<option value="">— Seleccione —</option>';
    if (!parent || !parent.value) { child.disabled = true; child.dispatchEvent(new Event('change')); return; }
    child.disabled = false;
    const url = child.dataset.url + '?' + encodeURIComponent(child.dataset.param) + '=' + encodeURIComponent(parent.value);
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      const items = res.ok ? await res.json() : [];
      for (const it of items) {
        const o = document.createElement('option');
        o.value = it.value; o.textContent = it.label;
        if (String(it.value) === String(selected)) o.selected = true;
        child.appendChild(o);
      }
      if (!items.length) child.options[0].textContent = '— Sin opciones disponibles —';
    } catch { child.options[0].textContent = '— Error al cargar —'; }
    child.dispatchEvent(new Event('change'));
  }

  selects.forEach((child) => {
    const parent = document.getElementById(child.dataset.dependsOn);
    if (!parent) return;
    parent.addEventListener('change', () => load(child, false));
  });
  // Carga inicial (edición o reenvío con errores): conserva la selección guardada.
  selects.forEach((child) => load(child, true));
})();

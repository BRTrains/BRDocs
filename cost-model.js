(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fuel = {
    steam: [1, 1], diesel: [.57, .50], electric: [.49, .45], 'bi-mode': [.69, .40],
    'tri-mode': [.80, .35], hydrogen: [.66, .56], battery: [.60, .38], 'gas-turbine': [.62, .62],
    unpowered: [.30, .20]
  };
  const wagon = {
    freight: [.25, .10], tank: [.35, .15], refrigerated: [.45, .20], coach: [.55, .30],
    sleeper: [.70, .35], dvt: [.75, .40]
  };
  const names = {locomotive:'Locomotive', multiple_unit:'Multiple unit', coach:'Coach', wagon:'Freight wagon'};
  const form = `
    <section class="cost-model-card">
      <div class="cost-model-form">
        <div class="cost-model-field"><label for="cost-train-type">Vehicle type</label><select id="cost-train-type"><option value="locomotive">Locomotive</option><option value="multiple_unit">Multiple unit</option><option value="coach">Coach</option><option value="wagon">Freight wagon</option></select></div>
        <div class="cost-model-field"><label for="cost-speed">Speed <output id="cost-speed-value">100</output> mph</label><input id="cost-speed" type="number" min="1" max="200" value="100"></div>
        <div class="cost-model-field"><label for="cost-power">Power <output id="cost-power-value">2000</output> hp</label><input id="cost-power" type="number" min="0" max="21000" value="2000"></div>
        <div class="cost-model-field"><label for="cost-capacity">Capacity <output id="cost-capacity-value">80</output></label><input id="cost-capacity" type="number" min="0" max="120" value="80"></div>
        <div class="cost-model-field"><label for="cost-size">Size <output id="cost-size-value">1</output></label><input id="cost-size" type="number" min="1" max="8" value="1"></div>
        <div class="cost-model-field"><label for="cost-vehicles">Formation cars <output id="cost-vehicles-value">1</output></label><input id="cost-vehicles" type="number" min="1" max="32" value="1"></div>
        <div class="cost-model-field"><label for="cost-fuel">Fuel / power type</label><select id="cost-fuel">${Object.keys(fuel).map(key => `<option value="${key}">${key.replace('-', ' ')}</option>`).join('')}</select></div>
        <div class="cost-model-field"><label for="cost-wagon">Unpowered stock type</label><select id="cost-wagon">${Object.keys(wagon).map(key => `<option value="${key}">${key}</option>`).join('')}</select></div>
      </div>
      <div class="cost-model-controls">
        <label for="cost-runtime-multiplier">Runtime multiplier <output id="cost-runtime-value">1.00×</output></label>
        <input id="cost-runtime-multiplier" type="range" min="0.25" max="4" step="0.01" value="1">
        <label for="cost-score-max">Score maximum <output id="cost-score-max-value">16,000</output></label>
        <input id="cost-score-max" type="range" min="1000" max="16000" step="100" value="16000">
      </div>
      <div class="cost-model-basecosts">
        <h3>OpenTTD base-cost exponents</h3>
        <p>Each exponent applies the NML base-cost adjustment <code>base × 2<sup>exponent</sup></code>.</p>
        <div class="cost-model-base-grid">
          <label>Powered purchase <output id="cost-train-base-exp-value">−2</output><input id="cost-train-base-exp" type="range" min="-8" max="4" step="1" value="-2"></label>
          <label>Wagon purchase <output id="cost-wagon-base-exp-value">+1</output><input id="cost-wagon-base-exp" type="range" min="-8" max="4" step="1" value="1"></label>
          <label>Steam running <output id="cost-steam-running-exp-value">−2</output><input id="cost-steam-running-exp" type="range" min="-8" max="4" step="1" value="-2"></label>
          <label>Diesel running <output id="cost-diesel-running-exp-value">−4</output><input id="cost-diesel-running-exp" type="range" min="-8" max="4" step="1" value="-4"></label>
        </div>
      </div>
      <div id="cost-model-output" class="cost-model-output" aria-live="polite"></div>
    </section>
    <p class="cost-model-note">The calculator mirrors BRBuild’s current model. OpenTTD uses a £400,000 purchase base for powered train vehicles and £2,000 for wagons/coaches. The maximum is normally fixed at 16,000 in BRBuild; the slider is provided for calibration experiments.</p>`;
  const page = {title:'Cost model calculator', intro:'Enter representative vehicle data and see the generated purchase and running-cost callback values.', body:`<p>Use this tool to sanity-check the relative position of wagons, coaches, locomotives and multiple units before changing BRBuild’s constants. The callback values are the factors emitted to NewGRF; the pound figures use OpenTTD’s no-inflation base prices.</p>${form}`};
  maintainerPages['cost-model'] = page;
  window.maintainerPageHooks = window.maintainerPageHooks || {};
  window.maintainerPageHooks['cost-model'] = () => {
    const root = document.querySelector('.cost-model-card');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = 'true';
    const get = id => root.querySelector(`#${id}`);
    const number = id => Number(get(id).value) || 0;
    const money = value => `£${Math.round(value).toLocaleString('en-GB')}`;
    const update = () => {
      const type = get('cost-train-type').value;
      const speed = Math.max(1, number('cost-speed'));
      const power = Math.max(0, number('cost-power'));
      const capacity = Math.max(0, number('cost-capacity'));
      const size = Math.max(1, number('cost-size'));
      const vehicles = Math.max(1, number('cost-vehicles'));
      const max = number('cost-score-max') || 16000;
      const runtime = Number(get('cost-runtime-multiplier').value);
      const exponent = id => Number(get(id).value);
      const powerPurchaseBase = 400000 * (2 ** exponent('cost-train-base-exp'));
      const wagonPurchaseBase = 2000 * (2 ** exponent('cost-wagon-base-exp'));
      const steamRunningBase = 5600 * (2 ** exponent('cost-steam-running-exp'));
      const dieselRunningBase = 5200 * (2 ** exponent('cost-diesel-running-exp'));
      const speedPart = Math.min(1, Math.max(0, speed / 200));
      const powerPart = Math.min(1, Math.max(0, power / 21000));
      const capacityPart = Math.min(1, Math.max(0, capacity / 120));
      const sizePart = Math.min(1, Math.max(0, size / 8));
      let base;
      if (type === 'wagon') base = 4200 * (1 + .25 * speedPart + .50 * capacityPart + .15 * sizePart);
      else if (type === 'coach') base = 3300 * (1 + .25 * speedPart + .50 * capacityPart + .10 * sizePart);
      else if (type === 'multiple_unit') base = 20 / vehicles + 90 + 15 * speedPart + 35 * powerPart + 10 * capacityPart;
      else base = 180 + 80 * powerPart + 40 * speedPart + 10 * sizePart;
      const [purchaseFuel, runningFuel] = fuel[get('cost-fuel').value];
      const [purchaseWagon, runningWagon] = wagon[get('cost-wagon').value];
      const purchase = base * purchaseFuel * (type === 'locomotive' || type === 'multiple_unit' ? 1 : purchaseWagon);
      const running = base * runningFuel * (type === 'locomotive' || type === 'multiple_unit' ? 1 : runningWagon);
      const purchaseCallback = Math.min(max, Math.round(purchase)) * runtime;
      const runningCallback = Math.min(max, Math.round(running)) * runtime;
      const powered = type === 'locomotive' || type === 'multiple_unit';
      const purchaseBase = powered ? powerPurchaseBase : wagonPurchaseBase;
      const runningFuelName = get('cost-fuel').value;
      const runningBase = runningFuelName === 'steam' ? steamRunningBase : runningFuelName === 'diesel' || runningFuelName === 'unpowered' ? dieselRunningBase : 4800;
      const formation = type === 'multiple_unit' ? vehicles : 1;
      root.querySelector('#cost-speed-value').textContent = speed;
      root.querySelector('#cost-power-value').textContent = power.toLocaleString('en-GB');
      root.querySelector('#cost-capacity-value').textContent = capacity;
      root.querySelector('#cost-size-value').textContent = size;
      root.querySelector('#cost-vehicles-value').textContent = vehicles;
      root.querySelector('#cost-runtime-value').textContent = `${runtime.toFixed(2)}×`;
      root.querySelector('#cost-score-max-value').textContent = max.toLocaleString('en-GB');
      ['cost-train-base-exp','cost-wagon-base-exp','cost-steam-running-exp','cost-diesel-running-exp'].forEach(id => { const value=exponent(id); root.querySelector(`#${id}-value`).textContent=value>0?`+${value}`:`${value}`; });
      root.querySelector('#cost-model-output').innerHTML = `<div class="cost-result"><span>Unscaled score</span><strong>${Math.round(base).toLocaleString('en-GB')}</strong></div><div class="cost-result"><span>Purchase callback</span><strong>${Math.round(purchaseCallback).toLocaleString('en-GB')}</strong><small>${money(purchaseBase * purchaseCallback / 256)} per vehicle · ${money(purchaseBase * purchaseCallback * formation / 256)} formation</small></div><div class="cost-result"><span>Running-cost callback</span><strong>${Math.round(runningCallback).toLocaleString('en-GB')}</strong><small>${money(runningBase * runningCallback / 256)} per vehicle · ${money(runningBase * runningCallback * formation / 256)} formation</small></div><div class="cost-result"><span>Adjusted bases</span><strong>${money(purchaseBase)} / ${money(runningBase)}</strong><small>Purchase / running base after exponent adjustment</small></div><div class="cost-result"><span>Model branch</span><strong>${esc(names[type])}</strong><small>Fuel multiplier: ${purchaseFuel.toFixed(2)} purchase / ${runningFuel.toFixed(2)} running</small></div>`;
    };
    root.querySelectorAll('input,select').forEach(input => input.addEventListener('input', update));
    root.querySelectorAll('select').forEach(input => input.addEventListener('change', update));
    update();
  };
})();
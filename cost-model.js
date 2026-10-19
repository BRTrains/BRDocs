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
  const basecostGroups = {
    'Purchase': ['PR_BUILD_VEHICLE_TRAIN', 'PR_BUILD_VEHICLE_WAGON'],
    'Running': ['PR_RUNNING_TRAIN_STEAM', 'PR_RUNNING_TRAIN_DIESEL', 'PR_RUNNING_TRAIN_ELECTRIC']
  };
  const basecostDefaults = {PR_BUILD_VEHICLE_TRAIN:-2,PR_BUILD_VEHICLE_WAGON:1,PR_RUNNING_TRAIN_STEAM:-2,PR_RUNNING_TRAIN_DIESEL:-4,PR_RUNNING_TRAIN_ELECTRIC:0};
  const basecostLabels = Object.fromEntries(Object.values(basecostGroups).flat().map(key=>[key,key.replace(/^PR_/,'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())]));
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
        <label for="cost-runtime-multiplier">Runtime cost parameter <output id="cost-runtime-value">1x</output></label>
        <input id="cost-runtime-multiplier" type="range" min="0.25" max="4" step="any" value="1" list="cost-runtime-notches">
        <datalist id="cost-runtime-notches"><option value="0.25" label="1/4"></option><option value="0.333333" label="1/3"></option><option value="0.5" label="1/2"></option><option value="1" label="1x"></option><option value="2" label="2x"></option><option value="3" label="3x"></option><option value="4" label="4x"></option></datalist>
        <label for="cost-score-max">Score maximum <output id="cost-score-max-value">16,000</output></label>
        <input id="cost-score-max" type="range" min="1000" max="16000" step="100" value="16000">
      </div>
      <div class="cost-model-basecosts">
        <h3>NML base-cost exponents</h3>
        <p>These are the base-cost entries relevant to BRTrains vehicles. Exponents apply <code>base × 2<sup>exponent</sup></code>; the entries relevant to the current vehicle and power type are highlighted.</p>
        <div id="cost-basecost-list" class="cost-model-base-list"></div>
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
    const list = get('cost-basecost-list');
    list.innerHTML = Object.entries(basecostGroups).map(([group, keys]) => `<section class="cost-base-group"><h4>${group}</h4>${keys.map(key => `<label class="cost-base-row" data-basecost-row="${key}"><span>${basecostLabels[key]}</span><output data-basecost-output="${key}">${basecostDefaults[key] > 0 ? `+${basecostDefaults[key]}` : basecostDefaults[key] ?? '0'}</output><input type="range" min="-8" max="4" step="1" value="${basecostDefaults[key] ?? 0}" data-basecost="${key}"></label>`).join('')}</section>`).join('');
    const baseExponent = key => Number(root.querySelector(`[data-basecost="${key}"]`).value);
    root.querySelectorAll('[data-basecost]').forEach(input => input.addEventListener('input', () => {
      const value = Number(input.value);
      const output = root.querySelector(`[data-basecost-output="${input.dataset.basecost}"]`);
      output.textContent = value > 0 ? `+${value}` : value;
      update();
    }));
    const number = id => Number(get(id).value) || 0;
    const money = value => `£${Math.round(value).toLocaleString('en-GB')}`;
    const runtimeNotches = [.25, 1 / 3, .5, 1, 2, 3, 4];
    const runtimeLabel = value => {
      const labels = ['1/4', '1/3', '1/2', '1x', '2x', '3x', '4x'];
      const index = runtimeNotches.reduce((best, notch, current) => Math.abs(notch - value) < Math.abs(runtimeNotches[best] - value) ? current : best, 0);
      return labels[index];
    };
    const update = () => {
      const type = get('cost-train-type').value;
      const speed = Math.max(1, number('cost-speed'));
      const power = Math.max(0, number('cost-power'));
      const capacity = Math.max(0, number('cost-capacity'));
      const size = Math.max(1, number('cost-size'));
      const vehicles = Math.max(1, number('cost-vehicles'));
      const max = number('cost-score-max') || 16000;
      const runtime = Number(get('cost-runtime-multiplier').value);
      const powerPurchaseBase = 400000 * (2 ** baseExponent('PR_BUILD_VEHICLE_TRAIN'));
      const wagonPurchaseBase = 2000 * (2 ** baseExponent('PR_BUILD_VEHICLE_WAGON'));
      const steamRunningBase = 5600 * (2 ** baseExponent('PR_RUNNING_TRAIN_STEAM'));
      const dieselRunningBase = 5200 * (2 ** baseExponent('PR_RUNNING_TRAIN_DIESEL'));
      const electricRunningBase = 4800 * (2 ** baseExponent('PR_RUNNING_TRAIN_ELECTRIC'));
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
      const runningBase = runningFuelName === 'steam' ? steamRunningBase : runningFuelName === 'electric' || runningFuelName === 'bi-mode' || runningFuelName === 'tri-mode' || runningFuelName === 'battery' ? electricRunningBase : dieselRunningBase;
      const formation = type === 'multiple_unit' ? vehicles : 1;
      const highlighted = new Set([powered ? 'PR_BUILD_VEHICLE_TRAIN' : 'PR_BUILD_VEHICLE_WAGON']);
      if (runningFuelName === 'steam') highlighted.add('PR_RUNNING_TRAIN_STEAM');
      else if (runningFuelName === 'electric' || runningFuelName === 'bi-mode' || runningFuelName === 'tri-mode' || runningFuelName === 'battery') highlighted.add('PR_RUNNING_TRAIN_ELECTRIC');
      else highlighted.add('PR_RUNNING_TRAIN_DIESEL');
      root.querySelectorAll('[data-basecost-row]').forEach(row => row.classList.toggle('relevant', highlighted.has(row.dataset.basecostRow)));
      root.querySelector('#cost-speed-value').textContent = speed;
      root.querySelector('#cost-power-value').textContent = power.toLocaleString('en-GB');
      root.querySelector('#cost-capacity-value').textContent = capacity;
      root.querySelector('#cost-size-value').textContent = size;
      root.querySelector('#cost-vehicles-value').textContent = vehicles;
      root.querySelector('#cost-runtime-value').textContent = runtimeLabel(runtime);
      root.querySelector('#cost-score-max-value').textContent = max.toLocaleString('en-GB');
      root.querySelector('#cost-model-output').innerHTML = `<div class="cost-result"><span>Unscaled score</span><strong>${Math.round(base).toLocaleString('en-GB')}</strong></div><div class="cost-result"><span>Purchase callback</span><strong>${Math.round(purchaseCallback).toLocaleString('en-GB')}</strong><small>${money(purchaseBase * purchaseCallback / 256)} per vehicle · ${money(purchaseBase * purchaseCallback * formation / 256)} formation</small></div><div class="cost-result"><span>Running-cost callback</span><strong>${Math.round(runningCallback).toLocaleString('en-GB')}</strong><small>${money(runningBase * runningCallback / 256)} per vehicle · ${money(runningBase * runningCallback * formation / 256)} formation</small></div><div class="cost-result"><span>Adjusted bases</span><strong>${money(purchaseBase)} / ${money(runningBase)}</strong><small>Purchase / running base after exponent adjustment</small></div><div class="cost-result"><span>Model branch</span><strong>${esc(names[type])}</strong><small>Fuel multiplier: ${purchaseFuel.toFixed(2)} purchase / ${runningFuel.toFixed(2)} running</small></div>`;
    };
    root.querySelectorAll('input,select').forEach(input => input.addEventListener('input', update));
    root.querySelectorAll('select').forEach(input => input.addEventListener('change', update));
    get('cost-runtime-multiplier').addEventListener('input', event => {
      const value = Number(event.target.value);
      const nearest = runtimeNotches.reduce((best, notch) => Math.abs(notch - value) < Math.abs(best - value) ? notch : best, runtimeNotches[0]);
      event.target.value = nearest;
      update();
    });
    update();
  };
})();
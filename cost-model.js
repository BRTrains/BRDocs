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
  const wagonOptions = {coach:['coach','sleeper','dvt'], wagon:['freight','tank','refrigerated']};
  const presets = [
    ['GWR Mink goods van',{type:'wagon',speed:50,capacity:20,wagon:'freight'}],
    ['BR HHA hopper',{type:'wagon',speed:75,capacity:72,wagon:'freight'}],
    ['Class 555',{type:'multiple_unit',speed:50,power:1770,capacity:120,vehicles:5,fuel:'electric'}],
    ['Class 456',{type:'multiple_unit',speed:75,power:500,capacity:79,vehicles:2,fuel:'electric'}],
    ['Class 142 Pacer',{type:'multiple_unit',speed:75,power:250,capacity:56,vehicles:2,fuel:'diesel'}],
    ['LU 1996 Stock',{type:'multiple_unit',speed:62,power:2500,capacity:141,vehicles:6,fuel:'electric'}],
    ['Class 376',{type:'multiple_unit',speed:75,power:2682,capacity:60,vehicles:5,fuel:'electric'}],
    ['Class 323',{type:'multiple_unit',speed:90,power:1566,capacity:98,vehicles:4,fuel:'electric'}],
    ['LU 2024 Stock',{type:'multiple_unit',speed:62,power:3400,capacity:119,vehicles:9,fuel:'electric'}],
    ['Class 158',{type:'multiple_unit',speed:90,power:700,capacity:69,vehicles:2,fuel:'diesel'}],
    ['Mk1 coach',{type:'coach',speed:90,capacity:64,wagon:'coach'}],
    ['Class 37',{type:'locomotive',speed:90,power:1750,fuel:'diesel'}],
    ['Mk5a coach',{type:'coach',speed:125,capacity:60,wagon:'coach'}],
    ['LU D78 Stock',{type:'multiple_unit',speed:45,power:3000,capacity:535,vehicles:3,fuel:'electric'}],
    ['Class 390 Pendolino',{type:'multiple_unit',speed:125,power:6840,capacity:50,vehicles:9,fuel:'electric'}],
    ['LU S Stock',{type:'multiple_unit',speed:60,power:0,capacity:1435,vehicles:7,fuel:'electric'}],
    ['Class 43 HST power car',{type:'locomotive',speed:125,power:4500,fuel:'diesel'}],
    ['Class 91',{type:'locomotive',speed:125,power:6480,fuel:'electric'}],
    ['A3 steam locomotive',{type:'locomotive',speed:100,power:1750,fuel:'steam'}],
    ['Class 374 Eurostar',{type:'multiple_unit',speed:199,power:21000,capacity:40,vehicles:16,fuel:'electric'}]
  ];
  const names = {locomotive:'Locomotive', multiple_unit:'Multiple unit', coach:'Coach', wagon:'Freight wagon'};
  const basecostGroups = {
    'Purchase': ['PR_BUILD_VEHICLE_TRAIN', 'PR_BUILD_VEHICLE_WAGON'],
    'Running': ['PR_RUNNING_TRAIN_STEAM', 'PR_RUNNING_TRAIN_DIESEL', 'PR_RUNNING_TRAIN_ELECTRIC']
  };
  const basecostDefaults = {PR_BUILD_VEHICLE_TRAIN:-1,PR_BUILD_VEHICLE_WAGON:2,PR_RUNNING_TRAIN_STEAM:-1,PR_RUNNING_TRAIN_DIESEL:-1,PR_RUNNING_TRAIN_ELECTRIC:-1};
  const basecostLabels = Object.fromEntries(Object.values(basecostGroups).flat().map(key=>[key,key.replace(/^PR_/,'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())]));
  const form = `
    <div class="cost-model-tabs" role="tablist"><button type="button" class="active" data-cost-tab="model">BRBuild model</button><button type="button" data-cost-tab="simple">Base-cost calculator</button></div>
    <div data-cost-panel="model">
    <section class="cost-model-card">
      <div class="cost-model-main">
      <div class="cost-model-presets"><h3>Examples</h3><p>Load a representative BRTrains unit.</p>${presets.map(([label]) => `<button type="button" data-preset="${label}">${label}</button>`).join('')}</div>
      <div class="cost-model-form">
        <div class="cost-model-field"><label for="cost-train-type">Vehicle type</label><select id="cost-train-type"><option value="locomotive">Locomotive</option><option value="multiple_unit">Multiple unit</option><option value="coach">Coach</option><option value="wagon">Freight wagon</option></select></div>
        <div id="cost-fuel-field" class="cost-model-field"><label for="cost-fuel">Fuel / power type</label><select id="cost-fuel">${Object.keys(fuel).filter(key => key !== 'unpowered').map(key => `<option value="${key}"${key === 'diesel' ? ' selected' : ''}>${key.replace('-', ' ')}</option>`).join('')}</select></div>
        <div id="cost-wagon-field" class="cost-model-field hidden"><label for="cost-wagon">Unpowered stock type</label><select id="cost-wagon">${Object.keys(wagon).map(key => `<option value="${key}">${key}</option>`).join('')}</select></div>
        <div class="cost-model-field"><label for="cost-speed">Speed <output id="cost-speed-value">100</output> mph</label><input id="cost-speed" type="number" min="1" max="200" value="100"></div>
        <div id="cost-power-field" class="cost-model-field"><label for="cost-power">Power <output id="cost-power-value">2000</output> hp</label><input id="cost-power" type="number" min="0" max="21000" value="2000"></div>
        <div id="cost-capacity-field" class="cost-model-field"><label for="cost-capacity">Capacity <output id="cost-capacity-value">80</output></label><input id="cost-capacity" type="number" min="0" max="120" value="80"></div>
        <div id="cost-vehicles-field" class="cost-model-field hidden"><label for="cost-vehicles">Formation cars <output id="cost-vehicles-value">1</output></label><input id="cost-vehicles" type="number" min="1" max="32" value="1"></div>
      </div>
      <div id="cost-model-output" class="cost-model-output" aria-live="polite"></div>
      </div>
      <aside class="cost-model-sidebar">
      <div class="cost-model-controls">
        <label for="cost-purchase-multiplier">Purchase Cost Multiplier (newGRF Parameter) <output id="cost-purchase-value">1x</output></label>
        <input id="cost-purchase-multiplier" type="range" min="0.25" max="4" step="any" value="1" list="cost-purchase-notches">
        <datalist id="cost-purchase-notches"><option value="0.25" label="1/4"></option><option value="0.333333" label="1/3"></option><option value="0.5" label="1/2"></option><option value="1" label="1x"></option><option value="2" label="2x"></option><option value="3" label="3x"></option><option value="4" label="4x"></option></datalist>
        <label for="cost-running-multiplier">Running Cost Multiplier (newGRF Parameter) <output id="cost-running-value">1x</output></label>
        <input id="cost-running-multiplier" type="range" min="0.25" max="4" step="any" value="1" list="cost-running-notches">
        <datalist id="cost-running-notches"><option value="0.25" label="1/4"></option><option value="0.333333" label="1/3"></option><option value="0.5" label="1/2"></option><option value="1" label="1x"></option><option value="2" label="2x"></option><option value="3" label="3x"></option><option value="4" label="4x"></option></datalist>
        <label for="cost-score-max">Score maximum <output id="cost-score-max-value">1,000</output></label>
        <input id="cost-score-max" type="range" min="255" max="16000" step="1" value="1000" list="cost-score-notches">
        <datalist id="cost-score-notches"><option value="255" label="255"></option><option value="500" label="500"></option><option value="1000" label="1k"></option><option value="2000" label="2k"></option><option value="3000" label="3k"></option><option value="4000" label="4k"></option><option value="5000" label="5k"></option><option value="6000" label="6k"></option><option value="7000" label="7k"></option><option value="8000" label="8k"></option><option value="9000" label="9k"></option><option value="10000" label="10k"></option><option value="11000" label="11k"></option><option value="12000" label="12k"></option><option value="13000" label="13k"></option><option value="14000" label="14k"></option><option value="15000" label="15k"></option><option value="16000" label="16k"></option></datalist>
      </div>
      <div class="cost-model-basecosts">
        <h3>NML base-cost exponents</h3>
        <div id="cost-basecost-list" class="cost-model-base-list"></div>
        <datalist id="cost-basecost-notches"><option value="-8" label="−8"></option><option value="-7"></option><option value="-6"></option><option value="-5"></option><option value="-4" label="−4"></option><option value="-3"></option><option value="-2" label="−2"></option><option value="-1" label="−1"></option><option value="0" label="0"></option><option value="1" label="+1"></option><option value="2" label="+2"></option><option value="3"></option><option value="4" label="+4"></option><option value="5"></option><option value="6"></option><option value="7"></option><option value="8" label="+8"></option><option value="9"></option><option value="10"></option><option value="11"></option><option value="12"></option><option value="13"></option><option value="14"></option><option value="15"></option><option value="16" label="+16"></option></datalist>
        <div id="cost-adjusted-bases" class="cost-adjusted-bases"></div>
      </div>
      </aside>
    </section>
    </div>
    <div data-cost-panel="simple" class="hidden">
      <section class="simple-cost-card">
        <div class="simple-cost-form">
          <div class="cost-model-field"><label id="simple-purchase-label" for="simple-purchase-value">Purchase callback value</label><div class="simple-input-wrap"><span id="simple-purchase-prefix" class="hidden">£</span><input id="simple-purchase-value" type="number" min="0" value="100"></div></div>
          <div class="cost-model-field"><label id="simple-running-label" for="simple-running-value">Running callback value</label><div class="simple-input-wrap"><span id="simple-running-prefix" class="hidden">£</span><input id="simple-running-value" type="number" min="0" value="100"></div></div>
          <div class="cost-model-field"><label for="simple-cars">Number of vehicles (if articulated, otherwise 1)</label><input id="simple-cars" type="number" min="1" value="1"></div>
          <div class="cost-model-field"><label for="simple-purchase-base">Purchase base</label><select id="simple-purchase-base"><option value="train">Powered train (£400,000)</option><option value="wagon">Wagon/coach (£2,000)</option></select></div>
          <div class="cost-model-field"><label for="simple-running-base">Running base</label><select id="simple-running-base"><option value="steam">Steam (£5,600)</option><option value="diesel" selected>Diesel (£5,200)</option><option value="electric">Electric (£4,800)</option></select></div>
          <fieldset class="simple-toggle"><legend>Calculator mode</legend><label><input id="simple-mode-callback" name="simple-calculator-mode" type="radio" checked> Callback → £</label><label><input id="simple-mode-cost" name="simple-calculator-mode" type="radio"> £ → callback</label></fieldset>
        </div>
        <div class="simple-exponents"><h3>NML base-cost exponents</h3><div id="simple-exponent-list"></div></div>
        <div id="simple-cost-output" class="simple-cost-output" aria-live="polite"><div class="cost-result"><span>Purchase cost</span><strong>£156,250</strong><small>Per car</small></div><div class="cost-result"><span>Running cost</span><strong>£2,031</strong><small>Per car</small></div></div>
      </section>
    </div>
    <p class="cost-model-note">The calculator mirrors BRBuild’s current model. OpenTTD uses a £400,000 purchase base for powered train vehicles and £2,000 for wagons/coaches. BRBuild’s default score maximum is 1,000; the slider is provided for calibration experiments.</p>`;
  const page = {title:'Cost model calculator', intro:'Enter representative vehicle data and see the generated purchase and running-cost callback values.', body:`<p>Use this tool to sanity-check the relative position of wagons, coaches, locomotives and multiple units before changing BRBuild’s constants. The callback values are the factors emitted to NewGRF; the pound figures use OpenTTD’s no-inflation base prices.</p>${form}`};
  maintainerPages['cost-model'] = page;
  window.maintainerPageHooks = window.maintainerPageHooks || {};
  window.maintainerPageHooks['cost-model'] = () => {
    const root = document.querySelector('.cost-model-card');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = 'true';
    const pageRoot = document.querySelector('#maintainer-content') || document;
    const get = id => pageRoot.querySelector(id.startsWith('#') || id.startsWith('[') ? id : `#${id}`);
    const list = get('cost-basecost-list');
    list.innerHTML = Object.entries(basecostGroups).map(([group, keys]) => `<section class="cost-base-group"><h4>${group}</h4>${keys.map(key => `<label class="cost-base-row" data-basecost-row="${key}"><span>${basecostLabels[key]}</span><output data-basecost-output="${key}">${basecostDefaults[key] > 0 ? `+${basecostDefaults[key]}` : basecostDefaults[key] ?? '0'}</output><input type="range" min="-8" max="16" step="1" list="cost-basecost-notches" value="${basecostDefaults[key] ?? 0}" data-basecost="${key}"></label>`).join('')}</section>`).join('');
    const baseExponent = key => Number(pageRoot.querySelector(`[data-basecost="${key}"]`).value);
    pageRoot.querySelectorAll('[data-basecost]').forEach(input => input.addEventListener('input', () => {
      input.value = Math.max(-8, Math.min(16, Math.round(Number(input.value))));
      const value = Number(input.value);
      const output = root.querySelector(`[data-basecost-output="${input.dataset.basecost}"]`);
      output.textContent = value > 0 ? `+${value}` : value;
      update();
    }));
    const number = id => Number(get(id).value) || 0;
    const money = value => `£${Math.round(value).toLocaleString('en-GB')}`;
    const simpleExponentDefaults = {PR_BUILD_VEHICLE_TRAIN:0,PR_BUILD_VEHICLE_WAGON:0,PR_RUNNING_TRAIN_STEAM:0,PR_RUNNING_TRAIN_DIESEL:0,PR_RUNNING_TRAIN_ELECTRIC:0};
    const simpleBases = {PR_BUILD_VEHICLE_TRAIN:400000,PR_BUILD_VEHICLE_WAGON:2000,PR_RUNNING_TRAIN_STEAM:5600,PR_RUNNING_TRAIN_DIESEL:5200,PR_RUNNING_TRAIN_ELECTRIC:4800};
    const simpleExponentList = get('simple-exponent-list');
    simpleExponentList.innerHTML = Object.entries(simpleExponentDefaults).map(([key,value]) => `<label class="simple-exponent-row" data-simple-exp-row="${key}"><span>${basecostLabels[key]}</span><output data-simple-exp-output="${key}">${value}</output><input type="range" min="-8" max="16" step="1" value="${value}" data-simple-exp="${key}"></label>`).join('');
    const simpleUpdate = () => {
      const reverse = get('simple-mode-cost').checked;
      get('simple-purchase-label').textContent = reverse ? 'Purchase cost' : 'Purchase callback value';
      get('simple-running-label').textContent = reverse ? 'Running cost' : 'Running callback value';
      get('simple-purchase-prefix').classList.toggle('hidden', !reverse);
      get('simple-running-prefix').classList.toggle('hidden', !reverse);
      const maximum = 65535;
      const purchaseValue = Math.max(0, number('simple-purchase-value'));
      const runningValue = Math.max(0, number('simple-running-value'));
      const cars = Math.max(1, number('simple-cars'));
      const purchaseKey = get('simple-purchase-base').value === 'train' ? 'PR_BUILD_VEHICLE_TRAIN' : 'PR_BUILD_VEHICLE_WAGON';
      const runningKey = `PR_RUNNING_TRAIN_${get('simple-running-base').value.toUpperCase()}`;
      const relevant = new Set([purchaseKey, runningKey]);
      pageRoot.querySelectorAll('[data-simple-exp-row]').forEach(row => row.classList.toggle('relevant', relevant.has(row.dataset.simpleExpRow)));
      const purchaseBase = simpleBases[purchaseKey] * (2 ** Number(get(`[data-simple-exp="${purchaseKey}"]`).value));
      const runningBase = simpleBases[runningKey] * (2 ** Number(get(`[data-simple-exp="${runningKey}"]`).value));
      if (!reverse) {
        const purchaseFactor = Math.min(maximum, purchaseValue);
        const runningFactor = Math.min(maximum, runningValue);
        const purchaseCost = purchaseBase * purchaseFactor / 256;
        const runningCost = runningBase * runningFactor / 256;
        get('simple-cost-output').innerHTML = `<div class="cost-result"><span>Purchase cost</span><strong>${money(purchaseCost)}</strong><small>${cars > 1 ? `Per car · ${money(purchaseCost * cars)} formation` : 'Per car'}</small></div><div class="cost-result"><span>Running cost</span><strong>${money(runningCost)}</strong><small>${cars > 1 ? `Per car · ${money(runningCost * cars)} formation` : 'Per car'}</small></div>`;
      } else {
        const idealPurchase = purchaseValue * 256 / purchaseBase;
        const idealRunning = runningValue * 256 / runningBase;
        const purchaseFactor = Math.min(maximum, Math.max(0, Math.round(idealPurchase)));
        const runningFactor = Math.min(maximum, Math.max(0, Math.round(idealRunning)));
        const purchaseCost = purchaseBase * purchaseFactor / 256;
        const runningCost = runningBase * runningFactor / 256;
        get('simple-cost-output').innerHTML = `<div class="cost-result"><span>Purchase</span><strong>Ideal value: ${idealPurchase.toFixed(2)}<br>Actual value: ${purchaseFactor.toLocaleString('en-GB')}</strong><small>Ideal £${purchaseValue.toLocaleString('en-GB')} · Actual £${money(purchaseCost)}${cars > 1 ? ` per car · ${money(purchaseCost * cars)} formation` : ''}</small></div><div class="cost-result"><span>Running</span><strong>Ideal value: ${idealRunning.toFixed(2)}<br>Actual value: ${runningFactor.toLocaleString('en-GB')}</strong><small>Ideal £${runningValue.toLocaleString('en-GB')} · Actual £${money(runningCost)}${cars > 1 ? ` per car · ${money(runningCost * cars)} formation` : ''}</small></div>`;
      }

    };
    pageRoot.querySelectorAll('[data-simple-exp]').forEach(input => input.addEventListener('input', () => {
      input.value = Math.max(-8, Math.min(16, Math.round(Number(input.value))));
      get(`[data-simple-exp-output="${input.dataset.simpleExp}"]`).textContent = input.value;
      simpleUpdate();
    }));
    pageRoot.querySelectorAll('#simple-purchase-value,#simple-running-value,#simple-cars,#simple-purchase-base,#simple-running-base,#simple-mode-callback,#simple-mode-cost').forEach(input => { input.addEventListener('input', simpleUpdate); input.addEventListener('change', simpleUpdate); });
    const tabRoot = pageRoot;
    tabRoot.querySelectorAll('[data-cost-tab]').forEach(tab => tab.addEventListener('click', () => {
      tabRoot.querySelectorAll('[data-cost-panel]').forEach(panel => panel.classList.toggle('hidden', panel.dataset.costPanel !== tab.dataset.costTab));
      tabRoot.querySelectorAll('[data-cost-tab]').forEach(button => button.classList.toggle('active', button === tab));
      if (tab.dataset.costTab === 'simple') simpleUpdate();
    }));
    const runtimeNotches = [.25, 1 / 3, .5, 1, 2, 3, 4];
    const runtimeLabel = value => {
      const labels = ['1/4', '1/3', '1/2', '1x', '2x', '3x', '4x'];
      const index = runtimeNotches.reduce((best, notch, current) => Math.abs(notch - value) < Math.abs(runtimeNotches[best] - value) ? current : best, 0);
      return labels[index];
    };
    const updateWagonOptions = type => {
      const select = get('cost-wagon');
      const options = wagonOptions[type] || [];
      const current = select.value;
      select.innerHTML = options.map(key => `<option value="${key}">${key}</option>`).join('');
      select.value = options.includes(current) ? current : options[0];
    };
    pageRoot.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
      const values = presets.find(([label]) => label === button.dataset.preset)?.[1];
      if (!values) return;
      get('cost-train-type').value = values.type;
      if (values.speed !== undefined) get('cost-speed').value = values.speed;
      if (values.power !== undefined) get('cost-power').value = values.power;
      if (values.capacity !== undefined) get('cost-capacity').value = values.capacity;
      if (values.vehicles !== undefined) get('cost-vehicles').value = values.vehicles;
      if (values.fuel) get('cost-fuel').value = values.fuel;
      if (values.wagon) get('cost-wagon').value = values.wagon;
      update();
    }));
    const update = () => {
      const type = get('cost-train-type').value;
      const powered = type === 'locomotive' || type === 'multiple_unit';
      const multipleUnit = type === 'multiple_unit';
      updateWagonOptions(type);
      get('cost-fuel-field').classList.toggle('hidden', !powered);
      get('cost-wagon-field').classList.toggle('hidden', powered);
      get('cost-power-field').classList.toggle('hidden', !powered);
      get('cost-capacity-field').classList.toggle('hidden', type === 'locomotive');
      get('cost-vehicles-field').classList.toggle('hidden', !multipleUnit);
      get('cost-capacity').max = multipleUnit ? 1500 : 250;
      if (!powered) get('cost-fuel').value = 'diesel';
      const speed = Math.max(1, number('cost-speed'));
      const power = powered ? Math.max(0, number('cost-power')) : 0;
      const capacity = type === 'locomotive' ? 0 : Math.max(0, number('cost-capacity'));
      const vehicles = multipleUnit ? Math.max(1, number('cost-vehicles')) : 1;
      const scoreMax = number('cost-score-max') || 1000;
      const purchaseRuntime = Number(get('cost-purchase-multiplier').value);
      const runningRuntime = Number(get('cost-running-multiplier').value);
      const powerPurchaseBase = 400000 * (2 ** baseExponent('PR_BUILD_VEHICLE_TRAIN'));
      const wagonPurchaseBase = 2000 * (2 ** baseExponent('PR_BUILD_VEHICLE_WAGON'));
      const steamRunningBase = 5600 * (2 ** baseExponent('PR_RUNNING_TRAIN_STEAM'));
      const dieselRunningBase = 5200 * (2 ** baseExponent('PR_RUNNING_TRAIN_DIESEL'));
      const electricRunningBase = 4800 * (2 ** baseExponent('PR_RUNNING_TRAIN_ELECTRIC'));
      const speedPart = Math.min(1, Math.max(0, speed / 250));
      const powerPart = Math.min(1, Math.max(0, power / 21000));
      const capacityPart = Math.min(1, Math.max(0, capacity / (multipleUnit ? 1500 : 250)));
      let base;
      if (type === 'wagon') base = scoreMax * (.65 * capacityPart + .35 * speedPart);
      else if (type === 'coach') base = scoreMax * (.65 * capacityPart + .35 * speedPart);
      else if (type === 'multiple_unit') base = scoreMax * (.40 * powerPart + .30 * capacityPart + .25 * speedPart + .05 / Math.min(vehicles, 16));
      else base = scoreMax * (.65 * powerPart + .35 * speedPart);
      const [purchaseFuel, runningFuel] = fuel[get('cost-fuel').value];
      const [purchaseWagon, runningWagon] = powered ? [1, 1] : wagon[get('cost-wagon').value];
      const purchase = base * purchaseFuel * (type === 'locomotive' || type === 'multiple_unit' ? 1 : purchaseWagon);
      const running = base * runningFuel * (type === 'locomotive' || type === 'multiple_unit' ? 1 : runningWagon);
      const purchaseCallback = Math.min(scoreMax, Math.round(purchase)) * purchaseRuntime;
      const runningCallback = Math.min(scoreMax, Math.round(running)) * runningRuntime;
      const purchaseBase = powered ? powerPurchaseBase : wagonPurchaseBase;
      const runningFuelName = get('cost-fuel').value;
      const runningBase = runningFuelName === 'steam' ? steamRunningBase : runningFuelName === 'electric' || runningFuelName === 'bi-mode' || runningFuelName === 'tri-mode' || runningFuelName === 'battery' ? electricRunningBase : dieselRunningBase;
      const formation = multipleUnit ? vehicles : 1;
      const highlighted = new Set([powered ? 'PR_BUILD_VEHICLE_TRAIN' : 'PR_BUILD_VEHICLE_WAGON']);
      if (runningFuelName === 'steam') highlighted.add('PR_RUNNING_TRAIN_STEAM');
      else if (runningFuelName === 'electric' || runningFuelName === 'bi-mode' || runningFuelName === 'tri-mode' || runningFuelName === 'battery') highlighted.add('PR_RUNNING_TRAIN_ELECTRIC');
      else highlighted.add('PR_RUNNING_TRAIN_DIESEL');
      root.querySelectorAll('[data-basecost-row]').forEach(row => row.classList.toggle('relevant', highlighted.has(row.dataset.basecostRow)));
      root.querySelector('#cost-speed-value').textContent = speed;
      root.querySelector('#cost-power-value').textContent = power.toLocaleString('en-GB');
      root.querySelector('#cost-capacity-value').textContent = capacity;
      root.querySelector('#cost-vehicles-value').textContent = vehicles;
      root.querySelector('#cost-purchase-value').textContent = runtimeLabel(purchaseRuntime);
      root.querySelector('#cost-running-value').textContent = runtimeLabel(runningRuntime);
      root.querySelector('#cost-score-max-value').textContent = scoreMax.toLocaleString('en-GB');
      root.querySelector('#cost-adjusted-bases').innerHTML = `<strong>Adjusted bases</strong><span>${money(purchaseBase)} purchase · ${money(runningBase)} running</span>`;
      root.querySelector('#cost-model-output').innerHTML = `<div class="cost-result"><span>Purchase callback</span><strong>${Math.round(purchaseCallback).toLocaleString('en-GB')}</strong><small>${money(purchaseBase * purchaseCallback / 256)} per vehicle · ${money(purchaseBase * purchaseCallback * formation / 256)} formation</small></div><div class="cost-result"><span>Running-cost callback</span><strong>${Math.round(runningCallback).toLocaleString('en-GB')}</strong><small>${money(runningBase * runningCallback / 256)} per vehicle · ${money(runningBase * runningCallback * formation / 256)} formation</small></div><div class="cost-result costs"><span>Costs</span><strong><span class="cost-highlight">Purchase: ${money(purchaseBase * purchaseCallback * formation / 256)}</span><span class="cost-highlight">Running: ${money(runningBase * runningCallback * formation / 256)}</span></strong><small>Formation total</small></div><div class="cost-result"><span>Model branch</span><strong>${esc(names[type])}</strong><small>Fuel multiplier: ${purchaseFuel.toFixed(2)} purchase / ${runningFuel.toFixed(2)} running</small></div>`;
    };
    root.querySelectorAll('input,select').forEach(input => input.addEventListener('input', update));
    root.querySelectorAll('select').forEach(input => input.addEventListener('change', update));
    ['cost-purchase-multiplier','cost-running-multiplier'].forEach(id => get(id).addEventListener('input', event => {
      const value = Number(event.target.value);
      const nearest = runtimeNotches.reduce((best, notch) => Math.abs(notch - value) < Math.abs(best - value) ? notch : best, runtimeNotches[0]);
      event.target.value = nearest;
      update();
    }));
    const scoreNotches = [255,500,1000,...Array.from({length:15},(_,index)=>(index+2)*1000)];
    get('cost-score-max').addEventListener('input', event => {
      const value = Number(event.target.value);
      const nearest = scoreNotches.reduce((best, notch) => Math.abs(notch - value) < Math.abs(best - value) ? notch : best, scoreNotches[0]);
      event.target.value = nearest;
      update();
    });
    update();
    simpleUpdate();
  };
  window.maintainerPageHooks['cost-model:simple'] = () => {
    document.querySelectorAll('[data-cost-panel]').forEach(panel => panel.classList.toggle('hidden', panel.dataset.costPanel !== 'simple'));
    document.querySelectorAll('[data-cost-tab]').forEach(button => button.classList.toggle('active', button.dataset.costTab === 'simple'));
  };
})();
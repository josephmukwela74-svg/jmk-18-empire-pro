const AI_TOOLS = {
  cv: {
    title: 'CV Generator',
    fields: [
      { name: 'name', label: 'Full Name' },
      { name: 'email', label: 'Email' },
      { name: 'phone', label: 'Phone' },
      { name: 'skills', label: 'Skills', type: 'textarea' },
      { name: 'experience', label: 'Experience', type: 'textarea' }
    ]
  },
  letter: {
    title: 'Cover Letter Generator',
    fields: [
      { name: 'name', label: 'Your Name' },
      { name: 'company', label: 'Company' },
      { name: 'position', label: 'Position' },
      { name: 'strengths', label: 'Key Strengths', type: 'textarea' }
    ]
  },
  business: {
    title: 'Business Plan Generator',
    fields: [
      { name: 'businessName', label: 'Business Name' },
      { name: 'industry', label: 'Industry' },
      { name: 'location', label: 'Location' },
      { name: 'products', label: 'Products/Services', type: 'textarea' }
    ]
  },
  proposal: {
    title: 'Proposal Writer',
    fields: [
      { name: 'client', label: 'Client Name' },
      { name: 'project', label: 'Project Name' },
      { name: 'scope', label: 'Project Scope', type: 'textarea' },
      { name: 'budget', label: 'Budget (K)', type: 'number' }
    ]
  },
  summary: {
    title: 'Text Summary',
    fields: [
      { name: 'text', label: 'Text to Summarize', type: 'textarea' },
      { name: 'count', label: 'Number of Key Points', type: 'number', value: '5' }
    ]
  },
  translator: {
    title: 'Translator',
    fields: [
      { name: 'text', label: 'Text to Translate', type: 'textarea' },
      { name: 'source', label: 'Source Language', value: 'English' },
      { name: 'target', label: 'Target Language', value: 'French' }
    ]
  }
};

const TOOL_CONFIG = {
  receipt: {
    title: 'Rent Receipt',
    fields: [
      { name: 'tenant', label: 'Tenant Name' },
      { name: 'landlord', label: 'Landlord Name' },
      { name: 'property', label: 'Property Address' },
      { name: 'amount', label: 'Amount (K)', type: 'number' },
      { name: 'period', label: 'Period', type: 'text' }
    ]
  },
  invoice: {
    title: 'Invoice Maker',
    fields: [
      { name: 'from', label: 'Your Business' },
      { name: 'client', label: 'Client Name' },
      { name: 'items', label: 'Items (description|qty|price)', type: 'textarea' }
    ]
  },
  duty: {
    title: 'Car Duty Calculator',
    fields: [
      { name: 'cif', label: 'CIF Value (K)', type: 'number' }
    ]
  },
  affidavit: {
    title: 'Affidavit Draft',
    fields: [
      { name: 'name', label: 'Full Name' },
      { name: 'nrc', label: 'NRC Number' },
      { name: 'address', label: 'Address' },
      { name: 'details', label: 'Affidavit Details', type: 'textarea' }
    ]
  },
  tenancy: {
    title: 'Tenancy Agreement',
    fields: [
      { name: 'landlord', label: 'Landlord Name' },
      { name: 'tenant', label: 'Tenant Name' },
      { name: 'property', label: 'Property' },
      { name: 'rent', label: 'Monthly Rent (K)', type: 'number' },
      { name: 'months', label: 'Months', type: 'number' }
    ]
  },
  payroll: {
    title: 'Payroll Calculator',
    fields: [
      { name: 'salary', label: 'Monthly Gross Salary (K)', type: 'number' }
    ]
  }
};

let currentAI = null;
let currentTool = null;
let deferredPrompt = null;

function saveFile() {
  const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jmk-empire-pro.html';
  a.click();
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
  document.querySelectorAll('.tabpill').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
}

document.querySelectorAll('.tabpill').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function updateSyncStatus() {
  const status = navigator.onLine ? 'online' : 'offline';
  const el = document.getElementById('syncStatus');
  el.className = `sync-status ${status}`;
  el.textContent = status.toUpperCase();
}
window.addEventListener('online', updateSyncStatus);
window.addEventListener('offline', updateSyncStatus);
updateSyncStatus();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('pwaInstall').classList.remove('hidden');
});

function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.finally(() => {
    deferredPrompt = null;
    document.getElementById('pwaInstall').classList.add('hidden');
  });
}

function openAI(toolName) {
  currentAI = toolName;
  const config = AI_TOOLS[toolName];
  const modal = document.getElementById('aiModal');
  const form = document.getElementById('aiForm');
  document.getElementById('aiTitle').textContent = config.title;

  form.innerHTML = config.fields.map(field => {
    if (field.type === 'textarea') {
      return `<div class="form-row"><label>${field.label}</label><textarea id="ai_${field.name}" placeholder="${field.label}">${field.value || ''}</textarea></div>`;
    }
    return `<div class="form-row"><label>${field.label}</label><input id="ai_${field.name}" type="${field.type || 'text'}" value="${field.value || ''}" placeholder="${field.label}" /></div>`;
  }).join('');

  document.getElementById('aiOutput').classList.add('hidden');
  modal.classList.remove('hidden');
}

function closeAI() {
  document.getElementById('aiModal').classList.add('hidden');
}

async function runAI() {
  const key = document.getElementById('openaiKey').value.trim();
  const payload = {};
  document.querySelectorAll('#aiForm input, #aiForm textarea').forEach(el => {
    payload[el.id.replace('ai_', '')] = el.value;
  });

  let output = '';
  if (key) {
    try {
      output = await callOpenAI(key, payload, currentAI);
    } catch (err) {
      output = 'OpenAI call failed. Falling back to offline output.\n\n' + err.message;
    }
  }
  if (!output) output = fallbackAI(currentAI, payload);

  const el = document.getElementById('aiOutput');
  el.textContent = output;
  el.classList.remove('hidden');
}

async function callOpenAI(apiKey, payload, toolName) {
  const modelMap = {
    cv: 'You are a professional CV writer. Generate a polished CV from the user data.',
    letter: 'You are a professional cover letter writer. Write a concise and persuasive cover letter.',
    business: 'You are a business strategist. Draft a clear business plan with summary, market, operations, and financial plan.',
    proposal: 'You are a business proposal writer. Create a professional proposal for the given project.',
    summary: 'Summarize the content into key actionable points.',
    translator: 'Translate the provided text accurately into the target language.'
  };

  const prompt = modelMap[toolName] || 'Generate a helpful business response.' + `\nHere is the user data:\n${JSON.stringify(payload, null, 2)}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'OpenAI request failed');
  return data.choices?.[0]?.message?.content || 'No output returned.';
}

function fallbackAI(toolName, payload) {
  switch (toolName) {
    case 'cv':
      return `CV DRAFT\n\nName: ${payload.name || 'Your Name'}\nEmail: ${payload.email || 'your@email.com'}\nPhone: ${payload.phone || '0000000000'}\n\nSkills:\n${payload.skills || 'Communication, organisation, leadership'}\n\nExperience:\n${payload.experience || '3+ years in business and customer support.'}`;
    case 'letter':
      return `Dear Hiring Manager,\n\nI am writing to apply for the ${payload.position || 'position'} role at ${payload.company || 'your company'}. I bring strong skills in ${payload.strengths || 'communication and team leadership'}.\n\nI am excited about this opportunity and confident I can add value to your organisation.\n\nYours sincerely,\n${payload.name || 'Applicant Name'}`;
    case 'business':
      return `BUSINESS PLAN - ${payload.businessName || 'Business Name'}\n\nIndustry: ${payload.industry || 'Retail'}\nLocation: ${payload.location || 'Lusaka'}\n\nProducts/Services:\n${payload.products || 'Customer-focused service offering'}\n\nSummary:\nThis business aims to serve local demand with a strong customer focus and disciplined operations.`;
    case 'proposal':
      return `PROPOSAL: ${payload.project || 'Project Name'}\nClient: ${payload.client || 'Client Name'}\nBudget: K${payload.budget || 0}\n\nScope:\n${payload.scope || 'Business support and project delivery services.'}`;
    case 'summary':
      return `Key Points:\n${(payload.text || '').split(/\s+/).slice(0, Number(payload.count || 5)).join(' ')}`;
    case 'translator':
      return `Translated text (${payload.source || 'English'} → ${payload.target || 'French'}):\n${payload.text || 'Your content here'}`;
    default:
      return 'AI output generated.';
  }
}

function openTool(toolName) {
  currentTool = toolName;
  const config = TOOL_CONFIG[toolName];
  const form = document.getElementById('toolForm');
  document.getElementById('toolTitle').textContent = config.title;
  form.innerHTML = config.fields.map(field => {
    if (field.type === 'textarea') {
      return `<div class="form-row"><label>${field.label}</label><textarea id="tool_${field.name}"></textarea></div>`;
    }
    return `<div class="form-row"><label>${field.label}</label><input id="tool_${field.name}" type="${field.type || 'text'}" /></div>`;
  }).join('');
  document.getElementById('toolOutput').classList.add('hidden');
  document.getElementById('toolModal').classList.remove('hidden');
}

function closeTool() {
  document.getElementById('toolModal').classList.add('hidden');
}

function generateTool() {
  const v = (name) => document.getElementById(`tool_${name}`).value;
  let output = '';

  if (currentTool === 'receipt') {
    output = `RENT RECEIPT\nNo: RR-${Date.now().toString().slice(-6)}\nDate: ${new Date().toLocaleDateString()}\n\nReceived from: ${v('tenant')}\nAmount: K${Number(v('amount') || 0).toLocaleString()}\nPeriod: ${v('period')}\nProperty: ${v('property')}\n\nReceived by: ${v('landlord')}\nSignature: ____________________`;
  }
  if (currentTool === 'invoice') {
    output = `INVOICE\nNo: INV-${Date.now().toString().slice(-6)}\nDate: ${new Date().toLocaleDateString()}\n\nFrom: ${v('from')}\nTo: ${v('client')}\n\n${v('items')}\n\nThank you for your business.`;
  }
  if (currentTool === 'duty') {
    const cif = Number(v('cif') || 0);
    const duty = cif * 0.35;
    const vat = (cif + duty) * 0.16;
    output = `ZRA VEHICLE IMPORT ESTIMATE\n\nCIF: K${cif.toLocaleString()}\nCustoms Duty (35%): K${duty.toLocaleString()}\nVAT (16%): K${vat.toLocaleString()}\nTOTAL: K${(cif + duty + vat).toLocaleString()}`;
  }
  if (currentTool === 'affidavit') {
    output = `AFFIDAVIT\n\nI, ${v('name')}, holder of NRC No. ${v('nrc')}, of ${v('address')}, do hereby make oath and state as follows:\n\n${v('details') || '[Insert details]'}\n\nSworn before me on ${new Date().toLocaleDateString()}.`;
  }
  if (currentTool === 'tenancy') {
    output = `TENANCY AGREEMENT\n\nLandlord: ${v('landlord')}\nTenant: ${v('tenant')}\nProperty: ${v('property')}\nMonthly Rent: K${Number(v('rent') || 0).toLocaleString()}\nDuration: ${v('months') || 12} months\n\nTerms: The tenant shall pay rent monthly and keep the property in good order.`;
  }
  if (currentTool === 'payroll') {
    const sal = Number(v('salary') || 0);
    const paye = sal * 0.15;
    const napsa = sal * 0.05;
    output = `PAYROLL SUMMARY\n\nGross: K${sal.toLocaleString()}\nPAYE: K${paye.toLocaleString()}\nNAPSA: K${napsa.toLocaleString()}\nNET: K${(sal - paye - napsa).toLocaleString()}`;
  }

  const el = document.getElementById('toolOutput');
  el.textContent = output;
  el.classList.remove('hidden');
}

let vehicles = JSON.parse(localStorage.getItem('jmk_fleet_data') || '[]');
let map;
let markers = {};
let tracking = false;
let watchId = null;
let currentVehicleId = null;

function openFleet() {
  document.getElementById('gpsFull').classList.remove('hidden');
  if (!map) {
    map = L.map('map').setView([-14.5, 27.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
  }
  setTimeout(() => map.invalidateSize(), 250);
  renderFleet();
}

function closeFleet() {
  document.getElementById('gpsFull').classList.add('hidden');
}

function switchFleet(tab) {
  document.getElementById('gOwner').classList.toggle('hidden', tab !== 'owner');
  document.getElementById('gDriver').classList.toggle('hidden', tab !== 'driver');
  document.getElementById('gTabOwner').className = tab === 'owner' ? 'btn btn-primary small' : 'btn btn-dark small';
  document.getElementById('gTabDriver').className = tab === 'driver' ? 'btn btn-primary small' : 'btn btn-dark small';
}

function saveFleetData() {
  localStorage.setItem('jmk_fleet_data', JSON.stringify(vehicles));
}

function renderFleet() {
  const list = document.getElementById('fleetList');
  list.innerHTML = '';
  let live = 0; let fuel = 0; let alerts = 0;
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};

  vehicles.forEach(v => {
    const active = (Date.now() - (v.ts || Date.now())) < 120000;
    if (active) live++; fuel += Number(v.fuel || 0); if (Number(v.speed || 0) > 80) alerts++;
    const icon = L.divIcon({ html: `<div style="background:${active ? '#00ff88' : '#ff4444'};width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>` });
    markers[v.id] = L.marker([v.lat, v.lng], { icon }).addTo(map).bindPopup(`<b>${v.plate}</b><br>${v.driver}<br>${v.route}<br>${v.speed} km/h`);
    list.innerHTML += `<div class="fleetItem"><div><b>${v.plate}</b><br><small>${v.driver} • ${v.speed}km/h • ${v.fuel}L</small></div><button class="btn btn-primary small" onclick="focusVehicle(${v.id})">Track</button></div>`;
  });

  document.getElementById('oTotal').textContent = vehicles.length;
  document.getElementById('oLive').textContent = live;
  document.getElementById('oFuel').textContent = `${fuel}L`;
  document.getElementById('oAlert').textContent = alerts;
}

function focusVehicle(id) {
  const v = vehicles.find(x => x.id === id);
  if (v && markers[id]) {
    map.setView([v.lat, v.lng], 14);
    markers[id].openPopup();
  }
}

function addDemo() {
  const samples = [
    { plate: 'BAE 1001 ZM', driver: 'Joseph', route: 'Lusaka → Ndola', lat: -14.5, lng: 28.2 },
    { plate: 'BAE 1002 ZM', driver: 'Chanda', route: 'Lusaka → Kitwe', lat: -12.9, lng: 28.2 }
  ];
  samples.forEach((s, i) => {
    vehicles.push({ id: Date.now() + i, ...s, speed: 68, fuel: 150, ts: Date.now() });
  });
  saveFleetData(); renderFleet();
}

function toggleTrack() {
  if (!tracking) {
    currentVehicleId = Date.now();
    const plate = document.getElementById('dPlate').value || 'BAE 1234 ZM';
    const driver = document.getElementById('dDriver').value || 'Driver';
    const route = document.getElementById('dRoute').value;
    const existing = vehicles.find(v => v.plate === plate);
    if (existing) currentVehicleId = existing.id;
    else vehicles.push({ id: currentVehicleId, plate, driver, route, lat: -15.4, lng: 28.3, speed: 0, fuel: 150, ts: Date.now() });
    saveFleetData(); renderFleet();
    document.getElementById('dStatus').textContent = 'Starting GPS...';

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        const v = vehicles.find(x => x.id === currentVehicleId);
        if (!v) return;
        v.lat = pos.coords.latitude;
        v.lng = pos.coords.longitude;
        v.speed = Math.round(pos.coords.speed ? pos.coords.speed * 3.6 : 60);
        v.ts = Date.now();
        saveFleetData(); renderFleet();
        document.getElementById('dStatus').innerHTML = `🟢 LIVE<br>${v.plate} ${v.lat.toFixed(5)}, ${v.lng.toFixed(5)}<br>Speed ${v.speed} km/h`;
      }, () => document.getElementById('dStatus').textContent = 'GPS error. Please allow location access.');
    }

    tracking = true;
    document.getElementById('startBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.remove('hidden');
  } else {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    tracking = false;
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('dStatus').textContent = 'Status: Not Tracking';
  }
}

function locateAll() {
  if (!map || Object.keys(markers).length === 0) return;
  const group = new L.featureGroup(Object.values(markers));
  map.fitBounds(group.getBounds().pad(0.3));
}

renderFleet();

/* ==========================================================================
   DIÁRIO DA ENXAQUECA - SUPABASE CLOUD SYNC
   Willian Soares (williansoares.net.br/diario)
   ========================================================================== */

// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = "https://wedtehhfjvykwyrxgtmj.supabase.co";
const SUPABASE_KEY = "sb_publishable_c6loFuQLy-JHAxcX9KSCRw_rL3AG_2K";

const STORAGE_USER_KEY = "diario_enxaqueca_user_session_v1";

let supabaseClient = null;
let currentUser = null;
let currentWizardStep = 1;
let editingCrisisId = null;
let wizardModalInstance = null;
let reportModalInstance = null;
let adminModalInstance = null;
let chartIntensity = null;
let chartDistribution = null;

// Medicamentos Comuns para Cefaleia/Enxaqueca
const COMMON_MEDICATIONS = [
  'Sumatriptana 50mg',
  'Sumatriptana 100mg',
  'Rizatriptana 10mg',
  'Zolmitriptana 2.5mg',
  'Frovatriptana 2.5mg',
  'Almotriptana 6.25mg',
  'Eletriptana 40mg',
  'Naratriptana 2.5mg',
  'Dipirona 500mg',
  'Dipirona 1g',
  'Paracetamol 500mg',
  'Paracetamol 750mg',
  'Ibuprofeno 200mg',
  'Ibuprofeno 400mg',
  'Ibuprofeno 600mg',
  'Naproxeno 220mg',
  'Naproxeno 550mg',
  'Nimesulida 100mg',
  'Acetilsalicílico (Aspirina) 500mg',
  'Acetilsalicílico (Aspirina) 1g',
  'Ácido Mefenâmico 250mg',
  'Diclofenaco 50mg',
  'Diclofenaco 100mg',
  'Cetoprofeno 50mg',
  'Piroxicam 20mg',
  'Meloxicam 7.5mg',
  'Cafeína + Paracetamol (Dorflex)',
  'Cafeína + Dipirona (Dorflex)',
  'Cafeína + Ibuprofeno (Ibupirac)',
  'Escitalopram 10mg',
  'Fluoxetina 20mg',
  'Amitriptilina 25mg',
  'Amitriptilina 75mg',
  'Venlafaxina 75mg',
  'Propranolol 40mg',
  'Propranolol 80mg',
  'Metoprolol 50mg',
  'Candesartana 8mg',
  'Losartana 50mg',
  'Flunarizina 10mg',
  'Topiramat 25mg',
  'Topiramat 100mg',
  'Valproato de Sódio 500mg',
  'Gabapentina 300mg',
  'Gabapentina 600mg',
  'Botox (Toxina Botulínica)',
  'Metoclopramida 10mg',
  'Domperidona 10mg',
  'Clorpromazina 25mg'
];

let userMedicationHistory = [];

// INICIALIZAÇÃO DA APLICAÇÃO
document.addEventListener("DOMContentLoaded", () => {
  initSupabase();
  initPWA();
  checkAuth();
  setDefaultDates();
  initMedicationAutocomplete();

  // Instâncias dos Modais Bootstrap
  const wizardModalEl = document.getElementById('wizardModal');
  if (wizardModalEl) wizardModalInstance = new bootstrap.Modal(wizardModalEl);

  const reportModalEl = document.getElementById('reportModal');
  if (reportModalEl) reportModalInstance = new bootstrap.Modal(reportModalEl);

  const adminModalEl = document.getElementById('adminUsersModal');
  if (adminModalEl) adminModalInstance = new bootstrap.Modal(adminModalEl);
});

// AUTOCOMPLETE DE MEDICAMENTOS
function initMedicationAutocomplete() {
  const medicationInput = document.getElementById('crisis-medication');

  if (!medicationInput) return;

  medicationInput.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase().trim();

    if (value.length < 1) {
      hideMedicationSuggestions();
      return;
    }

    // Filtrar medicamentos baseado no input
    const filtered = COMMON_MEDICATIONS.filter(med =>
      med.toLowerCase().includes(value)
    );

    // Adicionar histórico do usuário
    const userMeds = userMedicationHistory.filter(med =>
      med.toLowerCase().includes(value) &&
      !filtered.includes(med)
    );

    const combined = [...userMeds, ...filtered].slice(0, 8);

    if (combined.length > 0) {
      showMedicationSuggestions(combined, value);
    } else {
      hideMedicationSuggestions();
    }
  });

  medicationInput.addEventListener('blur', () => {
    setTimeout(() => hideMedicationSuggestions(), 200);
  });
}

function showMedicationSuggestions(suggestions, searchTerm) {
  let suggestionsBox = document.getElementById('medication-suggestions');

  if (!suggestionsBox) {
    const medicationInput = document.getElementById('crisis-medication');
    suggestionsBox = document.createElement('div');
    suggestionsBox.id = 'medication-suggestions';
    suggestionsBox.className = 'medication-suggestions-box';
    medicationInput.parentElement.appendChild(suggestionsBox);
  }

  suggestionsBox.innerHTML = suggestions.map((med, idx) => {
    const highlightedMed = med.replace(
      new RegExp(searchTerm, 'gi'),
      match => `<strong>${match}</strong>`
    );
    return `
      <div class="medication-suggestion-item" onclick="selectMedication('${med}')">
        <i class="bi bi-capsule text-warning"></i>
        ${highlightedMed}
      </div>
    `;
  }).join('');

  suggestionsBox.style.display = 'block';
}

function hideMedicationSuggestions() {
  const suggestionsBox = document.getElementById('medication-suggestions');
  if (suggestionsBox) {
    suggestionsBox.style.display = 'none';
  }
}

function selectMedication(medication) {
  const medicationInput = document.getElementById('crisis-medication');
  medicationInput.value = medication;

  // Adicionar ao histórico do usuário
  if (!userMedicationHistory.includes(medication)) {
    userMedicationHistory.unshift(medication);
    userMedicationHistory = userMedicationHistory.slice(0, 20); // Manter últimos 20
  }

  hideMedicationSuggestions();
  medicationInput.focus();
}

function initSupabase() {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.error("SDK do Supabase não foi carregado.");
  }
}

// SERVICE WORKER & STATUS DE CONEXÃO
function initPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("Service Worker ativo."))
      .catch(err => console.log("Erro SW:", err));
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

function updateOnlineStatus() {
  const statusEl = document.getElementById("pwa-status");
  if (statusEl) {
    if (navigator.onLine) {
      statusEl.innerHTML = '<i class="bi bi-cloud-check-fill" style="font-size: 0.7rem;"></i>';
      statusEl.className = "badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 rounded-pill px-2 py-0 d-none d-xxl-inline-block";
      statusEl.setAttribute('style', 'font-size: 0.65rem; line-height: 1.2;');
    } else {
      statusEl.innerHTML = '<i class="bi bi-wifi-off" style="font-size: 0.7rem;"></i>';
      statusEl.className = "badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30 rounded-pill px-2 py-0 d-none d-xxl-inline-block";
      statusEl.setAttribute('style', 'font-size: 0.65rem; line-height: 1.2;');
    }
  }
}

// SESSÃO E AUTENTICAÇÃO
function checkAuth() {
  const storedUser = localStorage.getItem(STORAGE_USER_KEY);
  const loginView = document.getElementById("login-view");
  const appView = document.getElementById("app-view");
  const adminBtn = document.getElementById("admin-panel-btn");

  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    loginView.classList.add("d-none");
    appView.classList.remove("d-none");

    if (currentUser.role === "admin") {
      adminBtn.classList.remove("d-none");
    } else {
      adminBtn.classList.add("d-none");
    }

    renderDashboard();
  } else {
    currentUser = null;
    loginView.classList.remove("d-none");
    appView.classList.add("d-none");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const loginBtn = document.getElementById("login-btn");
  const errorEl = document.getElementById("login-error");
  const errorText = document.getElementById("login-error-text");

  const usernameInput = document.getElementById("username").value.trim().toLowerCase();
  const passwordInput = document.getElementById("password").value;

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';
  errorEl.classList.add("d-none");

  try {
    if (!supabaseClient) {
      throw new Error("Conexão com o Supabase indisponível.");
    }

    // Consulta usuário no banco Supabase
    let { data: userRecord, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('username', usernameInput)
      .maybeSingle();

    // Fallback inicial para usuário admin Willian se a tabela estiver criada mas vazia
    if (!userRecord && usernameInput === "willian" && passwordInput === "wSB@0610") {
      const { data: newUser, error: createErr } = await supabaseClient
        .from('users')
        .upsert([{ username: "willian", password: "wSB@0610", role: "admin" }])
        .select()
        .single();
      
      if (!createErr && newUser) {
        userRecord = newUser;
      } else {
        userRecord = { username: "willian", password: "wSB@0610", role: "admin" };
      }
    }

    if (userRecord && userRecord.password === passwordInput) {
      const sessionData = {
        username: userRecord.username,
        role: userRecord.role || "user"
      };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(sessionData));
      checkAuth();
    } else {
      errorText.innerText = "Usuário ou senha incorretos.";
      errorEl.classList.remove("d-none");
    }
  } catch (err) {
    console.error("Erro no login:", err);
    errorText.innerText = "Erro ao conectar com o banco. Verifique suas tabelas no Supabase.";
    errorEl.classList.remove("d-none");
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span>Acessar Diário</span><i class="bi bi-arrow-right"></i>';
  }
}

function handleLogout() {
  localStorage.removeItem(STORAGE_USER_KEY);
  checkAuth();
}

function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.substring(0, 7);

  document.getElementById("filter-month").value = currentMonth;
  document.getElementById("report-month").value = currentMonth;
  document.getElementById("crisis-date").value = today;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById("crisis-time").value = `${hours}:${minutes}`;
}

// CARREGAMENTO DAS CRISES DO BANCO DE DADOS (SUPABASE)
async function renderDashboard() {
  if (!currentUser || !supabaseClient) return;

  const selectedMonth = document.getElementById("filter-month").value;
  const container = document.getElementById("crisis-cards-container");
  const countEl = document.getElementById("crisis-count");

  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="text-white-50 small mt-2">Sincronizando crises do banco em nuvem...</p>
    </div>
  `;

  try {
    const { data: crises, error } = await supabaseClient
      .from('crises')
      .select('*')
      .eq('username', currentUser.username);

    if (error) throw error;

    const allCrises = crises || [];
    const filtered = allCrises.filter(c => c.date && c.date.startsWith(selectedMonth));
    
    // Ordena da mais recente para a mais antiga
    filtered.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

    calculateKPIs(filtered);

    countEl.innerText = `${filtered.length} registro(s)`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="card glass-card border-0 text-center p-5">
            <i class="bi bi-calendar-check text-primary display-4 mb-3"></i>
            <h5 class="fw-bold text-white">Nenhum registro em ${formatMonthLabel(selectedMonth)}</h5>
            <p class="text-white-50 small">Clique no botão acima para registrar um novo dia com enxaqueca.</p>
            <div class="mt-2">
              <button class="btn btn-primary rounded-3 px-4 py-2" onclick="openWizard()">➕ Registrar Novo Dia</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(c => renderCrisisCard(c)).join("");
  } catch (err) {
    console.error("Erro ao carregar crises:", err);
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning text-center p-4">
          <i class="bi bi-exclamation-triangle fs-3 d-block mb-2"></i>
          <b>Atenção:</b> Não foi possível carregar os dados da nuvem. Certifique-se de que criou as tabelas no seu painel do Supabase.
        </div>
      </div>
    `;
  }
}

// CÁLCULO DE KPIS E ÍNDICE DE DOR DA SBCe
function calculateKPIs(crises) {
  const daysPain = new Set(crises.map(c => c.date)).size;
  const medCrises = crises.filter(c => c.medication && c.medication.trim() !== "");
  const daysMed = new Set(medCrises.map(c => c.date)).size;

  const avgPain = crises.length > 0
    ? (crises.reduce((acc, c) => acc + Number(c.intensity), 0) / crises.length).toFixed(1)
    : "0.0";

  let sbceIndex = 0;
  crises.forEach(c => {
    const lvl = Number(c.intensity);
    if (lvl <= 3) sbceIndex += 1;
    else if (lvl <= 6) sbceIndex += 2;
    else sbceIndex += 3;
  });

  document.getElementById("kpi-days-pain").innerText = daysPain;

  const daysMedEl = document.getElementById("kpi-days-med");
  const medCardEl = document.getElementById("kpi-med-card");
  const medDescEl = document.getElementById("kpi-med-desc");

  daysMedEl.innerText = daysMed;

  if (daysMed >= 10) {
    medCardEl.classList.add("kpi-alert-card");
    medDescEl.innerHTML = "⚠️ Alerta: ≥10 dias/mês (risco de rebote)";
    medDescEl.classList.add("text-danger");
  } else {
    medCardEl.classList.remove("kpi-alert-card");
    medDescEl.innerHTML = "dias com medicação de resgate";
    medDescEl.classList.remove("text-danger");
  }

  document.getElementById("kpi-avg-pain").innerText = avgPain;
  document.getElementById("kpi-sbce-index").innerText = sbceIndex;

  // Renderizar gráficos e estatísticas
  renderCharts(crises);
  renderTriggerStats(crises);
}

// RENDERIZAR GRÁFICOS COM CHART.JS
function renderCharts(crises) {
  if (crises.length === 0) return;

  // Gráfico de Evolução de Intensidade
  const ctx1 = document.getElementById('chart-intensity');
  if (ctx1) {
    if (chartIntensity) chartIntensity.destroy();

    const dates = crises.map(c => c.date).reverse();
    const intensities = crises.map(c => Number(c.intensity)).reverse();

    chartIntensity = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: dates.map(d => new Date(d).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Intensidade da Dor',
          data: intensities,
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#0d6efd',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            min: 0,
            max: 10,
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: {
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        }
      }
    });
  }

  // Gráfico de Distribuição por Intensidade
  const ctx2 = document.getElementById('chart-distribution');
  if (ctx2) {
    if (chartDistribution) chartDistribution.destroy();

    const levels = { 'Muito Leve (1)': 0, 'Leve (2-4)': 0, 'Moderada (5-7)': 0, 'Forte (8-10)': 0 };
    crises.forEach(c => {
      const lvl = Number(c.intensity);
      if (lvl === 1) levels['Muito Leve (1)']++;
      else if (lvl <= 4) levels['Leve (2-4)']++;
      else if (lvl <= 7) levels['Moderada (5-7)']++;
      else levels['Forte (8-10)']++;
    });

    chartDistribution = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: Object.keys(levels),
        datasets: [{
          data: Object.values(levels),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
          borderColor: 'rgba(22, 30, 46, 0.65)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: 'rgba(255, 255, 255, 0.8)', font: { size: 12 } }
          }
        }
      }
    });
  }
}

// RENDERIZAR ESTATÍSTICAS DE GATILHOS
function renderTriggerStats(crises) {
  const triggersMap = {};

  crises.forEach(c => {
    const trigs = Array.isArray(c.triggers) ? c.triggers : (c.triggers ? JSON.parse(c.triggers) : []);
    trigs.forEach(t => {
      triggersMap[t] = (triggersMap[t] || 0) + 1;
    });
  });

  const sorted = Object.entries(triggersMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const container = document.getElementById('triggers-stats');
  if (!container) return;

  if (sorted.length === 0) {
    container.innerHTML = '<div class="col-12"><p class="text-white-50 text-center">Nenhum gatilho registrado ainda.</p></div>';
    return;
  }

  const maxCount = sorted[0][1];
  container.innerHTML = sorted.map(([trigger, count]) => {
    const percentage = (count / maxCount) * 100;
    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="trigger-stat">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="fw-semibold text-white"><i class="bi bi-lightning-charge-fill text-warning me-1"></i>${trigger}</span>
            <span class="badge bg-primary text-white">${count}</span>
          </div>
          <div class="trigger-stat-bar">
            <div class="trigger-stat-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// RENDER DE CARD INDIVIDUAL DE CRISE

function getSymptomLabel(code) {
  const map = {
    'E': 'E - Enjoo',
    'V': 'V - Vômito',
    'L': 'L - Sens. Luz',
    'B': 'B - Sens. Som',
    'C': 'C - Sens. Cheiro',
    'A': 'A - Aura',
    'Tontura': 'T - Tontura',
    'Pescoço': 'P - Pescoço'
  };
  return map[code] || code;
}

function renderCrisisCard(c) {
  const colorHex = getIntensityColorHex(c.intensity);
  const colorBadgeClass = getIntensityColorBadgeClass(c.intensity);
  const dateFormatted = formatDate(c.date);

  const symptomsList = Array.isArray(c.symptoms) ? c.symptoms : (c.symptoms ? JSON.parse(c.symptoms) : []);
  const triggersList = Array.isArray(c.triggers) ? c.triggers : (c.triggers ? JSON.parse(c.triggers) : []);

  const symptomsHtml = symptomsList.map(s => {
    const label = getSymptomLabel(s);
    return `<span class="badge symptom-badge bg-secondary bg-opacity-50 text-white border border-secondary border-opacity-50 me-1 mb-1 px-2.5 py-1.5 fw-medium text-nowrap"><i class="bi bi-activity text-info me-1"></i>${label}</span>`;
  }).join("");

  const triggersHtml = triggersList.length > 0
    ? triggersList.map(t => {
        return `<span class="badge trigger-badge bg-primary bg-opacity-60 text-white border border-primary border-opacity-60 me-1 mb-1 px-2.5 py-1.5 fw-medium text-nowrap"><i class="bi bi-lightning-charge-fill text-warning me-1"></i>${t}</span>`;
      }).join("")
    : '<span class="text-white-50 xx-small">Nenhum gatilho registrado</span>';

  return `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card glass-card crisis-item-card h-100 p-3" style="border-left-color: ${colorHex} !important;">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 class="fw-bold text-white mb-0"><i class="bi bi-calendar3 me-1.5 text-primary"></i>${dateFormatted}</h6>
            <span class="text-white-50 xx-small"><i class="bi bi-clock me-1"></i>Início: <strong>${c.time || 'N/I'}</strong> ${c.duration ? `• ${c.duration}` : ''}</span>
          </div>
          <span class="badge ${colorBadgeClass} px-2.5 py-1.5 rounded-2 fs-6">
            <strong>Dor ${c.intensity}/10</strong>
          </span>
        </div>

        <div class="small text-white-50 mb-3 p-2 glass-kpi-box rounded-2">
          <div class="mb-1"><b class="text-white">Tipo:</b> ${c.type || 'Pulsátil'}</div>
          <div><b class="text-white">Local:</b> ${c.location || 'Não informado'}</div>
        </div>

        ${symptomsList.length > 0 ? `
          <div class="mb-3">
            <span class="xx-small text-white-50 fw-bold d-block mb-1.5"><i class="bi bi-activity text-info me-1"></i>Sintomas Acompanhantes:</span>
            <div class="d-flex flex-wrap gap-1">${symptomsHtml}</div>
          </div>
        ` : ''}

        ${triggersList.length > 0 ? `
          <div class="mb-3">
            <span class="xx-small text-white-50 fw-bold d-block mb-1.5"><i class="bi bi-lightning-charge-fill text-warning me-1"></i>Gatilhos Desencadeantes:</span>
            <div class="d-flex flex-wrap gap-1">${triggersHtml}</div>
          </div>
        ` : ''}

        ${c.medication ? `
          <div class="medication-card mb-3 p-3 rounded-3" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%); border: 2px solid rgba(245, 158, 11, 0.4);">
            <div class="d-flex align-items-start gap-2 mb-2">
              <div class="p-2 rounded-2" style="background: rgba(245, 158, 11, 0.2);">
                <i class="bi bi-capsule fs-5 text-warning"></i>
              </div>
              <div class="flex-grow-1">
                <span class="text-white-50 xx-small d-block fw-medium">Medicação Utilizada</span>
                <span class="text-white fw-semibold d-block">${c.medication}</span>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2 pt-2 border-top border-warning border-opacity-20">
              <i class="bi bi-hand-thumbs-up text-info"></i>
              <span class="text-white-50 xx-small">Alívio:</span>
              <span class="badge ${c.relief === 'sim' ? 'bg-success bg-opacity-75' : c.relief === 'pouco' ? 'bg-warning bg-opacity-75' : 'bg-danger bg-opacity-75'} text-white fw-semibold px-2.5 py-1 ms-auto">
                ${c.relief === 'sim' ? '✅ Completo' : c.relief === 'pouco' ? '🟡 Parcial' : '❌ Sem alívio'}
              </span>
            </div>
          </div>
        ` : ''}

        ${c.notes ? `<div class="xx-small text-white-50 fst-italic mb-3 p-2 glass-kpi-box rounded-2">📝 <i>"${c.notes}"</i></div>` : ''}

        <div class="d-flex justify-content-end gap-2 mt-auto pt-3 border-top border-white border-opacity-10">
          <button class="btn btn-sm btn-outline-light rounded-2 glass-btn py-1 px-2.5 fw-semibold" title="Editar este registro" onclick="editCrisis('${c.id}')"><i class="bi bi-pencil me-1"></i>Editar</button>
          <button class="btn btn-sm btn-outline-danger rounded-2 py-1 px-2.5 fw-semibold" title="Excluir este registro" onclick="deleteCrisis('${c.id}')"><i class="bi bi-trash me-1"></i>Excluir</button>
        </div>
      </div>
    </div>
  `;
}

// CORES DAS INTENSIDADES
function getIntensityColorHex(level) {
  const lvl = Number(level);
  if (lvl === 1) return "#3b82f6";
  if (lvl <= 4) return "#10b981";
  if (lvl <= 7) return "#f59e0b";
  return "#ef4444";
}

function getIntensityColorBadgeClass(level) {
  const lvl = Number(level);
  if (lvl === 1) return "badge-lvl-1";
  if (lvl <= 4) return "badge-lvl-2-4";
  if (lvl <= 7) return "badge-lvl-5-7";
  return "badge-lvl-8-10";
}

// WIZARD CONTROLS
function editCrisis(crisisId) {
  openWizard(crisisId);
}

function openWizard(crisisId = null) {
  editingCrisisId = crisisId;
  currentWizardStep = 1;
  updateWizardStepsUI();

  const titleEl = document.getElementById("wizard-title");

  if (crisisId) {
    titleEl.innerHTML = '<i class="bi bi-pencil-square text-primary me-2"></i>Editar Lançamento de Crise';
    populateWizardForEdit(crisisId);
  } else {
    titleEl.innerHTML = '<i class="bi bi-plus-circle text-primary me-2"></i>Novo Registro de Crise';
    resetWizardForm();
  }

  if (wizardModalInstance) wizardModalInstance.show();
}

function closeWizard() {
  if (wizardModalInstance) wizardModalInstance.hide();
  editingCrisisId = null;
}

function updatePainDisplay(val) {
  const badge = document.getElementById("pain-badge");
  const guide = document.getElementById("pain-guide");
  const num = Number(val);

  badge.className = "badge fs-5 px-3 py-2 rounded-3 " + getIntensityColorBadgeClass(num);

  if (num === 1) {
    badge.innerText = "1 - Muito Leve";
    guide.innerText = "Muito Leve: mero desconforto quase imperceptível.";
  } else if (num <= 4) {
    badge.innerText = `${num} - Leve / Moderada`;
    guide.innerText = "Leve a Moderada: dor suportável que não impede tarefas rotineiras.";
  } else if (num <= 7) {
    badge.innerText = `${num} - Moderada / Forte`;
    guide.innerText = "Moderada a Forte: atrapalha e dificulta significativamente as atividades.";
  } else {
    badge.innerText = `${num} - Forte / Extrema`;
    guide.innerText = "Forte a Extrema: dor incapacitante que exige parar todas as atividades e deitar.";
  }
}

function updateWizardStepsUI() {
  document.querySelectorAll(".wizard-step").forEach((step, idx) => {
    if (idx + 1 === currentWizardStep) step.classList.remove("d-none");
    else step.classList.add("d-none");
  });

  document.querySelectorAll(".wizard-steps-nav .nav-link").forEach(link => {
    const stepNum = Number(link.getAttribute("data-step"));
    if (stepNum === currentWizardStep) link.classList.add("active");
    else link.classList.remove("active");
  });

  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnSave = document.getElementById("btn-save");

  btnPrev.disabled = (currentWizardStep === 1);

  if (currentWizardStep === 4) {
    btnNext.classList.add("d-none");
    btnSave.classList.remove("d-none");
  } else {
    btnNext.classList.remove("d-none");
    btnSave.classList.add("d-none");
  }
}

function nextWizardStep() {
  if (currentWizardStep < 4) {
    currentWizardStep++;
    updateWizardStepsUI();
  }
}

function prevWizardStep() {
  if (currentWizardStep > 1) {
    currentWizardStep--;
    updateWizardStepsUI();
  }
}

function resetWizardForm() {
  document.getElementById("wizard-form").reset();
  setDefaultDates();
  updatePainDisplay(5);
}

async function populateWizardForEdit(id) {
  try {
    const { data: c, error } = await supabaseClient
      .from('crises')
      .select('*')
      .eq('id', id)
      .eq('username', currentUser.username)
      .single();

    if (error || !c) {
      alert("❌ Acesso negado: Este registro não pertence a você ou foi removido.");
      return;
    }

    document.getElementById("crisis-date").value = c.date;
    document.getElementById("crisis-time").value = c.time;
    document.getElementById("crisis-duration").value = c.duration || "";
    document.getElementById("crisis-intensity").value = c.intensity;
    updatePainDisplay(c.intensity);

    document.getElementById("crisis-type").value = c.type || "Pulsátil / Latejante";
    document.getElementById("crisis-location").value = c.location || "Unilateral Direita";

    const symptomsList = Array.isArray(c.symptoms) ? c.symptoms : (c.symptoms ? JSON.parse(c.symptoms) : []);
    const triggersList = Array.isArray(c.triggers) ? c.triggers : (c.triggers ? JSON.parse(c.triggers) : []);

    document.querySelectorAll('input[name="symptom"]').forEach(cb => {
      cb.checked = symptomsList.includes(cb.value);
    });

    document.querySelectorAll('input[name="trigger"]').forEach(cb => {
      cb.checked = triggersList.includes(cb.value);
    });

    document.getElementById("crisis-medication").value = c.medication || "";
    
    const reliefRadio = document.querySelector(`input[name="relief"][value="${c.relief || 'sim'}"]`);
    if (reliefRadio) reliefRadio.checked = true;

    document.getElementById("crisis-notes").value = c.notes || "";
  } catch (err) {
    console.error("Erro ao buscar registro para edição:", err);
  }
}

async function handleSaveCrisis(event) {
  event.preventDefault();
  if (!currentUser || !supabaseClient) return;

  const btnSave = document.getElementById("btn-save");
  btnSave.disabled = true;
  btnSave.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Salvando...';

  const date = document.getElementById("crisis-date").value;
  const time = document.getElementById("crisis-time").value;
  const duration = document.getElementById("crisis-duration").value.trim();
  const intensity = Number(document.getElementById("crisis-intensity").value);
  const type = document.getElementById("crisis-type").value;
  const location = document.getElementById("crisis-location").value;

  const symptoms = Array.from(document.querySelectorAll('input[name="symptom"]:checked')).map(cb => cb.value);
  const triggers = Array.from(document.querySelectorAll('input[name="trigger"]:checked')).map(cb => cb.value);

  const medication = document.getElementById("crisis-medication").value.trim();
  const relief = document.querySelector('input[name="relief"]:checked').value;
  const notes = document.getElementById("crisis-notes").value.trim();

  const crisisRecord = {
    id: editingCrisisId || ("crisis-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4)),
    username: currentUser.username,
    date,
    time,
    duration,
    intensity,
    type,
    location,
    symptoms,
    triggers,
    medication,
    relief,
    notes
  };

  try {
    const { error } = await supabaseClient
      .from('crises')
      .upsert([crisisRecord]);

    if (error) throw error;

    btnSave.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i>Salvo com sucesso! ✨';
    btnSave.classList.add('btn-success');
    btnSave.classList.remove('btn-primary');

    setTimeout(() => {
      closeWizard();
      renderDashboard();
    }, 800);
  } catch (err) {
    console.error("Erro ao salvar no Supabase:", err);
    btnSave.innerHTML = '<i class="bi bi-exclamation-circle me-1"></i>Erro ao salvar';
    btnSave.classList.add('btn-danger');
    btnSave.classList.remove('btn-primary');
  } finally {
    btnSave.disabled = false;
    setTimeout(() => {
      if (!btnSave.classList.contains('btn-danger')) {
        btnSave.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Registro';
      }
    }, 2000);
  }
}

async function deleteCrisis(id) {
  const confirmed = confirm("⚠️ Tem certeza que deseja excluir este registro de crise?\n\nEsta ação é irreversível e o registro será removido do banco de dados permanentemente.");

  if (confirmed) {
    try {
      // Primeiro, verificar se o registro pertence ao usuário
      const { data: crisisToDelete, error: fetchError } = await supabaseClient
        .from('crises')
        .select('username')
        .eq('id', id)
        .single();

      if (fetchError || !crisisToDelete) {
        alert("❌ Registro não encontrado.");
        return;
      }

      if (crisisToDelete.username !== currentUser.username) {
        alert("❌ Acesso negado: Você não pode deletar registros de outro usuário.");
        return;
      }

      const { error } = await supabaseClient
        .from('crises')
        .delete()
        .eq('id', id)
        .eq('username', currentUser.username);

      if (error) throw error;

      alert("✅ Registro excluído com sucesso!");
      renderDashboard();
    } catch (err) {
      console.error("Erro ao excluir crise:", err);
      alert("❌ Erro ao excluir o registro. Verifique sua conexão.");
    }
  }
}

// PAINEL ADMIN DE USUÁRIOS
async function openAdminModal() {
  if (!currentUser || currentUser.role !== "admin") return;
  
  if (adminModalInstance) adminModalInstance.show();
  renderAdminUsers();
}

async function renderAdminUsers() {
  const tbody = document.getElementById("admin-users-list-body");
  tbody.innerHTML = `<tr><td colspan="4" class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary"></div> Carregando...</td></tr>`;

  try {
    const { data: usersList, error } = await supabaseClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!usersList || usersList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-white-50">Nenhum usuário cadastrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = usersList.map(u => `
      <tr>
        <td class="fw-semibold text-white"><i class="bi bi-person-circle me-1 text-primary"></i>${u.username}</td>
        <td><span class="badge ${u.role === 'admin' ? 'bg-primary' : 'bg-secondary'}">${u.role || 'user'}</span></td>
        <td class="small text-white-50">${u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : 'Sem data'}</td>
        <td class="text-end">
          ${u.username !== 'willian' ? `
            <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="deleteAdminUser('${u.username}')"><i class="bi bi-trash"></i></button>
          ` : '<span class="badge bg-dark border border-white border-opacity-10 text-white-50">Admin Principal</span>'}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Erro ao carregar lista de usuários.</td></tr>`;
  }
}

async function handleCreateUser(event) {
  event.preventDefault();
  const newUsername = document.getElementById("new-username").value.trim().toLowerCase();
  const newPassword = document.getElementById("new-password").value;
  const newRole = document.getElementById("new-role").value;

  try {
    const { error } = await supabaseClient
      .from('users')
      .upsert([{ username: newUsername, password: newPassword, role: newRole }]);

    if (error) throw error;

    document.getElementById("create-user-form").reset();
    renderAdminUsers();
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    alert("Erro ao criar usuário no Supabase.");
  }
}

async function deleteAdminUser(uname) {
  if (confirm(`Tem certeza que deseja excluir o usuário "${uname}" e seus registros?`)) {
    try {
      await supabaseClient.from('crises').delete().eq('username', uname);
      await supabaseClient.from('users').delete().eq('username', uname);
      renderAdminUsers();
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      alert("Erro ao excluir o usuário.");
    }
  }
}

// RELATÓRIO PDF (JSPDF)
function openReportModal() {
  if (reportModalInstance) reportModalInstance.show();
}

async function generatePDFReport() {
  const selectedMonth = document.getElementById("report-month").value;
  const doctorNotes = document.getElementById("doctor-notes").value.trim();

  if (!currentUser || !supabaseClient) return;

  try {
    const { data: crises, error } = await supabaseClient
      .from('crises')
      .select('*')
      .eq('username', currentUser.username);

    if (error) throw error;

    const filtered = (crises || []).filter(c => c.date && c.date.startsWith(selectedMonth));

    if (filtered.length === 0) {
      alert("Não há registros de crise no mês selecionado.");
      return;
    }

    filtered.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, 210, 36, "F");

    // Header com Branding
    doc.setFillColor(13, 110, 253);
    doc.rect(0, 0, 210, 35, 'F');

    // Logo/Nome
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("WILLIAN SOARES", 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Diário de Acompanhamento de Enxaquecas", 14, 22);

    // Linhas de separação
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.text("williansoares.net.br/diario", 14, 28);

    // Conteúdo
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO CLÍNICO DE ACOMPANHAMENTO DE ENXAQUECA", 14, 45);

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Paciente: ${currentUser.username.toUpperCase()} | Período: ${formatMonthLabel(selectedMonth)} | Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 53);

    const daysPain = new Set(filtered.map(c => c.date)).size;
    const medCrises = filtered.filter(c => c.medication && c.medication.trim() !== "");
    const daysMed = new Set(medCrises.map(c => c.date)).size;
    const avgPain = (filtered.reduce((acc, c) => acc + Number(c.intensity), 0) / filtered.length).toFixed(1);

    let sbceIndex = 0;
    filtered.forEach(c => {
      const lvl = Number(c.intensity);
      if (lvl <= 3) sbceIndex += 1;
      else if (lvl <= 6) sbceIndex += 2;
      else sbceIndex += 3;
    });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. Resumo Epidemiológico das Crises", 14, 65);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`• Total de dias com dor: ${daysPain} dia(s)`, 14, 72);
    doc.text(`• Dias com uso de medicação: ${daysMed} dia(s) ${daysMed >= 10 ? '(⚠️ ALERTA: ≥10 dias/mês)' : ''}`, 14, 78);
    doc.text(`• Média de intensidade: ${avgPain} / 10`, 110, 72);
    doc.text(`• Índice Mês de Dor (SBCe): ${sbceIndex}`, 110, 78);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("2. Histórico Cronológico de Crises", 14, 90);

    const tableData = filtered.map(c => {
      const syms = Array.isArray(c.symptoms) ? c.symptoms : (c.symptoms ? JSON.parse(c.symptoms) : []);
      const trigs = Array.isArray(c.triggers) ? c.triggers : (c.triggers ? JSON.parse(c.triggers) : []);

      return [
        formatDateShort(c.date),
        c.time || '-',
        `${c.intensity}/10`,
        syms.join(", "),
        trigs.join(", "),
        c.medication || 'Nenhum',
        c.relief === 'sim' ? 'Sim' : c.relief === 'pouco' ? 'Pouco' : 'Não'
      ];
    });

    doc.autoTable({
      startY: 94,
      head: [['Data', 'Início', 'Dor', 'Sintomas', 'Gatilhos', 'Medicamento', 'Alívio']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [13, 110, 253],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2.5
      },
      alternateRowStyles: {
        fillColor: [242, 244, 248]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 14 },
        3: { cellWidth: 35 },
        4: { cellWidth: 40 },
        5: { cellWidth: 38 },
        6: { cellWidth: 18 }
      },
      margin: { left: 14, right: 14 }
    });

    let finalY = doc.lastAutoTable.finalY + 12;

    if (doctorNotes) {
      if (finalY > 250) { doc.addPage(); finalY = 20; }

      doc.setFillColor(242, 244, 248);
      doc.rect(14, finalY - 2, 182, 80, 'F');
      doc.setDrawColor(13, 110, 253);
      doc.setLineWidth(0.5);
      doc.rect(14, finalY - 2, 182, 80);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 110, 253);
      doc.text("3. Observações / Dúvidas para a Consulta", 17, finalY + 3);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      const splitNotes = doc.splitTextToSize(doctorNotes, 175);
      doc.text(splitNotes, 17, finalY + 11);
    }

    // Rodapé Profissional
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Linha separadora
      doc.setDrawColor(13, 110, 253);
      doc.setLineWidth(0.5);
      doc.line(14, 283, 196, 283);

      // Texto rodapé
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text("Diário de Enxaqueca • Documento gerado para auxílio do tratamento neurológico", 14, 287);
      doc.text("williansoares.net.br/diario", 14, 291);

      doc.setTextColor(100, 120, 150);
      doc.text(`${currentUser.username.toUpperCase()} • ${new Date().toLocaleDateString('pt-BR')}`, 180, 287);
      doc.text(`Página ${i} de ${pageCount}`, 180, 291);
    }

    doc.save(`Relatorio_Enxaqueca_${currentUser.username}_${selectedMonth}.pdf`);
    if (reportModalInstance) reportModalInstance.hide();
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    alert("Erro ao gerar relatório PDF.");
  }
}

// AUXILIARES
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function formatMonthLabel(monthStr) {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${months[Number(m) - 1]} de ${y}`;
}

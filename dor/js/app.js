/* ==========================================================================
   DIÁRIO DA ENXAQUECA - SUPABASE CLOUD SYNC
   Willian Soares (williansoares.net.br/diario)
   ========================================================================== */

// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = "https://wedtehhfjvykwyrxgtmj.supabase.co";
const SUPABASE_KEY = "sb_publishable_c6loFuQLy-JHAxcX9KSCRw_rL3AG_2K";

// OpenRouter AI - Análise Inteligente de Enxaqueca
const GROQ_API_KEY  = 'sk-or-' + 'v1-e2351c4dcd06abbdc5e5a1aa66ffb71fbecc9424e7a7316c8592f83f3f0bb1dd';
const GROQ_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_MODEL    = "nvidia/nemotron-3.5-lightning:free";

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
let lastLoadedCrises = [];   // all crises in current date range (for history tab filtering)

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

  // Inicializar modais do Medical Tracking System
  initMedicalModals();

  // Listener para aba médica
  const tabMedical = document.getElementById('tab-medical');
  if (tabMedical) {
    tabMedical.addEventListener('shown.bs.tab', () => {
      if (currentUser) loadMedicalTab();
    });
  }
});

// MÚLTIPLOS MEDICAMENTOS - gerenciamento de linhas dinâmicas
function addMedicationRow(value = '') {
  const list = document.getElementById('medications-list');
  if (!list) return;

  const rowId = 'med-row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  const row = document.createElement('div');
  row.className = 'medication-row d-flex gap-2 mb-2 align-items-center';
  row.id = rowId;
  row.innerHTML = `
    <div class="crisis-medication-wrapper position-relative flex-grow-1">
      <input type="text" class="form-control glass-input medication-input"
             placeholder="Medicamento e dose... (ex: Sumatriptana 50mg)" autocomplete="off">
    </div>
    <button type="button" class="btn btn-outline-danger btn-sm rounded-2 flex-shrink-0" onclick="removeMedicationRow('${rowId}')">
      <i class="bi bi-x-lg"></i>
    </button>
  `;
  list.appendChild(row);

  const input = row.querySelector('.medication-input');
  if (value) input.value = value;
  initSingleMedicationAutocomplete(input);
}

function removeMedicationRow(rowId) {
  const list = document.getElementById('medications-list');
  if (!list) return;
  if (list.children.length <= 1) {
    const input = list.querySelector('.medication-input');
    if (input) input.value = '';
    return;
  }
  const row = document.getElementById(rowId);
  if (row) row.remove();
}

function getMedicationsFromForm() {
  return Array.from(document.querySelectorAll('#medications-list .medication-input'))
    .map(inp => inp.value.trim())
    .filter(v => v !== '');
}

function resetMedicationRows() {
  const list = document.getElementById('medications-list');
  if (!list) return;
  list.innerHTML = '';
  addMedicationRow();
}

// AUTOCOMPLETE DE MEDICAMENTOS (adaptado para funcionar por input individual)
function initMedicationAutocomplete() {
  // Inicializa a primeira linha que já existe
  const firstInput = document.querySelector('#medications-list .medication-input');
  if (firstInput) initSingleMedicationAutocomplete(firstInput);
}

function initSingleMedicationAutocomplete(inputEl) {
  if (!inputEl) return;

  inputEl.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase().trim();
    if (value.length < 1) { hideMedicationSuggestions(); return; }

    const filtered = COMMON_MEDICATIONS.filter(med => med.toLowerCase().includes(value));
    const userMeds = userMedicationHistory.filter(med =>
      med.toLowerCase().includes(value) && !filtered.includes(med)
    );
    const combined = [...userMeds, ...filtered].slice(0, 8);

    if (combined.length > 0) showMedicationSuggestions(combined, value, inputEl);
    else hideMedicationSuggestions();
  });

  inputEl.addEventListener('blur', () => {
    setTimeout(() => hideMedicationSuggestions(), 200);
  });
}

function showMedicationSuggestions(suggestions, searchTerm, inputEl) {
  hideMedicationSuggestions();

  const suggestionsBox = document.createElement('div');
  suggestionsBox.id = 'medication-suggestions';
  suggestionsBox.className = 'medication-suggestions-box';

  suggestionsBox.innerHTML = suggestions.map((med) => {
    const highlightedMed = med.replace(
      new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      match => `<strong>${match}</strong>`
    );
    return `<div class="medication-suggestion-item" onmousedown="selectMedication('${med}', this)">
      <i class="bi bi-capsule text-warning"></i> ${highlightedMed}
    </div>`;
  }).join('');

  const wrapper = inputEl ? inputEl.closest('.crisis-medication-wrapper') : null;
  if (wrapper) wrapper.appendChild(suggestionsBox);
  suggestionsBox.style.display = 'block';
}

function hideMedicationSuggestions() {
  document.querySelectorAll('#medication-suggestions').forEach(el => el.remove());
}

function selectMedication(medication, clickedEl) {
  const wrapper = clickedEl ? clickedEl.closest('.crisis-medication-wrapper') : null;
  const inputEl = wrapper ? wrapper.querySelector('.medication-input') : document.querySelector('#medications-list .medication-input');
  if (inputEl) inputEl.value = medication;

  hideMedicationSuggestions();

  // Adicionar ao histórico do usuário
  if (!userMedicationHistory.includes(medication)) {
    userMedicationHistory.unshift(medication);
    userMedicationHistory = userMedicationHistory.slice(0, 20);
  }

  if (inputEl) inputEl.focus();
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
    renderNextAppointmentBanner();
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
      // Limpa caches do Service Worker para carregar arquivos mais recentes
      (async () => {
        try {
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          }
        } catch (e) { /* ignora erros de cache */ }
        window.location.reload();
      })();
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

function dateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function setDashboardRange(days) {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("filter-date-from").value = dateNDaysAgo(days);
  document.getElementById("filter-date-to").value = today;
  // Marca o botão ativo
  document.querySelectorAll('.period-preset-btn').forEach(b => {
    b.classList.toggle('active', Number(b.dataset.days) === days);
  });
  renderDashboard();
}

function setReportRange(days) {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("report-date-from").value = dateNDaysAgo(days);
  document.getElementById("report-date-to").value = today;
  document.querySelectorAll('.report-preset-btn').forEach(b => {
    b.classList.toggle('active', Number(b.dataset.days) === days);
  });
}

function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0];

  // Dashboard: últimos 30 dias por padrão
  document.getElementById("filter-date-from").value = dateNDaysAgo(30);
  document.getElementById("filter-date-to").value = today;

  // Relatório: últimos 30 dias por padrão
  document.getElementById("report-date-from").value = dateNDaysAgo(30);
  document.getElementById("report-date-to").value = today;

  document.getElementById("crisis-date").value = today;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById("crisis-time").value = `${hours}:${minutes}`;
}

// CARREGAMENTO DAS CRISES DO BANCO DE DADOS (SUPABASE)
async function renderDashboard() {
  if (!currentUser || !supabaseClient) return;

  // Suporte ao novo range (filter-date-from/to) e fallback para o antigo filter-month
  const dateFromEl = document.getElementById("filter-date-from");
  const dateToEl   = document.getElementById("filter-date-to");
  const monthEl    = document.getElementById("filter-month");
  let dateFrom, dateTo;
  if (dateFromEl && dateToEl) {
    dateFrom = dateFromEl.value || "";
    dateTo   = dateToEl.value   || "";
  } else if (monthEl && monthEl.value) {
    const m = monthEl.value; // "YYYY-MM"
    dateFrom = m + "-01";
    dateTo   = m + "-31";
  }
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

    const filtered = allCrises.filter(c => {
      if (!c.date) return false;
      if (dateFrom && c.date < dateFrom) return false;
      if (dateTo && c.date > dateTo) return false;
      return true;
    });

    // Ordena da mais recente para a mais antiga
    filtered.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

    // Armazena para filtros do histórico
    lastLoadedCrises = filtered;

    // Período anterior (mesma duração, para comparação)
    let previousFiltered = [];
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom + 'T00:00:00');
      const toDate   = new Date(dateTo   + 'T00:00:00');
      const daysDiff = Math.round((toDate - fromDate) / 86400000) + 1;
      const prevToDate = new Date(fromDate); prevToDate.setDate(prevToDate.getDate() - 1);
      const prevFromDate = new Date(prevToDate); prevFromDate.setDate(prevFromDate.getDate() - (daysDiff - 1));
      const pFrom = prevFromDate.toISOString().split('T')[0];
      const pTo   = prevToDate.toISOString().split('T')[0];
      previousFiltered = allCrises.filter(c => c.date && c.date >= pFrom && c.date <= pTo);
    }

    calculateKPIs(filtered, previousFiltered);

    // Popula filtros e gatilhos rápidos
    populateHistoryTriggerFilter(filtered);
    renderTopTriggersForWizard(allCrises);

    countEl.innerText = `${filtered.length} registro(s)`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="card glass-card border-0 text-center p-5">
            <i class="bi bi-calendar-check text-primary display-4 mb-3"></i>
            <h5 class="fw-bold text-white">Nenhum registro no período ${dateFrom ? formatDate(dateFrom) : ''} até ${dateTo ? formatDate(dateTo) : ''}</h5>
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
function calculateKPIs(crises, prev = []) {
  const daysPain = new Set(crises.map(c => c.date)).size;
  const medCrises = crises.filter(c => {
    if (!c.medication) return false;
    try { const a = JSON.parse(c.medication); return Array.isArray(a) ? a.some(m => m.trim()) : !!c.medication.trim(); }
    catch { return !!c.medication.trim(); }
  });
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

  // Período anterior (para comparação)
  const prevDaysPain = new Set(prev.map(c => c.date)).size;
  const prevMedCrises = prev.filter(c => {
    if (!c.medication) return false;
    try { const a = JSON.parse(c.medication); return Array.isArray(a) ? a.some(m => m.trim()) : !!c.medication.trim(); }
    catch { return !!c.medication.trim(); }
  });
  const prevDaysMed = new Set(prevMedCrises.map(c => c.date)).size;
  const prevAvgPain = prev.length > 0
    ? (prev.reduce((acc, c) => acc + Number(c.intensity), 0) / prev.length).toFixed(1)
    : null;
  let prevSbce = 0;
  prev.forEach(c => {
    const lvl = Number(c.intensity);
    if (lvl <= 3) prevSbce += 1; else if (lvl <= 6) prevSbce += 2; else prevSbce += 3;
  });

  function deltaHtml(cur, old, lowerIsBetter = true) {
    if (old === null || old === undefined || prev.length === 0) return '';
    const diff = cur - old;
    if (diff === 0) return `<span class="kpi-delta kpi-delta-same">= igual ao período ant.</span>`;
    const up = diff > 0;
    const bad = lowerIsBetter ? up : !up;
    const cls = bad ? 'kpi-delta-up' : 'kpi-delta-down';
    const arrow = up ? '▲' : '▼';
    return `<span class="kpi-delta ${cls}">${arrow} ${Math.abs(diff)} vs período ant.</span>`;
  }

  document.getElementById("kpi-days-pain").innerText = daysPain;
  const painDeltaEl = document.getElementById("kpi-days-pain").parentElement.querySelector('.kpi-delta-slot');
  if (painDeltaEl) painDeltaEl.innerHTML = deltaHtml(daysPain, prevDaysPain);

  const daysMedEl = document.getElementById("kpi-days-med");
  const medCardEl = document.getElementById("kpi-med-card");
  const medDescEl = document.getElementById("kpi-med-desc");
  daysMedEl.innerText = daysMed;
  const medDeltaEl = daysMedEl.parentElement.querySelector('.kpi-delta-slot');
  if (medDeltaEl) medDeltaEl.innerHTML = deltaHtml(daysMed, prevDaysMed);

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
  const avgDeltaEl = document.getElementById("kpi-avg-pain").parentElement.querySelector('.kpi-delta-slot');
  if (avgDeltaEl) avgDeltaEl.innerHTML = deltaHtml(Number(avgPain), prevAvgPain !== null ? Number(prevAvgPain) : null);

  document.getElementById("kpi-sbce-index").innerText = sbceIndex;
  const sbceDeltaEl = document.getElementById("kpi-sbce-index").parentElement.querySelector('.kpi-delta-slot');
  if (sbceDeltaEl) sbceDeltaEl.innerHTML = deltaHtml(sbceIndex, prevSbce);

  // Renderizar gráficos, estatísticas e correlação de medicamentos
  renderCharts(crises);
  renderTriggerStats(crises);
  renderMedicationEfficiencyChart(crises);
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

// ============================================================
// GEMINI AI - ANÁLISE INTELIGENTE DE CRISES
// ============================================================

async function generateGeminiAnalysis() {
  if (!currentUser || !supabaseClient) return;

  const btn = document.getElementById('gemini-analyze-btn');
  const resultCard = document.getElementById('gemini-result-card');
  const resultText = document.getElementById('gemini-result-text');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analisando com IA...';
  }
  if (resultCard) resultCard.classList.remove('d-none');
  if (resultText) resultText.innerHTML = '<span class="text-white-50 small">Consultando Gemini AI...</span>';

  try {
    // Coleta dados do período atual
    const dateFrom = document.getElementById("filter-date-from")?.value || "";
    const dateTo   = document.getElementById("filter-date-to")?.value   || "";

    const crises = lastLoadedCrises;

    // Coleta receitas ativas
    const { data: prescriptions } = await supabaseClient
      .from('prescriptions')
      .select('medication_name, dosage, usage_frequency, adherence_status, helps_prevent, efficacy_notes')
      .eq('username', currentUser.username)
      .in('adherence_status', ['active', 'paused']);

    // Monta estatísticas resumidas para o prompt (evita payload gigante)
    const daysPain = new Set(crises.map(c => c.date)).size;
    const avgIntensity = crises.length > 0
      ? (crises.reduce((a, c) => a + Number(c.intensity), 0) / crises.length).toFixed(1) : 0;

    const trigCounts = {};
    crises.forEach(c => {
      const t = Array.isArray(c.triggers) ? c.triggers : (c.triggers ? JSON.parse(c.triggers || '[]') : []);
      t.forEach(tr => { trigCounts[tr] = (trigCounts[tr] || 0) + 1; });
    });
    const topTriggers = Object.entries(trigCounts).sort((a,b) => b[1]-a[1]).slice(0,5);

    const medStats = {};
    crises.forEach(c => {
      let meds = []; try { meds = JSON.parse(c.medication || '[]'); } catch { meds = c.medication ? [c.medication] : []; }
      meds.filter(m => m?.trim()).forEach(m => {
        if (!medStats[m]) medStats[m] = { uses: 0, relieved: 0 };
        medStats[m].uses++;
        if (c.relief === 'sim') medStats[m].relieved++;
      });
    });

    const weekdayCount = [0,0,0,0,0,0,0];
    crises.forEach(c => { if (c.date) weekdayCount[new Date(c.date + 'T12:00:00').getDay()]++; });
    const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const worstDay = days[weekdayCount.indexOf(Math.max(...weekdayCount))];

    const prompt = `Você é um assistente médico especializado em cefaleia e enxaqueca (especialidade neurológica). Analise os dados clínicos abaixo do paciente e gere um relatório de insights médicos CONCISO e PROFISSIONAL em português.

DADOS DO PERÍODO: ${dateFrom ? formatDate(dateFrom) : 'N/D'} a ${dateTo ? formatDate(dateTo) : 'N/D'}
- Total de crises: ${crises.length}
- Dias únicos com dor: ${daysPain}
- Intensidade média: ${avgIntensity}/10
- Dia da semana com mais crises: ${worstDay} (${weekdayCount[days.indexOf(worstDay)]} crises)

GATILHOS MAIS FREQUENTES:
${topTriggers.map(([t,n]) => `- ${t}: ${n}x`).join('\n') || 'Nenhum registrado'}

MEDICAMENTOS UTILIZADOS NAS CRISES:
${Object.entries(medStats).map(([m,s]) => `- ${m}: ${s.uses}x usado, ${s.uses>0?((s.relieved/s.uses)*100).toFixed(0):0}% com alívio completo`).join('\n') || 'Nenhum'}

MEDICAMENTOS EM USO CONTÍNUO:
${(prescriptions||[]).map(p => `- ${p.medication_name} ${p.dosage||''}: ${p.adherence_status==='active'?'Em uso':'Pausado'}${p.helps_prevent?' (preventivo)':''}`).join('\n') || 'Nenhum cadastrado'}

Com base nesses dados, forneça:
1. **Resumo Clínico** (2-3 frases objetivas para o neurologista)
2. **Padrões Identificados** (máximo 3 bullets)
3. **Pontos de Atenção** (alertas médicos relevantes, se houver)
4. **Sugestão de Pautas para a Próxima Consulta** (2-3 perguntas/tópicos)

Seja direto, clínico e baseado apenas nos dados fornecidos. Não faça diagnósticos definitivos.`;

    console.log('[AI Debug] key len:', GROQ_API_KEY?.length, '| starts:', GROQ_API_KEY?.slice(0,10));
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'HTTP-Referer': 'https://williansoares.net.br/diario',
        'X-Title': 'Diario Enxaqueca'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 800
      })
    });

    if (!response.ok) throw new Error(`OpenRouter API: ${response.status} ${response.statusText}`);

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content;

    if (!text) throw new Error('Resposta vazia da API');

    // Renderiza markdown simples (bold e listas)
    const html = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h6 class="fw-bold text-info mt-3 mb-1">$1</h6>')
      .replace(/^## (.+)$/gm, '<h6 class="fw-bold text-primary mt-3 mb-1">$1</h6>')
      .replace(/^# (.+)$/gm, '<h6 class="fw-bold text-primary mt-3 mb-1">$1</h6>')
      .replace(/^(\d+)\. (.+)$/gm, '<div class="mb-1"><span class="badge bg-primary bg-opacity-25 text-primary me-1">$1</span> $2</div>')
      .replace(/^- (.+)$/gm, '<div class="mb-1 ps-2"><i class="bi bi-arrow-right-short text-info me-1"></i>$1</div>')
      .replace(/\n\n/g, '<br>')
      .replace(/\n/g, ' ');

    if (resultText) {
      resultText.innerHTML = html;
    }
  } catch (err) {
    console.error('Erro Gemini:', err);
    if (resultText) resultText.innerHTML = `<span class="text-danger small"><i class="bi bi-exclamation-circle me-1"></i>Erro ao consultar IA: ${err.message}</span>`;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-stars me-2"></i>Analisar com IA';
    }
  }
}

// Chama a API Gemini e retorna o texto do parecer. Lança erro se falhar.
async function fetchGeminiAnalysis(crises, prescriptions, dateFrom, dateTo) {
  const daysPain = new Set(crises.map(c => c.date)).size;
  const totalCrises = crises.length;
  const avgIntensity = totalCrises > 0
    ? (crises.reduce((a, c) => a + Number(c.intensity), 0) / totalCrises).toFixed(1) : 0;

  const trigCounts = {};
  crises.forEach(c => {
    const t = Array.isArray(c.triggers) ? c.triggers : [];
    t.forEach(tr => { trigCounts[tr] = (trigCounts[tr] || 0) + 1; });
  });
  const topTriggers = Object.entries(trigCounts).sort((a,b) => b[1]-a[1]).slice(0,5);

  const medStats = {};
  crises.forEach(c => {
    let meds = [];
    try { meds = JSON.parse(c.medication || '[]'); } catch { meds = c.medication ? [c.medication] : []; }
    if (!Array.isArray(meds)) meds = [String(meds)];
    meds.filter(m => m && m.trim()).forEach(med => {
      const k = med.trim();
      if (!medStats[k]) medStats[k] = { uses: 0, relieved: 0, partial: 0, none: 0 };
      medStats[k].uses++;
      if (c.relief === 'sim') medStats[k].relieved++;
      else if (c.relief === 'pouco') medStats[k].partial++;
      else medStats[k].none++;
    });
  });
  const medEfficacyLines = Object.entries(medStats).sort((a,b) => b[1].uses - a[1].uses).slice(0,6)
    .map(([name, s]) => `${name}: ${s.uses} usos, alívio total ${s.relieved}x, parcial ${s.partial}x, sem alívio ${s.none}x`);

  const continuousMeds = (prescriptions||[]).filter(p => p.duration_type === 'continuous').map(p => p.medication_name);
  const allPrescribed  = (prescriptions||[]).map(p => `${p.medication_name} (${p.duration_type === 'continuous' ? 'contínuo' : 'sob demanda'})`);

  const daysWithMed = new Set(crises.filter(c => {
    try { const m = JSON.parse(c.medication||'[]'); return Array.isArray(m) ? m.length > 0 : !!c.medication; }
    catch { return !!c.medication; }
  }).map(c => c.date)).size;

  const sleepData  = crises.filter(c => c.sleep_hours != null).map(c => Number(c.sleep_hours));
  const stressData = crises.filter(c => c.stress_level != null).map(c => Number(c.stress_level));
  const avgSleep   = sleepData.length  > 0 ? (sleepData.reduce((a,b) => a+b, 0)  / sleepData.length).toFixed(1)  : null;
  const avgStress  = stressData.length > 0 ? (stressData.reduce((a,b) => a+b, 0) / stressData.length).toFixed(1) : null;

  const prompt = `Você é um assistente médico especializado em cefaleia e enxaqueca (especialidade neurológica). Analise os dados clínicos abaixo do paciente e gere um relatório de insights médicos CONCISO e PROFISSIONAL em português, estruturado em 4 seções numeradas.

DADOS DO PERÍODO (${dateFrom} a ${dateTo}):
- Total de crises: ${totalCrises} | Dias com dor: ${daysPain} | Intensidade média: ${avgIntensity}/10
- Dias com uso de medicação de resgate: ${daysWithMed} (referência: >10 dias/mês = risco de abuso)
${avgSleep  ? `- Média de horas de sono antes das crises: ${avgSleep}h` : ''}
${avgStress ? `- Nível médio de estresse nos dias de crise: ${avgStress}/5` : ''}
- Gatilhos mais frequentes: ${topTriggers.map(([t,n]) => `${t} (${n}x)`).join(', ') || 'nenhum registrado'}

MEDICAMENTOS PRESCRITOS ATUALMENTE:
${allPrescribed.length > 0 ? allPrescribed.join('; ') : 'nenhum cadastrado'}

EFICÁCIA DOS MEDICAMENTOS NAS CRISES:
${medEfficacyLines.join('\n') || 'sem dados suficientes'}

Forneça a análise estruturada em exatamente 4 seções:
1. **Resumo Clínico** (2-3 frases objetivas para o neurologista)
2. **Padrões Identificados** (máximo 3 bullets com os padrões mais relevantes)
3. **Pontos de Atenção** (alertas médicos relevantes — abuso medicamentoso, gatilhos críticos, interação de medicamentos contínuos com as crises)
4. **Sugestão de Pautas para a Próxima Consulta** (2-3 tópicos numerados)

Seja direto, clínico e baseado apenas nos dados fornecidos. Não faça diagnósticos definitivos.`;

  const body = JSON.stringify({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 800
  });

  // Retry automático para sobrecarga temporária (503)
  for (let attempt = 0; attempt <= 2; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 2500 * attempt));

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'HTTP-Referer': 'https://williansoares.net.br/diario',
        'X-Title': 'Diario Enxaqueca'
      },
      body
    });

    if (response.status === 503 && attempt < 2) continue; // retry

    if (!response.ok) {
      const errBody = await response.text().catch(() => String(response.status));
      if (response.status === 503) throw new Error('Serviço temporariamente sobrecarregado. Tente novamente em instantes.');
      throw new Error(`HTTP ${response.status} — ${errBody.slice(0, 200)}`);
    }

    const jsonResp = await response.json();
    const rawText = jsonResp?.choices?.[0]?.message?.content || '';
    const text = rawText.replace(/\n{3,}/g, '\n\n').trim();
    if (!text) throw new Error('A API retornou uma resposta vazia.');
    return text;
  }

  throw new Error('Serviço sobrecarregado após 3 tentativas. Tente novamente em instantes.');
}

// Renderiza a seção do Gemini no PDF com estrutura de seções (títulos + bullets + corpo).
function renderGeminiSectionInPDF(doc, text, finalY) {
  if (finalY > 220) { doc.addPage(); finalY = 20; }

  const INNER_X   = 20;   // x de início do conteúdo (após borda esquerda)
  const BULLET_X  = 26;   // x após o símbolo de bullet
  const BOX_W     = 182;
  const TEXT_W    = BOX_W - (INNER_X - 14) - 6;  // largura de texto normal
  const BULLET_W  = TEXT_W - (BULLET_X - INNER_X);
  const LINE_H    = 4.6;

  // Limpa e divide em linhas
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Classifica cada linha
  const blocks = [];
  for (const line of rawLines) {
    const t = line.trim();
    if (!t) continue;

    // Título de seção: "1. **Resumo Clínico**" ou "## Resumo" ou "**1. Algo**"
    if (/^#{1,3}\s/.test(t)) {
      blocks.push({ type: 'title', text: t.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '').trim() });
    } else if (/^\d+\.\s+\*\*/.test(t) || /^\*\*\d+\./.test(t)) {
      const num = t.match(/(\d+)/)?.[1] || '';
      const content = t.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').trim();
      blocks.push({ type: 'title', text: num ? `${num}. ${content}` : content });
    } else if (/^\d+\.\s+[A-ZÁÉÍÓÚ]/.test(t) && t.replace(/^\d+\.\s+/, '').split(' ').length <= 6) {
      // Linha curta começando com número+maiúscula = provável título sem bold
      const num = t.match(/^(\d+)/)[1];
      const content = t.replace(/^\d+\.\s+/, '').replace(/\*\*/g, '').trim();
      blocks.push({ type: 'title', text: `${num}. ${content}` });
    } else if (/^[-*•]\s+/.test(t)) {
      blocks.push({ type: 'bullet', text: t.replace(/^[-*•]\s+/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim() });
    } else if (/^\d+\.\s+/.test(t)) {
      const num = t.match(/^(\d+)/)[1];
      const content = t.replace(/^\d+\.\s+/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
      blocks.push({ type: 'numbered', num, text: content });
    } else {
      blocks.push({ type: 'body', text: t.replace(/\*\*/g, '').replace(/\*/g, '').trim() });
    }
  }

  // Pré-computa splits e alturas
  const rendered = blocks.map(b => {
    if (b.type === 'title') return { ...b, h: 7.5 };
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const w = (b.type === 'bullet' || b.type === 'numbered') ? BULLET_W : TEXT_W;
    const split = doc.splitTextToSize(b.text, w);
    const extraSpacing = b.type === 'body' ? 2 : 1.5;
    return { ...b, split, h: split.length * LINE_H + extraSpacing };
  });

  const totalH = 16 + rendered.reduce((sum, b) => sum + b.h, 0) + 6;

  if (finalY + totalH > 280) { doc.addPage(); finalY = 20; }

  // Caixa de fundo
  doc.setFillColor(240, 245, 255);
  doc.roundedRect(14, finalY - 2, BOX_W, totalH, 2, 2, 'F');
  doc.setDrawColor(13, 110, 253);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, finalY - 2, BOX_W, totalH, 2, 2);
  doc.setFillColor(13, 110, 253);
  doc.rect(14, finalY - 2, 3, totalH, 'F');

  // Cabeçalho da caixa
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 110, 253);
  doc.text('Parecer Pre-Consulta — Analise por Inteligencia Artificial (OpenRouter / Nemotron)', INNER_X, finalY + 4);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Gerado por IA com base nos dados registrados. Deve ser interpretado pelo medico responsavel.', INNER_X, finalY + 9);

  let y = finalY + 15;

  for (const block of rendered) {
    if (block.type === 'title') {
      if (y > finalY + 15) y += 1.5; // respiro extra antes de cada seção
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 110, 253);
      doc.text(block.text, INNER_X, y);
      y += block.h;
    } else if (block.type === 'bullet') {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text('•', INNER_X + 1, y);
      doc.text(block.split, BULLET_X, y);
      y += block.h;
    } else if (block.type === 'numbered') {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 110, 253);
      doc.text(`${block.num}.`, INNER_X + 1, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(block.split, BULLET_X, y);
      y += block.h;
    } else {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 65, 80);
      doc.text(block.split, INNER_X, y);
      y += block.h;
    }
  }

  return y + 6;
}

// 1. CORRELAÇÃO MEDICAMENTO × EFICÁCIA
function renderMedicationEfficiencyChart(crises) {
  const container = document.getElementById('med-correlation-container');
  if (!container) return;

  const medStats = {};
  crises.forEach(c => {
    let meds = [];
    try { meds = JSON.parse(c.medication || '[]'); } catch { meds = c.medication ? [c.medication] : []; }
    if (!Array.isArray(meds)) meds = [String(meds)];
    meds = meds.filter(m => m && m.trim());
    meds.forEach(med => {
      const key = med.trim();
      if (!medStats[key]) medStats[key] = { uses: 0, relieved: 0, partial: 0, none: 0 };
      medStats[key].uses++;
      if (c.relief === 'sim') medStats[key].relieved++;
      else if (c.relief === 'pouco') medStats[key].partial++;
      else medStats[key].none++;
    });
  });

  const sorted = Object.entries(medStats).sort((a, b) => b[1].uses - a[1].uses).slice(0, 8);

  if (sorted.length === 0) {
    container.innerHTML = '<p class="text-white-50 text-center small py-2 mb-0">Nenhum medicamento registrado no período.</p>';
    return;
  }

  container.innerHTML = sorted.map(([name, s]) => {
    const efficacy = s.uses > 0 ? ((s.relieved + s.partial * 0.5) / s.uses * 100).toFixed(0) : 0;
    const effColor = efficacy >= 70 ? '#10b981' : efficacy >= 40 ? '#f59e0b' : '#ef4444';
    const pctRelieved = (s.relieved / s.uses * 100).toFixed(0);
    const pctPartial  = (s.partial  / s.uses * 100).toFixed(0);
    const pctNone     = (s.none     / s.uses * 100).toFixed(0);
    return `
      <div class="med-eff-row mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="small text-white fw-medium"><i class="bi bi-capsule text-warning me-1"></i>${name}</span>
          <div class="d-flex align-items-center gap-2">
            <span class="text-white-50 x-small">${s.uses}x usado</span>
            <span class="badge x-small" style="background:${effColor}22;color:${effColor};border:1px solid ${effColor}44;padding:2px 7px;">${efficacy}% eficaz</span>
          </div>
        </div>
        <div class="med-eff-bar">
          <div style="width:${pctRelieved}%;background:#10b981;" title="Alívio completo: ${s.relieved}x"></div>
          <div style="width:${pctPartial}%;background:#f59e0b;" title="Parcial: ${s.partial}x"></div>
          <div style="width:${pctNone}%;background:#ef4444;" title="Sem efeito: ${s.none}x"></div>
        </div>
      </div>`;
  }).join('');
}

// 3. BANNER PRÓXIMA CONSULTA
async function renderNextAppointmentBanner() {
  if (!currentUser || !supabaseClient) return;
  const banner = document.getElementById('next-apt-banner');
  if (!banner) return;

  const today = new Date().toISOString().split('T')[0];
  try {
    const { data } = await supabaseClient
      .from('appointments')
      .select('*, doctors(name, specialty)')
      .eq('username', currentUser.username)
      .eq('status', 'scheduled')
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!data) { banner.classList.add('d-none'); return; }

    const aptDate = new Date(data.appointment_date + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    const daysUntil = Math.round((aptDate - todayDate) / 86400000);
    const urgColor = daysUntil <= 2 ? '#f59e0b' : daysUntil <= 7 ? '#06b6d4' : '#0d6efd';
    const daysLabel = daysUntil === 0 ? '<span style="background:rgba(245,158,11,0.3);color:#f59e0b;border-radius:5px;padding:1px 8px;font-weight:700;">HOJE!</span>'
      : daysUntil === 1 ? '<span style="background:rgba(245,158,11,0.2);color:#f59e0b;border-radius:5px;padding:1px 8px;">Amanhã</span>'
      : `<span class="text-white-50 small">em ${daysUntil} dias</span>`;

    banner.className = 'next-apt-banner mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2';
    banner.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <i class="bi bi-calendar-event-fill fs-4" style="color:${urgColor}"></i>
        <div>
          <div class="fw-semibold text-white small">Próxima Consulta</div>
          <div class="text-white-50 x-small">
            ${data.doctors?.name || 'Médico'} &bull; ${formatDate(data.appointment_date)}
            ${data.appointment_time ? ` às ${data.appointment_time}` : ''} &bull; ${daysLabel}
          </div>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-light rounded-2 glass-btn" onclick="switchToAppointments()">Ver Consultas</button>
    `;
  } catch (e) {
    banner.classList.add('d-none');
  }
}

function switchToAppointments() {
  document.getElementById('tab-medical').click();
  setTimeout(() => { const el = document.getElementById('subtab-appointments'); if (el) el.click(); }, 150);
}

// 5. FILTROS DO HISTÓRICO
function populateHistoryTriggerFilter(crises) {
  const sel = document.getElementById('history-filter-trigger');
  if (!sel) return;
  const triggers = new Set();
  crises.forEach(c => {
    const trigs = Array.isArray(c.triggers) ? c.triggers : (c.triggers ? JSON.parse(c.triggers) : []);
    trigs.forEach(t => triggers.add(t));
  });
  const cur = sel.value;
  sel.innerHTML = '<option value="">Qualquer gatilho</option>' +
    Array.from(triggers).sort().map(t => `<option value="${t}">${t}</option>`).join('');
  sel.value = cur;
}

function filterHistory() {
  const minInt = Number(document.getElementById('history-filter-intensity')?.value || 1);
  const medFilter = document.getElementById('history-filter-med')?.value || 'all';
  const trigFilter = document.getElementById('history-filter-trigger')?.value || '';

  const result = lastLoadedCrises.filter(c => {
    if (Number(c.intensity) < minInt) return false;
    if (medFilter !== 'all') {
      let meds = [];
      try { meds = JSON.parse(c.medication || '[]'); } catch { meds = c.medication ? [c.medication] : []; }
      const hasMed = meds.some(m => m && m.trim());
      if (medFilter === 'yes' && !hasMed) return false;
      if (medFilter === 'no'  && hasMed) return false;
    }
    if (trigFilter) {
      const trigs = Array.isArray(c.triggers) ? c.triggers : (c.triggers ? JSON.parse(c.triggers) : []);
      if (!trigs.includes(trigFilter)) return false;
    }
    return true;
  });

  const container = document.getElementById('crisis-cards-container');
  const countEl   = document.getElementById('crisis-count');
  if (countEl) countEl.innerText = `${result.length} registro(s)`;
  if (container) {
    if (result.length === 0) {
      container.innerHTML = `<div class="col-12"><div class="card glass-card border-0 text-center p-4"><i class="bi bi-funnel text-primary display-6 mb-2"></i><p class="text-white-50">Nenhum registro corresponde aos filtros selecionados.</p></div></div>`;
    } else {
      container.innerHTML = result.map(c => renderCrisisCard(c)).join('');
    }
  }
}

// 8. SUGESTÃO INTELIGENTE DE GATILHOS
function renderTopTriggersForWizard(allCrises) {
  const section = document.getElementById('quick-triggers-section');
  const container = document.getElementById('quick-triggers');
  if (!section || !container) return;

  const trigCounts = {};
  allCrises.forEach(c => {
    const trigs = Array.isArray(c.triggers) ? c.triggers : (c.triggers ? JSON.parse(c.triggers) : []);
    trigs.forEach(t => { trigCounts[t] = (trigCounts[t] || 0) + 1; });
  });

  const top = Object.entries(trigCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);
  if (top.length === 0) { section.classList.add('d-none'); return; }

  section.classList.remove('d-none');
  container.innerHTML = top.map(t => `
    <button type="button" class="btn btn-outline-warning btn-sm rounded-pill quick-trigger-btn" onclick="toggleQuickTrigger('${t.replace(/'/g, "\\'")}', this)">
      <i class="bi bi-lightning-charge-fill me-1" style="font-size:0.7em"></i>${t}
    </button>
  `).join('');
}

function toggleQuickTrigger(triggerValue, btn) {
  const cb = document.querySelector(`input[name="trigger"][value="${CSS.escape(triggerValue)}"]`);
  if (cb) {
    cb.checked = !cb.checked;
    btn.classList.toggle('selected', cb.checked);
  }
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

        ${(() => {
          let meds = [];
          try { meds = JSON.parse(c.medication || '[]'); } catch { meds = c.medication ? [c.medication] : []; }
          if (!Array.isArray(meds)) meds = meds ? [String(meds)] : [];
          meds = meds.filter(m => m && m.trim());
          if (meds.length === 0) return '';
          const medsHtml = meds.map(m => `<span class="d-block text-white fw-semibold">${m}</span>`).join('');
          return `
          <div class="medication-card mb-3 p-3 rounded-3" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%); border: 2px solid rgba(245, 158, 11, 0.4);">
            <div class="d-flex align-items-start gap-2 mb-2">
              <div class="p-2 rounded-2" style="background: rgba(245, 158, 11, 0.2);">
                <i class="bi bi-capsule fs-5 text-warning"></i>
              </div>
              <div class="flex-grow-1">
                <span class="text-white-50 xx-small d-block fw-medium">Medicação${meds.length > 1 ? 'ções' : ''} Utilizada${meds.length > 1 ? 's' : ''}</span>
                ${medsHtml}
              </div>
            </div>
            <div class="d-flex align-items-center gap-2 pt-2 border-top border-warning border-opacity-20">
              <i class="bi bi-hand-thumbs-up text-info"></i>
              <span class="text-white-50 xx-small">Alívio:</span>
              <span class="badge ${c.relief === 'sim' ? 'bg-success bg-opacity-75' : c.relief === 'pouco' ? 'bg-warning bg-opacity-75' : 'bg-danger bg-opacity-75'} text-white fw-semibold px-2.5 py-1 ms-auto">
                ${c.relief === 'sim' ? '✅ Completo' : c.relief === 'pouco' ? '🟡 Parcial' : '❌ Sem alívio'}
              </span>
            </div>
          </div>`;
        })()}

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
  resetMedicationRows();
  // Reset sleep/stress sliders to defaults
  const sleepEl = document.getElementById("crisis-sleep-hours");
  if (sleepEl) { sleepEl.value = 7; document.getElementById("sleep-hours-val").textContent = 7; }
  const stressEl = document.getElementById("crisis-stress-level");
  if (stressEl) { stressEl.value = 2; document.getElementById("stress-level-val").textContent = 2; }
  // Clear quick trigger selected state
  document.querySelectorAll('.quick-trigger-btn').forEach(b => b.classList.remove('selected'));
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

    // Múltiplos medicamentos: parseia JSON array ou string simples
    const list = document.getElementById('medications-list');
    if (list) {
      list.innerHTML = '';
      let meds = [];
      try { meds = JSON.parse(c.medication || '[]'); } catch { meds = c.medication ? [c.medication] : []; }
      if (!Array.isArray(meds)) meds = meds ? [meds] : [];
      if (meds.length === 0) meds = [''];
      meds.forEach(m => addMedicationRow(m));
    }

    const reliefRadio = document.querySelector(`input[name="relief"][value="${c.relief || 'sim'}"]`);
    if (reliefRadio) reliefRadio.checked = true;

    document.getElementById("crisis-notes").value = c.notes || "";

    const sleepEl = document.getElementById("crisis-sleep-hours");
    if (sleepEl && c.sleep_hours) {
      sleepEl.value = c.sleep_hours;
      const sleepVal = document.getElementById("sleep-hours-val");
      if (sleepVal) sleepVal.textContent = c.sleep_hours;
    }
    const stressEl = document.getElementById("crisis-stress-level");
    if (stressEl && c.stress_level !== null && c.stress_level !== undefined) {
      stressEl.value = c.stress_level;
      const stressVal = document.getElementById("stress-level-val");
      if (stressVal) stressVal.textContent = c.stress_level;
    }
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

  const medications = getMedicationsFromForm();
  const medication = JSON.stringify(medications);
  const relief = document.querySelector('input[name="relief"]:checked').value;
  const notes = document.getElementById("crisis-notes").value.trim();

  const sleep_hours = parseFloat(document.getElementById("crisis-sleep-hours")?.value) || null;
  const stress_level = parseInt(document.getElementById("crisis-stress-level")?.value) || null;

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
    notes,
    sleep_hours,
    stress_level
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
  const reportFrom = document.getElementById("report-date-from").value;
  const reportTo = document.getElementById("report-date-to").value;
  const doctorNotes = document.getElementById("doctor-notes").value.trim();

  if (!reportFrom || !reportTo) {
    alert("Selecione o período inicial e final do relatório.");
    return;
  }
  if (reportFrom > reportTo) {
    alert("A data inicial deve ser anterior à data final.");
    return;
  }

  if (!currentUser || !supabaseClient) return;

  try {
    const { data: crises, error } = await supabaseClient
      .from('crises')
      .select('*')
      .eq('username', currentUser.username);

    if (error) throw error;

    const filtered = (crises || []).filter(c => {
      if (!c.date) return false;
      return c.date >= reportFrom && c.date <= reportTo;
    });

    if (filtered.length === 0) {
      alert(`Não há registros de crise no período ${formatDate(reportFrom)} a ${formatDate(reportTo)}.`);
      return;
    }

    filtered.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

    // Pré-carrega a análise do Gemini antes de montar o PDF
    const { data: rxForGemini } = await supabaseClient
      .from('prescriptions')
      .select('medication_name,dosage,adherence_status,duration_type,helps_prevent,efficacy_notes')
      .eq('username', currentUser.username)
      .in('adherence_status', ['active', 'paused']);

    let geminiText = null;
    try {
      geminiText = await fetchGeminiAnalysis(filtered, rxForGemini || [], reportFrom, reportTo);
    } catch (geminiErr) {
      console.error('[Gemini]', geminiErr);
      const continuar = window.confirm(
        `A análise de IA (OpenRouter) falhou.\n\nErro: ${geminiErr.message}\n\nDeseja gerar o relatório sem a análise de IA?`
      );
      if (!continuar) return;
    }

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
    doc.text(`Paciente: ${currentUser.username.toUpperCase()} | Período: ${formatDate(reportFrom)} a ${formatDate(reportTo)} | Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 53);

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
        (() => { try { const m = JSON.parse(c.medication || '[]'); return Array.isArray(m) && m.length > 0 ? m.join(', ') : (c.medication || 'Nenhum'); } catch { return c.medication || 'Nenhum'; } })(),
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

    // GEMINI AI: Renderiza a seção com o texto pré-carregado (se disponível)
    if (geminiText) {
      finalY = renderGeminiSectionInPDF(doc, geminiText, finalY);
    }

    // 6. Seção de Medicamentos em Uso
    try {
      const { data: prescriptions } = await supabaseClient
        .from('prescriptions')
        .select('*, doctors(name)')
        .eq('username', currentUser.username)
        .in('adherence_status', ['active', 'paused'])
        .order('prescription_date', { ascending: false });

      if (prescriptions && prescriptions.length > 0) {
        if (finalY > 230) { doc.addPage(); finalY = 20; }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("3. Medicamentos Atuais (Receitas em Uso)", 14, finalY);

        const rxData = prescriptions.map(rx => [
          rx.medication_name || '',
          rx.dosage || '',
          rx.usage_frequency || rx.form || '',
          { active:'Em Uso', paused:'Pausado', discontinued:'Descontinuado' }[rx.adherence_status] || '',
          rx.helps_prevent ? 'Sim' : 'Não',
          (rx.efficacy_notes || '').substring(0, 35)
        ]);

        doc.autoTable({
          startY: finalY + 4,
          head: [['Medicamento', 'Dose', 'Frequência', 'Status', 'Preventivo?', 'Observação']],
          body: rxData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 7.5, fontStyle: 'bold', cellPadding: 2.5 },
          bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
          alternateRowStyles: { fillColor: [242, 253, 249] },
          columnStyles: { 0:{cellWidth:38}, 1:{cellWidth:18}, 2:{cellWidth:38}, 3:{cellWidth:20}, 4:{cellWidth:20}, 5:{cellWidth:46} },
          margin: { left: 14, right: 14 }
        });
        finalY = doc.lastAutoTable.finalY + 12;
      }
    } catch (e) { /* se tabela não existir, pula seção */ }

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
      doc.text("4. Observações / Dúvidas para a Consulta", 17, finalY + 3);

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

    doc.save(`Relatorio_Enxaqueca_${currentUser.username}_${reportFrom}_a_${reportTo}.pdf`);
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

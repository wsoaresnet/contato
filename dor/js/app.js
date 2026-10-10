/* ==========================================================================
   LÓGICA PRINCIPAL - DIÁRIO DA ENXAQUECA (PWA)
   Willian Soares • williansoares.net.br/diario
   ========================================================================== */

// STATE DA APLICAÇÃO
const AUTH_USER = "Willian";
const AUTH_PASS = "wSB@0610";
const STORAGE_AUTH_KEY = "diario_enxaqueca_auth";
const STORAGE_DATA_KEY = "diario_enxaqueca_crises_v1";

let currentWizardStep = 1;
let editingCrisisId = null;

// DADOS DE EXEMPLO RETROATIVOS (Se o banco estiver vazio na primeira execução)
const SAMPLE_CRISES = [
  {
    id: "sample-1",
    date: "2026-10-05",
    time: "14:30",
    duration: "6 horas",
    intensity: 8,
    type: "Pulsátil / Latejante",
    location: "Unilateral Esquerda",
    symptoms: ["E", "L", "B"],
    triggers: ["Estresse/Preocupação", "Telas/Luz forte"],
    medication: "Sumatriptana 50mg",
    relief: "sim",
    notes: "Crise iniciada após reunião de trabalho longa na tela."
  },
  {
    id: "sample-2",
    date: "2026-09-28",
    time: "08:15",
    duration: "4 horas",
    intensity: 5,
    type: "Aperto / Peso",
    location: "Bilateral (Ambos os lados)",
    symptoms: ["E", "A"],
    triggers: ["Dormi pouco/demais", "Café demais/falta"],
    medication: "Dipirona 1g",
    relief: "pouco",
    notes: "Acordei com dor leve que foi aumentando."
  },
  {
    id: "sample-3",
    date: "2026-09-15",
    time: "19:00",
    duration: "12 horas",
    intensity: 9,
    type: "Pulsátil / Latejante",
    location: "Testa / Atrás dos Olhos",
    symptoms: ["E", "V", "L", "B", "C", "A"],
    triggers: ["Jejum prolongado", "Mudança de tempo/calor"],
    medication: "Triptano + Anti-inflamatório",
    relief: "sim",
    notes: "Crise forte com aura visual. Precisei deitar no escuro."
  }
];

// INICIALIZAÇÃO DA APLICAÇÃO
document.addEventListener("DOMContentLoaded", () => {
  initPWA();
  checkAuth();
  setDefaultDates();
});

// REGISTRO DO SERVICE WORKER (PWA OFFLINE)
function initPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("Service Worker registrado com sucesso."))
      .catch(err => console.log("Falha ao registrar Service Worker:", err));
  }
  
  // Atualiza badge de conexão
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

function updateOnlineStatus() {
  const statusEl = document.getElementById("pwa-status");
  if (statusEl) {
    if (navigator.onLine) {
      statusEl.innerHTML = "⚡ PWA On-Device • Online";
      statusEl.style.color = "var(--accent-green)";
    } else {
      statusEl.innerHTML = "📶 Modo Offline • Armazenado Localmente";
      statusEl.style.color = "var(--accent-yellow)";
    }
  }
}

// MÓDULO DE AUTENTICAÇÃO
function checkAuth() {
  const isAuth = localStorage.getItem(STORAGE_AUTH_KEY) === "true";
  const loginView = document.getElementById("login-view");
  const appView = document.getElementById("app-view");

  if (isAuth) {
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
    renderDashboard();
  } else {
    loginView.classList.remove("hidden");
    appView.classList.add("hidden");
  }
}

function handleLogin(event) {
  event.preventDefault();
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  const errorEl = document.getElementById("login-error");

  if (user === AUTH_USER && pass === AUTH_PASS) {
    localStorage.setItem(STORAGE_AUTH_KEY, "true");
    errorEl.classList.add("hidden");
    checkAuth();
  } else {
    errorEl.classList.remove("hidden");
  }
}

function handleLogout() {
  localStorage.removeItem(STORAGE_AUTH_KEY);
  checkAuth();
}

// GERENCIAMENTO DE DADOS (LOCALSTORAGE / INDEXEDDB)
function getCrises() {
  const data = localStorage.getItem(STORAGE_DATA_KEY);
  if (!data) {
    // Inicializa com dados de exemplo
    localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(SAMPLE_CRISES));
    return SAMPLE_CRISES;
  }
  return JSON.parse(data);
}

function saveCrises(crises) {
  localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(crises));
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

// RENDERIZAÇÃO DA DASHBOARD E CARDS
function renderDashboard() {
  const selectedMonth = document.getElementById("filter-month").value; // YYYY-MM
  const allCrises = getCrises();

  // Filtra por mês
  const filteredCrises = allCrises.filter(c => c.date.startsWith(selectedMonth));
  
  // Ordena por data/hora mais recente primeiro
  filteredCrises.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

  // Atualiza Métricas (KPIs)
  calculateKPIs(filteredCrises);

  // Renderiza Cards
  const container = document.getElementById("crisis-cards-container");
  const countEl = document.getElementById("crisis-count");
  countEl.innerText = `${filteredCrises.length} registro(s)`;

  if (filteredCrises.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-panel">
        <span style="font-size: 2.5rem;">🧘</span>
        <p>Nenhuma crise de enxaqueca registrada no mês de <b>${formatMonthLabel(selectedMonth)}</b>.</p>
        <button class="btn btn-primary" style="margin-top:14px;" onclick="openWizard()">➕ Registrar Novo Dia</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredCrises.map(crisis => renderCrisisCard(crisis)).join("");
}

// CÁLCULO DE KPIS E ÍNDICE DE DOR DA SBCe
function calculateKPIs(crises) {
  const daysPain = new Set(crises.map(c => c.date)).size;
  
  // Dias com medicação utilizada
  const medCrises = crises.filter(c => c.medication && c.medication.trim() !== "");
  const daysMed = new Set(medCrises.map(c => c.date)).size;

  // Média de intensidade
  const avgPain = crises.length > 0
    ? (crises.reduce((acc, c) => acc + Number(c.intensity), 0) / crises.length).toFixed(1)
    : "0.0";

  // ÍNDICE MÊS DE DOR (Sociedade Brasileira de Cefaleia - SBCe):
  // Formula: (1 * fracas[1-3]) + (2 * moderadas[4-6]) + (3 * fortes[7-10])
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
  
  // Alerta clínico se dias com analgésico >= 10 (risco de cefaleia por reboque/uso excessivo)
  if (daysMed >= 10) {
    medCardEl.classList.add("kpi-alert");
    medDescEl.innerText = "⚠️ Risco de cefaleia rebote (≥10 dias/mês)";
  } else {
    medCardEl.classList.remove("kpi-alert");
    medDescEl.innerText = "dias com medicação de resgate";
  }

  document.getElementById("kpi-avg-pain").innerText = avgPain;
  document.getElementById("kpi-sbce-index").innerText = sbceIndex;
}

// RENDER DE CARD DE CRISE INDIVIDUAL
function renderCrisisCard(c) {
  const colorClass = getIntensityColorClass(c.intensity);
  const colorHex = getIntensityColorHex(c.intensity);
  const dateFormatted = formatDate(c.date);
  
  const symptomsHtml = (c.symptoms || []).map(s => {
    const label = getSymptomLabel(s);
    return `<span class="badge-tag" title="${label}">${s}</span>`;
  }).join("");

  const triggersHtml = (c.triggers || []).map(t => `<span class="badge-tag">⚡ ${t}</span>`).join("");

  return `
    <div class="crisis-card" style="border-left-color: ${colorHex};">
      <div class="crisis-card-header">
        <div class="crisis-date-time">
          <span class="crisis-date">🗓️ ${dateFormatted}</span>
          <span class="crisis-subinfo">⏰ Início: ${c.time || 'Não inf.'} • Duração: ${c.duration || 'N/A'}</span>
        </div>
        <div class="pain-badge-card ${colorClass}">
          Dor ${c.intensity}/10
        </div>
      </div>

      <div class="crisis-details">
        <div class="detail-item"><b>Tipo:</b> ${c.type || 'Pulsátil'}</div>
        <div class="detail-item"><b>Local:</b> ${c.location || 'Não informado'}</div>
      </div>

      ${c.symptoms && c.symptoms.length > 0 ? `
        <div>
          <span class="group-title" style="font-size:0.75rem; margin-bottom:2px;">Sintomas Acompanhantes:</span>
          <div class="symptom-badges">${symptomsHtml}</div>
        </div>
      ` : ''}

      ${c.triggers && c.triggers.length > 0 ? `
        <div>
          <span class="group-title" style="font-size:0.75rem; margin-bottom:2px;">Gatilhos Notados:</span>
          <div class="symptom-badges">${triggersHtml}</div>
        </div>
      ` : ''}

      ${c.medication ? `
        <div class="crisis-details" style="background: rgba(255,255,255,0.03); padding: 8px; border-radius: 8px;">
          <div>💊 <b>Remédio:</b> ${c.medication}</div>
          <div><b>Alívio:</b> ${c.relief === 'sim' ? '✅ Sim' : c.relief === 'pouco' ? '🟡 Pouco' : '❌ Não'}</div>
        </div>
      ` : ''}

      ${c.notes ? `<div class="crisis-subinfo" style="font-style: italic;">📝 "${c.notes}"</div>` : ''}

      <div class="crisis-actions">
        <button class="btn-card-action" onclick="editCrisis('${c.id}')">✏️ Editar</button>
        <button class="btn-card-action delete" onclick="deleteCrisis('${c.id}')">🗑️ Excluir</button>
      </div>
    </div>
  `;
}

// COR DA ESCALA DE DOR (1 a 10)
function getIntensityColorClass(level) {
  const lvl = Number(level);
  if (lvl === 1) return "lvl-1";
  if (lvl <= 4) return "lvl-2-4";
  if (lvl <= 7) return "lvl-5-7";
  return "lvl-8-10";
}

function getIntensityColorHex(level) {
  const lvl = Number(level);
  if (lvl === 1) return "#3b82f6";      // Azul
  if (lvl <= 4) return "#10b981";      // Verde
  if (lvl <= 7) return "#f59e0b";      // Amarelo
  return "#ef4444";                     // Vermelho Escuro
}

function getSymptomLabel(code) {
  const map = {
    'E': 'Enjoo / Náusea',
    'V': 'Vômito',
    'L': 'Sensibilidade à Luz (Fotofobia)',
    'B': 'Sensibilidade ao Barulho (Fonofobia)',
    'C': 'Sensibilidade ao Cheiro (Osmofobia)',
    'A': 'Aura (Pontos luminosos / formigamento)',
    'Tontura': 'Tontura / Vertigem',
    'Pescoço': 'Rigidez no Pescoço'
  };
  return map[code] || code;
}

// GERENCIAMENTO DO WIZARD DE NOVO LANÇAMENTO
function openWizard(crisisId = null) {
  editingCrisisId = crisisId;
  currentWizardStep = 1;
  updateWizardStepsUI();

  const modal = document.getElementById("wizard-modal");
  const titleEl = document.getElementById("wizard-title");

  if (crisisId) {
    titleEl.innerText = "✏️ Editar Lançamento de Crise";
    populateWizardForEdit(crisisId);
  } else {
    titleEl.innerText = "➕ Novo Registro de Crise";
    resetWizardForm();
  }

  modal.classList.remove("hidden");
}

function closeWizard() {
  document.getElementById("wizard-modal").classList.add("hidden");
  editingCrisisId = null;
}

function updatePainDisplay(val) {
  const badge = document.getElementById("pain-badge");
  const guide = document.getElementById("pain-guide");
  const num = Number(val);

  badge.className = "pain-badge-display " + getIntensityColorClass(num);

  if (num === 1) {
    badge.innerText = "1 - Muito Leve";
    guide.innerText = "Dor muito leve, mero desconforto imperceptível.";
  } else if (num <= 4) {
    badge.innerText = `${num} - Leve / Moderada`;
    guide.innerText = "Leve a moderada: suportável, não impede atividades diárias.";
  } else if (num <= 7) {
    badge.innerText = `${num} - Moderada / Forte`;
    guide.innerText = "Moderada a forte: atrapalha significativamente as atividades.";
  } else {
    badge.innerText = `${num} - Forte / Extrema`;
    guide.innerText = "Dor intensa / extrema: incapacitante, necessita parar e deitar.";
  }
}

function updateWizardStepsUI() {
  document.querySelectorAll(".wizard-step").forEach(step => step.classList.remove("active"));
  document.querySelector(`.wizard-step.step-${currentWizardStep}`).classList.add("active");

  document.querySelectorAll(".step-dot").forEach(dot => {
    const stepNum = Number(dot.getAttribute("data-step"));
    if (stepNum === currentWizardStep) dot.classList.add("active");
    else dot.classList.remove("active");
  });

  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnSave = document.getElementById("btn-save");

  btnPrev.disabled = (currentWizardStep === 1);

  if (currentWizardStep === 4) {
    btnNext.classList.add("hidden");
    btnSave.classList.remove("hidden");
  } else {
    btnNext.classList.remove("hidden");
    btnSave.classList.add("hidden");
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

function populateWizardForEdit(id) {
  const crises = getCrises();
  const c = crises.find(x => x.id === id);
  if (!c) return;

  document.getElementById("crisis-date").value = c.date;
  document.getElementById("crisis-time").value = c.time;
  document.getElementById("crisis-duration").value = c.duration || "";
  document.getElementById("crisis-intensity").value = c.intensity;
  updatePainDisplay(c.intensity);

  document.getElementById("crisis-type").value = c.type || "Pulsátil / Latejante";
  document.getElementById("crisis-location").value = c.location || "Unilateral Direita";

  // Checkboxes Sintomas
  document.querySelectorAll('input[name="symptom"]').forEach(cb => {
    cb.checked = (c.symptoms || []).includes(cb.value);
  });

  // Checkboxes Gatilhos
  document.querySelectorAll('input[name="trigger"]').forEach(cb => {
    cb.checked = (c.triggers || []).includes(cb.value);
  });

  document.getElementById("crisis-medication").value = c.medication || "";
  
  // Radio Alívio
  const reliefRadio = document.querySelector(`input[name="relief"][value="${c.relief || 'sim'}"]`);
  if (reliefRadio) reliefRadio.checked = true;

  document.getElementById("crisis-notes").value = c.notes || "";
}

function handleSaveCrisis(event) {
  event.preventDefault();

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

  let crises = getCrises();

  if (editingCrisisId) {
    crises = crises.map(c => c.id === editingCrisisId ? {
      id: editingCrisisId, date, time, duration, intensity, type, location, symptoms, triggers, medication, relief, notes
    } : c);
  } else {
    const newCrisis = {
      id: "crisis-" + Date.now(),
      date, time, duration, intensity, type, location, symptoms, triggers, medication, relief, notes
    };
    crises.push(newCrisis);
  }

  saveCrises(crises);
  closeWizard();
  renderDashboard();
}

function editCrisis(id) {
  openWizard(id);
}

function deleteCrisis(id) {
  if (confirm("Tem certeza que deseja excluir este registro de crise?")) {
    let crises = getCrises();
    crises = crises.filter(c => c.id !== id);
    saveCrises(crises);
    renderDashboard();
  }
}

// GERADOR DE RELATÓRIO MÉDICO EM PDF (jsPDF)
function openReportModal() {
  document.getElementById("report-modal").classList.remove("hidden");
}

function closeReportModal() {
  document.getElementById("report-modal").classList.add("hidden");
}

function generatePDFReport() {
  const selectedMonth = document.getElementById("report-month").value;
  const doctorNotes = document.getElementById("doctor-notes").value.trim();
  
  const allCrises = getCrises();
  const filteredCrises = allCrises.filter(c => c.date.startsWith(selectedMonth));

  if (filteredCrises.length === 0) {
    alert("Não há registros de crises de enxaqueca para o mês selecionado.");
    return;
  }

  filteredCrises.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // CABEÇALHO DO DOCUMENTO CLÍNICO
  doc.setFillColor(11, 15, 25); // Dark navy header
  doc.rect(0, 0, 210, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO CLÍNICO DE ACOMPANHAMENTO DE ENXAQUECA", 14, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Paciente: Willian Soares | Período: ${formatMonthLabel(selectedMonth)} | Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);

  // KPIS E RESUMO
  const daysPain = new Set(filteredCrises.map(c => c.date)).size;
  const medCrises = filteredCrises.filter(c => c.medication && c.medication.trim() !== "");
  const daysMed = new Set(medCrises.map(c => c.date)).size;
  const avgPain = (filteredCrises.reduce((acc, c) => acc + Number(c.intensity), 0) / filteredCrises.length).toFixed(1);

  let sbceIndex = 0;
  filteredCrises.forEach(c => {
    const lvl = Number(c.intensity);
    if (lvl <= 3) sbceIndex += 1;
    else if (lvl <= 6) sbceIndex += 2;
    else sbceIndex += 3;
  });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("1. Resumo Epidemiológico Mês", 14, 46);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`• Total de dias com dor: ${daysPain} dia(s)`, 14, 53);
  doc.text(`• Dias com uso de medicação de resgate: ${daysMed} dia(s) ${daysMed >= 10 ? '(⚠️ ALERTA: ≥10 dias/mês)' : ''}`, 14, 59);
  doc.text(`• Média de intensidade da dor: ${avgPain} / 10`, 110, 53);
  doc.text(`• Índice Mês de Dor (SBCe): ${sbceIndex}`, 110, 59);

  // TABELA DE REGISTRO DETALHADO DE CRISES
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("2. Histórico Cronológico das Crises", 14, 70);

  const tableData = filteredCrises.map(c => [
    formatDateShort(c.date),
    c.time || '-',
    `${c.intensity}/10`,
    (c.symptoms || []).join(", "),
    (c.triggers || []).join(", "),
    c.medication || 'Nenhum',
    c.relief === 'sim' ? 'Sim' : c.relief === 'pouco' ? 'Pouco' : 'Não'
  ]);

  doc.autoTable({
    startY: 74,
    head: [['Data', 'Início', 'Dor', 'Sintomas', 'Gatilhos', 'Medicamento', 'Alívio']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 15 },
      2: { cellWidth: 14 },
      3: { cellWidth: 35 },
      4: { cellWidth: 40 },
      5: { cellWidth: 38 },
      6: { cellWidth: 18 }
    }
  });

  let finalY = doc.lastAutoTable.finalY + 12;

  // DÚVIDAS / ANOTAÇÕES PARA O NEUROLOGISTA
  if (doctorNotes) {
    if (finalY > 250) { doc.addPage(); finalY = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("3. Dúvidas e Anotações do Paciente para a Consulta", 14, finalY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(doctorNotes, 180);
    doc.text(splitNotes, 14, finalY + 6);
    finalY += (splitNotes.length * 5) + 10;
  }

  // RODAPÉ CLINICO
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Diário de Enxaqueca • Documento gerado para auxílio de diagnóstico e tratamento de cefaleias.", 14, 288);
    doc.text(`Página ${i} de ${pageCount}`, 180, 288);
  }

  // Baixar Arquivo PDF
  doc.save(`Relatorio_Enxaqueca_Willian_${selectedMonth}.pdf`);
  closeReportModal();
}

// AUXILIARES DE FORMATAÇÃO
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

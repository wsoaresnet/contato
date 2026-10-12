/* ============================================================
   MEDICAL TRACKING SYSTEM v10 - SUPABASE INTEGRATION
   Acompanhamento Médico Completo
   ============================================================ */

let doctorModalInstance = null;
let appointmentModalInstance = null;
let prescriptionModalInstance = null;

let editingDoctorId = null;
let editingAppointmentId = null;
let editingPrescriptionId = null;

// Inicializar instâncias de modais
function initMedicalModals() {
  console.log('initMedicalModals iniciando...');

  const doctorModalEl = document.getElementById('doctorModal');
  if (doctorModalEl) {
    doctorModalInstance = new bootstrap.Modal(doctorModalEl);
    console.log('✓ doctorModalInstance inicializado');
  } else {
    console.error('✗ doctorModal elemento não encontrado!');
  }

  const appointmentModalEl = document.getElementById('appointmentModal');
  if (appointmentModalEl) {
    appointmentModalInstance = new bootstrap.Modal(appointmentModalEl);
    console.log('✓ appointmentModalInstance inicializado');
  } else {
    console.error('✗ appointmentModal elemento não encontrado!');
  }

  const prescriptionModalEl = document.getElementById('prescriptionModal');
  if (prescriptionModalEl) {
    prescriptionModalInstance = new bootstrap.Modal(prescriptionModalEl);
    console.log('✓ prescriptionModalInstance inicializado');
    // Garante que sempre haja pelo menos uma linha de medicamento visível ao abrir
    prescriptionModalEl.addEventListener('shown.bs.modal', () => {
      const list = document.getElementById('rx-meds-list');
      if (list && list.children.length === 0) addRxMedRow();
    });
  } else {
    console.error('✗ prescriptionModal elemento não encontrado!');
  }
}

// ============================================================
// MÉDICOS - CRUD
// ============================================================

async function openDoctorModal(doctorId = null) {
  console.log('🔵 openDoctorModal chamada', { doctorId, instanceExists: !!doctorModalInstance });
  editingDoctorId = doctorId;

  if (doctorId) {
    document.getElementById('doctor-modal-title').textContent = 'Editar Médico';
    document.getElementById('doctor-delete-btn').classList.remove('d-none');
    const { data, error } = await supabaseClient
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (data) {
      document.getElementById('doctor-name').value = data.name;
      document.getElementById('doctor-specialty').value = data.specialty || '';
      document.getElementById('doctor-clinic').value = data.clinic_name || '';
      document.getElementById('doctor-address').value = data.address || '';
      document.getElementById('doctor-phone').value = data.phone || '';
      document.getElementById('doctor-email').value = data.email || '';
      document.getElementById('doctor-crm').value = data.crm || '';
      document.getElementById('doctor-notes').value = data.notes || '';
    }
  } else {
    document.getElementById('doctor-modal-title').textContent = 'Novo Médico';
    document.getElementById('doctor-delete-btn').classList.add('d-none');
    document.getElementById('doctor-form').reset();
  }

  document.getElementById('doctor-id').value = doctorId || '';
  doctorModalInstance.show();
}

async function handleSaveDoctor(event) {
  event.preventDefault();

  const doctorData = {
    username: currentUser.username,
    name: document.getElementById('doctor-name').value,
    specialty: document.getElementById('doctor-specialty').value,
    clinic_name: document.getElementById('doctor-clinic').value,
    address: document.getElementById('doctor-address').value,
    phone: document.getElementById('doctor-phone').value,
    email: document.getElementById('doctor-email').value,
    crm: document.getElementById('doctor-crm').value,
    notes: document.getElementById('doctor-notes').value,
  };

  if (editingDoctorId) {
    const { error } = await supabaseClient
      .from('doctors')
      .update(doctorData)
      .eq('id', editingDoctorId)
      .eq('username', currentUser.username);

    if (error) {
      console.error('Erro ao atualizar médico:', error);
      alert('Erro ao atualizar médico');
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from('doctors')
      .insert([doctorData]);

    if (error) {
      console.error('Erro ao criar médico:', error);
      alert('Erro ao criar médico');
      return;
    }
  }

  doctorModalInstance.hide();
  renderDoctors();
}

async function deleteDoctorWithConfirm() {
  if (!confirm('Tem certeza que deseja deletar este médico? Isso também deletará todas as consultas e receitas associadas.')) return;

  const { error } = await supabaseClient
    .from('doctors')
    .delete()
    .eq('id', editingDoctorId)
    .eq('username', currentUser.username);

  if (error) {
    console.error('Erro ao deletar médico:', error);
    alert('Erro ao deletar médico');
    return;
  }

  doctorModalInstance.hide();
  renderDoctors();
}

async function renderDoctors() {
  const { data, error } = await supabaseClient
    .from('doctors')
    .select('*')
    .eq('username', currentUser.username)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar médicos:', error);
    return;
  }

  const container = document.getElementById('doctors-container');

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="col-12"><p class="text-white-50 text-center py-4">Nenhum médico cadastrado ainda</p></div>';
    return;
  }

  container.innerHTML = data.map(doctor => `
    <div class="col-12 col-md-6">
      <div class="card glass-card border-0 p-3 rounded-3">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="fw-bold text-white mb-0">
            <i class="bi bi-hospital text-primary me-1"></i>${doctor.name}
          </h6>
          <span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:0.75em;font-weight:600;color:#ffffff !important;background:rgba(13,110,253,0.4);border:1px solid rgba(13,110,253,0.6);">${doctor.specialty || 'N/A'}</span>
        </div>
        <p class="text-white-50 small mb-2"><i class="bi bi-building me-1"></i>${doctor.clinic_name || 'Clínica não informada'}</p>
        ${doctor.phone ? `<p class="text-white-50 small mb-1"><i class="bi bi-telephone me-1"></i>${doctor.phone}</p>` : ''}
        ${doctor.email ? `<p class="text-white-50 small mb-2"><i class="bi bi-envelope me-1"></i>${doctor.email}</p>` : ''}
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-sm btn-primary rounded-2 flex-grow-1" onclick="openDoctorModal('${doctor.id}')">Editar</button>
          <button class="btn btn-sm btn-outline-light rounded-2" onclick="openAppointmentModalForDoctor('${doctor.id}')">Agendar</button>
        </div>
      </div>
    </div>
  `).join('');

  updateDoctorSelects();
}

// ============================================================
// CONSULTAS - CRUD
// ============================================================

async function openAppointmentModal(appointmentId = null) {
  editingAppointmentId = appointmentId;

  if (appointmentId) {
    document.getElementById('appointment-modal-title').textContent = 'Editar Consulta';
    document.getElementById('appointment-delete-btn').classList.remove('d-none');

    const { data, error } = await supabaseClient
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (data) {
      document.getElementById('appointment-doctor').value = data.doctor_id;
      document.getElementById('appointment-date').value = data.appointment_date;
      document.getElementById('appointment-time').value = data.appointment_time || '';
      document.getElementById('appointment-reason').value = data.reason || '';
      document.getElementById('appointment-symptoms').value = data.symptoms || '';
      document.getElementById('appointment-diagnosis').value = data.diagnosis || '';
      document.getElementById('appointment-followup-date').value = data.follow_up_date || '';
      document.getElementById('appointment-status').value = data.status;
    }
  } else {
    document.getElementById('appointment-modal-title').textContent = 'Nova Consulta';
    document.getElementById('appointment-delete-btn').classList.add('d-none');
    document.getElementById('appointment-form').reset();
  }

  document.getElementById('appointment-id').value = appointmentId || '';
  appointmentModalInstance.show();
}

async function openAppointmentModalForDoctor(doctorId) {
  openAppointmentModal();
  document.getElementById('appointment-doctor').value = doctorId;
}

async function handleSaveAppointment(event) {
  event.preventDefault();

  const appointmentData = {
    username: currentUser.username,
    doctor_id: document.getElementById('appointment-doctor').value,
    appointment_date: document.getElementById('appointment-date').value,
    appointment_time: document.getElementById('appointment-time').value || null,
    reason: document.getElementById('appointment-reason').value,
    symptoms: document.getElementById('appointment-symptoms').value,
    diagnosis: document.getElementById('appointment-diagnosis').value,
    follow_up_date: document.getElementById('appointment-followup-date').value || null,
    status: document.getElementById('appointment-status').value,
  };

  if (editingAppointmentId) {
    const { error } = await supabaseClient
      .from('appointments')
      .update(appointmentData)
      .eq('id', editingAppointmentId)
      .eq('username', currentUser.username);

    if (error) {
      console.error('Erro ao atualizar consulta:', error);
      alert('Erro ao atualizar consulta');
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from('appointments')
      .insert([appointmentData]);

    if (error) {
      console.error('Erro ao criar consulta:', error);
      alert('Erro ao criar consulta');
      return;
    }
  }

  appointmentModalInstance.hide();
  renderAppointments();
}

async function deleteAppointmentWithConfirm() {
  if (!confirm('Tem certeza que deseja deletar esta consulta?')) return;

  const { error } = await supabaseClient
    .from('appointments')
    .delete()
    .eq('id', editingAppointmentId)
    .eq('username', currentUser.username);

  if (error) {
    console.error('Erro ao deletar consulta:', error);
    alert('Erro ao deletar consulta');
    return;
  }

  appointmentModalInstance.hide();
  renderAppointments();
}

async function renderAppointments() {
  const { data, error } = await supabaseClient
    .from('appointments')
    .select(`
      *,
      doctors (name, specialty, clinic_name)
    `)
    .eq('username', currentUser.username)
    .order('appointment_date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar consultas:', error);
    return;
  }

  const container = document.getElementById('appointments-container');

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="col-12"><p class="text-white-50 text-center py-4">Nenhuma consulta agendada</p></div>';
    return;
  }

  container.innerHTML = data.map(apt => {
    const BADGE_STYLE = 'display:inline-block;padding:3px 8px;border-radius:6px;font-size:0.75em;font-weight:600;color:#ffffff !important;';
    const statusBadge = {
      'scheduled': `<span style="${BADGE_STYLE}background:rgba(13,202,240,0.45);border:1px solid rgba(13,202,240,0.6);">Agendada</span>`,
      'completed':  `<span style="${BADGE_STYLE}background:rgba(25,135,84,0.45);border:1px solid rgba(25,135,84,0.6);">Realizada</span>`,
      'cancelled':  `<span style="${BADGE_STYLE}background:rgba(220,53,69,0.45);border:1px solid rgba(220,53,69,0.6);">Cancelada</span>`
    }[apt.status] || '';

    return `
      <div class="col-12 col-md-6">
        <div class="card glass-card border-0 p-3 rounded-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold text-white mb-0">
              <i class="bi bi-calendar-event text-primary me-1"></i>${apt.doctors.name}
            </h6>
            ${statusBadge}
          </div>
          <p class="text-white-50 small mb-1"><i class="bi bi-calendar-range me-1"></i>${apt.appointment_date}${apt.appointment_time ? ` às ${apt.appointment_time}` : ''}</p>
          <p class="text-white-50 small mb-2"><i class="bi bi-hospital me-1"></i>${apt.doctors.specialty}</p>
          ${apt.reason ? `<p class="text-white-50 small mb-2"><strong>Motivo:</strong> ${apt.reason}</p>` : ''}
          ${apt.diagnosis ? `<p class="text-white-50 small"><strong>Diagnóstico:</strong> ${apt.diagnosis}</p>` : ''}
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-sm btn-primary rounded-2 flex-grow-1" onclick="openAppointmentModal('${apt.id}')">Editar</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// RECEITAS - CRUD
// ============================================================

// ── Linhas dinâmicas de medicamentos ────────────────────────────────────────

function addRxMedRow(data = {}) {
  const list = document.getElementById('rx-meds-list');
  if (!list) return;

  const rowId = 'rxmed-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  const canRemove = list.children.length > 0;

  const div = document.createElement('div');
  div.id = rowId;
  div.className = 'rx-med-row mb-3 p-3 rounded-3';
  div.style.cssText = 'background:rgba(13,110,253,0.07);border:1px solid rgba(13,110,253,0.2);';
  div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span class="small fw-bold text-primary"><i class="bi bi-capsule me-1"></i>Medicamento</span>
      <button type="button" class="btn btn-outline-danger btn-sm rounded-2 py-0 px-2" onclick="removeRxMedRow('${rowId}')" title="Remover"><i class="bi bi-x-lg"></i></button>
    </div>
    <div class="row g-2">
      <div class="col-12 col-md-6">
        <label class="form-label small text-white-50 mb-1">Nome do Medicamento *</label>
        <input type="text" class="form-control glass-input rxmed-name" placeholder="Ex: Sumatriptana" required value="${data.medication_name || ''}">
      </div>
      <div class="col-6 col-md-3">
        <label class="form-label small text-white-50 mb-1">Dosagem *</label>
        <input type="text" class="form-control glass-input rxmed-dosage" placeholder="Ex: 50mg" required value="${data.dosage || ''}">
      </div>
      <div class="col-6 col-md-3">
        <label class="form-label small text-white-50 mb-1">Forma</label>
        <select class="form-select glass-input rxmed-form">
          <option ${(data.form||'Comprimido')==='Comprimido'?'selected':''}>Comprimido</option>
          <option ${data.form==='Cápsula'?'selected':''}>Cápsula</option>
          <option ${data.form==='Injeção'?'selected':''}>Injeção</option>
          <option ${data.form==='Spray'?'selected':''}>Spray</option>
          <option ${data.form==='Líquido'?'selected':''}>Líquido</option>
          <option ${data.form==='Adesivo'?'selected':''}>Adesivo</option>
          <option ${data.form==='Outro'?'selected':''}>Outro</option>
        </select>
      </div>
      <div class="col-12 col-md-6">
        <label class="form-label small text-white-50 mb-1">Frequência / Modo de Uso</label>
        <input type="text" class="form-control glass-input rxmed-frequency" placeholder="Ex: 1x ao dia, ao acordar" value="${data.usage_frequency || ''}">
      </div>
      <div class="col-12 col-md-6">
        <label class="form-label small text-white-50 mb-1">Tipo de Uso</label>
        <select class="form-select glass-input rxmed-duration-type">
          <option value="continuous" ${(data.duration_type||'continuous')==='continuous'?'selected':''}>Contínuo</option>
          <option value="as_needed" ${data.duration_type==='as_needed'?'selected':''}>Conforme Necessário</option>
          <option value="course" ${data.duration_type==='course'?'selected':''}>Ciclo com prazo</option>
        </select>
      </div>
      <div class="col-12">
        <label class="form-label small text-white-50 mb-1">Instruções Detalhadas</label>
        <textarea class="form-control glass-input rxmed-instructions" rows="2" placeholder="Ex: Tomar com água, evitar sol...">${data.usage_instructions || ''}</textarea>
      </div>
      <div class="col-6">
        <label class="form-label small text-white-50 mb-1">Data Início</label>
        <input type="date" class="form-control glass-input rxmed-start-date" value="${data.start_date || ''}">
      </div>
      <div class="col-6">
        <label class="form-label small text-white-50 mb-1">Data Fim <small class="text-white-25">(se tiver prazo)</small></label>
        <input type="date" class="form-control glass-input rxmed-end-date" value="${data.end_date || ''}">
      </div>
    </div>
  `;
  list.appendChild(div);
}

function removeRxMedRow(rowId) {
  const list = document.getElementById('rx-meds-list');
  if (!list || list.children.length <= 1) return;
  const row = document.getElementById(rowId);
  if (row) row.remove();
}

function getRxMedsFromForm() {
  const list = document.getElementById('rx-meds-list');
  if (!list) return [];
  return Array.from(list.querySelectorAll('.rx-med-row')).map(row => ({
    medication_name:   row.querySelector('.rxmed-name').value.trim(),
    dosage:            row.querySelector('.rxmed-dosage').value.trim(),
    form:              row.querySelector('.rxmed-form').value,
    usage_frequency:   row.querySelector('.rxmed-frequency').value.trim(),
    duration_type:     row.querySelector('.rxmed-duration-type').value,
    usage_instructions:row.querySelector('.rxmed-instructions').value.trim(),
    start_date:        row.querySelector('.rxmed-start-date').value || null,
    end_date:          row.querySelector('.rxmed-end-date').value || null,
  })).filter(m => m.medication_name);
}

function resetRxMedRows() {
  const list = document.getElementById('rx-meds-list');
  if (list) { list.innerHTML = ''; addRxMedRow(); }
}

// ────────────────────────────────────────────────────────────────────────────

async function openPrescriptionModal(groupKey = null) {
  // groupKey: null = nova receita | string "doctorId|date" = editar grupo
  document.getElementById('prescription-group-ids').value = '';
  document.getElementById('prescription-id').value = '';

  if (groupKey) {
    document.getElementById('prescription-modal-title').textContent = 'Editar Receita';
    document.getElementById('prescription-delete-btn').classList.remove('d-none');

    const [doctorId, rxDate] = groupKey.split('|');
    const { data, error } = await supabaseClient
      .from('prescriptions')
      .select('*')
      .eq('username', currentUser.username)
      .eq('doctor_id', doctorId)
      .eq('prescription_date', rxDate);

    if (data && data.length > 0) {
      const first = data[0];
      document.getElementById('prescription-doctor').value = first.doctor_id;
      document.getElementById('prescription-date').value   = first.prescription_date;
      document.getElementById('prescription-indication').value = first.indication || '';
      document.getElementById('prescription-preventive').checked = first.is_preventive || false;
      document.getElementById('prescription-adherence').value = first.adherence_status || 'active';
      document.getElementById('prescription-efficacy').value  = first.efficacy_notes || '';
      document.getElementById('prescription-helps').checked   = first.helps_prevent || false;
      document.getElementById('prescription-triggers').checked = first.triggers_migraines || false;

      // IDs para deletar ao salvar
      document.getElementById('prescription-group-ids').value = data.map(d => d.id).join(',');

      // Popula linhas de medicamentos
      const list = document.getElementById('rx-meds-list');
      list.innerHTML = '';
      data.forEach(d => addRxMedRow(d));
    }
  } else {
    document.getElementById('prescription-modal-title').textContent = 'Nova Receita Médica';
    document.getElementById('prescription-delete-btn').classList.add('d-none');
    document.getElementById('prescription-form').reset();
    resetRxMedRows();
  }

  prescriptionModalInstance.show();
}

async function handleSavePrescription(event) {
  event.preventDefault();

  const meds = getRxMedsFromForm();
  if (meds.length === 0) { alert('Adicione pelo menos um medicamento.'); return; }

  const sharedFields = {
    username:          currentUser.username,
    doctor_id:         document.getElementById('prescription-doctor').value,
    prescription_date: document.getElementById('prescription-date').value,
    indication:        document.getElementById('prescription-indication').value,
    is_preventive:     document.getElementById('prescription-preventive').checked,
    adherence_status:  document.getElementById('prescription-adherence').value,
    efficacy_notes:    document.getElementById('prescription-efficacy').value,
    helps_prevent:     document.getElementById('prescription-helps').checked,
    triggers_migraines:document.getElementById('prescription-triggers').checked,
  };

  const groupIdsRaw = document.getElementById('prescription-group-ids').value;
  const oldIds = groupIdsRaw ? groupIdsRaw.split(',').filter(Boolean) : [];

  // Se editando: deleta registros antigos do grupo
  if (oldIds.length > 0) {
    const { error: delErr } = await supabaseClient
      .from('prescriptions')
      .delete()
      .in('id', oldIds)
      .eq('username', currentUser.username);
    if (delErr) { console.error('Erro ao deletar receitas antigas:', delErr); alert('Erro ao atualizar receita'); return; }
  }

  // Insere um registro por medicamento
  const rows = meds.map(m => ({ ...sharedFields, ...m }));
  const { error } = await supabaseClient.from('prescriptions').insert(rows);
  if (error) { console.error('Erro ao salvar receita:', error); alert('Erro ao salvar receita'); return; }

  prescriptionModalInstance.hide();
  renderPrescriptions();
}

async function deletePrescriptionWithConfirm() {
  if (!confirm('Tem certeza que deseja deletar esta receita e todos os medicamentos dela?')) return;

  const groupIdsRaw = document.getElementById('prescription-group-ids').value;
  const ids = groupIdsRaw ? groupIdsRaw.split(',').filter(Boolean) : [];
  if (ids.length === 0) return;

  const { error } = await supabaseClient
    .from('prescriptions')
    .delete()
    .in('id', ids)
    .eq('username', currentUser.username);

  if (error) { console.error('Erro ao deletar receita:', error); alert('Erro ao deletar receita'); return; }

  prescriptionModalInstance.hide();
  renderPrescriptions();
}

async function renderPrescriptions() {
  const { data, error } = await supabaseClient
    .from('prescriptions')
    .select('*, doctors (name, specialty)')
    .eq('username', currentUser.username)
    .order('prescription_date', { ascending: false });

  if (error) { console.error('Erro ao buscar receitas:', error); return; }

  const container = document.getElementById('prescriptions-container');

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="col-12"><p class="text-white-50 text-center py-4">Nenhuma receita cadastrada</p></div>';
    return;
  }

  // Agrupa por doctor_id + prescription_date (= uma receita médica)
  const groups = {};
  data.forEach(rx => {
    const key = `${rx.doctor_id}|${rx.prescription_date}`;
    if (!groups[key]) groups[key] = { key, rxDate: rx.prescription_date, doctor: rx.doctors, shared: rx, meds: [] };
    groups[key].meds.push(rx);
  });

  const BADGE = (color, label) => {
    const rgb = color==='success'?'25,135,84':color==='warning'?'255,193,7':color==='danger'?'220,53,69':'108,117,125';
    return `<span style="display:inline-block;padding:2px 7px;border-radius:5px;font-size:0.73em;font-weight:600;color:#fff;background:rgba(${rgb},0.45);border:1px solid rgba(${rgb},0.6);">${label}</span>`;
  };

  const DURATION_LABEL = { continuous: 'Contínuo', as_needed: 'Conforme Necessário', course: 'Ciclo com prazo' };

  container.innerHTML = Object.values(groups).map(g => {
    const s = g.shared;
    const statusColor = { active:'success', discontinued:'danger', paused:'warning' }[s.adherence_status] || 'secondary';
    const statusLabel = { active:'Em Uso', discontinued:'Descontinuado', paused:'Pausado' }[s.adherence_status] || s.adherence_status;

    const todayStr = new Date().toISOString().split('T')[0];

    const medsHtml = g.meds.map((m, i) => {
      let expiryHtml = '';
      if (m.end_date) {
        const daysLeft = Math.ceil((new Date(m.end_date + 'T00:00:00') - new Date(todayStr + 'T00:00:00')) / 86400000);
        if (daysLeft < 0) {
          expiryHtml = `<span class="rx-expiry-tag rx-expiry-expired ms-2"><i class="bi bi-exclamation-circle me-1"></i>Vencida há ${Math.abs(daysLeft)}d</span>`;
        } else if (daysLeft <= 15) {
          expiryHtml = `<span class="rx-expiry-tag ms-2"><i class="bi bi-clock-history me-1"></i>Vence em ${daysLeft}d</span>`;
        }
      }
      return `
      <div class="rx-med-item ${i > 0 ? 'mt-2 pt-2' : ''}" ${i > 0 ? 'style="border-top:1px solid rgba(255,255,255,0.08)"' : ''}>
        <div class="d-flex align-items-center flex-wrap gap-1 mb-1">
          <i class="bi bi-capsule text-primary"></i>
          <span class="fw-semibold text-white">${m.medication_name}</span>
          <span class="text-white-50 small">${m.dosage}</span>
          <span class="text-white-25 small ms-1">${m.form || ''}</span>
          ${expiryHtml}
        </div>
        ${m.usage_frequency ? `<p class="text-white-50 small mb-0 ps-4"><i class="bi bi-clock me-1"></i>${m.usage_frequency} &bull; ${DURATION_LABEL[m.duration_type] || m.duration_type || ''}</p>` : ''}
        ${m.start_date ? `<p class="text-white-50 small mb-0 ps-4"><i class="bi bi-calendar-range me-1"></i>${m.start_date}${m.end_date ? ' → ' + m.end_date : ' (sem prazo definido)'}</p>` : ''}
        ${m.usage_instructions ? `<p class="text-white-25 small mb-0 ps-4 fst-italic">${m.usage_instructions}</p>` : ''}
      </div>
    `;}).join('');

    return `
      <div class="col-12 col-md-6">
        <div class="card glass-card border-0 p-3 rounded-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <p class="text-white-50 xx-small mb-0"><i class="bi bi-calendar3 me-1"></i>${g.rxDate} &bull; ${g.doctor?.name || 'Médico'}</p>
              <h6 class="fw-bold text-white mb-0 mt-1">
                <i class="bi bi-file-medical text-primary me-1"></i>Receita Médica
                <span class="text-white-50 small fw-normal">(${g.meds.length} med${g.meds.length > 1 ? 's' : ''})</span>
              </h6>
            </div>
            ${BADGE(statusColor, statusLabel)}
          </div>

          <div class="mb-2">${medsHtml}</div>

          ${s.indication ? `<p class="text-white-50 small mb-1"><i class="bi bi-info-circle me-1"></i><strong>Indicação:</strong> ${s.indication}</p>` : ''}
          ${s.helps_prevent ? '<p class="text-success small mb-1"><i class="bi bi-check-circle me-1"></i>Ajuda a prevenir crises</p>' : ''}
          ${s.triggers_migraines ? '<p class="text-danger small mb-1"><i class="bi bi-exclamation-circle me-1"></i>Pode gatilhar crises</p>' : ''}

          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-sm btn-primary rounded-2 flex-grow-1" onclick="openPrescriptionModal('${g.key}')">
              <i class="bi bi-pencil me-1"></i>Editar
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// UTILITÁRIOS
// ============================================================

async function updateDoctorSelects() {
  const { data, error } = await supabaseClient
    .from('doctors')
    .select('id, name')
    .eq('username', currentUser.username)
    .order('name');

  if (error) return;

  const appointmentSelect = document.getElementById('appointment-doctor');
  const prescriptionSelect = document.getElementById('prescription-doctor');

  if (appointmentSelect) {
    const currentValue = appointmentSelect.value;
    appointmentSelect.innerHTML = '<option value="">Selecione um médico...</option>' +
      (data || []).map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    appointmentSelect.value = currentValue;
  }

  if (prescriptionSelect) {
    const currentValue = prescriptionSelect.value;
    prescriptionSelect.innerHTML = '<option value="">Selecione um médico...</option>' +
      (data || []).map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    prescriptionSelect.value = currentValue;
  }
}

async function loadMedicalTab() {
  renderDoctors();
  renderAppointments();
  renderPrescriptions();
  updateDoctorSelects();
}

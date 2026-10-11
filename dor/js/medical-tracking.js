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
          <span class="badge bg-primary bg-opacity-20 text-primary small">${doctor.specialty || 'N/A'}</span>
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
    const statusBadge = {
      'scheduled': '<span class="badge bg-info bg-opacity-20 text-info">Agendada</span>',
      'completed': '<span class="badge bg-success bg-opacity-20 text-success">Realizada</span>',
      'cancelled': '<span class="badge bg-danger bg-opacity-20 text-danger">Cancelada</span>'
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

async function openPrescriptionModal(prescriptionId = null) {
  editingPrescriptionId = prescriptionId;

  if (prescriptionId) {
    document.getElementById('prescription-modal-title').textContent = 'Editar Receita';
    document.getElementById('prescription-delete-btn').classList.remove('d-none');

    const { data, error } = await supabaseClient
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single();

    if (data) {
      document.getElementById('prescription-doctor').value = data.doctor_id;
      document.getElementById('prescription-date').value = data.prescription_date;
      document.getElementById('prescription-medication').value = data.medication_name;
      document.getElementById('prescription-dosage').value = data.dosage;
      document.getElementById('prescription-form').value = data.form || 'Comprimido';
      document.getElementById('prescription-frequency').value = data.usage_frequency || '';
      document.getElementById('prescription-duration-type').value = data.duration_type || 'continuous';
      document.getElementById('prescription-instructions').value = data.usage_instructions || '';
      document.getElementById('prescription-start-date').value = data.start_date || '';
      document.getElementById('prescription-end-date').value = data.end_date || '';
      document.getElementById('prescription-indication').value = data.indication || '';
      document.getElementById('prescription-preventive').checked = data.is_preventive || false;
      document.getElementById('prescription-adherence').value = data.adherence_status || 'active';
      document.getElementById('prescription-efficacy').value = data.efficacy_notes || '';
      document.getElementById('prescription-helps').checked = data.helps_prevent || false;
      document.getElementById('prescription-triggers').checked = data.triggers_migraines || false;
    }
  } else {
    document.getElementById('prescription-modal-title').textContent = 'Nova Receita Médica';
    document.getElementById('prescription-delete-btn').classList.add('d-none');
    document.getElementById('prescription-form').reset();
  }

  document.getElementById('prescription-id').value = prescriptionId || '';
  prescriptionModalInstance.show();
}

async function handleSavePrescription(event) {
  event.preventDefault();

  const prescriptionData = {
    username: currentUser.username,
    doctor_id: document.getElementById('prescription-doctor').value,
    prescription_date: document.getElementById('prescription-date').value,
    medication_name: document.getElementById('prescription-medication').value,
    dosage: document.getElementById('prescription-dosage').value,
    form: document.getElementById('prescription-form').value,
    usage_frequency: document.getElementById('prescription-frequency').value,
    duration_type: document.getElementById('prescription-duration-type').value,
    usage_instructions: document.getElementById('prescription-instructions').value,
    start_date: document.getElementById('prescription-start-date').value || null,
    end_date: document.getElementById('prescription-end-date').value || null,
    indication: document.getElementById('prescription-indication').value,
    is_preventive: document.getElementById('prescription-preventive').checked,
    adherence_status: document.getElementById('prescription-adherence').value,
    efficacy_notes: document.getElementById('prescription-efficacy').value,
    helps_prevent: document.getElementById('prescription-helps').checked,
    triggers_migraines: document.getElementById('prescription-triggers').checked,
  };

  if (editingPrescriptionId) {
    const { error } = await supabaseClient
      .from('prescriptions')
      .update(prescriptionData)
      .eq('id', editingPrescriptionId)
      .eq('username', currentUser.username);

    if (error) {
      console.error('Erro ao atualizar receita:', error);
      alert('Erro ao atualizar receita');
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from('prescriptions')
      .insert([prescriptionData]);

    if (error) {
      console.error('Erro ao criar receita:', error);
      alert('Erro ao criar receita');
      return;
    }
  }

  prescriptionModalInstance.hide();
  renderPrescriptions();
}

async function deletePrescriptionWithConfirm() {
  if (!confirm('Tem certeza que deseja deletar esta receita?')) return;

  const { error } = await supabaseClient
    .from('prescriptions')
    .delete()
    .eq('id', editingPrescriptionId)
    .eq('username', currentUser.username);

  if (error) {
    console.error('Erro ao deletar receita:', error);
    alert('Erro ao deletar receita');
    return;
  }

  prescriptionModalInstance.hide();
  renderPrescriptions();
}

async function renderPrescriptions() {
  const { data, error } = await supabaseClient
    .from('prescriptions')
    .select(`
      *,
      doctors (name, specialty)
    `)
    .eq('username', currentUser.username)
    .order('prescription_date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar receitas:', error);
    return;
  }

  const container = document.getElementById('prescriptions-container');

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="col-12"><p class="text-white-50 text-center py-4">Nenhuma receita cadastrada</p></div>';
    return;
  }

  container.innerHTML = data.map(rx => {
    const statusColor = {
      'active': 'success',
      'discontinued': 'danger',
      'paused': 'warning'
    }[rx.adherence_status] || 'secondary';

    return `
      <div class="col-12 col-md-6">
        <div class="card glass-card border-0 p-3 rounded-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold text-white mb-0">
              <i class="bi bi-capsule text-primary me-1"></i>${rx.medication_name}
            </h6>
            <span class="badge bg-${statusColor} bg-opacity-20 text-${statusColor} small">
              ${rx.adherence_status === 'active' ? 'Em Uso' : rx.adherence_status === 'discontinued' ? 'Descontinuado' : 'Pausado'}
            </span>
          </div>
          <p class="text-white-50 small mb-1"><strong>Dosagem:</strong> ${rx.dosage}</p>
          <p class="text-white-50 small mb-1"><strong>Médico:</strong> ${rx.doctors.name}</p>
          <p class="text-white-50 small mb-1"><strong>Indicação:</strong> ${rx.indication || 'N/A'}</p>
          <p class="text-white-50 small mb-2"><strong>Modo:</strong> ${rx.usage_frequency || 'N/A'}</p>
          ${rx.helps_prevent ? '<p class="text-success small mb-1"><i class="bi bi-check-circle me-1"></i>Ajuda a prevenir crises</p>' : ''}
          ${rx.triggers_migraines ? '<p class="text-danger small mb-1"><i class="bi bi-exclamation-circle me-1"></i>Pode gatilhar crises</p>' : ''}
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-sm btn-primary rounded-2 flex-grow-1" onclick="openPrescriptionModal('${rx.id}')">Editar</button>
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

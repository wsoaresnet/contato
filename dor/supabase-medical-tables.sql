-- ============================================================
-- MEDICAL TRACKING SYSTEM - SQL SETUP
-- Diário de Enxaquecas v10 - Supabase Tables
-- ============================================================

-- TABLE 1: DOCTORS (Médicos)
-- ============================================================
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  clinic_name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  crm TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE,
  CONSTRAINT valid_doctor CHECK (name IS NOT NULL AND username IS NOT NULL)
);

CREATE INDEX idx_doctors_username ON public.doctors(username);
CREATE INDEX idx_doctors_name ON public.doctors(name);

-- ============================================================
-- TABLE 2: APPOINTMENTS (Consultas)
-- ============================================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  doctor_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME,
  reason TEXT,
  symptoms TEXT,
  diagnosis TEXT,
  notes TEXT,
  follow_up_date DATE,
  follow_up_type TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE,
  CONSTRAINT valid_appointment CHECK (
    appointment_date IS NOT NULL AND
    username IS NOT NULL AND
    doctor_id IS NOT NULL
  ),
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'completed', 'cancelled'))
);

CREATE INDEX idx_appointments_username ON public.appointments(username);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);

-- ============================================================
-- TABLE 3: PRESCRIPTIONS (Receitas Médicas)
-- ============================================================
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  doctor_id UUID NOT NULL,
  appointment_id UUID,
  prescription_date DATE NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  form TEXT,
  quantity INTEGER,
  prescription_file_url TEXT,

  -- Modo de Uso
  usage_frequency TEXT,
  usage_timing TEXT,
  usage_instructions TEXT,
  take_with_food TEXT,
  duration_type TEXT,
  start_date DATE,
  end_date DATE,

  -- Indicação
  indication TEXT,
  indication_reason TEXT,
  is_preventive BOOLEAN DEFAULT FALSE,

  -- Status
  adherence_status TEXT DEFAULT 'active',
  adherence_reason TEXT,
  side_effects JSONB DEFAULT '[]'::jsonb,
  efficacy_notes TEXT,

  -- Análise
  contraindications TEXT,
  related_crises_count INTEGER DEFAULT 0,
  helps_prevent BOOLEAN DEFAULT FALSE,
  triggers_migraines BOOLEAN DEFAULT FALSE,

  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL,
  CONSTRAINT valid_prescription CHECK (
    medication_name IS NOT NULL AND
    dosage IS NOT NULL AND
    prescription_date IS NOT NULL
  ),
  CONSTRAINT valid_adherence CHECK (adherence_status IN ('active', 'discontinued', 'paused')),
  CONSTRAINT valid_status_rx CHECK (status IN ('active', 'discontinued'))
);

CREATE INDEX idx_prescriptions_username ON public.prescriptions(username);
CREATE INDEX idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_medication ON public.prescriptions(medication_name);
CREATE INDEX idx_prescriptions_date_range ON public.prescriptions(start_date, end_date);

-- ============================================================
-- VIEW: ACTIVE PRESCRIPTIONS
-- ============================================================
CREATE VIEW public.active_prescriptions AS
SELECT *
FROM public.prescriptions
WHERE status = 'active'
  AND adherence_status IN ('active', 'paused')
  AND (end_date IS NULL OR end_date >= CURRENT_DATE);

-- ============================================================
-- VIEW: PRESCRIPTION ANALYSIS
-- ============================================================
CREATE VIEW public.prescription_analysis AS
SELECT
  p.id,
  p.username,
  d.name as doctor_name,
  p.medication_name,
  p.dosage,
  p.indication,
  p.start_date,
  p.end_date,
  p.helps_prevent,
  p.triggers_migraines,
  p.efficacy_notes,
  p.adherence_status,
  CASE
    WHEN p.end_date IS NULL THEN 'Em uso'
    WHEN p.end_date >= CURRENT_DATE THEN 'Ativa'
    ELSE 'Descontinuada'
  END as current_status,
  p.created_at
FROM public.prescriptions p
LEFT JOIN public.doctors d ON p.doctor_id = d.id;

-- ============================================================
-- SAMPLE DATA (OPTIONAL - Remover em produção)
-- ============================================================
-- Apenas para teste/demonstração
-- DELETE desta seção em produção

INSERT INTO public.doctors (username, name, specialty, clinic_name, address, phone, email, crm)
VALUES
  ('willian', 'Dra. Karin Corrêa', 'Neurologia', 'Clínica Dr. Silva', 'Av. Paulista, 1000', '(11) 98765-4321', 'karin@clinica.com.br', '123456-SP'),
  ('willian', 'Dr. João Santos', 'Cardiologia', 'Hospital Central', 'Rua da Paz, 500', '(11) 99999-8888', 'joao@hospital.com.br', '789012-SP')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PERMISSIONS (RLS - Row Level Security) - OPTIONAL
-- ============================================================
-- Note: RLS is optional. The app filters by username in queries.
-- If you want to enable RLS for additional security, uncomment below:

-- ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- COMMENTED OUT: RLS policies require auth.uid() mapping to username
-- For now, relying on app-level filtering by username
-- Future: integrate with Supabase auth system for full RLS

-- ============================================================
-- NOTES
-- ============================================================
/*
Para aplicar estas tabelas no Supabase:

1. Acesse: https://app.supabase.com/project/[seu-project]/sql/new
2. Cole este SQL completo
3. Execute
4. As tabelas serão criadas com indices e políticas RLS

Alternativamente, use o cliente Supabase CLI:
  supabase db push

As views podem ser consultadas como:
  SELECT * FROM active_prescriptions;
  SELECT * FROM prescription_analysis;
*/

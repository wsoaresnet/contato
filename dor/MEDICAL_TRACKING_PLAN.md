# 🏥 Medical Tracking System - Plano Completo v10

## Visão Geral

Sistema de acompanhamento médico integrado com o Diário de Enxaquecas para:
- ✅ Registrar médicos e locais de atendimento
- ✅ Gerenciar agendamentos e histórico de consultas
- ✅ Rastrear receitas médicas completas
- ✅ Correlacionar medicações com crises de enxaqueca
- ✅ Descobrir padrões e gatilhos medicamentosos

---

## 📊 Estrutura do Banco de Dados

### Tabela 1: `doctors` (Médicos)

```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  name TEXT NOT NULL,                    -- Ex: "Dra. Karin Corrêa"
  specialty TEXT,                        -- Ex: "Neurologia"
  clinic_name TEXT,                      -- Ex: "Clínica Dr. Silva"
  address TEXT,                          -- Endereço completo
  phone TEXT,                            -- Telefone de contato
  email TEXT,                            -- Email
  crm TEXT,                              -- Número do CRM
  notes TEXT,                            -- Notas adicionais
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (username) REFERENCES users(username)
);
```

### Tabela 2: `appointments` (Consultas)

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  doctor_id UUID NOT NULL,
  appointment_date DATE NOT NULL,        -- Data da consulta
  appointment_time TIME,                 -- Hora
  reason TEXT,                           -- Motivo da consulta
  symptoms TEXT,                         -- Sintomas apresentados
  diagnosis TEXT,                        -- Diagnóstico informado
  notes JSONB,                           -- Notas adicionais
  prescription_ids TEXT[],               -- Array de IDs de receitas
  follow_up_date DATE,                   -- Próxima consulta
  follow_up_type TEXT,                   -- Tipo: "consulta", "telefonema", etc
  status TEXT DEFAULT 'scheduled',       -- "scheduled", "completed", "cancelled"
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (username) REFERENCES users(username),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

### Tabela 3: `prescriptions` (Receitas Médicas)

```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  doctor_id UUID NOT NULL,
  appointment_id UUID,
  prescription_date DATE NOT NULL,
  medication_name TEXT NOT NULL,         -- Ex: "Sumatriptana"
  dosage TEXT NOT NULL,                  -- Ex: "50mg"
  form TEXT,                             -- Ex: "Comprimido", "Injeção"
  quantity INTEGER,                      -- Quantidade prescrita
  prescription_file TEXT,                -- URL da imagem/PDF receita
  
  -- Modo de Uso Completo
  usage_frequency TEXT,                  -- "1x ao dia", "3x ao dia", etc
  usage_timing TEXT,                     -- "Manhã", "Durante a crise", etc
  usage_instructions TEXT,               -- Instruções detalhadas
  take_with_food BOOLEAN,                -- Com ou sem alimento
  duration_type TEXT,                    -- "contínuo", "conforme necessário"
  start_date DATE,                       -- Data início
  end_date DATE,                         -- Data fim (se aplicável)
  
  -- Indicação
  indication TEXT,                       -- Motivo da prescrição
  indication_reason TEXT,                -- Detalhe do motivo
  is_preventive BOOLEAN,                 -- É preventivo ou resgate?
  
  -- Status de Adesão
  adherence_status TEXT,                 -- "em uso", "descontinuado", "pausado"
  adherence_reason TEXT,                 -- Por que parou/pausou
  side_effects JSONB,                    -- Efeitos colaterais observados
  efficacy_notes TEXT,                   -- Notas sobre eficácia
  
  -- Análise
  contraindications TEXT,                -- Interações conhecidas
  related_crises INT,                    -- Número de crises durante uso
  helps_prevent BOOLEAN,                 -- Ajuda a prevenir?
  triggers_migraines BOOLEAN,            -- Pode gatilhar enxaquecas?
  
  status TEXT DEFAULT 'active',          -- "active", "discontinued"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (username) REFERENCES users(username),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
```

---

## 🎯 Telas & Funcionalidades

### 1️⃣ Tela de Médicos

#### Funcionalidades
- ✅ **Listar Médicos**: Cards com foto (opcional), nome, especialidade
- ✅ **Adicionar Médico**: Modal com form completo
- ✅ **Editar Médico**: Atualizar dados
- ✅ **Deletar Médico**: Com confirmação
- ✅ **Filtrar**: Por especialidade, status

#### Campos do Form
```
Nome do Médico           [texto]
Especialidade            [select: Neurologia, Oftalmologia, etc]
Clínica/Consultório      [texto]
Endereço                 [texto]
Telefone                 [tel]
Email                    [email]
CRM                      [texto]
Notas                    [textarea]
Ativo                    [toggle]
```

#### Card de Médico
```
┌─────────────────────────────┐
│  👨‍⚕️ Dra. Karin Corrêa         │
│  🏥 Neurologia               │
│  📍 Clínica Dr. Silva        │
│  📞 (XX) XXXXX-XXXX         │
│  ✉️  karin@clinica.com.br   │
│                             │
│  [Agendar] [Editar] [+Info] │
└─────────────────────────────┘
```

---

### 2️⃣ Tela de Consultas

#### Funcionalidades
- ✅ **Calendário**: Visualizar consultas no mês
- ✅ **Agendar Consulta**: Modal com seleção de médico e data
- ✅ **Histórico**: Timeline de consultas passadas
- ✅ **Detalhes**: Expandir para ver diagnóstico, prescrições
- ✅ **Avisos**: Próxima consulta (follow-up)
- ✅ **Status**: Agendada, Realizada, Cancelada

#### Campos do Form
```
Médico                   [select: Dra. Karin Corrêa]
Data da Consulta         [date]
Hora                     [time]
Motivo da Consulta       [select/textarea]
Sintomas Apresentados    [textarea]
Diagnóstico Informado    [textarea]
Receitas Associadas      [multi-select]
Próxima Consulta (data)  [date]
Tipo de Follow-up        [select]
Notas Adicionais         [textarea]
```

#### Timeline de Consultas
```
📅 Outubro 2026
━━━━━━━━━━━━━━━━━━━━━━

15/10 - Dra. Karin Corrêa (Realizada) ✅
   Neurologia | Clínica Silva
   Motivo: Acompanhamento de Enxaquecas
   Diagnóstico: Migrânea Episódica
   Receitas: 2 prescrições

10/10 - Dr. Silva (Agendada) 📅
   Oftalmologia | Clínica Dr. Silva
   Horário: 14:30

📅 Setembro 2026
━━━━━━━━━━━━━━━━━━━━━━

20/09 - Dra. Karin Corrêa (Realizada) ✅
   ...
```

---

### 3️⃣ Tela de Receitas Médicas

#### Funcionalidades
- ✅ **Listar Receitas**: Cards ou tabela
- ✅ **Adicionar Receita**: Form detalhado
- ✅ **Foto/PDF da Receita**: Upload
- ✅ **Status**: Ativo, Descontinuado, Pausado
- ✅ **Timeline**: Período de uso
- ✅ **Análise**: Correlação com crises
- ✅ **Efeitos Colaterais**: Registro
- ✅ **Interações**: Alertas

#### Card de Receita
```
┌─────────────────────────────────────┐
│  💊 Sumatriptana 50mg               │
│  👨‍⚕️ Dra. Karin Corrêa              │
│  📅 Data: 15/10/2026                │
│                                     │
│  📋 Indicação: Dor de Enxaqueca     │
│  ⏱️  Uso: Conforme necessário       │
│  📝 Modo: 1 comprimido ao inicio   │
│          da crise, repetir em 2h   │
│          se necessário (máx 2/dia)  │
│                                     │
│  Status: Em Uso ✅                  │
│  Efeitos: Nenhum observado          │
│  Ajuda?: Sim ✅                     │
│  Gatilho?: Não ❌                   │
│                                     │
│  [Ver Receita] [Editar] [Parar]    │
└─────────────────────────────────────┘
```

#### Form de Receita
```
INFORMAÇÕES BÁSICAS
───────────────────
Médico Prescritor        [select]
Consulta Relacionada     [select]
Data da Receita          [date]

MEDICAMENTO
───────────
Nome                     [text com autocomplete]
Dosagem                  [text: "50mg"]
Forma Farmacêutica       [select: Comprimido, Injeção, Líquido]
Quantidade Prescrita     [number]

MODO DE USO COMPLETO
────────────────────
Frequência de Uso        [text: "1x ao dia", "3x ao dia"]
Horário de Uso           [select: Manhã, Tarde, Noite, Conforme Necessário]
Instruções Detalhadas    [textarea: "Tomar 1 comprimido ao início..."]
Tomar com Alimento?      [radio: Sim/Não/Indiferente]
Tipo de Uso              [radio: Contínuo/Conforme Necessário]
Data de Início           [date]
Data de Fim (se aplica)  [date]

INDICAÇÃO MÉDICA
────────────────
Indicação                [select: Dor de Enxaqueca, Prevenção, etc]
Detalhamento            [textarea]
É Medicação Preventiva?  [toggle]

RECEITA FÍSICA
───────────────
Enviar Foto/PDF Receita  [file upload]
Número RX                [text]

MONITORAMENTO
──────────────
Efeitos Colaterais Observados  [checkbox list]
Notas sobre Eficácia           [textarea]
Interações Conhecidas          [textarea auto-preenchida]

STATUS DE ADESÃO
─────────────────
Status Atual              [select: Em Uso, Descontinuado, Pausado]
Motivo da Alteração      [textarea se descontinuado]
Relaciona com Crises?    [toggle + count]
Ajuda a Prevenir?        [toggle]
Pode Gatilhar Enxaquecas? [toggle]
```

---

## 🔗 Integração com Diário de Crises

### Cross-Reference: Correlação de Medicamentos

Quando uma crise é registrada:
```
✅ Sistema sugere medicações ativas
✅ Mostra histórico de eficácia
✅ Alerta se pode ser gatilho
✅ Recomenda qual usar baseado em histórico
```

Quando uma receita é criada/atualizada:
```
✅ Sistema busca crises durante período
✅ Calcula eficácia (redução de crises)
✅ Identifica padrões
✅ Alerta sobre possíveis gatilhos
```

### Dashboard Médico

Novo widget no dashboard:
```
┌─────────────────────────────────────┐
│  🏥 Acompanhamento Médico            │
├─────────────────────────────────────┤
│  Próxima Consulta:                  │
│  📅 20/10/2026 às 14:30             │
│  👨‍⚕️ Dra. Karin Corrêa               │
│                                     │
│  Medicações Ativas: 3               │
│  ├─ Sumatriptana (Eficaz ✅)        │
│  ├─ Amitriptilina (Preventiva 🔄)   │
│  └─ Metoclopramida (Adjuvante)      │
│                                     │
│  [Ver Agenda] [Ver Receitas]        │
└─────────────────────────────────────┘
```

---

## 📱 Abas de Navegação (v10)

Adicionar ao menu superior:

```
📊 Dashboard | 📋 Histórico | 🏥 Agenda | 💊 Receitas | 📄 Relatório
```

Ou dentro do dashboard como sub-abas:

```
Dashboard Clínico | Histórico | Médicos | Consultas | Receitas
```

---

## 🔄 Fluxos de Uso

### Fluxo 1: Primeira Consulta
```
1. Cadastrar Médico
   └─ Preencher dados: nome, especialidade, local
2. Agendar Consulta
   └─ Selecionar médico, data, motivo
3. Marcar como Realizada
   └─ Preencher diagnóstico e observações
4. Cadastrar Receitas
   └─ Preencher medicações prescritas
5. Sistema correlaciona com crises
   └─ Análise de eficácia
```

### Fluxo 2: Acompanhamento Contínuo
```
1. Registrar Crise (como sempre)
2. Sistema sugere medicações
3. Registrar uso de medicação
4. Rastrear eficácia
5. Na próxima consulta, trazer relatório
6. Médico prescreve nova/ajusta dosagem
7. Ciclo continua...
```

### Fluxo 3: Análise de Correlação
```
1. Paciente toma Medicamento X
2. Após 3 dias, aumenta frequência de crises
3. Sistema alerta: "Possível gatilho"
4. Paciente reporta ao médico
5. Médico confirma interação
6. Sistema marca como "pode gatilhar"
7. Próximas sugestões evitam este medicamento
```

---

## 📊 Relatório Médico Expandido (v10)

Adicionar ao PDF:

```
SEÇÃO 4: Histórico de Consultas
────────────────────────────────
15/10/2026 - Dra. Karin Corrêa
   Especialidade: Neurologia
   Motivo: Acompanhamento de Enxaquecas
   Diagnóstico: Migrânea Episódica
   

SEÇÃO 5: Medicações em Acompanhamento
───────────────────────────────────────
Sumatriptana 50mg (Resgate)
   Médico: Dra. Karin
   Desde: 15/10/2026
   Eficácia: Excelente
   Crises durante uso: 2 (ambas aliviadas)

Amitriptilina 25mg (Preventiva)
   Médico: Dra. Karin
   Desde: 01/09/2026
   Eficácia: Boa (redução de 30%)
   Efeitos colaterais: Sonolência leve
```

---

## 🛠️ Tecnologia

### Frontend (novo)
- ✅ Novo componente: `MedicalTracker`
- ✅ Abas: Médicos, Consultas, Receitas
- ✅ Modals para CRUD
- ✅ Calendário para consultas
- ✅ Timeline para receitas
- ✅ Cards com análise

### Backend (Supabase)
- ✅ 3 novas tabelas
- ✅ Relacionamentos ForeignKey
- ✅ Índices para performance
- ✅ RLS para isolamento por usuário

### Lógica (JavaScript)
- ✅ Correlação crise ↔ medicação
- ✅ Cálculo de eficácia
- ✅ Alertas de gatilhos
- ✅ Análise estatística

---

## 📈 Benefícios para Você

✅ **Visão Holística**: Todos os dados médicos em um lugar  
✅ **Descoberta de Causas**: Identifica padrões e gatilhos  
✅ **Comunicação Melhor**: Relatório completo para neurologista  
✅ **Análise de Eficácia**: Sabe quais medicamentos realmente funcionam  
✅ **Segurança**: Detecção de interações e efeitos colaterais  
✅ **Continuidade**: Acompanhamento entre consultas  

---

## 📋 Checklist de Implementação v10

- [ ] Criar tabelas Supabase (doctors, appointments, prescriptions)
- [ ] Frontend: Tela de Médicos (CRUD)
- [ ] Frontend: Tela de Consultas (Calendário + Timeline)
- [ ] Frontend: Tela de Receitas (Cards + Análise)
- [ ] Lógica: Correlação medicação ↔ crise
- [ ] Lógica: Cálculo de eficácia
- [ ] Widget: Dashboard médico
- [ ] Atualizar: Relatório PDF com seções médicas
- [ ] Documentação
- [ ] Testes

---

*Medical Tracking System v10 - Complete Healthcare Management*  
*Desenvolvido para descobrir as causas das enxaquecas* 🔬💊

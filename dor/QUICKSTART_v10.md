# 🚀 Quick Start - Medical Tracking System v10

**⏱️ Tempo de Setup: 5 minutos**

---

## Step 1️⃣: Criar as Tabelas no Supabase (3 min)

### No seu projeto Supabase:
1. Acesse: **SQL Editor** (canto esquerdo)
2. Clique em **New Query**
3. Abra o arquivo: `supabase-medical-tables.sql`
4. **Cole TUDO** (1000+ linhas)
5. Clique em **Run** (botão azul)
6. ✅ Aguarde até completar

### Verificar:
- Vá para **Tables** (canto esquerdo)
- Procure por: `doctors`, `appointments`, `prescriptions`
- Deve estar verde ✅

---

## Step 2️⃣: Fazer Login (1 min)

```
Abra: http://localhost:8000 (ou seu URL)

Usuário: seu_usuario
Senha: sua_senha

✅ Clique em "Acessar Diário"
```

---

## Step 3️⃣: Acessar a Nova Aba (1 min)

### Na página principal:
```
Dashboard Clínico | Histórico de Registros | 🆕 Acompanhamento Médico
```

**Clique em:** `Acompanhamento Médico`

---

## Step 4️⃣: Usar os 3 Módulos (até 5 min cada)

### 📋 Médicos
```
[Clique em: + Novo Médico]

Preencha:
- Nome Completo: "Dra. Karin Corrêa"
- Especialidade: "Neurologia"
- Clínica: "Clínica Silva"
- Telefone: "(11) 98765-4321"
- Email: "karin@clinica.com.br"

[Clique em: Salvar]
✅ Pronto!
```

### 📅 Consultas
```
[Vá para aba: Consultas]
[Clique em: + Nova Consulta]

Preencha:
- Médico: (selecione o que criou)
- Data: "2026-10-20"
- Hora: "14:30"
- Motivo: "Acompanhamento de Enxaquecas"
- Status: "Agendada" (depois mude para "Realizada")

[Clique em: Salvar]
✅ Pronto!
```

### 💊 Receitas
```
[Vá para aba: Receitas]
[Clique em: + Nova Receita]

Preencha:
- Médico: (mesmo acima)
- Data da Receita: "2026-10-20"
- Medicamento: "Sumatriptana"
- Dosagem: "50mg"
- Frequência: "Conforme necessário"
- Indicação: "Dor de Enxaqueca (Resgate)"

[Clique em: Salvar]
✅ Pronto!
```

---

## 🎯 Fluxo Completo (10 min)

### Cenário Comum:
```
1. Marque consulta com médico
   └─ Aba Consultas → + Nova → Status: "Agendada"

2. Vá à consulta
   └─ Edite → Status: "Realizada"

3. Médico prescreve medicação
   └─ Aba Receitas → + Nova → Salve detalhes

4. Use medicação
   └─ Registre crise normalmente
   └─ Sistema correlaciona automaticamente

5. Após mês
   └─ Gerar PDF → Inclui seção "Medicações em Acompanhamento"
   └─ Mostre ao médico
```

---

## 🎨 Visual Esperado

### Médicos Tab
```
┌────────────────────────────────┐
│ 👨‍⚕️ Dra. Karin Corrêa            │
│ Neurologia | Clínica Silva      │
│ (11) 98765-4321 | CRM: 123456   │
│                                │
│ [Editar] [Agendar]             │
└────────────────────────────────┘
```

### Consultas Tab
```
┌────────────────────────────────┐
│ 📅 2026-10-20 às 14:30         │
│ Dra. Karin Corrêa | Neurologia │
│ ✅ Realizada                    │
│                                │
│ Motivo: Acompanhamento         │
│ Diagnóstico: Migrânea          │
│                                │
│ [Editar]                       │
└────────────────────────────────┘
```

### Receitas Tab
```
┌────────────────────────────────┐
│ 💊 Sumatriptana 50mg           │
│ Dra. Karin Corrêa              │
│ Resgate | Em Uso ✅            │
│                                │
│ Modo: Conforme necessário      │
│ Ajuda a prevenir? ✅           │
│                                │
│ [Editar]                       │
└────────────────────────────────┘
```

---

## ⚙️ Troubleshooting Rápido

### ❌ Erro: "Tabelas não encontradas"
**Solução:** Execute SQL novamente no Supabase (Step 1)

### ❌ Erro: "Botão não funciona"
**Solução:** 
1. F5 (refresh)
2. Verifique F12 → Console (há erros?)
3. Logue novamente

### ❌ Erro: "Nenhum médico cadastrado"
**Solução:** Crie um médico (Step 4)

### ❌ Erro: "Dados não salvam"
**Solução:**
1. Verifique internet
2. Verifique se está logado
3. F12 → Console → procure "error" vermelho
4. Copie o erro e avise

---

## ✅ Checklist Pós-Setup

```
☑️ Tabelas Supabase criadas (doctors, appointments, prescriptions)
☑️ Consegui fazer login
☑️ Achei aba "Acompanhamento Médico"
☑️ Criei 1 médico com sucesso
☑️ Agendei 1 consulta
☑️ Registrei 1 receita
☑️ Dados aparecem nos cards
☑️ Consigo editar/deletar
```

Se todos acima estão ✅, **PRONTO!** 🎉

---

## 📞 Próximas Dúvidas?

Consulte:
- **Guia Completo:** IMPLEMENTATION_v10.md
- **Plano Original:** MEDICAL_TRACKING_PLAN.md
- **Schema SQL:** supabase-medical-tables.sql

---

## 🎓 Dicas Profissionais

### Dica 1: Sincronizar Informações
```
Depois de cada consulta:
1. Marque a consulta como "Realizada"
2. Adicione diagnóstico e observações
3. Crie receitas prescritas
4. Sistema cria correlações automaticamente
```

### Dica 2: Monitorar Eficácia
```
Para cada medicação:
1. Marque se "Ajuda a prevenir crises"
2. Marque se "Pode gatilhar crises"
3. Adicione "Notas sobre Eficácia"
4. Relatório PDF mostrará padrões
```

### Dica 3: Preparar para Consulta
```
Antes de consultar:
1. Vá para aba "Acompanhamento Médico"
2. Revise histórico de consultas
3. Revise medicações ativas
4. Gere PDF com dados completos
5. Mostre ao médico
```

---

## 🚀 Você Está Pronto!

**Tempo investido:** 5 min
**Funcionalidades desbloqueadas:** Acompanhamento médico completo
**Próximo passo:** Registre seus médicos e consultas!

**Boa sorte! 🎯**

---

*Medical Tracking System v10*  
*Facilitando o descobrimento de causas de enxaquecas* 💊

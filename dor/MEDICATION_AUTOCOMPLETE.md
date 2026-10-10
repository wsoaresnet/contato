# 💊 Feature: Autocomplete de Medicamentos

## O Que É?

Um sistema inteligente de sugestão de medicamentos que ajuda você a preencher o campo de medicação com:
- ✅ Medicamentos comuns para cefaleia/enxaqueca
- ✅ Histórico de medicamentos já usados
- ✅ Autocomplete em tempo real
- ✅ Interface elegante com dropdown

---

## Como Funciona?

### 1. Abrir Wizard de Crise
```
Clique em "Novo Lançamento de Crise"
```

### 2. Ir para Passo 4 (Remédio e Alívio)
```
Complete os passos 1, 2, 3
No passo 4, veja o campo "Medicamento e Dose Utilizados"
```

### 3. Começar a Digitar
```
Campo de medicamento → Comece a digitar
Exemplo: "suma" (para Sumatriptana)
```

### 4. Ver Sugestões
```
Dropdown aparece com medicamentos que correspondem
Clique em uma para selecionar
Ou continue digitando para filtrar mais
```

### 5. Pressionar Enter ou Clicar
```
Medicamento selecionado aparece no campo
Sistema memoriza para próximas vezes
```

---

## 📋 Medicamentos Disponíveis

### Triptanos (1ª linha para enxaqueca)
```
✅ Sumatriptana 50mg
✅ Sumatriptana 100mg
✅ Rizatriptana 10mg
✅ Zolmitriptana 2.5mg
✅ Frovatriptana 2.5mg
✅ Almotriptana 6.25mg
✅ Eletriptana 40mg
✅ Naratriptana 2.5mg
```

### Analgésicos Simples
```
✅ Dipirona 500mg
✅ Dipirona 1g
✅ Paracetamol 500mg
✅ Paracetamol 750mg
✅ Acetilsalicílico (Aspirina) 500mg
✅ Acetilsalicílico (Aspirina) 1g
```

### AINEs (Anti-inflamatórios)
```
✅ Ibuprofeno 200mg
✅ Ibuprofeno 400mg
✅ Ibuprofeno 600mg
✅ Naproxeno 220mg
✅ Naproxeno 550mg
✅ Nimesulida 100mg
✅ Ácido Mefenâmico 250mg
✅ Diclofenaco 50mg
✅ Diclofenaco 100mg
✅ Cetoprofeno 50mg
✅ Piroxicam 20mg
✅ Meloxicam 7.5mg
```

### Combinações Populares
```
✅ Cafeína + Paracetamol (Dorflex)
✅ Cafeína + Dipirona (Dorflex)
✅ Cafeína + Ibuprofeno (Ibupirac)
```

### Preventivos (Uso Contínuo)
```
✅ Escitalopram 10mg
✅ Fluoxetina 20mg
✅ Amitriptilina 25mg
✅ Amitriptilina 75mg
✅ Venlafaxina 75mg
✅ Propranolol 40mg
✅ Propranolol 80mg
✅ Metoprolol 50mg
✅ Candesartana 8mg
✅ Losartana 50mg
✅ Flunarizina 10mg
✅ Topiramat 25mg
✅ Topiramat 100mg
✅ Valproato de Sódio 500mg
✅ Gabapentina 300mg
✅ Gabapentina 600mg
```

### Adjuvantes & Outros
```
✅ Botox (Toxina Botulínica)
✅ Metoclopramida 10mg
✅ Domperidona 10mg
✅ Clorpromazina 25mg
```

---

## 🎯 Recursos Inteligentes

### 1. **Filtro em Tempo Real**
- Digita "suma" → mostra todos os Sumatriptanos
- Digita "ibu" → mostra Ibuprofeno
- Digita "dipi" → mostra Dipironas

### 2. **Histórico Pessoal**
- Sistema memoriza medicamentos que você usou
- Próxima vez aparecem em primeiro lugar
- Histórico do mês aparecem sugeridos

### 3. **Destaque de Busca**
- Termo digitado fica em **negrito** nas sugestões
- Fácil visualizar o que você procura

### 4. **Dropdown Elegante**
```
┌─────────────────────────────────────┐
│ Comece a digitar...                 │
├─────────────────────────────────────┤
│ 💊 Sumatriptana 50mg                │
│ 💊 Sumatriptana 100mg               │
│ 💊 Sumatriptana + Cafeína           │
│                                     │
│ (Máximo 8 sugestões mostradas)      │
└─────────────────────────────────────┘
```

---

## 💡 Dicas de Uso

### Dica 1: Ser Específico
```
❌ Não recomendado: "Dipirona"
✅ Melhor: "Dipirona 500mg" ou "Dipirona 1g"

Motivo: Dose importa para o médico!
```

### Dica 2: Abreviar para Filtrar
```
Procurando Sumatriptana?
- Digite: "suma"
- Digite: "sumat"
- Digite: "sumatriptana"

Todos funcionam! Escolha o mais rápido.
```

### Dica 3: Medicamentos Não na Lista
```
Se seu medicamento não aparece:
1. Continue digitando o nome inteiro
2. Pressione Enter/Tab
3. O campo aceita qualquer texto

Depois ele fica no seu histórico pessoal!
```

### Dica 4: Combinações
```
Se tomou vários medicamentos:
1. Campo aceita separação por vírgula
2. Exemplo: "Dipirona 1g, Metoclopramida 10mg"
3. Ou separe em dois registros de crise
```

---

## 🎨 Visual do Autocomplete

### Dropdown Aberto
```
Input com foco azul
    ↓
┌─────────────────────────────┐
│ 💊 Sumatriptana 50mg        │  ← Hover = Background azul
│ 💊 Sumatriptana 100mg       │
│ 💊 Meu histórico: Dipirona  │
│ 💊 Ibuprofeno 400mg         │
└─────────────────────────────┘
    ↓
Clique em uma = Seleciona
```

### Animações
```
Dropdown Entrada:  0.2s slideDown
Hover Item:        0.2s transition
Ícone:             Scales 1.15x ao hover
```

---

## 🔧 Técnico: Como Funciona

### Fluxo
```javascript
1. Usuário digita no campo #crisis-medication
2. Event listener detecta 'input'
3. Valor digitalizado é filtrado contra COMMON_MEDICATIONS[]
4. Histórico do usuário userMedicationHistory[] é incluído
5. Dropdown renderiza com até 8 sugestões
6. Termos digitados ficam em bold nas sugestões
7. Clique seleciona e adiciona ao histórico
```

### Dados
```javascript
// Lista de 50+ medicamentos comuns
const COMMON_MEDICATIONS = [
  'Sumatriptana 50mg',
  'Sumatriptana 100mg',
  ... (50 total)
]

// Histórico por usuário (último 20)
let userMedicationHistory = []
```

### Funções
```javascript
initMedicationAutocomplete()     // Inicializa ao carregar
showMedicationSuggestions(...)   // Mostra dropdown
hideMedicationSuggestions()      // Esconde dropdown
selectMedication(med)            // Seleciona e memoriza
```

---

## 🌟 Benefícios

### Para Você
- ✅ Economiza tempo digitando
- ✅ Evita erros de digitação
- ✅ Vê medicamentos comuns de uma vez
- ✅ Histórico personalizado

### Para o Médico
- ✅ Nomes de medicamentos padronizados
- ✅ Fácil ler relatório PDF com nomes corretos
- ✅ Identifica padrões de uso

### Para o Sistema
- ✅ Dados mais consistentes
- ✅ Fácil análise de medicações
- ✅ Histórico medicamentoso claro

---

## 📊 Exemplos de Uso

### Exemplo 1: Primeira Crise com Sumatriptana
```
1. Novo Lançamento → Passo 4
2. No campo, digita: "suma"
3. Vê opções: Sumatriptana 50mg, 100mg
4. Clica em "Sumatriptana 50mg"
5. Sistema memoriza
6. Próximas vezes, aparece no topo!
```

### Exemplo 2: Usando Ibuprofeno
```
1. Digite: "ibu"
2. Ver: Ibuprofeno 200mg, 400mg, 600mg
3. Escolher: "Ibuprofeno 400mg"
4. Selecionar
5. Histórico atualizado
```

### Exemplo 3: Combinação de Medicamentos
```
1. Digite: "dipi"
2. Vê: "Dipirona 500mg", "Dipirona 1g"
3. Clica em "Dipirona 1g"
4. Adiciona: ", Metoclopramida 10mg" manualmente
5. Resultado: "Dipirona 1g, Metoclopramida 10mg"
```

---

## ❓ FAQ

### P: Posso digitar um medicamento que não está na lista?
**R:** Sim! Se não achar na lista, apenas continue digitando o nome inteiro. Ele será memorizado no seu histórico.

### P: O histórico é sincronizado entre dispositivos?
**R:** Sim! Como tudo é salvo no Supabase, seu histórico aparece em iPhone, Android e PC.

### P: Posso deletar medicamentos do histórico?
**R:** Atualmente não há UI para isso, mas se quiser limpar, avise o Willian (admin).

### P: E se não souber a dose exata?
**R:** Escreva o nome e a dose aproximada. O importante é ter um registro!

### P: Posso adicionar mais medicamentos à lista?
**R:** Sim! Avise o Willian (admin) e ele adiciona na próxima versão.

---

## 🚀 Roadmap Futuro

- [ ] API OpenFDA para buscar medicamentos reais
- [ ] Posologia correta por medicamento
- [ ] Interações medicamentosas (warning)
- [ ] Preço dos medicamentos (se disponível)
- [ ] Cloud sync do histórico entre apps
- [ ] Exportar lista de medicamentos para doctor

---

## 📝 Versão

- **Feature**: Medication Autocomplete
- **Lançada em**: v9.1
- **Status**: ✅ Ativo
- **Medicamentos**: 50+
- **Histórico**: Últimos 20 por usuário

---

*Desenvolvido para tornar mais fácil registrar suas medicações! 💊✨*

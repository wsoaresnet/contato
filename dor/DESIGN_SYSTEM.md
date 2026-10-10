# 🎨 Design System: Identidade Visual Profissional

## Overview

O Diário de Enxaquecas agora possui um **design system profissional de primeira qualidade**, com identidade visual consistente em todas as telas.

---

## 🎯 Paleta de Cores

### Cores Primárias
```
Azul Primário:    #0d6efd (RGB: 13, 110, 253)
Azul Secundário:  #60a5fa (RGB: 96, 165, 250)
Azul Escuro:      #0b5ed7 (RGB: 11, 94, 215)
```

### Cores de Fundo
```
Background Dark:  #0b0f17 (RGB: 11, 15, 23)
Background Card:  rgba(22, 30, 46, 0.75)
Background Glass: rgba(15, 23, 42, 0.5)
```

### Cores de Status
```
Sucesso (Verde):    #10b981
Aviso (Amarelo):    #f59e0b
Erro (Vermelho):    #ef4444
Info (Cyan):        #06b6d4
```

### Escala de Dor
```
Nível 1 (Muito Leve):      #3b82f6 (Azul)
Nível 2-4 (Leve/Mod):      #10b981 (Verde)
Nível 5-7 (Mod/Forte):     #f59e0b (Amarelo)
Nível 8-10 (Forte/Extrema): #ef4444 (Vermelho)
```

---

## 🔤 Tipografia

### Fonte Principal
```css
font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
```

### Hierarquia de Tamanhos

| Elemento | Tamanho | Peso | Uso |
|----------|---------|------|-----|
| Login Title | 2.5rem | 800 | Tela de login |
| H1 | 2rem | 700 | Título de página |
| H2 | 1.5rem | 700 | Subtítulo |
| H3 | 1.25rem | 600 | Seção |
| H5 | 1rem | 600 | Card title |
| H6 | 0.875rem | 600 | Label bold |
| Body | 1rem | 400 | Texto normal |
| Small | 0.875rem | 400 | Texto secundário |
| X-Small | 0.75rem | 400 | Metadados |

### Espaçamento de Letras
```css
letter-spacing: -0.02em;   /* Headings compactos */
letter-spacing: 0;         /* Body normal */
letter-spacing: 0.08em;    /* Labels destacadas */
```

---

## 🖼️ Componentes Premium

### Logo - Ícone T.I.
```
Estilo: Código /\ \/
Cores: Gradiente #0d6efd → #60a5fa
Tamanho: 100x100px (SVG escalável)
Animação: Flutuação suave 4s, breathing 3s
```

### Botões
```
Login Button:
  - Background: Linear gradient #0d6efd → #0b5ed7
  - Padding: 12px 20px
  - Border radius: 8px
  - Shadow: 0 8px 16px rgba(13, 110, 253, 0.3)
  - Hover: Translatey(-2px), shadow aumenta
  - Active: Translatey(0), sem elevação

Action Buttons:
  - Variações: Primary, Secondary, Danger
  - Border radius: 8-12px
  - Transição suave 0.3s
```

### Cards
```
Glass Card:
  - Background: rgba(22, 30, 46, 0.65)
  - Backdrop filter: blur(16px)
  - Border: 1px solid rgba(255, 255, 255, 0.12)
  - Border radius: 16px
  - Shadow: 0 12px 32px rgba(0, 0, 0, 0.35)
  - Hover: Elevação +4px, shadow aumenta
```

### Inputs
```
Login Input:
  - Background: rgba(15, 23, 42, 0.5)
  - Border: 1px solid rgba(255, 255, 255, 0.12)
  - Border radius: 12px
  - Focus: Border azul, box-shadow interna
  - Icon color: #0d6efd (focus)
  - Text: Branco, weight 500
```

---

## 🎭 Tela de Login - Novo Design v9

### Estrutura
```
┌─────────────────────────────────────┐
│  🌀 Fundo Animado (Gradient + Shapes)
│  
│     ┌─────────────────────────┐
│     │   Logo Flutuante ✨     │
│     │   WILLIAN SOARES        │
│     │   Diário de Enxaquecas  │
│     │                         │
│     │  [User Input]           │
│     │  [Pass Input]           │
│     │                         │
│     │  [Acessar Diário →]     │
│     │                         │
│     │  🔒 Conexão Segura      │
│     └─────────────────────────┘
│
│  williansoares.net.br/diario
└─────────────────────────────────────┘
```

### Animações
```css
/* Entrada do Card */
slideUp: 0s-0.8s cubic-bezier(0.34, 1.56, 0.64, 1)

/* Flutuação do Logo */
rotateFloat: 4s ease-in-out infinite
codeFlow: 3s ease-in-out infinite

/* Fundo Gradiente */
gradientShift: 15s ease infinite

/* Formas Flutuantes */
float: 20s infinite (delay 0s, 3s, 6s)

/* Botão Shimmer */
shimmer ao hover
```

---

## 📊 Dashboard - Design Premium

### Abas Navegáveis
```
┌─ Dashboard Clínico │ Histórico de Registros ─┐
│                                               │
│  [KPI Grid 2x2]                              │
│  
│  [Gráfico Evolução] [Gráfico Distribuição]
│  
│  [Gatilhos Mais Frequentes]
│  
│  [Legenda Escala]
└───────────────────────────────────────────────┘
```

### KPI Cards
```
Grid: 2 colunas (mobile), 4 colunas (desktop)
Card:
  - Ícone radial sutil no fundo
  - Número em tamanho grande (fs-2)
  - Label pequeno e secundário
  - Hover: Elevação +4px, border azul
  - Cores: Primária, Warning, Sucesso, Info
```

### Gráficos
```
Chart.js com tema dark:
  - Cor de linha: #0d6efd
  - Cor de preenchimento: rgba(13, 110, 253, 0.1)
  - Grid: rgba(255, 255, 255, 0.05)
  - Legenda: rgba(255, 255, 255, 0.8)
  - Pontos: Brancos com borda azul
```

---

## 📄 Relatório PDF - Profissionalismo

### Header
```
┌─────────────────────────────────────────────┐
│ [Cor Azul #0d6efd]                         │
│ WILLIAN SOARES                             │
│ Diário de Acompanhamento de Enxaquecas    │
│ williansoares.net.br/diario                │
└─────────────────────────────────────────────┘
```

### Seções
```
1️⃣ Resumo Epidemiológico (KPIs)
2️⃣ Tabela Cronológica (styleado)
3️⃣ Observações (caixa destacada)
```

### Rodapé
```
—— Linha Azul ——
Diário de Enxaqueca | williansoares.net.br/diario
WILLIAN SOARES | 10/10/2024         Página 1 de N
```

---

## 🎨 Consistência Visual

### Padrões de Cor
```
Hover/Elevação:   +2-4px transform
Focus:            Outline 2px #0d6efd
Active:           Cor mais escura, sem elevação
Disabled:         Opacity 0.5
```

### Espaçamento
```
Gutters:   1.5rem (desktop), 1rem (tablet), 0.75rem (mobile)
Padding:   1rem, 1.5rem, 2rem, 2.5rem
Border Radius: 8px, 12px, 16px, 24px (por tamanho)
```

### Sombras
```
Subtle:     0 2px 4px rgba(0, 0, 0, 0.1)
Medium:     0 8px 16px rgba(13, 110, 253, 0.2)
Large:      0 12px 32px rgba(0, 0, 0, 0.35)
Inset:      inset 0 1px 0 rgba(255, 255, 255, 0.1)
```

---

## 🔍 Guia de Uso

### Quando Usar Cada Componente

| Situação | Componente | Exemplo |
|----------|-----------|---------|
| Input principal | login-input | Usuário/Senha |
| Ação crítica | login-btn | Acessar Diário |
| Métrica importante | kpi-card | Dias com Dor |
| Card com dados | glass-card | Crise/Remédio |
| Informação urgente | badge (danger) | Alerta medicação |
| Navegação | tab | Dashboard/Histórico |

---

## 📱 Responsividade

### Breakpoints
```
Mobile:  < 576px
Tablet:  576px - 992px
Desktop: > 992px
```

### Adaptações
```
Mobile:
  - Logo: 80px → 100px (desktop)
  - Title: 1.8rem → 2.5rem
  - Padding: 0.75rem → 1.5rem
  - Grid: 1 col → 4 col

Tablet:
  - Gráficos: 1 col → 2 col
  - Inputs: Full → Paired

Desktop:
  - 4 colunas KPI
  - 2 gráficos lado a lado
  - Sidebar opcional
```

---

## ✅ Checklist de Qualidade

- [x] Cores consistentes em toda a app
- [x] Tipografia hierárquica clara
- [x] Espaçamento proporcional
- [x] Sombras e elevações
- [x] Animações suaves 0.3s-0.8s
- [x] Transições em hover
- [x] Responsivo em 3 breakpoints
- [x] Dark mode otimizado
- [x] Acessibilidade (contraste, focus)
- [x] Logo em SVG (escalável)
- [x] PDF com branding
- [x] Ícones consistentes

---

## 🚀 Ferramentas Utilizadas

```
Framework:    Bootstrap 5.3
Ícones:       Bootstrap Icons 1.11
Fontes:       Google Fonts (Plus Jakarta Sans)
Gráficos:     Chart.js 4.4
PDF:          jsPDF 2.5 + autoTable
Editor:       VS Code
Versionamento: Git
```

---

## 🎯 Próximas Melhorias Visuais (Roadmap)

- [ ] Dark/Light mode toggle
- [ ] Tema customizável por usuário
- [ ] Ícones customizados para cada usuário
- [ ] Padrão visual para impressão (PDF)
- [ ] Animações ao carregar dados
- [ ] Loading spinners customizados
- [ ] Toast notifications estilizadas
- [ ] Modal dialogs premium

---

## 📞 Suporte

Para dúvidas sobre o design system:
- Consulte este documento
- Verifique as variáveis CSS em `style.css`
- Referencie os componentes em `index.html`

---

*Design System v9 - Professional Edition*  
*Criado por: Willian Soares*  
*Data: 2024-10-10*

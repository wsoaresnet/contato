# 📚 Guia Multi-Usuário: Diário de Enxaquecas Compartilhado

## 🔒 Segurança e Isolamento de Dados

Seu Diário de Enxaquecas foi desenvolvido com **isolamento completo por usuário**. Isso significa:

✅ **Cada pessoa tem seu próprio login e senha**  
✅ **Cada pessoa vê APENAS seu próprio diário**  
✅ **Nenhum usuário consegue acessar dados de outro**  
✅ **Dados são protegidos no banco Supabase**  

---

## 👥 Adicionando Usuários à Família

### **Opção 1: Você Cria os Usuários (Recomendado)**

Como **administrador principal** (willian), você pode criar contas para familiares:

1. **Faça login:** `williansoares.net.br/diario`
2. **Clique no botão "Usuários"** (canto superior direito) ⚙️
3. **Preencha o formulário:**
   - Nome de usuário (ex: `mae`, `filho`, `irma`)
   - Senha (compartilhe pessoalmente ou via WhatsApp)
   - Tipo: "Usuário" (não admin)
4. **Clique em "Criar"**

### **Opção 2: Familiares Solicitam Acesso**

Se preferir não gerenciar senhas:
- Familiares enviam mensagem: *"Quero acessar meu diário de enxaquecas"*
- Você cria a conta no painel admin
- Compartilha login + senha via mensagem privada

---

## 🔐 Estrutura de Segurança Implementada

### **Isolamento no Frontend**
```javascript
// Cada ação é filtrada pelo usuário autenticado
.eq('username', currentUser.username)
```

### **Isolamento no Banco (Supabase)**
Tabela `crises`:
```sql
SELECT * FROM crises 
WHERE username = 'usuario_logado'  -- ← Filtro obrigatório
```

### **Proteções Adicionadas v8:**
- ✅ Validação ao editar: verifica se registro pertence ao usuário
- ✅ Validação ao deletar: rejeita se registro não é do usuário
- ✅ Mensagens de erro claras: "Acesso negado" se tentar violar

---

## 📱 Acesso para Cada Familiar

### **Mãe**
```
Login: mae
Senha: [escolha uma fácil]
Acesso: williansoares.net.br/diario
Device: Celular/Tablet
```

### **Filho/Filha**
```
Login: filho (ou nome)
Senha: [escolha uma fácil]
Acesso: williansoares.net.br/diario
Device: Celular/Tablet/PC
```

### **Irmã/Irmão**
```
Login: irma
Senha: [escolha uma fácil]
Acesso: williansoares.net.br/diario
Device: Celular/Tablet
```

---

## 🔑 Boas Práticas de Senhas

| ✅ Bom | ❌ Evitar |
|--------|----------|
| `mae@2024enxaq` | `123456` |
| `filho_cefaleia_2024` | `password` |
| `irma.dor.2024` | `diario` |

**Dica:** Use padrão: `[Nome]_[Ano]` ou `[Nome]@enxaq`

---

## 🛡️ O Que Cada Usuário VÊ/NÃO VÊ

### **O que PODE VER:**
- ✅ Seu próprio dashboard
- ✅ Seu próprio histórico de crises
- ✅ Seus próprios gráficos e estatísticas
- ✅ Gerar seu próprio PDF médico
- ✅ Editar/deletar suas crises

### **O que NÃO PODE VER:**
- ❌ Dados de outros usuários
- ❌ Histórico de outros familiares
- ❌ Gráficos de outros
- ❌ Relatórios de outros

---

## 👨‍💼 Painel Admin (Apenas Você)

Como administrador (`willian`), você tem:

1. **Criar usuários** → Menu "Usuários" ⚙️
2. **Ver lista de todos os usuários** → Tabela no painel
3. **Deletar usuários** (e seus registros) → Botão "Deletar" 🗑️
4. **Seu próprio diário** → Como qualquer outro usuário

**Atenção:** Deletar um usuário **remove também todos seus registros**!

---

## 🚨 Cenários de Segurança

### **Cenário 1: Alguém tenta mudar a URL**
```
URL: /index.html?username=mae
Resultado: ❌ Não funciona (filtrado no backend)
```

### **Cenário 2: Alguém tenta editar registro alheio**
```
Ação: Clicar "Editar" no histórico de outro
Resultado: ❌ "Acesso negado: registro não pertence a você"
```

### **Cenário 3: Alguém tenta deletar registro alheio**
```
Ação: Chamar API com ID de crise de outro usuário
Resultado: ❌ "Acesso negado: você não pode deletar"
```

### **Cenário 4: Logout e login como outro**
```
User 1 sai: localStorage.clear() ✓
User 2 entra: dados filtrados apenas para User 2 ✓
User 1 não vê dados antigos
```

---

## 📊 Exemplo: 3 Membros da Família

```
┌─────────────────────────────────────┐
│   Diário de Enxaquecas Compartilhado │
├─────────────────────────────────────┤
│                                     │
│  👨 WILLIAN (Admin)                 │
│  ├─ 10 registros                    │
│  ├─ Dashboard próprio               │
│  └─ Controle de usuários            │
│                                     │
│  👩 MÃE                             │
│  ├─ 8 registros                     │
│  ├─ Dashboard próprio               │
│  └─ Sem acesso ao painel admin      │
│                                     │
│  👦 FILHO                           │
│  ├─ 5 registros                     │
│  ├─ Dashboard próprio               │
│  └─ Sem acesso ao painel admin      │
│                                     │
└─────────────────────────────────────┘

Cada um vê APENAS seus dados!
```

---

## 🎯 Guia de Uso para Familiares

### **Passo 1: Receber Credenciais**
```
You: "Criei sua conta no diário"
Familiar: "Qual é o login?"
You: "mae / senha_que_escolhi"
```

### **Passo 2: Fazer Login**
1. Acesse: `williansoares.net.br/diario`
2. Digite username e senha
3. Clique "Acessar Diário"

### **Passo 3: Registrar Crises**
1. Clique "Novo Lançamento de Crise"
2. Siga o wizard de 4 passos
3. Veja seus dados no Dashboard

### **Passo 4: Ver Histórico**
1. Clique na aba "Histórico de Registros"
2. Veja todos seus registros cronológicos
3. Edite ou delete conforme necessário

---

## 📞 Suporte e Troubleshooting

### **"Não consigo fazer login"**
- ✓ Verificar username e senha
- ✓ Verificar se a conta foi criada no painel admin
- ✓ Limpar cookies do navegador (pressionar Ctrl+Shift+Del)

### **"Vejo dados de outro usuário"**
- ⚠️ **NUNCA deve acontecer!** Reporte imediatamente
- Deslogue (botão "Sair")
- Limpe cache e cookies
- Faça login novamente

### **"Esqueci minha senha"**
- Entre em contato com Willian (admin)
- Ele pode deletar sua conta e criar uma nova
- Seus registros antigos serão perdidos

### **"Preciso mudar de senha"**
- ⚠️ Sistema não tem "mudar senha" ainda
- Avise Willian para deletar e recriar com nova senha

---

## 🚀 Deploy & Compartilhamento

### **URL para Compartilhar**
```
williansoares.net.br/diario
```

### **Instalar como App (Recomendado)**

**iOS/iPhone:**
1. Abra em Safari
2. Toque o botão de compartilhar
3. "Adicionar à Tela de Início"
4. Abre como app nativo!

**Android:**
1. Abra em Chrome
2. Menu (⋯) → "Instalar app"
3. Abre como app nativo!

**Desktop:**
1. Salve bookmark na barra
2. Ou simplesmente acesse a URL

---

## ✅ Checklist de Segurança

- [ ] Cada familiar tem username único
- [ ] Cada familiar tem senha forte
- [ ] Você (admin) tem a senha master
- [ ] Ninguém compartilha login com outro
- [ ] Todos fazem logout após usar
- [ ] Ninguém deixa navegador aberto com sessão ativa
- [ ] Backups regulares (Supabase auto-faz)

---

## 🎉 Pronto para Compartilhar!

Seu sistema está **100% seguro** para compartilhar com a família:

```
✅ Isolamento de dados por usuário
✅ Validação em edição e exclusão
✅ Armazenamento seguro no Supabase
✅ Interface amigável e intuitiva
✅ Dashboard profissional com gráficos
✅ PDF médico gerado automaticamente
```

**Bom uso! 🏥📊💊**

---

*Versão: v8 Multi-User Secure*  
*Data: 2024-10-10*  
*Autor: Willian Soares*

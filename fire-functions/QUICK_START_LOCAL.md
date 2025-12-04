# 🚀 Guia Rápido - Desenvolvimento Local

## Opção 1: Usar ngrok (Mais Fácil)

### Passo 1: Instalar ngrok

```bash
# Opção A: Instalar globalmente
brew install ngrok
# ou baixe de https://ngrok.com/download

# Opção B: Usar sem instalar (recomendado)
npx ngrok http 5001
```

### Passo 2: Configurar variáveis locais

1. Copie o arquivo de exemplo:
```bash
cd fire-functions/functions
cp .env.local.example .env.local
```

2. Edite `.env.local` com suas credenciais:
```env
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=https://SUA_URL_NGROK/googleCalendarCallback
APP_URL=http://localhost:5173
GCLOUD_PROJECT=beaulty-book
FUNCTION_REGION=us-central1
```

### Passo 3: Iniciar emulador

Terminal 1:
```bash
cd fire-functions
npm run dev
```

Terminal 2 (ngrok):
```bash
npx ngrok http 5001
```

Copie a URL do ngrok (ex: `https://abc123.ngrok.io`)

### Passo 4: Configurar Google Cloud Console

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Edite seu OAuth 2.0 Client ID
3. Adicione em "Authorized redirect URIs":
   ```
   https://SUA_URL_NGROK/googleCalendarCallback
   ```
4. Atualize `.env.local` com a URL do ngrok
5. Reinicie o emulador

### Passo 5: Testar

1. Frontend rodando em `http://localhost:5173`
2. Emulador rodando em `http://localhost:5001`
3. Ngrok expondo em `https://SUA_URL_NGROK`

---

## Opção 2: Usar localhost direto (Limitado)

⚠️ **Nota**: O Google OAuth não funciona com `localhost` diretamente. Você precisa de uma URL pública.

Se quiser testar apenas as functions sem OAuth:

```bash
cd fire-functions
npm run dev
```

As functions estarão disponíveis em:
- `http://localhost:5001/beaulty-book/us-central1/NOME_DA_FUNCAO`

---

## Opção 3: Deploy para desenvolvimento

Faça deploy em um ambiente de staging:

```bash
cd fire-functions
firebase deploy --only functions
```

Use a URL de produção para testes.

---

## Troubleshooting

### Erro: "GOOGLE_CLIENT_ID não configurado"

- Verifique se o arquivo `.env.local` existe
- Verifique se as variáveis estão corretas
- Reinicie o emulador após criar/editar `.env.local`

### Erro: "redirect_uri_mismatch"

- Verifique se a URL no Google Console corresponde exatamente à URL do ngrok
- Inclua o protocolo `https://`
- Não inclua barra final `/` (exceto se necessário)

### Ngrok URL muda a cada vez

- Use ngrok com plano pago para URL fixa
- Ou atualize o Google Console e `.env.local` a cada vez

---

## Estrutura de URLs

### Em Produção:
- Function: `https://us-central1-beaulty-book.cloudfunctions.net/googleCalendarCallback`
- App: `https://bookpro.me`

### Em Localhost (com ngrok):
- Function: `https://abc123.ngrok.io/googleCalendarCallback`
- App: `http://localhost:5173`

### Em Emulator (sem ngrok):
- Function: `http://localhost:5001/beaulty-book/us-central1/googleCalendarCallback`
- App: `http://localhost:5173`
- ⚠️ OAuth não funcionará sem URL pública


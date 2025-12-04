# Desenvolvimento Local - Google Calendar Integration

## Estratégias para Testar em Localhost

### Estratégia 1: Usar ngrok (Recomendado)

O ngrok expõe seu localhost através de uma URL pública, permitindo que o Google OAuth funcione.

#### 1. Instalar ngrok

```bash
# Linux/Mac
brew install ngrok
# ou baixe de https://ngrok.com/download

# Ou use npx (sem instalação)
npx ngrok http 5001
```

#### 2. Configurar Firebase Emulator

```bash
cd fire-functions
firebase emulators:start --only functions
```

O emulador rodará em `http://localhost:5001`

#### 3. Expor com ngrok

Em outro terminal:

```bash
ngrok http 5001
```

Você receberá uma URL como: `https://abc123.ngrok.io`

#### 4. Configurar variáveis de ambiente locais

Crie um arquivo `.env.local` em `fire-functions/functions/`:

```env
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=https://abc123.ngrok.io/googleCalendarCallback
APP_URL=http://localhost:5173
GCLOUD_PROJECT=beaulty-book
FUNCTION_REGION=us-central1
```

#### 5. Adicionar URL do ngrok no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edite seu OAuth 2.0 Client ID
3. Adicione em "Authorized redirect URIs":
   - `https://abc123.ngrok.io/googleCalendarCallback`
4. Salve

#### 6. Atualizar código para usar variáveis locais

O código já está preparado para usar `process.env`, então funcionará automaticamente.

---

### Estratégia 2: Usar Firebase Emulator com variáveis locais

#### 1. Criar arquivo `.env.local` em `fire-functions/functions/`

```env
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5001/googleCalendarCallback
APP_URL=http://localhost:5173
```

#### 2. Instalar dotenv

```bash
cd fire-functions/functions
npm install --save-dev dotenv
```

#### 3. Criar script de desenvolvimento

Crie `fire-functions/functions/src/local-setup.ts`:

```typescript
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({path: path.join(__dirname, "../.env.local")});
```

#### 4. Modificar index.ts para carregar dotenv em desenvolvimento

Adicione no início de `index.ts`:

```typescript
if (process.env.FUNCTIONS_EMULATOR === "true") {
  require("dotenv").config({path: require("path").join(__dirname, "../.env.local")});
}
```

---

### Estratégia 3: Usar Cloud Run Local (Avançado)

Para uma experiência mais próxima da produção, use Cloud Run localmente.

---

## Solução Recomendada: Script Automatizado

Vou criar um script que facilita o desenvolvimento local.


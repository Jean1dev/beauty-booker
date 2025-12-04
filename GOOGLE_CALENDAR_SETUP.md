# Configuração da Integração com Google Calendar

## 1. Configurar OAuth 2.0 no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto Firebase
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**
5. Configure:
   - Application type: **Web application**
   - Name: `Beauty Booker Calendar Integration`
   - Authorized redirect URIs:
     - `https://us-central1-SEU_PROJETO.cloudfunctions.net/googleCalendarCallback`
     - (Para desenvolvimento local, adicione também a URL do emulador se necessário)
6. Copie o **Client ID** e **Client Secret**

## 2. Habilitar Google Calendar API

1. No Google Cloud Console, vá em **APIs & Services** > **Library**
2. Procure por "Google Calendar API"
3. Clique em **Enable**

## 3. Configurar Variáveis de Ambiente nas Cloud Functions

Execute os seguintes comandos no diretório `fire-functions`:

```bash
cd fire-functions
firebase functions:config:set google.client_id="SEU_CLIENT_ID"
firebase functions:config:set google.client_secret="SEU_CLIENT_SECRET"
firebase functions:config:set app.url="https://SEU_DOMINIO.com"
```

**Nota:** Para Firebase Functions v2, use variáveis de ambiente:

```bash
firebase functions:secrets:set GOOGLE_CLIENT_ID
firebase functions:secrets:set GOOGLE_CLIENT_SECRET
firebase functions:secrets:set GOOGLE_REDIRECT_URI
firebase functions:secrets:set APP_URL
```

Ou configure diretamente no código usando `process.env` (não recomendado para produção).

## 4. Instalar Dependências

```bash
cd fire-functions/functions
npm install
```

## 5. Deploy das Functions

```bash
cd fire-functions
firebase deploy --only functions
```

## 6. Estrutura de Dados no Firestore

A integração cria automaticamente documentos na collection `googleCalendarIntegrations`:

```
googleCalendarIntegrations/{userId}
  - userId: string
  - googleUserId: string
  - accessToken: string
  - refreshToken: string
  - expiryDate: number (timestamp)
  - scope: string
  - tokenType: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

## 7. Como Funciona

1. **Conectar**: Usuário clica em "Conectar com Google Agenda" na página de Agendamentos
2. **Autorização**: É redirecionado para o Google OAuth
3. **Callback**: Google redireciona de volta com tokens
4. **Armazenamento**: Tokens são salvos no Firestore
5. **Sincronização**: Quando um agendamento é criado, uma Cloud Function automaticamente:
   - Verifica se o usuário tem Google Calendar conectado
   - Cria o evento no Google Calendar
   - Salva o `googleCalendarEventId` no agendamento

## 8. Funções Disponíveis

### Frontend (via Cloud Functions)
- `getGoogleCalendarAuthUrl`: Gera URL de autorização OAuth
- `checkGoogleCalendarConnection`: Verifica se usuário está conectado
- `disconnectGoogleCalendar`: Desconecta a integração
- `createCalendarEvent`: Cria evento manualmente (opcional)

### Backend (Triggers)
- `syncAppointmentToGoogleCalendar`: Trigger automático quando agendamento é criado

## 9. Troubleshooting

### Erro: "Usuário não conectado ao Google Calendar"
- Verifique se o usuário completou o fluxo OAuth
- Verifique se os tokens estão salvos no Firestore

### Erro: "Tokens não recebidos corretamente"
- Verifique se o redirect URI está correto no Google Cloud Console
- Verifique se a Google Calendar API está habilitada

### Eventos não estão sendo criados
- Verifique os logs das Cloud Functions
- Verifique se o usuário tem Google Calendar conectado
- Verifique se os tokens não expiraram (refresh automático deve funcionar)


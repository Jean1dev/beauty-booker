# BeautyBook - Sistema de Agendamento para Profissionais da Beleza

## Sobre o Projeto

Plataforma completa de agendamento para manicures, tatuadores, body piercers e outros profissionais da beleza. Gerencie serviços, horários e agendamentos com facilidade.

## Como editar este código?

Você pode trabalhar localmente usando sua IDE preferida.

O único requisito é ter Node.js & npm instalados - [instale com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Siga estes passos:

```sh
# Passo 1: Clone o repositório usando a URL Git do projeto.
git clone <YOUR_GIT_URL>

# Passo 2: Navegue até o diretório do projeto.
cd <YOUR_PROJECT_NAME>

# Passo 3: Instale as dependências necessárias.
npm i

# Passo 4: Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Firebase

# Passo 5: Inicie o servidor de desenvolvimento com auto-reload e preview instantâneo.
npm run dev
```

### Configuração de Variáveis de Ambiente

Este projeto requer variáveis de ambiente para funcionar corretamente. Após clonar o repositório:

1. Copie o arquivo `.env.example` para `.env`
2. Preencha as variáveis com suas credenciais do Firebase:
   - `VITE_FIREBASE_API_KEY`: Sua chave de API do Firebase
   - `VITE_FIREBASE_AUTH_DOMAIN`: Domínio de autenticação (geralmente `seu-projeto.firebaseapp.com`)
   - `VITE_FIREBASE_PROJECT_ID`: ID do seu projeto Firebase
   - `VITE_FIREBASE_STORAGE_BUCKET`: Bucket de armazenamento (geralmente `seu-projeto.firebasestorage.app`)
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: ID do remetente de mensagens
   - `VITE_FIREBASE_APP_ID`: ID do aplicativo
   - `VITE_FIREBASE_MEASUREMENT_ID`: ID de medição do Analytics
   - `VITE_RECAPTCHA_SITE_KEY`: Chave do site reCAPTCHA (opcional)

**Importante**: Nunca commite o arquivo `.env` no repositório. Ele já está no `.gitignore`.

**Editar um arquivo diretamente no GitHub**

- Navegue até o arquivo desejado.
- Clique no botão "Edit" (ícone de lápis) no canto superior direito da visualização do arquivo.
- Faça suas alterações e faça commit das mudanças.

**Usar GitHub Codespaces**

- Navegue até a página principal do seu repositório.
- Clique no botão "Code" (botão verde) próximo ao canto superior direito.
- Selecione a aba "Codespaces".
- Clique em "New codespace" para iniciar um novo ambiente Codespace.
- Edite arquivos diretamente no Codespace e faça commit e push das mudanças quando terminar.

## Quais tecnologias são usadas neste projeto?

Este projeto é construído com:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Como fazer deploy deste projeto?

Você pode fazer deploy deste projeto usando qualquer plataforma de hospedagem que suporte aplicações React/Vite, como:

- Vercel
- Netlify
- GitHub Pages
- AWS Amplify
- Outras plataformas de sua escolha

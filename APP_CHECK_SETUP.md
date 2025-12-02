# Configuração do App Check com reCAPTCHA

## O que é App Check?

O App Check protege seus recursos do Firebase contra abusos e acesso não autorizado. Ele funciona verificando que as requisições vêm de apps legítimos usando tokens de atestado.

## Como configurar

### 1. Criar chave do site reCAPTCHA v3

1. Acesse o [Console do reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Clique em **"+"** para criar um novo site
3. Configure:
   - **Rótulo**: Nome do seu projeto (ex: "BeautyBook")
   - **Tipo reCAPTCHA**: Selecione **reCAPTCHA v3**
   - **Domínios**: Adicione seus domínios:
     - `localhost` (para desenvolvimento)
     - Seu domínio de produção (ex: `seuapp.com`)
   - Aceite os termos e clique em **Enviar**
4. **Copie a Chave do Site** (Site Key) - você precisará dela no próximo passo

### 2. Registrar o app no Firebase Console

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **beaulty-book**
3. No menu lateral, vá para **App Check**
4. Clique em **Registrar app**
5. Selecione **Web** e escolha seu app
6. Em **Provedor de atestado**, selecione **reCAPTCHA v3**
7. Cole a **Chave secreta** (Secret Key) do reCAPTCHA que você criou
8. Clique em **Salvar**

### 3. Configurar variável de ambiente

1. Crie um arquivo `.env` na raiz do projeto (se não existir)
2. Adicione a chave do site reCAPTCHA:

```env
VITE_RECAPTCHA_SITE_KEY=sua-chave-do-site-aqui
```

3. **IMPORTANTE**: O arquivo `.env` já está no `.gitignore`, então não será commitado

### 4. Reiniciar o servidor de desenvolvimento

Após adicionar a variável de ambiente, reinicie o servidor:

```bash
npm run dev
```

## Como funciona

- O App Check é inicializado automaticamente quando o app carrega
- Ele gera tokens de atestado usando o reCAPTCHA v3
- Esses tokens são enviados automaticamente com todas as requisições ao Firebase
- O Firebase valida os tokens antes de permitir acesso aos recursos

## Solução de problemas

### Erro 400 (Bad Request) do reCAPTCHA

Se você ver um erro `400 (Bad Request)` no console relacionado ao reCAPTCHA:

1. **Verifique se a chave do site está correta**:
   - A chave deve começar com `6L` (para reCAPTCHA v3)
   - Copie a chave diretamente do console do reCAPTCHA

2. **Verifique se o domínio está registrado**:
   - No console do reCAPTCHA, vá em **Configurações**
   - Verifique se `localhost` está na lista de domínios
   - Para produção, adicione seu domínio real

3. **Verifique a variável de ambiente**:
   - Certifique-se de que o arquivo `.env` existe na raiz do projeto
   - Verifique se a variável está escrita corretamente: `VITE_RECAPTCHA_SITE_KEY=...`
   - Reinicie o servidor após criar/modificar o `.env`

4. **Limpe o cache do navegador**:
   - Pressione `Ctrl+Shift+Delete` (ou `Cmd+Shift+Delete` no Mac)
   - Limpe o cache e cookies
   - Recarregue a página

### App Check não é obrigatório para desenvolvimento

Se você estiver tendo problemas com o reCAPTCHA durante o desenvolvimento, você pode:
- Remover temporariamente a variável `VITE_RECAPTCHA_SITE_KEY` do `.env`
- O app continuará funcionando, mas sem proteção do App Check
- Configure corretamente antes de fazer deploy em produção

## Verificação

Após configurar, você pode verificar se está funcionando:

1. Abra o DevTools (F12)
2. Vá para a aba **Network**
3. Faça uma requisição ao Firebase (ex: upload de logo)
4. Verifique se há um header `X-Firebase-AppCheck` na requisição

## Ambiente de desenvolvimento (localhost)

### ⚠️ Problema com localhost

O reCAPTCHA v3 tem restrições com `localhost` e pode retornar erro 400. Para resolver isso, o código já está configurado para usar o **modo de depuração** automaticamente quando detectar que está rodando em localhost.

### Como funciona o modo de depuração

1. **O código detecta automaticamente** se está rodando em localhost
2. **Habilita o modo de depuração** automaticamente
3. **Gera um token de depuração** no console do navegador
4. **Você precisa registrar esse token** no Firebase Console

### Passos para configurar o modo de depuração:

#### Passo 1: Verificar se o app está registrado no App Check

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto: **beaulty-book**
3. No menu lateral, vá para **App Check**
4. **Verifique se seu app Web está listado**:
   - Se NÃO estiver listado, você precisa registrar primeiro:
     - Clique em **Registrar app**
     - Selecione **Web**
     - Escolha seu app: `1:430911372516:web:1dcda82966d2827b6b00f1`
     - Em **Provedor de atestado**, selecione **reCAPTCHA v3**
     - Cole a **Chave secreta** (Secret Key) do reCAPTCHA
     - Clique em **Salvar**

#### Passo 2: Obter o token de depuração

1. **Execute o app em localhost**:
   ```bash
   npm run dev
   ```

2. **Abra o console do navegador** (F12 > Console)

3. **Procure por uma mensagem** como:
   ```
   AppCheck debug token: "37343cb3-491f-41cc-a4d7-1157b53934fe". 
   You will need to safelist it in the Firebase console for it to work.
   ```

4. **Copie o token de depuração** (a string entre aspas, ex: `37343cb3-491f-41cc-a4d7-1157b53934fe`)

#### Passo 3: Registrar o token no Firebase Console

1. **Acesse o Firebase Console**:
   - URL: https://console.firebase.google.com/
   - Projeto: **beaulty-book**

2. **Vá para App Check**:
   - Menu lateral > **App Check**

3. **Encontre seu app Web** na lista

4. **Clique no menu de três pontos (⋮)** ao lado do seu app Web

5. **Selecione "Gerenciar tokens de depuração"** (ou "Manage debug tokens")

6. **Clique em "Adicionar token de depuração"** (ou "Add debug token")

7. **Cole o token** que você copiou do console (ex: `37343cb3-491f-41cc-a4d7-1157b53934fe`)

8. **Clique em "Salvar"** (ou "Save")

#### Passo 4: Verificar se funcionou

1. **Recarregue a página** do app (F5 ou Ctrl+R)

2. **Verifique o console** - não deve mais aparecer erros 403

3. **Teste o upload do logo** - deve funcionar agora!

### ⚠️ Erro 403 ao trocar token de depuração

Se você receber um erro **403** ao tentar trocar o token de depuração, verifique:

1. ✅ O app está registrado no App Check? (Passo 1 acima)
2. ✅ O token foi copiado corretamente? (sem espaços extras)
3. ✅ O token foi adicionado na lista de tokens de depuração?
4. ✅ Você está usando o token correto? (cada execução pode gerar um novo token)

**Importante**: O token de depuração precisa ser adicionado **ANTES** de fazer requisições ao Firebase. Se você já tentou fazer upload antes de registrar o token, pode ser necessário:
- Gerar um novo token (recarregar a página)
- Registrar o novo token
- Tentar novamente

### Importante

- O token de depuração é específico para desenvolvimento
- Não use tokens de depuração em produção
- Cada desenvolvedor precisa gerar seu próprio token
- Os tokens de depuração expiram após algum tempo (você precisará gerar um novo)

Para mais detalhes, veja a documentação: https://firebase.google.com/docs/app-check/web/debug-provider

## Referências

- [Documentação do App Check](https://firebase.google.com/docs/app-check)
- [reCAPTCHA v3 Provider](https://firebase.google.com/docs/app-check/web/recaptcha-provider)


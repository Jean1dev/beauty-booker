# Configuração do Firestore

## Erro: Missing or insufficient permissions

Este erro ocorre quando as regras de segurança do Firestore não estão configuradas corretamente.

## Como resolver:

### 1. Acesse o Firebase Console
- Vá para [Firebase Console](https://console.firebase.google.com/)
- Selecione seu projeto: `beaulty-book`

### 2. Configure as regras de segurança
- No menu lateral, clique em **Firestore Database**
- Vá para a aba **Regras** (Rules)
- Substitua as regras atuais por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /user-preferences/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Publique as regras
- Clique em **Publicar** (Publish)

## O que essas regras fazem?

- Permitem que usuários autenticados leiam e escrevam apenas em seus próprios documentos
- O `userId` no documento deve corresponder ao `uid` do usuário autenticado
- Garante segurança: cada usuário só acessa seus próprios dados

## Arquivo de regras

O arquivo `firestore.rules` na raiz do projeto contém essas regras e pode ser usado com Firebase CLI para deploy automático.


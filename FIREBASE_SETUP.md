# 🔥 Configuração do Firebase para Migração

## 📋 Passo a Passo Completo

### 1. **Obter Credenciais do Firebase**

#### 1.1 Acessar o Console do Firebase
1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: `uffa-expence-tracker-app`

#### 1.2 Criar Service Account
1. Clique no ícone de **engrenagem** ⚙️ → **Configurações do projeto**
2. Vá para a aba **"Contas de serviço"**
3. Clique em **"Gerar nova chave privada"**
4. Baixe o arquivo JSON

#### 1.3 Extrair Informações do JSON
Do arquivo baixado, você precisa de:
```json
{
  "project_id": "uffa-expence-tracker-app",
  "client_email": "firebase-adminsdk-xxxxx@uffa-expence-tracker-app.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQgEz6nXFPbdQD\n...\n-----END PRIVATE KEY-----\n"
}
```

### 2. **Configurar Variáveis de Ambiente**

#### 2.1 Criar arquivo .env.local
```bash
cp .env.example .env.local
```

#### 2.2 Preencher as variáveis
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=raphanakai_portfolio

# Firebase Configuration (para migração)
FIREBASE_PROJECT_ID=uffa-expence-tracker-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@uffa-expence-tracker-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA_COMPLETA_AQUI\n-----END PRIVATE KEY-----"
FIREBASE_STORAGE_BUCKET=uffa-expence-tracker-app.appspot.com
```

⚠️ **IMPORTANTE**: A chave privada deve estar entre aspas e com `\n` para quebras de linha!

### 3. **Instalar Dependências**

```bash
npm install firebase-admin
```

### 4. **Testar Configuração**

#### 4.1 Verificar Conexão
```bash
npm run dev
```

#### 4.2 Acessar Admin
1. Vá para `http://localhost:3000/admin/dashboard`
2. Clique na aba **"Migração Firebase"**
3. Clique em **"Testar Migração"**

### 5. **Executar Migração Real**

Se o teste passou, a migração irá:

✅ **Buscar todos os itens** do Firestore  
✅ **Baixar arquivos** do Firebase Storage  
✅ **Otimizar vídeos** (compressão, resolução)  
✅ **Otimizar fotos** (WebP, qualidade 85%)  
✅ **Salvar no MongoDB** com metadados  
✅ **Preservar views** e categorias  
✅ **Gerar relatório** de compressão  

### 6. **Verificar Resultados**

Após a migração:
- ✅ Arquivos otimizados em `/public/uploads/`
- ✅ Dados no MongoDB
- ✅ Dashboard atualizado com estatísticas
- ✅ Portfolio funcionando com novo sistema

## 🔧 Troubleshooting

### Erro: "Firebase credentials not configured"
- ✅ Verifique se todas as variáveis estão no `.env.local`
- ✅ Confirme que a chave privada está completa
- ✅ Reinicie o servidor após alterar `.env.local`

### Erro: "Permission denied"
- ✅ Verifique se a service account tem permissões
- ✅ No Firebase Console → IAM → Adicione papel "Firebase Admin SDK Administrator Service Agent"

### Erro: "Storage bucket not found"
- ✅ Confirme o nome do bucket: `uffa-expence-tracker-app.appspot.com`
- ✅ Verifique se o Firebase Storage está ativado

### Erro: "MongoDB connection failed"
```bash
# Verificar MongoDB
sudo systemctl status mongodb

# Iniciar se necessário
sudo systemctl start mongodb
```

## 📊 Monitoramento da Migração

O dashboard mostrará:
- 📈 **Progresso em tempo real**
- 📊 **Estatísticas de compressão**
- ✅ **Itens migrados com sucesso**
- ❌ **Erros e como corrigi-los**
- 💾 **Economia de espaço**

## 🎯 Após a Migração

1. **Verificar** se todos os itens foram migrados
2. **Testar** o portfolio público
3. **Desativar** Firebase (opcional)
4. **Remover** credenciais do `.env.local`
5. **Backup** do MongoDB

A migração preserva todos os dados e otimiza os arquivos automaticamente! 🚀
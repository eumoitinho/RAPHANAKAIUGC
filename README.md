# Rapha Nakai Portfolio - Sistema MongoDB + VPS

Sistema de portfolio com upload otimizado de mídia, usando MongoDB e armazenamento local na VPS.

## 🚀 Funcionalidades

### ✨ Sistema de Upload Avançado
- **Otimização automática** de vídeos e fotos
- **Seleção de thumbnail** a partir de frames do vídeo
- **Compressão inteligente** para reduzir tamanho dos arquivos
- **Progress tracking** com etapas detalhadas

### 🎥 Processamento de Mídia
- **Vídeos**: Compressão com FFmpeg, máx 1920x1080
- **Fotos**: Conversão para WebP, qualidade 85%
- **Thumbnails**: Extração automática de frames

### 🗄️ Banco de Dados
- **MongoDB** para metadados
- **Armazenamento local** na VPS
- **Migração automática** do Firebase

## 📋 Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar MongoDB
```bash
# Instalar MongoDB (Ubuntu/Debian)
sudo apt update
sudo apt install mongodb

# Iniciar serviço
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 3. Configurar Variáveis de Ambiente
```bash
cp .env.example .env.local
```

Edite o `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=raphanakai_portfolio
```

### 4. Instalar FFmpeg (para processamento de vídeo)
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

### 5. Executar o Projeto
```bash
npm run dev
```

## 🔄 Migração do Firebase

1. Acesse `/admin/dashboard`
2. Vá para a aba "Migração Firebase"
3. Clique em "Iniciar Migração"
4. Aguarde o processo completar

A migração irá:
- ✅ Baixar todos os arquivos do Firebase Storage
- ✅ Otimizar vídeos e fotos
- ✅ Salvar metadados no MongoDB
- ✅ Preservar views e categorias
- ✅ Gerar relatório de compressão

## 📁 Estrutura de Arquivos

```
public/uploads/
├── videos/          # Vídeos otimizados
├── photos/          # Fotos otimizadas
├── thumbnails/      # Thumbnails dos vídeos
└── temp/           # Arquivos temporários
```

## 🛠️ APIs Disponíveis

- `GET /api/media` - Listar mídia
- `POST /api/media` - Incrementar views
- `POST /api/upload-media` - Upload com otimização
- `POST /api/extract-frames` - Extrair frames de vídeo
- `DELETE /api/media/delete` - Deletar mídia
- `POST /api/migrate-firebase` - Migrar do Firebase

## 🎯 Otimizações Implementadas

### Vídeos
- Resolução máxima: 1920x1080
- Codec: H.264
- Bitrate: 2000k (vídeo) + 128k (áudio)
- Formato: MP4

### Fotos
- Formato: WebP
- Qualidade: 85%
- Resolução máxima: 1920x1080
- Compressão automática

### Performance
- Cleanup automático de arquivos temporários
- Progress tracking em tempo real
- Processamento assíncrono
- Cache de thumbnails

## 🔧 Troubleshooting

### Erro: "Module not found: Can't resolve 'firebase/firestore'"
✅ **Resolvido** - Removemos todas as dependências do Firebase

### Erro: FFmpeg não encontrado
```bash
# Verificar instalação
ffmpeg -version

# Instalar se necessário
sudo apt install ffmpeg
```

### Erro: MongoDB connection failed
```bash
# Verificar status
sudo systemctl status mongodb

# Reiniciar se necessário
sudo systemctl restart mongodb
```

## 📊 Monitoramento

O dashboard admin mostra:
- Total de mídia otimizada
- Estatísticas de compressão
- Views por item
- Status do sistema

## 🚀 Deploy em Produção

1. Configure MongoDB na VPS
2. Instale FFmpeg e Sharp
3. Configure variáveis de ambiente
4. Execute a migração
5. Configure nginx para servir arquivos estáticos

O sistema está pronto para produção com otimizações automáticas e gerenciamento completo de mídia!
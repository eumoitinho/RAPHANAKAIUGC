# Configuração VPS - Sistema de Upload de Mídia

## Visão Geral

Este projeto foi configurado para usar uma VPS própria com MongoDB para armazenamento de vídeos e fotos, substituindo o Firebase.

## Configurações Implementadas

### 1. Conexão MongoDB

- **Arquivo**: `lib/mongodb.ts`
- **String de Conexão**: `mongodb://root:K3X8FdR0B4leih2nugpThCCXlU6NEpEwgCXX3dVnljHXE63foxM0zGgElLMqfeIO@162.240.99.119:5481/?directConnection=true`
- **Banco de Dados**: `raphanakai_portfolio`
- **Coleção**: `media`

### 2. Sistema de Upload VPS

#### Arquivos Criados:
- `lib/vps-uploader.ts` - Classe para upload de arquivos na VPS
- `lib/media-storage-vps.ts` - Interface para operações no MongoDB
- `app/api/upload-media-vps/route.ts` - API endpoint para upload VPS

#### Funcionalidades:
- Upload de vídeos e fotos (máximo 100MB)
- Geração automática de thumbnails
- Armazenamento em diretórios organizados (`/uploads/videos/` e `/uploads/photos/`)
- Metadados salvos no MongoDB

### 3. Painel de Administração VPS

#### Componentes Criados:
- `components/admin/media-uploader-vps.tsx` - Interface de upload para VPS
- `components/admin/media-manager-vps.tsx` - Gerenciador de arquivos VPS
- `app/admin/dashboard-vps/page.tsx` - Dashboard específico para VPS
- `app/admin/files-vps/page.tsx` - Página de gerenciamento de arquivos VPS

#### Funcionalidades do Painel:
- Upload direto para VPS com preview
- Visualização de estatísticas (total de mídia, vídeos, fotos, visualizações, espaço usado)
- Status de conexão MongoDB/VPS
- Gerenciamento completo de arquivos (visualizar, excluir, copiar URL)
- Filtros por tipo de mídia
- Busca por título/descrição

### 4. Navegação Atualizada

O layout do admin foi atualizado para incluir:
- Submenu "Arquivos" com opções Firebase e VPS
- Submenu "Dashboard VPS" com acesso ao painel VPS

## Estrutura de Diretórios

```
/public/uploads/
├── videos/          # Vídeos enviados
├── photos/          # Fotos enviadas
└── thumbnails/      # Thumbnails gerados
```

## Endpoints da API

### Upload VPS
- **POST** `/api/upload-media-vps` - Upload de arquivo para VPS
- **GET** `/api/upload-media-vps` - Listar todos os arquivos
- **DELETE** `/api/upload-media-vps?id={id}` - Excluir arquivo

## Schema MongoDB

```typescript
type MediaItem = {
  _id?: string
  id: string
  title: string
  description: string
  fileUrl: string
  thumbnailUrl: string
  fileType: 'video' | 'photo'
  categories: string[]
  dateCreated: Date
  views: number
  fileName: string
  fileSize: number
  duration?: number // para vídeos
  dimensions?: {
    width: number
    height: number
  }
  optimized: boolean
}
```

## Como Usar

### 1. Acessar o Painel VPS
- Navegue para `/admin/dashboard-vps`
- Use a aba "Upload VPS" para enviar novos arquivos
- Use a aba "Gerenciar Arquivos" para administrar arquivos existentes

### 2. Upload de Arquivos
1. Selecione o tipo (vídeo ou foto)
2. Preencha título e descrição
3. Selecione categorias
4. Escolha o arquivo (máx. 100MB)
5. Clique em "Enviar para VPS"

### 3. Gerenciamento
- Visualize arquivos na tabela
- Use filtros para encontrar arquivos específicos
- Clique no ícone de olho para visualizar
- Clique no ícone de lixeira para excluir
- Use o menu de três pontos para mais opções

## Vantagens da VPS

1. **Controle Total**: Você tem controle completo sobre os arquivos
2. **Sem Limites de Bandwidth**: Não há limitações do Firebase
3. **Custos Previsíveis**: Sem surpresas na fatura
4. **Performance**: Acesso direto aos arquivos
5. **Backup**: Você controla os backups dos seus dados

## Próximos Passos

1. **Otimização de Imagens**: Implementar redimensionamento automático
2. **Processamento de Vídeo**: Adicionar compressão e múltiplas qualidades
3. **CDN**: Configurar CDN para melhor performance
4. **Backup Automático**: Implementar backup automático dos arquivos
5. **Monitoramento**: Adicionar logs e monitoramento de uso

## Dependências Adicionadas

- `mongodb`: Driver oficial do MongoDB para Node.js

## Configuração de Produção

Para usar em produção, certifique-se de:
1. Configurar HTTPS na VPS
2. Implementar autenticação adequada
3. Configurar backup regular do MongoDB
4. Monitorar espaço em disco
5. Implementar rate limiting nas APIs


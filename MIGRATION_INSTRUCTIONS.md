# 🔄 Guia de Migração - Firebase para VPS

Este guia explica como migrar todos os vídeos e fotos do portfólio do Firebase para a VPS, garantindo que uploads sigam o novo padrão: formato vertical (9:16), thumbnails gerados automaticamente pela VPS, e URLs públicas corretas.

## ✅ Pré-requisitos

1. **Servidor Next.js rodando**: O processo de migração usa APIs locais
2. **Conexão com Firebase configurada**: Para baixar os arquivos
3. **VPS configurada**: Para upload e geração de thumbnails
4. **MongoDB conectado**: Para salvar os dados migrados

## 📋 Etapas da Migração

### 1. Preparação

```bash
# Certifique-se de que está no diretório do projeto
cd "d:\MSYNC PESSOAL\RAPHANAKAIUGC"

# Instale as dependências se necessário
npm install

# Inicie o servidor Next.js (obrigatório para a migração)
npm run dev
```

### 2. Executar a Migração dos Arquivos

**Abra um novo terminal** (deixe o servidor rodando) e execute:

```bash
cd "d:\MSYNC PESSOAL\RAPHANAKAIUGC\scripts"
node migrate-firebase-to-vps.js
```

**O que este script faz:**
- 📥 Baixa todos os arquivos do Firebase
- 📤 Faz upload para a VPS via API local
- 🖼️ Deixa a VPS gerar thumbnails verticais automaticamente
- 📄 Salva os resultados em `migrated_items.json`

**Tempo esperado:** Varia conforme o número de arquivos (pode levar alguns minutos)

### 3. Importar Dados para o MongoDB

Após a migração dos arquivos, importe os dados para o banco:

```bash
# Ainda no diretório scripts
node import-migrated-data.js
```

**O que este script faz:**
- 📋 Lê os dados do arquivo `migrated_items.json`
- 💾 Importa cada item para o MongoDB via API
- ✅ Confirma o sucesso de cada importação
- 📁 Renomeia o arquivo processado

### 4. Verificação

1. **Acesse o portfólio**: http://localhost:3000
2. **Confirme que:**
   - ✅ Todos os vídeos e fotos aparecem
   - ✅ Thumbnails estão no formato vertical (9:16)
   - ✅ URLs apontam para a VPS
   - ✅ Grid está funcionando corretamente

## 📁 Arquivos Gerados

Durante o processo, estes arquivos serão criados na pasta `scripts`:

- `migration_results.json` - Log completo da migração
- `migrated_items.json` - Dados prontos para importação
- `migrated_items_processed_YYYY-MM-DD.json` - Backup após importação

## 🔧 Troubleshooting

### ❌ Erro: "Servidor Next.js não está rodando"
**Solução:** Certifique-se de que `npm run dev` está ativo em outro terminal

### ❌ Erro: "Arquivo migrated_items.json não encontrado"
**Solução:** Execute primeiro o script `migrate-firebase-to-vps.js`

### ❌ Erro de conexão VPS
**Solução:** Verifique as configurações da VPS em `.env.local`

### ❌ Erro de conexão MongoDB
**Solução:** Verifique a string de conexão `MONGODB_URI` em `.env.local`

## 📊 Formatos Suportados

**Vídeos:**
- Automaticamente redimensionados para 9:16
- Thumbnail gerado em 1080x1920

**Fotos:**
- Automaticamente redimensionadas para 9:16  
- Thumbnail gerado em 216x384

## 🎯 Resultado Final

Após a migração completa:

- 🗄️ **Firebase**: Pode ser desabilitado (arquivos não serão mais usados)
- 🌐 **VPS**: Hospeda todos os arquivos com URLs públicas
- 📱 **Portfólio**: Mostra apenas conteúdo vertical com thumbnails adequados
- 💾 **MongoDB**: Contém todas as informações atualizadas

## ⚠️ Importante

- **Backup**: Faça backup do banco antes da migração
- **Testes**: Teste em ambiente de desenvolvimento primeiro
- **Performance**: A migração pode demorar dependendo do número de arquivos
- **Conexão**: Mantenha boa conexão com internet durante o processo

---

## 📞 Suporte

Se encontrar problemas, verifique:

1. Logs do console nos scripts
2. Logs do servidor Next.js
3. Conectividade com VPS e MongoDB
4. Configurações no arquivo `.env.local`

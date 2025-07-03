const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const cors = require('cors')
const sharp = require('sharp')
const ffmpeg = require('fluent-ffmpeg')

const app = express()
const PORT = process.env.PORT || 3001

// Configurar CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://seu-site.vercel.app',
    'http://localhost:3000',
    'https://raphanakai.com.br'
  ],
  credentials: true
}))

app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' }))

// Configurar diretórios de upload
const uploadDir = '/app/uploads'
const videosDir = path.join(uploadDir, 'videos')
const photosDir = path.join(uploadDir, 'photos')
const thumbnailsDir = path.join(uploadDir, 'thumbnails')

// Criar diretórios se não existirem
[uploadDir, videosDir, photosDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Servir arquivos estáticos
app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=31536000')
  }
}))

// Configurar multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = req.body.fileType || 'photo'
    const destDir = fileType === 'video' ? videosDir : photosDir
    cb(null, destDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const extension = path.extname(file.originalname)
    cb(null, uniqueName + extension)
  }
})

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB
    fieldSize: 100 * 1024 * 1024
  }
})

// Função para otimizar imagem
async function optimizeImage(inputPath, outputPath) {
  try {
    const info = await sharp(inputPath)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(outputPath)
    
    fs.unlinkSync(inputPath)
    return { path: outputPath, size: info.size }
  } catch (error) {
    console.error('Erro ao otimizar imagem:', error)
    const stats = fs.statSync(inputPath)
    return { path: inputPath, size: stats.size }
  }
}

// Função para otimizar vídeo
async function optimizeVideo(inputPath, outputPath) {
  return new Promise((resolve) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size('1920x?')
      .videoBitrate('2000k')
      .audioBitrate('128k')
      .outputOptions(['-preset', 'fast', '-crf', '23'])
      .on('end', () => {
        try {
          const stats = fs.statSync(outputPath)
          fs.unlinkSync(inputPath)
          resolve({ path: outputPath, size: stats.size })
        } catch (error) {
          console.error('Erro após otimização:', error)
          const stats = fs.statSync(inputPath)
          resolve({ path: inputPath, size: stats.size })
        }
      })
      .on('error', (err) => {
        console.error('Erro ao otimizar vídeo:', err)
        const stats = fs.statSync(inputPath)
        resolve({ path: inputPath, size: stats.size })
      })
      .save(outputPath)
  })
}

// Função para gerar thumbnail
async function generateVideoThumbnail(videoPath, thumbnailPath) {
  return new Promise((resolve) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['10%'],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '640x360'
      })
      .on('end', () => resolve(thumbnailPath))
      .on('error', (err) => {
        console.error('Erro ao gerar thumbnail:', err)
        resolve(null)
      })
  })
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Endpoint de upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload iniciado:', {
      file: req.file?.originalname,
      size: req.file?.size,
      type: req.body.fileType
    })

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    const { title, description, fileType, categories } = req.body
    const uploadedFile = req.file
    
    let processedFile = { path: uploadedFile.path, size: uploadedFile.size }
    let thumbnailUrl = ''

    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`

    // Processar arquivo baseado no tipo
    if (fileType === 'photo') {
      const optimizedPath = uploadedFile.path.replace(/\.[^/.]+$/, '_opt.jpg')
      processedFile = await optimizeImage(uploadedFile.path, optimizedPath)
      thumbnailUrl = processedFile.path.replace('/app/uploads', `${baseUrl}/uploads`)
    } else if (fileType === 'video') {
      // Otimizar vídeo
      const optimizedPath = uploadedFile.path.replace(/\.[^/.]+$/, '_opt.mp4')
      processedFile = await optimizeVideo(uploadedFile.path, optimizedPath)
      
      // Gerar thumbnail
      const thumbnailName = path.basename(processedFile.path, path.extname(processedFile.path)) + '_thumb.jpg'
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName)
      const thumbResult = await generateVideoThumbnail(processedFile.path, thumbnailPath)
      
      if (thumbResult) {
        thumbnailUrl = thumbResult.replace('/app/uploads', `${baseUrl}/uploads`)
      }
    }

    const fileUrl = processedFile.path.replace('/app/uploads', `${baseUrl}/uploads`)
    
    const response = {
      success: true,
      item: {
        id: Date.now().toString(),
        title,
        description,
        fileUrl,
        thumbnailUrl: thumbnailUrl || fileUrl,
        fileType,
        categories: JSON.parse(categories || '[]'),
        fileName: path.basename(processedFile.path),
        fileSize: processedFile.size,
        dateCreated: new Date(),
        optimized: true
      }
    }

    console.log('Upload concluído:', response.item.fileName)
    res.json(response)
  } catch (error) {
    console.error('Erro no upload:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Endpoint para listar arquivos
app.get('/files', (req, res) => {
  try {
    const files = []
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`
    
    // Listar vídeos
    if (fs.existsSync(videosDir)) {
      const videoFiles = fs.readdirSync(videosDir)
      videoFiles.forEach(file => {
        const filePath = path.join(videosDir, file)
        const stats = fs.statSync(filePath)
        files.push({
          id: file,
          fileName: file,
          fileType: 'video',
          fileUrl: `${baseUrl}/uploads/videos/${file}`,
          fileSize: stats.size,
          dateCreated: stats.birthtime
        })
      })
    }

    // Listar fotos
    if (fs.existsSync(photosDir)) {
      const photoFiles = fs.readdirSync(photosDir)
      photoFiles.forEach(file => {
        const filePath = path.join(photosDir, file)
        const stats = fs.statSync(filePath)
        files.push({
          id: file,
          fileName: file,
          fileType: 'photo',
          fileUrl: `${baseUrl}/uploads/photos/${file}`,
          fileSize: stats.size,
          dateCreated: stats.birthtime
        })
      })
    }

    res.json({ files })
  } catch (error) {
    console.error('Erro ao listar arquivos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Endpoint para deletar arquivo
app.delete('/delete/:filename', (req, res) => {
  try {
    const { filename } = req.params
    const { fileType } = req.query
    
    const dir = fileType === 'video' ? videosDir : photosDir
    const filePath = path.join(dir, filename)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      
      // Tentar deletar thumbnail se for vídeo
      if (fileType === 'video') {
        const thumbName = path.basename(filename, path.extname(filename)) + '_thumb.jpg'
        const thumbPath = path.join(thumbnailsDir, thumbName)
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath)
        }
      }
      
      res.json({ success: true })
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado' })
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de uploads rodando na porta ${PORT}`)
  console.log(`📁 Diretório de uploads: ${uploadDir}`)
})
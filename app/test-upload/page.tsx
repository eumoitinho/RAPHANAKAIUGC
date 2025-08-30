'use client'

import { useState } from 'react'
import { useTUSUpload } from '@/hooks/use-tus-upload'

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const { uploadFile, uploading, progress } = useTUSUpload()
  const [result, setResult] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      console.log('📁 ARQUIVO SELECIONADO:', selectedFile.name, selectedFile.size, selectedFile.type)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      console.log('❌ NENHUM ARQUIVO')
      return
    }

    console.log('🔥 INICIANDO TESTE DE UPLOAD RESUMABLE (TUS)')
    
    try {
      const fileExt = file.name.split('.').pop() || 'mp4'
      const fileName = `uploads/${Date.now()}.${fileExt}`

      const uploadResult = await uploadFile({
        file,
        bucketName: 'media',
        fileName,
      })
      
      console.log('✅ SUCESSO TUS:', uploadResult)
      setResult(`✅ SUCESSO: ${uploadResult.url}`)
    } catch (error: any) {
      console.error('❌ ERRO TUS:', error)
      setResult(`❌ ERRO: ${error.message}`)
    }
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1>🔥 TESTE UPLOAD RESUMABLE (TUS)</h1>
      <p>Teste com upload em partes, ideal para arquivos grandes e celulares.</p>
      
      <div style={{ margin: '20px 0' }}>
        <input 
          type="file" 
          onChange={handleFileChange}
          accept="video/*,image/*"
          style={{ padding: '10px', fontSize: '16px' }}
        />
      </div>

      {file && (
        <div style={{ margin: '20px 0', backgroundColor: '#222', padding: '15px', borderRadius: '8px' }}>
          <h3>📁 Arquivo Selecionado:</h3>
          <p><strong>Nome:</strong> {file.name}</p>
          <p><strong>Tamanho:</strong> {(file.size/1024/1024).toFixed(2)} MB</p>
          <p><strong>Tipo:</strong> {file.type || 'Não detectado'}</p>
        </div>
      )}

      <button 
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          padding: '15px 30px', 
          fontSize: '18px', 
          backgroundColor: uploading ? '#666' : '#5e3a8d',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? `🔄 Uploading... ${progress}%` : '🚀 UPLOAD COM TUS'}
      </button>

      {result && (
        <div style={{ 
          margin: '20px 0', 
          padding: '15px', 
          backgroundColor: result.includes('✅') ? '#1a4d1a' : '#4d1a1a',
          borderRadius: '8px',
          fontFamily: 'monospace'
        }}>
          <h3>Resultado:</h3>
          <p>{result}</p>
        </div>
      )}

      <div style={{ margin: '40px 0', backgroundColor: '#222', padding: '20px', borderRadius: '8px' }}>
        <h3>📋 Logs do Console:</h3>
        <p>Abra o Console do Browser (F12) para ver todos os logs detalhados do TUS.</p>
        <p>Procure por emojis: 🔥 📁 🚀 📊 📦 ✅ ❌</p>
      </div>

      <div style={{ margin: '20px 0', fontSize: '14px', color: '#888' }}>
        <p><strong>Instruções:</strong></p>
        <p>1. Abra o console (F12)</p>
        <p>2. Faça login na aplicação para ter uma sessão Supabase ativa (o upload TUS precisa de autenticação).</p>
        <p>3. Selecione um vídeo grande (300MB+)</p>
        <p>4. Clique em "UPLOAD COM TUS"</p>
        <p>5. Acompanhe o progresso do upload em chunks no console.</p>
      </div>
    </div>
  )
}
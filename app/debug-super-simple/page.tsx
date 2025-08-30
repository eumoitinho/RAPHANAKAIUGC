'use client'

import { useState } from 'react'

export default function SuperSimpleDebug() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('AGUARDANDO ARQUIVO')
  const [uploading, setUploading] = useState(false)

  const forceLog = (message: string) => {
    setStatus(message)
    console.log(message)
    
    // FORÇA ALERT PARA QUALQUER COISA IMPORTANTE
    if (message.includes('ERROR') || message.includes('FALHOU') || message.includes('❌')) {
      alert(`🚨 ERRO DETECTADO!\n\n${message}`)
    }
    
    if (message.includes('TIMEOUT')) {
      alert(`⏰ TIMEOUT!\n\n${message}`)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      forceLog(`✅ ARQUIVO: ${selectedFile.name} - ${(selectedFile.size/1024/1024).toFixed(2)}MB`)
      forceLog(`🎭 TIPO: ${selectedFile.type || 'VAZIO (iPhone)'}`)
      
      if (!selectedFile.type) {
        forceLog(`🔍 DETECTANDO POR EXTENSÃO...`)
        const ext = selectedFile.name.split('.').pop()?.toLowerCase()
        forceLog(`📂 EXTENSÃO: ${ext}`)
      }
    }
  }

  const testUpload = async () => {
    if (!file) {
      alert('❌ NENHUM ARQUIVO SELECIONADO!')
      return
    }

    setUploading(true)
    forceLog('🚀 INICIANDO UPLOAD SUPER SIMPLES...')

    try {
      // Criar FormData
      const formData = new FormData()
      formData.append('file', file)
      
      forceLog('📤 ENVIANDO PARA API...')
      
      // Fazer upload com timeout manual
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        forceLog('❌ TIMEOUT - 2 MINUTOS')
        alert('🚨 TIMEOUT DE 2 MINUTOS!\n\nUpload demorou demais e foi cancelado.')
      }, 2 * 60 * 1000) // 2 minutos

      const response = await fetch('/api/upload-supabase', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        forceLog(`❌ API ERROR: ${response.status} - ${errorText}`)
        alert(`🚨 API FALHOU!\n\nStatus: ${response.status}\nErro: ${errorText}`)
        return
      }

      const result = await response.json()
      forceLog(`✅ SUCESSO: ${result.url || result.message}`)
      alert(`🎉 UPLOAD FUNCIONOU!\n\nURL: ${result.url || result.message}`)

    } catch (error: any) {
      if (error.name === 'AbortError') {
        forceLog('❌ UPLOAD CANCELADO POR TIMEOUT')
        alert('🚨 UPLOAD CANCELADO!\n\nDemorou mais de 2 minutos.')
      } else {
        forceLog(`❌ ERRO GERAL: ${error.message}`)
        alert(`🚨 ERRO GERAL!\n\n${error.message}\n\nStack:\n${error.stack || 'N/A'}`)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#000',
      color: '#0f0',
      fontFamily: 'monospace',
      minHeight: '100vh',
      fontSize: '18px'
    }}>
      <h1 style={{ color: '#f84', fontSize: '32px' }}>🔥 DEBUG ULTRA SIMPLES iPhone</h1>
      <p style={{ color: '#0af' }}>TODOS OS ERROS APARECEM EM ALERT!</p>

      {/* STATUS GIGANTE */}
      <div style={{
        margin: '20px 0',
        padding: '20px',
        backgroundColor: '#111',
        border: '3px solid #f84',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        color: status.includes('❌') ? '#f00' : status.includes('✅') ? '#0f0' : '#ff0'
      }}>
        STATUS: {status}
      </div>

      {/* FILE INPUT */}
      <input
        type="file"
        onChange={handleFileSelect}
        accept="video/*"
        style={{
          padding: '15px',
          fontSize: '20px',
          backgroundColor: '#222',
          color: '#fff',
          border: '2px solid #444',
          width: '100%',
          marginBottom: '20px'
        }}
      />

      {file && (
        <div style={{
          margin: '20px 0',
          padding: '20px',
          backgroundColor: '#111',
          border: '2px solid #0a5',
          fontSize: '20px'
        }}>
          <h3 style={{ color: '#0af' }}>📁 ARQUIVO:</h3>
          <p><strong>Nome:</strong> {file.name}</p>
          <p><strong>Tamanho:</strong> {(file.size/1024/1024).toFixed(2)} MB</p>
          <p><strong>Tipo:</strong> {file.type || '❌ VAZIO (PROBLEMA iPhone)'}</p>
        </div>
      )}

      {/* BOTÃO GIGANTE */}
      <button
        onClick={testUpload}
        disabled={!file || uploading}
        style={{
          padding: '25px 50px',
          fontSize: '28px',
          backgroundColor: uploading ? '#666' : '#d87093',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          width: '100%',
          marginTop: '20px'
        }}
      >
        {uploading ? '🔄 UPLOADING...' : '🚀 TESTE UPLOAD'}
      </button>

      {/* INSTRUÇÕES */}
      <div style={{
        margin: '40px 0',
        padding: '20px',
        backgroundColor: '#001122',
        border: '2px solid #0066aa',
        fontSize: '18px'
      }}>
        <h3 style={{ color: '#0af' }}>📋 COMO FUNCIONA:</h3>
        <p>1. Selecione vídeo de 300MB do iPhone</p>
        <p>2. Clique "🚀 TESTE UPLOAD"</p>
        <p>3. <strong style={{ color: '#f84' }}>QUALQUER ERRO VAI APARECER EM ALERT!</strong></p>
        <p>4. Status fica visível na tela em tempo real</p>
        <p>5. Timeout em 2 minutos = alert automático</p>
      </div>

      <div style={{
        marginTop: '40px',
        padding: '15px',
        backgroundColor: '#200',
        border: '2px solid #f00',
        fontSize: '16px'
      }}>
        <h3 style={{ color: '#f00' }}>🚨 GARANTIAS:</h3>
        <p>✅ Todo erro vira ALERT no iPhone</p>
        <p>✅ Status sempre visível na tela</p>
        <p>✅ Timeout de 2 minutos máximo</p>
        <p>✅ Detalhes completos em cada erro</p>
      </div>
    </div>
  )
}
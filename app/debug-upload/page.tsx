'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default function DebugUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<string>('')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [logMessage, ...prev])
    
    // FORÇA ALERT NO iPhone PARA ERROS
    if (message.includes('❌')) {
      alert(`ERRO: ${message}`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setLogs([])
      setResult('')
      addLog(`📁 ARQUIVO: ${selectedFile.name}`)
      addLog(`📏 TAMANHO: ${(selectedFile.size/1024/1024).toFixed(2)}MB`)
      addLog(`🎭 TIPO: ${selectedFile.type || 'VAZIO - PROBLEMA NO IPHONE'}`)
      
      // Detectar tipo pela extensão se type estiver vazio
      if (!selectedFile.type) {
        const ext = selectedFile.name.split('.').pop()?.toLowerCase()
        addLog(`🔍 EXTENSÃO DETECTADA: ${ext}`)
        if (ext && ['mov', 'mp4', 'avi', 'hevc'].includes(ext)) {
          addLog('✅ TIPO INFERIDO: VIDEO')
        }
      }
    }
  }

  const uploadDirect = async () => {
    if (!file) return
    
    setUploading(true)
    setProgress(0)
    addLog('🚀 INICIANDO UPLOAD DIRETO AO SUPABASE')
    
    try {
      // Nome único
      const timestamp = Date.now()
      const ext = file.name.split('.').pop() || 'mov'
      const fileName = `debug_${timestamp}.${ext}`
      const filePath = `debug/${fileName}`
      
      addLog(`📂 CAMINHO: ${filePath}`)
      setProgress(10)
      
      // Upload com timeout manual
      const uploadPromise = supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      // Timeout de 5 minutos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT - 5 minutos')), 5 * 60 * 1000)
      })
      
      addLog('⏱️ TIMEOUT CONFIGURADO: 5 minutos')
      setProgress(30)
      
      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any
      
      if (error) {
        const errorMsg = `❌ ERRO SUPABASE: ${error.message}`
        addLog(errorMsg)
        addLog(`❌ DETALHES: ${JSON.stringify(error)}`)
        setResult(`ERRO: ${error.message}`)
        // DUPLO ALERT PARA GARANTIR QUE O iPhone VÊ
        alert(`UPLOAD FALHOU!\n\n${error.message}\n\nDetalhes: ${JSON.stringify(error)}`)
        return
      }
      
      addLog('✅ UPLOAD COMPLETADO')
      setProgress(80)
      
      // URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(data.path)
      
      addLog(`🔗 URL: ${publicUrl}`)
      setProgress(100)
      
      setResult(`SUCESSO: ${publicUrl}`)
      
    } catch (error: any) {
      const errorMsg = `❌ ERRO GERAL: ${error.message}`
      addLog(errorMsg)
      setResult(`ERRO: ${error.message}`)
      // ALERT OBRIGATÓRIO PARA iPhone VER
      alert(`ERRO GERAL NO UPLOAD!\n\n${error.message}\n\nStack: ${error.stack || 'N/A'}`)
    } finally {
      setUploading(false)
    }
  }

  const uploadViaAPI = async () => {
    if (!file) return
    
    setUploading(true)
    setProgress(0)
    addLog('🚀 TENTANDO VIA API (FALLBACK)')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      addLog('📤 ENVIANDO PARA /api/upload-supabase')
      setProgress(20)
      
      const response = await fetch('/api/upload-supabase', {
        method: 'POST',
        body: formData
      })
      
      setProgress(60)
      
      if (!response.ok) {
        const errorText = await response.text()
        const errorMsg = `❌ API ERRO: ${response.status} - ${errorText}`
        addLog(errorMsg)
        setResult(`ERRO API: ${errorText}`)
        // ALERT PARA API ERROR
        alert(`API FALHOU!\n\nStatus: ${response.status}\nErro: ${errorText}`)
        return
      }
      
      const result = await response.json()
      addLog(`✅ API SUCESSO: ${JSON.stringify(result)}`)
      setProgress(100)
      
      setResult(`SUCESSO API: ${result.url || result.message}`)
      
    } catch (error: any) {
      const errorMsg = `❌ ERRO API: ${error.message}`
      addLog(errorMsg)
      setResult(`ERRO: ${error.message}`)
      // ALERT FINAL PARA API
      alert(`ERRO NA API!\n\n${error.message}\n\nStack: ${error.stack || 'N/A'}`)
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
      minHeight: '100vh'
    }}>
      <h1>🔥 DEBUG UPLOAD iPhone - LOGS VISÍVEIS</h1>
      <p style={{ color: '#0af' }}>Especial para iPhone que não mostra console</p>
      
      <div style={{ margin: '20px 0' }}>
        <input 
          type="file" 
          onChange={handleFileChange}
          accept="video/*"
          style={{ 
            padding: '15px', 
            fontSize: '16px',
            backgroundColor: '#222',
            color: '#fff',
            border: '2px solid #444'
          }}
        />
      </div>

      {file && (
        <div style={{ 
          margin: '20px 0', 
          backgroundColor: '#111', 
          padding: '15px', 
          border: '2px solid #333' 
        }}>
          <h3 style={{ color: '#0af' }}>📁 ARQUIVO DETECTADO:</h3>
          <p><strong>Nome:</strong> {file.name}</p>
          <p><strong>Tamanho:</strong> {(file.size/1024/1024).toFixed(2)} MB</p>
          <p><strong>Tipo MIME:</strong> {file.type || '❌ VAZIO (PROBLEMA iPhone)'}</p>
        </div>
      )}

      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={uploadDirect}
          disabled={!file || uploading}
          style={{ 
            padding: '15px 30px', 
            fontSize: '18px', 
            backgroundColor: uploading ? '#666' : '#0a5',
            color: 'white',
            border: 'none',
            marginRight: '10px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? `🔄 ${progress}%` : '🚀 TESTE DIRETO'}
        </button>

        <button 
          onClick={uploadViaAPI}
          disabled={!file || uploading}
          style={{ 
            padding: '15px 30px', 
            fontSize: '18px', 
            backgroundColor: uploading ? '#666' : '#a50',
            color: 'white',
            border: 'none',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          🔄 TESTE VIA API
        </button>
      </div>

      {result && (
        <div style={{ 
          margin: '20px 0', 
          padding: '15px', 
          backgroundColor: result.includes('SUCESSO') ? '#052' : '#520',
          border: '2px solid ' + (result.includes('SUCESSO') ? '#0a5' : '#a50'),
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          <h3>🎯 RESULTADO FINAL:</h3>
          <p>{result}</p>
        </div>
      )}

      <div style={{ 
        margin: '20px 0', 
        backgroundColor: '#111', 
        padding: '20px',
        border: '2px solid #333',
        maxHeight: '400px',
        overflowY: 'scroll'
      }}>
        <h3 style={{ color: '#0af' }}>📊 LOGS EM TEMPO REAL:</h3>
        <p style={{ color: '#f84', fontSize: '16px', fontWeight: 'bold' }}>🚨 TODOS OS ERROS APARECEM EM ALERT NO iPhone! 🚨</p>
        {logs.length === 0 ? (
          <p style={{ color: '#777' }}>Selecione um arquivo para ver logs...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ 
              margin: '5px 0', 
              padding: '5px',
              backgroundColor: log.includes('❌') ? '#300' : log.includes('✅') ? '#030' : '#001'
            }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div style={{ 
        margin: '40px 0', 
        padding: '20px', 
        backgroundColor: '#001122',
        border: '2px solid #0066aa'
      }}>
        <h3 style={{ color: '#0af' }}>📋 INSTRUÇÕES iPhone:</h3>
        <p>1. Selecione vídeo grande do iPhone (300MB+)</p>
        <p>2. Veja se o TIPO MIME aparece ou está vazio</p>
        <p>3. Clique "🚀 TESTE DIRETO" primeiro</p>
        <p>4. Se falhar, tente "🔄 TESTE VIA API"</p>
        <p>5. Todos os logs aparecem em TEMPO REAL na tela</p>
        <p style={{ color: '#f84' }}><strong>SEM PRECISAR DO CONSOLE!</strong></p>
      </div>
    </div>
  )
}
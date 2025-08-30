'use client'

import { useState } from 'react'
import { useTUSUpload } from '@/hooks/use-tus-upload'
import { supabase } from '@/lib/supabase'

export default function TestTUSPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])
  
  const { uploadFile, uploading, progress, error } = useTUSUpload()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [logMessage, ...prev])
    
    // ALERT para erros críticos
    if (message.includes('❌') || message.includes('ERRO')) {
      alert(`🚨 ${message}`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult('')
      setLogs([])
      addLog(`📁 ARQUIVO: ${selectedFile.name}`)
      addLog(`📏 TAMANHO: ${(selectedFile.size/1024/1024).toFixed(2)}MB`)
      addLog(`🎭 TIPO: ${selectedFile.type || 'DETECTANDO...'}`)
      
      if (!selectedFile.type) {
        const ext = selectedFile.name.split('.').pop()?.toLowerCase()
        addLog(`🔍 EXTENSÃO: ${ext}`)
        if (ext === 'mov') {
          addLog('✅ TIPO INFERIDO: video/quicktime')
        } else if (ext === 'mp4') {
          addLog('✅ TIPO INFERIDO: video/mp4')
        }
      }
    }
  }

  const handleTUSUpload = async () => {
    if (!file) {
      alert('❌ SELECIONE UM ARQUIVO!')
      return
    }

    // Verificar se tem sessão
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      addLog('❌ SEM SESSÃO - FAZENDO LOGIN ANÔNIMO...')
      
      // Tentar sign in anônimo
      const { error: signInError } = await supabase.auth.signInAnonymously()
      if (signInError) {
        addLog(`❌ ERRO LOGIN: ${signInError.message}`)
        alert(`Login falhou: ${signInError.message}`)
        return
      }
      addLog('✅ LOGIN ANÔNIMO OK')
    } else {
      addLog('✅ SESSÃO ATIVA')
    }

    addLog('🚀 INICIANDO TUS RESUMABLE UPLOAD...')
    addLog('📦 CHUNKS DE 6MB - PROTOCOLO TUS')
    
    try {
      // Nome único para arquivo
      const timestamp = Date.now()
      const ext = file.name.split('.').pop() || 'mov'
      const fileName = `tus-test/${timestamp}.${ext}`
      
      addLog(`📂 CAMINHO: ${fileName}`)

      const uploadResult = await uploadFile({
        bucketName: 'media',
        fileName: fileName,
        file: file,
        onProgress: (prog) => {
          addLog(`📊 PROGRESSO: ${prog}%`)
        },
        onError: (err) => {
          addLog(`❌ TUS ERRO: ${err.message}`)
        },
        onSuccess: (res) => {
          addLog(`✅ TUS SUCESSO: ${res.url}`)
        }
      })

      setResult(`✅ UPLOAD TUS FUNCIONOU!\n\nURL: ${uploadResult.url}`)
      addLog('🎉 TESTE TUS COMPLETO COM SUCESSO!')
      alert(`🎉 TUS FUNCIONOU!\n\nArquivo de ${(file.size/1024/1024).toFixed(2)}MB foi enviado com sucesso!`)

    } catch (error: any) {
      const errorMsg = `❌ FALHA TUS: ${error.message}`
      addLog(errorMsg)
      setResult(errorMsg)
      alert(`🚨 TUS FALHOU!\n\n${error.message}\n\nStack: ${error.stack || 'N/A'}`)
    }
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#000',
      color: '#0f0',
      fontFamily: 'monospace',
      minHeight: '100vh',
      fontSize: '16px'
    }}>
      <h1 style={{ color: '#f84', fontSize: '32px' }}>🔥 TESTE TUS RESUMABLE UPLOAD</h1>
      <p style={{ color: '#0af', fontSize: '18px' }}>Solução oficial Supabase para arquivos grandes iPhone</p>
      
      {/* STATUS PRINCIPAL */}
      <div style={{
        margin: '20px 0',
        padding: '20px',
        backgroundColor: uploading ? '#440' : '#111',
        border: `3px solid ${uploading ? '#fa0' : '#333'}`,
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        {uploading ? (
          <>
            <div style={{ color: '#fa0' }}>🔄 UPLOAD TUS ATIVO</div>
            <div style={{ color: '#fff', fontSize: '32px', margin: '10px 0' }}>
              {progress}%
            </div>
          </>
        ) : (
          <div style={{ color: '#0af' }}>⚡ TUS PRONTO PARA TESTE</div>
        )}
      </div>

      {/* FILE INPUT */}
      <input
        type="file"
        onChange={handleFileChange}
        accept="video/*"
        disabled={uploading}
        style={{
          padding: '15px',
          fontSize: '18px',
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
          fontSize: '18px'
        }}>
          <h3 style={{ color: '#0af' }}>📁 ARQUIVO PARA TUS:</h3>
          <p><strong>Nome:</strong> {file.name}</p>
          <p><strong>Tamanho:</strong> {(file.size/1024/1024).toFixed(2)} MB</p>
          <p><strong>Tipo:</strong> {file.type || '❌ VAZIO (será detectado por extensão)'}</p>
          {file.size > 6*1024*1024 && (
            <p style={{ color: '#0f0', fontWeight: 'bold' }}>✅ ARQUIVO &gt;6MB - PERFEITO PARA TUS!</p>
          )}
        </div>
      )}

      {/* BOTÃO TUS */}
      <button
        onClick={handleTUSUpload}
        disabled={!file || uploading}
        style={{
          padding: '25px 50px',
          fontSize: '24px',
          backgroundColor: uploading ? '#666' : '#d87093',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          width: '100%',
          marginTop: '20px'
        }}
      >
        {uploading ? `🔄 TUS UPLOADING ${progress}%` : '🚀 TESTE TUS UPLOAD'}
      </button>

      {/* RESULTADO */}
      {result && (
        <div style={{
          margin: '20px 0',
          padding: '20px',
          backgroundColor: result.includes('✅') ? '#1a4d1a' : '#4d1a1a',
          border: `2px solid ${result.includes('✅') ? '#0f0' : '#f00'}`,
          borderRadius: '8px',
          fontSize: '18px',
          whiteSpace: 'pre-wrap'
        }}>
          <h3>🎯 RESULTADO TUS:</h3>
          <p>{result}</p>
        </div>
      )}

      {/* LOGS EM TEMPO REAL */}
      <div style={{
        margin: '20px 0',
        backgroundColor: '#111',
        padding: '20px',
        border: '2px solid #333',
        maxHeight: '300px',
        overflowY: 'scroll'
      }}>
        <h3 style={{ color: '#0af' }}>📊 LOGS TUS:</h3>
        <p style={{ color: '#f84' }}>🚨 Erros aparecem em ALERT! 🚨</p>
        {logs.length === 0 ? (
          <p style={{ color: '#777' }}>Logs aparecerão aqui...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{
              margin: '5px 0',
              padding: '8px',
              fontSize: '14px',
              backgroundColor: log.includes('❌') ? '#500' : log.includes('✅') ? '#050' : '#001',
              border: log.includes('❌') ? '1px solid #f00' : log.includes('✅') ? '1px solid #0f0' : '1px solid #333'
            }}>
              {log}
            </div>
          ))
        )}
      </div>

      {/* EXPLICAÇÃO TUS */}
      <div style={{
        margin: '40px 0',
        padding: '20px',
        backgroundColor: '#001122',
        border: '2px solid #0066aa',
        fontSize: '16px'
      }}>
        <h3 style={{ color: '#0af' }}>🔬 PROTOCOLO TUS:</h3>
        <p>✅ <strong>Chunks de 6MB</strong> - arquivos são divididos</p>
        <p>✅ <strong>Resumable</strong> - continua de onde parou</p>
        <p>✅ <strong>Retry automático</strong> - tenta novamente se falhar</p>
        <p>✅ <strong>Endpoint otimizado</strong> - máxima performance</p>
        <p>✅ <strong>Suporte até 50GB</strong> - sem limite prático</p>
        <p style={{ color: '#f84' }}>🎯 <strong>SOLUÇÃO OFICIAL</strong> para arquivos grandes iPhone!</p>
      </div>
    </div>
  )
}
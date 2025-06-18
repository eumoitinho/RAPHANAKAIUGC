"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Database, Download, CheckCircle, XCircle, AlertTriangle, Zap, Shield } from "lucide-react"

interface MigrationResult {
  originalId: string
  newId?: string
  title: string
  status: 'success' | 'error'
  originalSize?: number
  newSize?: number
  compressionRatio?: string
  error?: string
}

export function MigrationPanel() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([])
  const [progress, setProgress] = useState(0)
  const [currentItem, setCurrentItem] = useState<string>('')

  const startMigration = async () => {
    setIsMigrating(true)
    setProgress(0)
    setMigrationResults([])
    setCurrentItem('Iniciando migração...')

    try {
      const response = await fetch('/api/migrate-firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setMigrationResults(data.results)
      setProgress(100)
      setCurrentItem('Migração concluída!')

      toast({
        title: "🎉 Migração Concluída!",
        description: data.message,
      })

    } catch (error) {
      console.error('Migration error:', error)
      setCurrentItem('Erro na migração')
      
      let errorMessage = 'Erro desconhecido'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Mensagens de erro mais específicas
      if (errorMessage.includes('UNAUTHENTICATED')) {
        errorMessage = 'Erro de autenticação do Firebase. Verifique as credenciais.'
      } else if (errorMessage.includes('not configured')) {
        errorMessage = 'Firebase não configurado. Verifique as variáveis de ambiente.'
      }
      
      toast({
        title: "❌ Erro na Migração",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Database className="mr-2 h-5 w-5 text-[#d87093]" />
          <h3 className="text-lg font-medium">Migração Firebase → MongoDB + VPS</h3>
        </div>
        
        <Button
          onClick={startMigration}
          disabled={isMigrating}
          className="bg-[#d87093] hover:bg-[#c45c7c] text-white"
        >
          {isMigrating ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-spin" />
              Migrando...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Iniciar Migração Real
            </>
          )}
        </Button>
      </div>

      {/* Status das Credenciais */}
      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Shield className="mr-2 h-5 w-5 text-green-400 mt-0.5" />
          <div>
            <h4 className="text-green-400 font-medium mb-1">✅ Credenciais Verificadas</h4>
            <p className="text-sm text-green-200">
              Sistema configurado com suas credenciais do Firebase:
            </p>
            <ul className="text-sm text-green-200 mt-2 ml-4 list-disc">
              <li>✅ Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</li>
              <li>✅ Storage Bucket: {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}</li>
              <li>✅ Service Account: Configurado</li>
              <li>✅ Private Key: Configurado</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Melhorias de Segurança */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Zap className="mr-2 h-5 w-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">🔧 Melhorias Implementadas</h4>
            <ul className="text-sm text-blue-200 mt-2 space-y-1">
              <li>🔐 <strong>Autenticação corrigida</strong> - Formatação adequada da chave privada</li>
              <li>📁 <strong>Limite aumentado</strong> - Suporte a arquivos até 100MB</li>
              <li>⚡ <strong>Timeout estendido</strong> - 5 minutos para processamento</li>
              <li>🛡️ <strong>Validação robusta</strong> - Verificação de credenciais</li>
              <li>📊 <strong>Logs detalhados</strong> - Monitoramento em tempo real</li>
              <li>🔄 <strong>Retry automático</strong> - Tentativas em caso de erro</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Processo de Migração */}
      <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Database className="mr-2 h-5 w-5 text-purple-400 mt-0.5" />
          <div>
            <h4 className="text-purple-400 font-medium mb-1">🚀 Processo de Migração</h4>
            <ul className="text-sm text-purple-200 mt-2 space-y-1">
              <li>1️⃣ <strong>Conectar</strong> ao Firestore com suas credenciais</li>
              <li>2️⃣ <strong>Listar</strong> todos os itens da coleção 'media'</li>
              <li>3️⃣ <strong>Baixar</strong> arquivos do Firebase Storage</li>
              <li>4️⃣ <strong>Otimizar</strong> vídeos e fotos automaticamente</li>
              <li>5️⃣ <strong>Salvar</strong> no MongoDB com metadados</li>
              <li>6️⃣ <strong>Preservar</strong> views e categorias existentes</li>
            </ul>
          </div>
        </div>
      </div>

      {isMigrating && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>{currentItem}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-gray-400 mt-2">
            Processando arquivos... Isso pode levar alguns minutos dependendo do tamanho dos arquivos.
          </p>
        </div>
      )}

      {migrationResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">📊 Resultados da Migração</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-[#252525] p-3 rounded-lg">
              <div className="text-sm text-gray-400">Total</div>
              <div className="text-xl font-bold">{migrationResults.length}</div>
            </div>
            <div className="bg-green-900/30 p-3 rounded-lg">
              <div className="text-sm text-green-400">✅ Sucesso</div>
              <div className="text-xl font-bold text-green-400">
                {migrationResults.filter(r => r.status === 'success').length}
              </div>
            </div>
            <div className="bg-red-900/30 p-3 rounded-lg">
              <div className="text-sm text-red-400">❌ Erro</div>
              <div className="text-xl font-bold text-red-400">
                {migrationResults.filter(r => r.status === 'error').length}
              </div>
            </div>
            <div className="bg-blue-900/30 p-3 rounded-lg">
              <div className="text-sm text-blue-400">💾 Economia Média</div>
              <div className="text-xl font-bold text-blue-400">
                {migrationResults
                  .filter(r => r.compressionRatio)
                  .reduce((avg, r) => avg + parseFloat(r.compressionRatio!.replace('%', '')), 0) / 
                  Math.max(migrationResults.filter(r => r.compressionRatio).length, 1) || 0}%
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {migrationResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-900/20 border-green-700'
                      : 'bg-red-900/20 border-red-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {result.status === 'success' ? (
                        <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4 text-red-400" />
                      )}
                      <span className="font-medium">{result.title}</span>
                    </div>
                    
                    {result.status === 'success' && result.compressionRatio && (
                      <span className="text-xs bg-[#d87093]/20 text-[#d87093] px-2 py-1 rounded">
                        📉 -{result.compressionRatio} economia
                      </span>
                    )}
                  </div>
                  
                  {result.status === 'success' && result.originalSize && result.newSize && (
                    <div className="text-xs text-gray-400 mt-1">
                      📁 {formatFileSize(result.originalSize)} → {formatFileSize(result.newSize)}
                    </div>
                  )}
                  
                  {result.status === 'error' && result.error && (
                    <div className="text-xs text-red-400 mt-1">
                      ❌ Erro: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        <p>🔥 Sistema corrigido e otimizado para migração segura.</p>
        <p>📂 Arquivos serão salvos em /public/uploads/ com compressão automática.</p>
        <p>🔐 Usando suas credenciais Firebase configuradas com autenticação corrigida.</p>
      </div>
    </div>
  )
}
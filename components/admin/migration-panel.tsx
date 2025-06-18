"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Database, Download, CheckCircle, XCircle, AlertTriangle, Zap } from "lucide-react"

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

  const startMigration = async () => {
    setIsMigrating(true)
    setProgress(0)
    setMigrationResults([])

    try {
      const response = await fetch('/api/migrate-firebase', {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Migration failed')
      }

      const data = await response.json()
      setMigrationResults(data.results)
      setProgress(100)

      toast({
        title: "🎉 Migração Concluída!",
        description: data.message,
      })

    } catch (error) {
      console.error('Migration error:', error)
      toast({
        title: "❌ Erro na Migração",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
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
          <CheckCircle className="mr-2 h-5 w-5 text-green-400 mt-0.5" />
          <div>
            <h4 className="text-green-400 font-medium mb-1">✅ Credenciais Configuradas</h4>
            <p className="text-sm text-green-200">
              Suas variáveis do Firebase estão prontas para migração:
            </p>
            <ul className="text-sm text-green-200 mt-2 ml-4 list-disc">
              <li>✅ Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</li>
              <li>✅ Storage Bucket: {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}</li>
              <li>✅ Client Email: Configurado</li>
              <li>✅ Private Key: Configurado</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Processo de Migração */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Zap className="mr-2 h-5 w-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">🚀 O que a Migração Fará</h4>
            <ul className="text-sm text-blue-200 mt-2 space-y-1">
              <li>📥 <strong>Baixar</strong> todos os arquivos do Firebase Storage</li>
              <li>🎥 <strong>Otimizar vídeos</strong> (compressão, resolução máx 1920x1080)</li>
              <li>🖼️ <strong>Otimizar fotos</strong> (conversão WebP, qualidade 85%)</li>
              <li>💾 <strong>Salvar no MongoDB</strong> com metadados completos</li>
              <li>👀 <strong>Preservar views</strong> e categorias existentes</li>
              <li>📊 <strong>Gerar relatório</strong> de economia de espaço</li>
            </ul>
          </div>
        </div>
      </div>

      {isMigrating && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso da migração</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-gray-400 mt-2">
            Baixando e otimizando arquivos... Isso pode levar alguns minutos.
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
              <div className="text-sm text-blue-400">💾 Economia</div>
              <div className="text-xl font-bold text-blue-400">
                {migrationResults
                  .filter(r => r.compressionRatio)
                  .reduce((avg, r) => avg + parseFloat(r.compressionRatio!.replace('%', '')), 0) / 
                  migrationResults.filter(r => r.compressionRatio).length || 0}%
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
        <p>🔥 Migração real usando suas credenciais do Firebase configuradas.</p>
        <p>📂 Arquivos serão salvos em /public/uploads/ e metadados no MongoDB.</p>
      </div>
    </div>
  )
}
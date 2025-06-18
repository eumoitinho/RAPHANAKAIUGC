"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Database, Download, CheckCircle, XCircle } from "lucide-react"

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
        throw new Error('Migration failed')
      }

      const data = await response.json()
      setMigrationResults(data.results)
      setProgress(100)

      toast({
        title: "Migração Concluída",
        description: data.message,
      })

    } catch (error) {
      console.error('Migration error:', error)
      toast({
        title: "Erro na Migração",
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
    <div className="bg-[#1e1e1e] rounded-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Database className="mr-2 h-5 w-5 text-[#d87093]" />
          <h3 className="text-lg font-medium">Migração Firebase → MongoDB</h3>
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
              <Download className="mr-2 h-4 w-4" />
              Iniciar Migração
            </>
          )}
        </Button>
      </div>

      {isMigrating && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso da migração</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {migrationResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Resultados da Migração</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-[#252525] p-3 rounded-lg">
              <div className="text-sm text-gray-400">Total</div>
              <div className="text-xl font-bold">{migrationResults.length}</div>
            </div>
            <div className="bg-green-900/30 p-3 rounded-lg">
              <div className="text-sm text-green-400">Sucesso</div>
              <div className="text-xl font-bold text-green-400">
                {migrationResults.filter(r => r.status === 'success').length}
              </div>
            </div>
            <div className="bg-red-900/30 p-3 rounded-lg">
              <div className="text-sm text-red-400">Erro</div>
              <div className="text-xl font-bold text-red-400">
                {migrationResults.filter(r => r.status === 'error').length}
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
                        -{result.compressionRatio} compressão
                      </span>
                    )}
                  </div>
                  
                  {result.status === 'success' && result.originalSize && result.newSize && (
                    <div className="text-xs text-gray-400 mt-1">
                      {formatFileSize(result.originalSize)} → {formatFileSize(result.newSize)}
                    </div>
                  )}
                  
                  {result.status === 'error' && result.error && (
                    <div className="text-xs text-red-400 mt-1">
                      Erro: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        <p>Esta ferramenta migra todos os arquivos do Firebase Storage para o sistema local da VPS,</p>
        <p>otimizando vídeos e imagens durante o processo para reduzir o tamanho dos arquivos.</p>
      </div>
    </div>
  )
}
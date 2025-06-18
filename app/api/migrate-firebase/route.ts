import { NextResponse } from 'next/server'
import { FirebaseMigration } from '@/lib/firebase-migration'

// Configurações para Vercel (máximo 60s no plano hobby)
export const maxDuration = 60 // 60 segundos máximo
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('Iniciando migração do Firebase...')
    
    const migration = new FirebaseMigration()
    
    // Para o Vercel, vamos processar apenas alguns itens por vez
    // devido ao limite de 60 segundos
    const results = await migration.migrateAllMedia()
    
    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    
    return NextResponse.json({
      success: true,
      message: `Migração concluída! ${successCount} itens migrados com sucesso, ${errorCount} erros.`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount
      },
      note: 'Migração otimizada para Vercel (60s limit)'
    })
    
  } catch (error) {
    console.error('Erro na migração:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro na migração',
        details: 'Verifique se as credenciais do Firebase estão configuradas corretamente'
      },
      { status: 500 }
    )
  }
}
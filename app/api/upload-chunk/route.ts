import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase'
import { createMedia } from '@/lib/supabase-db'
import { v4 as uuidv4 } from 'uuid'

// UPLOAD EM CHUNKS PARA IPHONE
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const chunk = formData.get('chunk') as Blob
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const fileName = formData.get('fileName') as string
    const uploadId = formData.get('uploadId') as string
    const fileType = formData.get('fileType') as string
    
    console.log(`📱 iPhone chunk ${chunkIndex + 1}/${totalChunks} para ${fileName}`)
    
    // Armazenar chunks temporariamente
    const tempPath = `temp/${uploadId}/chunk_${chunkIndex}`
    
    const { data: chunkData, error: chunkError } = await supabaseAdmin.storage
      .from('temp')
      .upload(tempPath, chunk, {
        upsert: true,
        contentType: 'application/octet-stream'
      })
    
    if (chunkError) {
      console.error('Erro salvando chunk:', chunkError)
      return NextResponse.json({ error: 'Falha ao salvar chunk' }, { status: 500 })
    }
    
    // Se for o último chunk, juntar todos
    if (chunkIndex === totalChunks - 1) {
      console.log('📱 Último chunk recebido, juntando arquivo...')
      
      // Baixar e juntar todos os chunks
      const chunks: Uint8Array[] = []
      
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = `temp/${uploadId}/chunk_${i}`
        const { data, error } = await supabaseAdmin.storage
          .from('temp')
          .download(chunkPath)
        
        if (error || !data) {
          console.error(`Erro baixando chunk ${i}:`, error)
          continue
        }
        
        const arrayBuffer = await data.arrayBuffer()
        chunks.push(new Uint8Array(arrayBuffer))
      }
      
      // Juntar chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      const completeFile = new Uint8Array(totalLength)
      let offset = 0
      
      for (const chunk of chunks) {
        completeFile.set(chunk, offset)
        offset += chunk.length
      }
      
      // Salvar arquivo completo
      const date = new Date()
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const uniqueFileName = `${uuidv4()}.${fileName.split('.').pop()}`
      const finalPath = `${year}/${month}/${uniqueFileName}`
      
      const isVideo = fileType === 'video'
      const bucket = isVideo ? STORAGE_BUCKETS.VIDEOS : STORAGE_BUCKETS.IMAGES
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(finalPath, completeFile.buffer, {
          contentType: isVideo ? 'video/mp4' : 'image/jpeg',
          upsert: true
        })
      
      if (uploadError) {
        console.error('Erro no upload final:', uploadError)
        return NextResponse.json({ error: 'Falha no upload final' }, { status: 500 })
      }
      
      // Limpar chunks temporários
      for (let i = 0; i < totalChunks; i++) {
        await supabaseAdmin.storage
          .from('temp')
          .remove([`temp/${uploadId}/chunk_${i}`])
      }
      
      // Obter URL pública
      const { data: urlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(finalPath)
      
      return NextResponse.json({
        success: true,
        complete: true,
        fileUrl: urlData.publicUrl,
        path: finalPath
      })
    }
    
    return NextResponse.json({
      success: true,
      complete: false,
      chunkIndex
    })
    
  } catch (error) {
    console.error('❌ Erro no chunk upload:', error)
    return NextResponse.json(
      { error: 'Erro no upload do chunk' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minuto por chunk
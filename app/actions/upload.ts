"use server"

export async function uploadFile(formData: FormData) {
  try {
    // Usa a API route que redireciona para a VPS
    const response = await fetch('/api/upload-media', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro no upload')
    }

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Upload realizado:', result.item)
      return result.item
    }
  } catch (error) {
    console.error('❌ Erro no upload:', error)
    throw error
  }
}
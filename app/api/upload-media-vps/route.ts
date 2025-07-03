import { type NextRequest, NextResponse } from "next/server"

const UPLOADS_API_URL = process.env.UPLOADS_API_URL || "https://uploads.catalisti.com.br"

// Configurações para Vercel - limites mais restritivos
export const maxDuration = 60
export const dynamic = "force_dynamic"

// Limites da Vercel (mais restritivos que a VPS)
const VERCEL_MAX_SIZE = 4.5 * 1024 * 1024 // 4.5MB para ser seguro (Vercel Hobby tem limite de 5MB)
const VPS_MAX_SIZE = 100 * 1024 * 1024 // 100MB para VPS

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Iniciando upload via Vercel para VPS:", UPLOADS_API_URL)

    // Verificar Content-Length antes de processar
    const contentLength = request.headers.get("content-length")
    if (contentLength) {
      const size = Number.parseInt(contentLength)
      console.log("Tamanho da requisição:", (size / 1024 / 1024).toFixed(2), "MB")

      if (size > VERCEL_MAX_SIZE) {
        return NextResponse.json(
          {
            error: "Arquivo muito grande para upload via Vercel",
            maxSize: "4.5MB",
            currentSize: `${(size / 1024 / 1024).toFixed(2)}MB`,
            suggestion: "Use upload direto na VPS ou reduza o tamanho do arquivo",
            directUploadUrl: UPLOADS_API_URL,
          },
          { status: 413 },
        )
      }
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error("❌ Erro ao processar FormData:", error)
      return NextResponse.json(
        {
          error: "Erro ao processar dados do formulário",
          details: "Arquivo pode ser muito grande para a Vercel processar",
        },
        { status: 413 },
      )
    }

    // Verificar tamanho do arquivo
    const file = formData.get("file") as File
    if (file) {
      console.log("Arquivo:", file.name, "Tamanho:", (file.size / 1024 / 1024).toFixed(2), "MB")

      if (file.size > VERCEL_MAX_SIZE) {
        return NextResponse.json(
          {
            error: "Arquivo muito grande para upload via Vercel",
            maxSize: "4.5MB",
            currentSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            suggestion: "Use upload direto na VPS ou comprima o arquivo",
            directUploadUrl: UPLOADS_API_URL,
          },
          { status: 413 },
        )
      }

      if (file.size > VPS_MAX_SIZE) {
        return NextResponse.json(
          {
            error: "Arquivo muito grande para a VPS processar",
            maxSize: "100MB",
            currentSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          },
          { status: 413 },
        )
      }
    }

    // Fazer upload para VPS com timeout
    console.log("🚀 Enviando para VPS...")
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 50000) // 50s timeout

    let response: Response
    try {
      response = await fetch(`${UPLOADS_API_URL}/upload`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          // Não definir Content-Type, deixar o browser definir com boundary
        },
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error("❌ Erro na requisição para VPS:", fetchError)

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          return NextResponse.json(
            { error: "Timeout no upload. Tente um arquivo menor ou use upload direto." },
            { status: 408 },
          )
        }

        if (fetchError.message.includes("fetch")) {
          return NextResponse.json(
            {
              error: "Erro de conexão com o servidor de uploads",
              suggestion: "Verifique se a VPS está online",
              vpsUrl: UPLOADS_API_URL,
            },
            { status: 503 },
          )
        }
      }

      throw fetchError
    }

    clearTimeout(timeoutId)
    console.log("Status da VPS:", response.status)

    if (!response.ok) {
      let errorMessage = `VPS Error: ${response.status}`
      let errorDetails = ""

      try {
        const errorText = await response.text()
        console.error("❌ Erro da VPS:", errorText)

        // Tentar parsear como JSON primeiro
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
          errorDetails = errorJson.details || ""
        } catch {
          // Se não for JSON, usar o texto diretamente
          errorMessage = errorText || errorMessage
        }
      } catch (e) {
        console.error("❌ Erro ao ler resposta da VPS")
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
          vpsStatus: response.status,
        },
        { status: response.status },
      )
    }

    let result
    try {
      result = await response.json()
    } catch (jsonError) {
      console.error("❌ Erro ao parsear resposta JSON da VPS:", jsonError)
      return NextResponse.json({ error: "Resposta inválida da VPS" }, { status: 502 })
    }

    console.log("✅ Upload concluído na VPS:", result.item?.fileName)

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Erro geral no upload:", error)

    // Verificar tipos específicos de erro
    if (error instanceof Error) {
      if (
        error.message.includes("PayloadTooLargeError") ||
        error.message.includes("Body exceeded") ||
        error.message.includes("413") ||
        error.message.includes("entity too large")
      ) {
        return NextResponse.json(
          {
            error: "Arquivo muito grande para a Vercel processar",
            maxSize: "4.5MB",
            suggestion: "Use upload direto na VPS ou comprima o arquivo",
            directUploadUrl: UPLOADS_API_URL,
          },
          { status: 413 },
        )
      }

      if (error.message.includes("timeout") || error.message.includes("TIMEOUT")) {
        return NextResponse.json(
          {
            error: "Timeout no upload",
            suggestion: "Tente um arquivo menor ou use upload direto",
          },
          { status: 408 },
        )
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
        details: "Erro interno no processamento do upload",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    console.log("📋 Buscando arquivos da VPS:", UPLOADS_API_URL)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout para listagem

    const response = await fetch(`${UPLOADS_API_URL}/files`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`VPS Error: ${response.status}`)
    }

    const result = await response.json()
    console.log(`✅ ${result.files?.length || 0} arquivos encontrados`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Erro ao buscar arquivos:", error)

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Timeout ao buscar arquivos da VPS" }, { status: 408 })
    }

    return NextResponse.json(
      {
        error: "Failed to fetch files from VPS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")
    const fileType = searchParams.get("fileType")

    if (!filename || !fileType) {
      return NextResponse.json({ error: "Filename and fileType are required" }, { status: 400 })
    }

    console.log("🗑️ Deletando arquivo da VPS:", filename)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(`${UPLOADS_API_URL}/delete/${filename}?fileType=${fileType}`, {
      method: "DELETE",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`VPS Error: ${response.status}`)
    }

    const result = await response.json()
    console.log("✅ Arquivo deletado da VPS")

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Erro ao deletar arquivo:", error)

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Timeout ao deletar arquivo" }, { status: 408 })
    }

    return NextResponse.json(
      {
        error: "Failed to delete file from VPS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

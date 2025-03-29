"use client"

import { useState, useEffect } from "react"
import { app } from "@/lib/firebase"
import { Button } from "@/components/ui/button"

export function FirebaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [errorMessage, setErrorMessage] = useState<string>("")

  const checkConnection = async () => {
    setStatus("checking")
    try {
      // Simple check to see if Firebase is initialized
      if (app) {
        setStatus("connected")
      } else {
        throw new Error("Firebase app is not initialized")
      }
    } catch (error) {
      console.error("Firebase connection error:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : String(error))
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="p-4 bg-[#1e1e1e] rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              status === "checking" ? "bg-yellow-500" : status === "connected" ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <h3 className="text-sm font-medium">
            Firebase Status:{" "}
            <span
              className={
                status === "checking" ? "text-yellow-500" : status === "connected" ? "text-green-500" : "text-red-500"
              }
            >
              {status === "checking" ? "Verificando..." : status === "connected" ? "Conectado" : "Erro"}
            </span>
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkConnection}
          className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
        >
          Verificar Conexão
        </Button>
      </div>
      {status === "error" && (
        <div className="mt-2 text-xs text-red-400">
          <p>Erro: {errorMessage}</p>
          <p className="mt-1">
            Verifique se as variáveis de ambiente estão configuradas corretamente e se o Firebase está inicializado.
          </p>
        </div>
      )}
      {status === "connected" && (
        <div className="mt-2 text-xs text-green-400">
          <p>Firebase inicializado com sucesso!</p>
          <p className="mt-1">Projeto: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
        </div>
      )}
    </div>
  )
}


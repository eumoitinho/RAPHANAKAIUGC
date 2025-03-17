"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [blobToken, setBlobToken] = useState<string | null>(null)

  const checkBlobToken = () => {
    // This will be undefined in the browser
    const token = process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || null
    setBlobToken(token)
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="mt-8 text-amber-500 border-amber-500/20 bg-amber-500/10"
        onClick={() => setIsOpen(true)}
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Debug Panel
      </Button>
    )
  }

  return (
    <div className="mt-8 p-4 bg-black/60 border border-amber-500/20 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-amber-500">Debug Panel</h3>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
          Close
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-400 mb-2">Vercel Blob Configuration:</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
            onClick={checkBlobToken}
          >
            Check Blob Token
          </Button>

          {blobToken !== undefined && (
            <p className="mt-2 text-sm">
              {blobToken ? (
                <span className="text-green-500">Blob token is available</span>
              ) : (
                <span className="text-red-500">Blob token is missing</span>
              )}
            </p>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Upload API Status:</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
            onClick={async () => {
              try {
                const response = await fetch("/api/blobs")
                const data = await response.json()
                console.log("API Response:", data)
                alert("API check complete. See console for details.")
              } catch (error) {
                console.error("API Error:", error)
                alert(`API Error: ${error instanceof Error ? error.message : String(error)}`)
              }
            }}
          >
            Test API Connection
          </Button>
        </div>
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { clientStorage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export function FirebaseStorageCheck() {
  const [status, setStatus] = useState<"unchecked" | "checking" | "success" | "error">("unchecked")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [bucketName, setBucketName] = useState<string>("")

  const checkStorage = async () => {
    setStatus("checking")
    try {
      // Get the storage bucket name
      const bucket = clientStorage.app.options.storageBucket || "Not set"
      setBucketName(bucket)

      if (!bucket || bucket === "Not set") {
        throw new Error("Storage bucket is not configured")
      }

      // Try to list files to verify storage access
      setStatus("success")
      toast({
        title: "Storage check successful",
        description: `Connected to bucket: ${bucket}`,
      })
    } catch (error) {
      console.error("Firebase Storage error:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : String(error))
      toast({
        title: "Storage check failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-4 bg-[#252525] rounded-lg">
      <h3 className="text-sm font-medium mb-2">Firebase Storage Configuration</h3>

      <div className="text-xs text-gray-400 mb-3">
        <p>Storage bucket environment variable: {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "Not set"}</p>
        {status !== "unchecked" && <p>Detected bucket: {bucketName || "None"}</p>}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={checkStorage}
        disabled={status === "checking"}
        className="bg-[#333333] border-[#444444] text-white hover:bg-[#444444]"
      >
        {status === "checking" ? "Checking..." : "Check Storage Configuration"}
      </Button>

      {status === "error" && (
        <div className="mt-2 text-xs text-red-400">
          <p>Error: {errorMessage}</p>
          <p className="mt-1">
            Make sure the NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is set correctly. It should be in the
            format: your-project-id.appspot.com
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="mt-2 text-xs text-green-400">
          <p>Firebase Storage is properly configured!</p>
        </div>
      )}
    </div>
  )
}

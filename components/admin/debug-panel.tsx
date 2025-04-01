"use client"

import { useState } from "react"
import { AlertTriangle, Database, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { db, storage } from "@/lib/firebase"
import { collection, getDocs, limit, query } from "firebase/firestore"
import { ref, listAll } from "firebase/storage"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCheckingFirestore, setIsCheckingFirestore] = useState(false)
  const [isCheckingStorage, setIsCheckingStorage] = useState(false)
  const [firestoreStatus, setFirestoreStatus] = useState<"unchecked" | "success" | "error">("unchecked")
  const [storageStatus, setStorageStatus] = useState<"unchecked" | "success" | "error">("unchecked")
  const [firestoreError, setFirestoreError] = useState("")
  const [storageError, setStorageError] = useState("")

  const checkFirestore = async () => {
    setIsCheckingFirestore(true)
    setFirestoreStatus("unchecked")
    setFirestoreError("")

    try {
      // Log the project ID
      const projectId = db.app.options.projectId
      console.log("Firestore Project ID:", projectId)

      if (!projectId) {
        throw new Error("Firestore project ID is not configured")
      }

      // Try to query Firestore to verify access
      const mediaCollection = collection(db, "media")
      const q = query(mediaCollection, limit(1))
      await getDocs(q)

      setFirestoreStatus("success")
      toast({
        title: "Firestore Check",
        description: `Successfully connected to Firestore in project: ${projectId}`,
      })
    } catch (error) {
      console.error("Firestore error:", error)
      setFirestoreStatus("error")
      setFirestoreError(error instanceof Error ? error.message : String(error))
      toast({
        title: "Firestore Check Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setIsCheckingFirestore(false)
    }
  }

  const checkStorage = async () => {
    setIsCheckingStorage(true)
    setStorageStatus("unchecked")
    setStorageError("")

    try {
      // Log the storage bucket
      const bucket = storage.app.options.storageBucket
      console.log("Firebase Storage Bucket:", bucket)

      if (!bucket) {
        throw new Error("Firebase Storage bucket is not configured")
      }

      // Try to list files to verify access
      const rootRef = ref(storage)
      await listAll(rootRef)

      setStorageStatus("success")
      toast({
        title: "Firebase Storage Check",
        description: `Successfully connected to Firebase Storage bucket: ${bucket}`,
      })
    } catch (error) {
      console.error("Firebase Storage error:", error)
      setStorageStatus("error")
      setStorageError(error instanceof Error ? error.message : String(error))
      toast({
        title: "Firebase Storage Check Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setIsCheckingStorage(false)
    }
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
        <div className="p-4 bg-[#252525] rounded-lg">
          <h4 className="text-sm font-medium mb-2">Firestore Database</h4>
          <div className="mb-2">
            <p className="text-xs text-gray-400">Project ID: {db.app.options.projectId || "Not configured"}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-[#333333] border-[#444444] text-white hover:bg-[#444444]"
            onClick={checkFirestore}
            disabled={isCheckingFirestore}
          >
            <Database className="mr-2 h-4 w-4" />
            {isCheckingFirestore ? "Checking..." : "Check Firestore Connection"}
          </Button>

          {firestoreStatus === "success" && (
            <div className="mt-2 text-xs text-green-400">
              <p>Firestore is properly configured and accessible!</p>
            </div>
          )}

          {firestoreStatus === "error" && (
            <div className="mt-2 text-xs text-red-400">
              <p>Error: {firestoreError}</p>
              <p className="mt-1">Make sure the Firebase project is properly configured with Firestore.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#252525] rounded-lg">
          <h4 className="text-sm font-medium mb-2">Firebase Storage</h4>
          <div className="mb-2">
            <p className="text-xs text-gray-400">
              Storage Bucket: {storage.app.options.storageBucket || "Not configured"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-[#333333] border-[#444444] text-white hover:bg-[#444444]"
            onClick={checkStorage}
            disabled={isCheckingStorage}
          >
            <HardDrive className="mr-2 h-4 w-4" />
            {isCheckingStorage ? "Checking..." : "Check Storage Connection"}
          </Button>

          {storageStatus === "success" && (
            <div className="mt-2 text-xs text-green-400">
              <p>Firebase Storage is properly configured and accessible!</p>
            </div>
          )}

          {storageStatus === "error" && (
            <div className="mt-2 text-xs text-red-400">
              <p>Error: {storageError}</p>
              <p className="mt-1">Make sure the Firebase project is properly configured with Storage.</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">API Status:</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
            onClick={async () => {
              try {
                const response = await fetch("/api/media")
                const data = await response.json()
                console.log("API Response:", data)
                toast({
                  title: "API Check",
                  description: `Found ${data.media?.length || 0} media items`,
                })
              } catch (error) {
                console.error("API Error:", error)
                toast({
                  title: "API Error",
                  description: `${error instanceof Error ? error.message : String(error)}`,
                  variant: "destructive",
                })
              }
            }}
          >
            Test Media API
          </Button>
        </div>
      </div>
    </div>
  )
}


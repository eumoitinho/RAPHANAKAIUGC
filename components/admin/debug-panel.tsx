"use client"

import { useState } from "react"
import { AlertTriangle, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingDirs, setIsCreatingDirs] = useState(false)

  const ensureUploadDirectories = async () => {
    setIsCreatingDirs(true)
    try {
      const response = await fetch("/api/local/ensure-uploads-dir")
      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Upload directories created successfully",
        })
      } else {
        throw new Error(data.error || "Failed to create upload directories")
      }
    } catch (error) {
      console.error("Error creating upload directories:", error)
      toast({
        title: "Error",
        description: `Failed to create upload directories: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsCreatingDirs(false)
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
          <h4 className="text-sm font-medium mb-2">Local Storage</h4>
          <Button
            variant="outline"
            size="sm"
            className="bg-[#333333] border-[#444444] text-white hover:bg-[#444444]"
            onClick={ensureUploadDirectories}
            disabled={isCreatingDirs}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            {isCreatingDirs ? "Creating..." : "Create Upload Directories"}
          </Button>
          <p className="mt-2 text-xs text-gray-400">
            This will create the necessary directories for file uploads if they don't exist.
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">API Status:</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
            onClick={async () => {
              try {
                const response = await fetch("/api/local/blobs")
                const data = await response.json()
                console.log("API Response:", data)
                toast({
                  title: "API Check",
                  description: `Found ${data.blobs?.length || 0} files in local storage`,
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
            Test Local Storage API
          </Button>
        </div>
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export function FirebaseAdminTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testFirebaseAdmin = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/firebase-admin-test")
      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Firebase Admin Test",
          description: "Firebase Admin environment variables are properly configured.",
        })
      } else {
        toast({
          title: "Firebase Admin Test",
          description: "Firebase Admin environment variables check failed.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error testing Firebase Admin:", error)
      toast({
        title: "Firebase Admin Test",
        description: `Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 bg-[#252525] rounded-lg mb-4">
      <h3 className="text-sm font-medium mb-2">Firebase Admin Configuration Test</h3>

      <Button
        variant="outline"
        size="sm"
        onClick={testFirebaseAdmin}
        disabled={isLoading}
        className="bg-[#333333] border-[#444444] text-white hover:bg-[#444444] mb-2"
      >
        {isLoading ? "Testing..." : "Test Firebase Admin Setup"}
      </Button>

      {result && (
        <div className="mt-2 text-xs">
          <pre className="bg-[#1e1e1e] p-2 rounded overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div className="mt-2 text-xs text-gray-400">
        <p>This test checks if the Firebase Admin environment variables are properly configured.</p>
      </div>
    </div>
  )
}


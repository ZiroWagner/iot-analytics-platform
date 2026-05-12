"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { handleOAuthCallbackUseCase } from "@/features/auth/application"

const REDIRECT_DELAY_MS = 500

function OAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    const stored = handleOAuthCallbackUseCase(token)
    if (stored) {
      const timeout = setTimeout(() => router.push("/dashboard"), REDIRECT_DELAY_MS)
      return () => clearTimeout(timeout)
    }
    router.push("/login")
  }, [searchParams, router])

  return (
    <Card className="w-full max-w-sm text-center shadow-lg border-primary/20 backdrop-blur-sm bg-card/80">
      <CardHeader>
        <CardTitle>Autenticando...</CardTitle>
        <CardDescription>Validando tus credenciales de acceso.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 justify-center items-center h-8">
          <div
            className="h-3 w-3 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="h-3 w-3 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="h-3 w-3 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function OAuthCallbackPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-background to-background -z-10" />
      <Suspense
        fallback={
          <Card className="w-full max-w-sm text-center">
            <CardHeader>
              <CardTitle>Cargando...</CardTitle>
            </CardHeader>
          </Card>
        }
      >
        <OAuthCallback />
      </Suspense>
    </div>
  )
}

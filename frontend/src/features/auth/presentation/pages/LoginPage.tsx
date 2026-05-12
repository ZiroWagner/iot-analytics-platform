"use client"

import { ParticleNetwork } from "@/components/auth/ParticleNetwork"
import { AuthForm } from "@/components/auth/AuthForm"
import { Globe } from "lucide-react"

export function LoginPage() {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      <div className="relative hidden flex-1 items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 md:flex">
        <ParticleNetwork particleCount={50} />

        <div className="relative z-10 mx-auto max-w-md space-y-6 px-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Globe size={28} />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              IoT Analytics
              <br />
              Platform
            </h1>
            <p className="text-lg text-muted-foreground">
              Monitorea, analiza y optimiza tus dispositivos IoT en tiempo real
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full border border-border/50 bg-card/50 px-4 py-1.5 backdrop-blur-sm">
              Análisis en tiempo real
            </span>
            <span className="rounded-full border border-border/50 bg-card/50 px-4 py-1.5 backdrop-blur-sm">
              Métricas avanzadas
            </span>
            <span className="rounded-full border border-border/50 bg-card/50 px-4 py-1.5 backdrop-blur-sm">
              Gestión de dispositivos
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex w-full flex-col md:w-[480px] md:flex-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-background -z-10 md:hidden" />
        <div className="flex h-full flex-col justify-center border-l border-border/50 bg-background/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}

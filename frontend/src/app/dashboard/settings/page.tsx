"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Shield, Bell, Key, Save } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes del Sistema</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Administra tus preferencias personales, seguridad y notificaciones.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full max-w-4xl">
        <TabsList className="bg-surface-container-low border border-border w-full justify-start h-auto p-1 overflow-x-auto">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-2 px-4">
            <User className="h-4 w-4 mr-2" />
            Perfil de Usuario
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-500 py-2 px-4">
            <Shield className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500 py-2 px-4">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500 py-2 px-4">
            <Key className="h-4 w-4 mr-2" />
            Claves API
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="mt-6">
          <Card className="bg-surface-container-low border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tu nombre y correo electrónico público.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" defaultValue="Usuario IoT" className="bg-surface-container-lowest" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" defaultValue="admin@vortex-iot.com" className="bg-surface-container-lowest" readOnly />
                <p className="text-xs text-muted-foreground">Tu correo electrónico no se puede cambiar desde esta interfaz.</p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Guardando..." : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="mt-6">
          <Card className="bg-surface-container-low border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Contraseña</CardTitle>
              <CardDescription>Asegúrate de usar una contraseña larga y segura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_pwd">Contraseña Actual</Label>
                <Input id="current_pwd" type="password" placeholder="••••••••" className="bg-surface-container-lowest" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_pwd">Nueva Contraseña</Label>
                  <Input id="new_pwd" type="password" placeholder="••••••••" className="bg-surface-container-lowest" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_pwd">Confirmar Contraseña</Label>
                  <Input id="confirm_pwd" type="password" placeholder="••••••••" className="bg-surface-container-lowest" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-4 flex justify-end">
              <Button variant="secondary">Actualizar Contraseña</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="bg-surface-container-low border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Alertas de Sistema</CardTitle>
              <CardDescription>Configura cómo y cuándo deseas recibir alertas críticas de telemetría.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-32 border border-dashed border-border/50 rounded-lg bg-surface-container-lowest">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">El módulo de notificaciones por Email/SMS está en desarrollo.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API TAB */}
        <TabsContent value="api" className="mt-6">
          <Card className="bg-surface-container-low border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Tokens de Acceso</CardTitle>
              <CardDescription>Genera tokens para acceso a la API REST pública.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-32 border border-dashed border-border/50 rounded-lg bg-surface-container-lowest">
              <Key className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">El sistema de Public API Keys estará disponible en la v1.1.</p>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

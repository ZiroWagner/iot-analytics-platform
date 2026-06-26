"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { User, Shield, Bell, Key, Save, AlertTriangle } from "lucide-react"
import { httpAuthRepository, type UserProfile } from "@/features/auth/infrastructure/auth.repository"
import { tokenStorage } from "@/shared/infrastructure/http"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"

const profileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50, "El nombre no puede tener más de 50 caracteres"),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "La confirmación debe tener al menos 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type ProfileInput = z.infer<typeof profileSchema>
type PasswordInput = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile")

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  })

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  useEffect(() => {
    const load = async () => {
      try {
        const data = await httpAuthRepository.getProfile()
        setProfile(data)
        profileForm.setValue("name", data.name || "")
      } catch (err) {
        console.error("Error al cargar perfil:", err)
        toast.error("No se pudo cargar el perfil de usuario")
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onUpdateProfile = async (values: ProfileInput) => {
    try {
      setSavingProfile(true)
      const res = await httpAuthRepository.updateProfile({ name: values.name })
      tokenStorage.set(res.access_token)
      toast.success("Perfil actualizado correctamente")
      const data = await httpAuthRepository.getProfile()
      setProfile(data)
      profileForm.setValue("name", data.name || "")
    } catch (err) {
      console.error("Error al actualizar perfil:", err)
      toast.error("Error al actualizar el perfil")
    } finally {
      setSavingProfile(false)
    }
  }

  const onChangePassword = async (values: PasswordInput) => {
    try {
      setSavingPassword(true)
      const res = await httpAuthRepository.updateProfile({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      tokenStorage.set(res.access_token)
      toast.success("Contraseña actualizada correctamente")
      passwordForm.reset()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar la contraseña"
      toast.error(msg || "La contraseña actual es incorrecta")
    } finally {
      setSavingPassword(false)
    }
  }

  const onDeleteAccount = async () => {
    try {
      setDeleting(true)
      await httpAuthRepository.deleteProfile()
      tokenStorage.clear()
      toast.success("Cuenta eliminada permanentemente")
      router.push("/login")
    } catch (err) {
      console.error("Error al eliminar cuenta:", err)
      toast.error("Error al eliminar la cuenta")
      setDeleting(false)
      setIsDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ajustes del Sistema</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Administra tus preferencias personales, seguridad y notificaciones.
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes del Sistema</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Administra tus preferencias personales, seguridad y notificaciones.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="profile" className="w-full max-w-4xl">
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
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="bg-surface-container-low border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tu nombre y correo electrónico público.</CardDescription>
            </CardHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onUpdateProfile)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-surface-container-lowest" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2 mb-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" value={profile?.email || ""} className="bg-surface-container-lowest" readOnly disabled />
                    <p className="text-xs text-muted-foreground">Tu correo electrónico no se puede cambiar desde esta interfaz.</p>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/50 pt-4 flex justify-end">
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? "Guardando..." : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>

          <Card className="bg-surface-container-low border-destructive/20 shadow-sm border">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                Zona de Peligro
              </CardTitle>
              <CardDescription>Acciones irreversibles sobre tu cuenta de usuario.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Al eliminar tu cuenta, se borrarán de forma inmediata y permanente todos tus proyectos creados, así como sus respectivos dispositivos registrados, sensores, configuraciones de dashboards y todos los registros de telemetría históricos. Esta acción no se puede deshacer.
              </p>
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-4 flex justify-end">
              <Button type="button" variant="destructive" onClick={() => setIsDeleteOpen(true)} className="shadow-lg shadow-destructive/20">
                Eliminar Cuenta Permanentemente
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="mt-6">
          <Card className="bg-surface-container-low border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Seguridad de la Cuenta</CardTitle>
              <CardDescription>
                {profile?.hasPassword
                  ? "Actualiza tu contraseña para mantener tu cuenta protegida."
                  : "Tu cuenta está autenticada mediante un proveedor externo (OAuth)."}
              </CardDescription>
            </CardHeader>
            {profile?.hasPassword ? (
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña Actual</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} className="bg-surface-container-lowest" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nueva Contraseña</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} className="bg-surface-container-lowest" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Contraseña</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} className="bg-surface-container-lowest" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-border/50 pt-4 flex justify-end">
                    <Button type="submit" disabled={savingPassword}>
                      {savingPassword ? "Actualizando..." : "Actualizar Contraseña"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            ) : (
              <CardContent className="py-8 text-center bg-surface-container-lowest border border-dashed rounded-md mx-6 mb-6">
                <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Te has registrado usando Google o GitHub. La administración de la contraseña y credenciales se realiza a través del proveedor de identidad externo correspondiente.
                </p>
              </CardContent>
            )}
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

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={profile?.name || "tu cuenta"}
        description="Esta acción es irreversible y borrará absolutamente todos tus proyectos, dispositivos, sensores y datos de telemetría recolectados."
        onConfirm={onDeleteAccount}
        loading={deleting}
      />
    </div>
  )
}

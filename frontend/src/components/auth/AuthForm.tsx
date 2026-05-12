"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  loginSchema,
  registerSchema,
  loginUseCase,
  registerUseCase,
} from "@/features/auth"
import { getAuthUrl, API_ENDPOINTS } from "@/shared/infrastructure/http"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { SocialButton } from "@/components/auth/SocialButton"
import { Loader2, Mail, Lock, User, ArrowRight, Globe } from "lucide-react"

type LoginFormValues = {
  email: string
  password: string
  name?: string
}

export function AuthForm() {
  const router = useRouter()
  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const schema = isRegistering ? registerSchema : loginSchema

  const form = useForm<LoginFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  })

  const onSubmit = useCallback(
    async (data: LoginFormValues) => {
      setSubmitError("")
      setIsLoading(true)

      try {
        if (isRegistering) {
          await registerUseCase({
            email: data.email,
            password: data.password,
            name: data.name,
          })
        } else {
          await loginUseCase({
            email: data.email,
            password: data.password,
          })
        }
        router.push("/dashboard")
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al autenticar"
        setSubmitError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [isRegistering, router]
  )

  const toggleMode = useCallback(() => {
    setIsRegistering((prev) => !prev)
    setSubmitError("")
    form.reset({ email: form.getValues("email"), password: "", name: "" })
  }, [form])

  return (
    <div className="flex w-full flex-col items-center justify-center p-6 md:p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Globe size={20} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              IoT Analytics
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isRegistering
              ? "Crea tu cuenta para acceder a la plataforma"
              : "Inicia sesión para acceder a tu panel"}
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            aria-label={
              isRegistering
                ? "Formulario de registro"
                : "Formulario de inicio de sesión"
            }
          >
            {isRegistering && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Tu nombre"
                            className="pl-9"
                            autoComplete="name"
                          />
                        </FormControl>
                        <User
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="m@ejemplo.com"
                        className="pl-9"
                        autoComplete="email"
                      />
                    </FormControl>
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        autoComplete={
                          isRegistering ? "new-password" : "current-password"
                        }
                      />
                    </FormControl>
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitError && (
              <div
                role="alert"
                className="animate-in zoom-in-95 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2 cursor-pointer"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  {isRegistering ? "Crear cuenta" : "Iniciar sesión"}
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground md:bg-transparent">
              O continúa con
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SocialButton
            href={getAuthUrl(API_ENDPOINTS.AUTH.GOOGLE)}
            provider="google"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            }
          />
          <SocialButton
            href={getAuthUrl(API_ENDPOINTS.AUTH.GITHUB)}
            provider="github"
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            }
          />
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={toggleMode}
            type="button"
          >
            {isRegistering
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Plus, ArrowRight } from "lucide-react"
import {
  createProjectSchema,
  type CreateProjectInput,
} from "../../domain/schemas"
import { countActiveDevices } from "../../domain/rules"
import { httpProjectsRepository } from "../../infrastructure/projects.repository"
import { useProjects } from "../hooks/useProjects"

export function ProjectsPage() {
  const router = useRouter()
  const { projects, loading, unauthorized, refetch } = useProjects()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (unauthorized) router.push("/login")
  }, [unauthorized, router])

  async function onSubmit(values: CreateProjectInput) {
    try {
      await httpProjectsRepository.create(values)
      toast.success("Proyecto creado exitosamente")
      setIsDialogOpen(false)
      form.reset()
      refetch()
    } catch {
      toast.error("Hubo un problema al crear el proyecto")
    }
  }

  let projectsContent = (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const active = countActiveDevices(project)
        return (
          <Card
            key={project.id}
            className="group hover:border-primary/50 transition-all duration-300 bg-surface-container-low border-border/50"
          >
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                {project.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  {active}
                  <span className="text-xl text-muted-foreground ml-1">
                    / {project._count?.devices || 0}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">Devices Activos</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Creado el {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                className="w-full justify-between hover:bg-primary/10 hover:text-primary group-hover:translate-x-1 transition-transform"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                Gestionar Sensores
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )

  if (loading) {
    projectsContent = (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  } else if (projects.length === 0) {
    projectsContent = (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg bg-surface-container-low/50">
        <p className="text-muted-foreground mb-4">No tienes proyectos creados aún.</p>
        <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
          Crear mi primer proyecto
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Proyectos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona tus agrupaciones lógicas de sensores.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] border-border bg-background shadow-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
              <DialogDescription>
                Define un nuevo contenedor lógico (Ej. Invernadero A, Fábrica Norte).
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 pt-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Proyecto</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. Sector Logístico"
                          {...field}
                          className="bg-surface-container-lowest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {projectsContent}
    </div>
  )
}

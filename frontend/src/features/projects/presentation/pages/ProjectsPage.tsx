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
import { Plus, ArrowRight, Pencil, Trash2 } from "lucide-react"
import {
  createProjectSchema,
  type CreateProjectInput,
} from "../../domain/schemas"
import { countActiveDevices } from "../../domain/rules"
import { httpProjectsRepository } from "../../infrastructure/projects.repository"
import { useProjects } from "../hooks/useProjects"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import type { Project } from "../../domain/types"

export function ProjectsPage() {
  const router = useRouter()
  const { projects, loading, unauthorized, refetch } = useProjects()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Edit & Delete state
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "" },
  })

  const editForm = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (unauthorized) router.push("/login")
  }, [unauthorized, router])

  useEffect(() => {
    if (editingProject) {
      editForm.reset({ name: editingProject.name })
    }
  }, [editingProject, editForm])

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

  async function onEditSubmit(values: CreateProjectInput) {
    if (!editingProject) return
    try {
      await httpProjectsRepository.update(editingProject.id, values)
      toast.success("Proyecto actualizado exitosamente")
      setIsEditDialogOpen(false)
      setEditingProject(null)
      refetch()
    } catch {
      toast.error("Hubo un problema al actualizar el proyecto")
    }
  }

  async function onDeleteConfirm() {
    if (!deletingProject) return
    try {
      setDeleting(true)
      await httpProjectsRepository.delete(deletingProject.id)
      toast.success("Proyecto eliminado permanentemente")
      setIsDeleteOpen(false)
      setDeletingProject(null)
      refetch()
    } catch {
      toast.error("Hubo un problema al eliminar el proyecto")
    } finally {
      setDeleting(false)
    }
  }

  let projectsContent = (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const active = countActiveDevices(project)
        return (
          <Card
            key={project.id}
            className="group hover:border-primary/50 transition-all duration-300 bg-surface-container-low border-border/50 relative overflow-hidden"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center justify-between">
                <span className="truncate pr-2" title={project.name}>
                  {project.name}
                </span>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingProject(project)
                      setIsEditDialogOpen(true)
                    }}
                    title="Editar proyecto"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingProject(project)
                      setIsDeleteOpen(true)
                    }}
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary font-mono tabular-nums">
                  {active}
                  <span className="text-xl text-muted-foreground ml-1">
                    / {project._count?.devices || 0}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">Devices Activos</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-4 font-mono">
                Creado el {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="pt-3 border-t border-border/50">
              <Button
                variant="ghost"
                className="w-full justify-between hover:bg-primary/10 hover:text-primary group-hover:translate-x-0.5 transition-all text-xs h-9"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                Gestionar Proyecto
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
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
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

      {/* EDIT PROJECT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-border bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle>Editar Proyecto</DialogTitle>
            <DialogDescription>
              Modifica los detalles del contenedor lógico.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4 pt-4"
            >
              <FormField
                control={editForm.control}
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
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingProject(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* DELETE PROJECT CONFIRMATION */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={deletingProject?.name || "este proyecto"}
        description="Al eliminar este proyecto, se eliminarán en cascada de forma permanente todos los dispositivos Gateways registrados a este, junto con sus sensores y el histórico completo de eventos de telemetría."
        onConfirm={onDeleteConfirm}
        loading={deleting}
      />
    </div>
  )
}

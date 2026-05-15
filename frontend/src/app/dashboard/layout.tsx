"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, FolderKanban, Radio, Settings, LogOut } from "lucide-react"
import {
  getCurrentSessionUseCase,
  logoutUseCase,
  type Session,
} from "@/features/auth"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<Session | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const session = getCurrentSessionUseCase()
      if (!session) {
        logoutUseCase()
        router.push("/login")
        return
      }
      setUser(session)
    }, 0)
    return () => clearTimeout(timeout)
  }, [router])

  if (!user) {
    return <div className="min-h-screen bg-background" />
  }

  const handleLogout = () => {
    logoutUseCase()
    router.push("/login")
  }

  const initials = user.name
    ? user.name.slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Mis Proyectos", href: "/dashboard/projects", icon: FolderKanban },
    { name: "Métricas", href: "/dashboard/metrics", icon: Radio },
    { name: "Ajustes", href: "/dashboard/settings", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-surface-container-low hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <svg className="h-6 w-6 text-primary mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xl font-bold tracking-tight">Vortex IoT</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <span className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                  <Icon className="h-5 w-5" />
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-red-500 hover:bg-red-500/10 rounded-md transition-colors text-sm font-medium">
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
          <div className="md:hidden flex items-center">
             <span className="text-xl font-bold tracking-tight">Vortex IoT</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-10 w-10 rounded-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={user.image || ""} alt={user.name || "Usuario"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || "Usuario"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Perfil</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-surface">
          {children}
        </main>
      </div>
    </div>
  )
}

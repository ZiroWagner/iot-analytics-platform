import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SocialButtonProps {
  href: string
  provider: "google" | "github"
  icon: React.ReactNode
}

export function SocialButton({ href, provider, icon }: SocialButtonProps) {
  const providerLabel = provider === "google" ? "Google" : "GitHub"
  const providerColors =
    provider === "google"
      ? "hover:border-[#4285F4]/50 hover:bg-[#4285F4]/5"
      : "hover:border-zinc-700/50 hover:bg-zinc-800/5 dark:hover:border-zinc-600/50 dark:hover:bg-zinc-700/10"

  return (
    <a href={href} className="group w-full">
      <Button
        variant="outline"
        className={cn(
          "w-full justify-center gap-0 overflow-hidden transition-all duration-400 group-hover:gap-2 cursor-pointer",
          providerColors
        )}
        type="button"
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="max-w-0 whitespace-nowrap text-sm opacity-0 transition-all duration-400 group-hover:max-w-[80px] group-hover:opacity-100">
          {providerLabel}
        </span>
      </Button>
    </a>
  )
}

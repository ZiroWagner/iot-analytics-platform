"use client"

import { useEffect, useRef, useCallback } from "react"
import { animate } from "animejs"

interface Particle {
  element: HTMLElement
  x: number
  y: number
  baseX: number
  baseY: number
  size: number
  animation: ReturnType<typeof animate> | null
}

interface ParticleNetworkProps {
  particleCount?: number
  className?: string
}

export function ParticleNetwork({
  particleCount = 45,
  className = "",
}: ParticleNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const animationFrameRef = useRef<number>(0)
  const lineElementsRef = useRef<SVGLineElement[]>([])
  const loopRef = useRef<(() => void) | null>(null)

  const maxDistance = 150
  const mouseRadius = 120

  const initParticles = useCallback(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    container.innerHTML = ""
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"
    container.appendChild(svg)

    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      const el = document.createElement("div")
      el.style.cssText = `
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        will-change: transform;
      `
      container.appendChild(el)

      const x = Math.random() * width
      const y = Math.random() * height

      particles.push({
        element: el,
        x,
        y,
        baseX: x,
        baseY: y,
        size: Math.random() * 3 + 2,
        animation: null,
      })
    }

    const lineElements: SVGLineElement[] = []
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        )
        line.setAttribute("stroke-linecap", "round")
        svg.appendChild(line)
        lineElements.push(line)
      }
    }

    particlesRef.current = particles
    lineElementsRef.current = lineElements

    particles.forEach((p) => {
      p.element.style.left = `${p.x}px`
      p.element.style.top = `${p.y}px`
      p.element.style.width = `${p.size}px`
      p.element.style.height = `${p.size}px`

      const duration = 3000 + Math.random() * 4000
      const distanceX = (Math.random() - 0.5) * 80
      const distanceY = (Math.random() - 0.5) * 80

      p.animation = animate(p.element, {
        translateX: [0, distanceX, -distanceX * 0.5, 0],
        translateY: [0, distanceY, -distanceY * 0.5, 0],
        duration,
        loop: true,
        alternate: true,
        ease: "inOutSine",
        onUpdate: () => {
          const matrix = p.element.style.transform
          const match = matrix.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
          if (match) {
            p.x = p.baseX + parseFloat(match[1])
            p.y = p.baseY + parseFloat(match[2])
          }
        },
      })
    })
  }, [particleCount])

  const renderLoop = useCallback(() => {
    const particles = particlesRef.current
    const lines = lineElementsRef.current

    const style = getComputedStyle(document.documentElement)
    const isDark = document.documentElement.classList.contains("dark")
    const primaryColor = isDark
      ? style.getPropertyValue("--primary").trim() || "#ffffff"
      : style.getPropertyValue("--primary").trim() || "#000000"

    let lineIndex = 0

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const line = lines[lineIndex]
        if (!line) continue
        lineIndex++

        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.3
          line.setAttribute("x1", String(particles[i].x))
          line.setAttribute("y1", String(particles[i].y))
          line.setAttribute("x2", String(particles[j].x))
          line.setAttribute("y2", String(particles[j].y))
          line.setAttribute("stroke", primaryColor)
          line.setAttribute("stroke-opacity", String(opacity))
          line.setAttribute("stroke-width", "1")
        } else {
          line.setAttribute("stroke-opacity", "0")
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (loopRef.current) loopRef.current()
    })
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    particlesRef.current.forEach((p) => {
      const dx = p.x - mouseRef.current.x
      const dy = p.y - mouseRef.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < mouseRadius) {
        const force = (1 - dist / mouseRadius) * 30
        const angle = Math.atan2(dy, dx)
        p.baseX = p.baseX + Math.cos(angle) * force * 0.05
        p.baseY = p.baseY + Math.sin(angle) * force * 0.05

        if (p.animation) {
          p.animation.play()
        }
      }
    })
  }, [])

  useEffect(() => {
    initParticles()
    loopRef.current = renderLoop
    animationFrameRef.current = requestAnimationFrame(renderLoop)

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      particlesRef.current.forEach((p) => {
        if (p.animation) {
          p.animation.pause()
          p.animation.revert()
        }
      })
      cancelAnimationFrame(animationFrameRef.current)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [initParticles, renderLoop, handleMouseMove])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
    />
  )
}

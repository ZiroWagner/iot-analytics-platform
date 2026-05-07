# Shadcn UI & Design Principles Skill

## 1. Typography & Themes
- Utilizar fuentes modernas (Google Fonts: `Outfit`, `Inter` o `Roboto`) en lugar de fuentes por defecto. Definir variables `--font-sans` en el layout de Next.js.
- Aplicar temas dinámicos soportados por `next-themes` y modo oscuro para la plataforma de interfaz. Utiliza paletas refinadas evitando colores genéricos planos.
- En `tailwind.config.ts` o variables CSS globales (`globals.css`), asegurar un diseño Premium (fondos ligeramente tintados, bordes semitransparentes).

## 2. Layouts y Layouts de Componentes
- Emplear esquemas Grid y Flex de Tailwind generosamente para responsividad.
- Componentes clave de shadcn a emplear y combinar: `Card`, `Avatar`, `Button`, `DropdownMenu` y `Sheet` para menús laterales.
- Integrar efectos de "Glassmorphism" suave (ejemplo: `backdrop-blur-md bg-card/80`) para headers y barras de navegación sobrecargadas.

## 3. Microanimaciones y UX
- Agregar estados interactivos (`hover:bg-accent/10 transition-colors`).
- Proyectar sombras sutiles que enriquezcan la jerarquía del DOM (`shadow-sm`, `shadow-md`).
- Al renderizar data obtenida por JWT, desplegar "Skeleton" (`animate-pulse`) o indicadores suaves mientras carga, en lugar de pantallas o "parpadeos" (flashes) vacíos.

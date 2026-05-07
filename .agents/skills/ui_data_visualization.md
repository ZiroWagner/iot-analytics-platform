# Skill de Antigravity: Diseño UI y Visualización de Datos (IoT Platform)

## Objetivo
Instrucciones detalladas para que el agente respete los estándares de diseño de la **Plataforma Dinámica de Gestión y Análisis de Datos IoT**, utilizando **Next.js**, **shadcn/ui**, **Tailwind CSS**, y **Recharts**.

## Reglas de Arquitectura UI
### Estética y Colores (Modo Oscuro)
1. **Next-themes**: La aplicación debe estar optimizada para modo oscuro ("dark mode") de forma predeterminada usando `next-themes`. 
2. **Sistema de Variables**: Todos los colores se declaran en variables CSS (`--background`, `--foreground`, etc.) en `app/globals.css`, nunca harcodeados en el className de Tailwind, excepto en casos específicos de utilidades como variaciones puntuales.
3. El diseño debe sentirse "premium" e "inmersivo", con detalles de 'glassmorphism' cuando sea posible (ej: `bg-background/80 backdrop-blur-md`).

### Gráficos y Dashboard (Recharts / shadcn Charts)
1. **Componentes base**: Los widgets de los dashboards deben estar envueltos en los componentes `Card`, `CardHeader` y `CardContent` de shadcn/ui.
2. **Recharts Tooltips y Gráficos Custom**: Se utilizará el sistema interno de Shadcn de Charts, que implementa `ChartContainer`, `ChartTooltip`, y `ChartLegend`. 
3. **Responsive**: Los gráficos siempre usarán `ResponsiveContainer` provistos por shadcn/ui (100% alto y ancho), ajustando el tamaño exterior de la Card o el contenedor padre.
4. Mostrar siempre animaciones sutiles (`animate={{ duration: 300 }}`) en la data inicial.

### Shadcn/ui y Componentes
- Al generar componentes, se prefiere siempre la invocación vía script: `npx shadcn-ui@latest add <componente>`.
- Prioriza evitar componentes "crudos", haz uso del CLI de shadcn.
- El diseño debe emplear la densidad adecuada para "Dashboards" (compacto pero espacioso). Letras pequeñas y precisas `text-sm`, `text-xs` para leyendas y datos densos. Font priorizada: **Inter** o estándar del navegador si se usa Geist.

## Componentes Analíticos Específicos
Implementa gráficos para:
- **Líneas/Áreas temporales** (Humedad, Temperatura, Calidad de Aire).
- **Tarjetas KPI** (estadísticas principales: última lectura).

¡Sé dinámico! Las vistas de "analitics" de cada sensor y agrupación lógica del proyecto deben brillar.

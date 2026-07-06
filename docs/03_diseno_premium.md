# 03 - Diseño premium y dirección visual

## Objetivo visual

La aplicación debe sentirse como una herramienta IT moderna, pulida y propia. Evitar apariencia genérica de plantilla administrativa.

Concepto: **IT Command Desk**.

La interfaz debe transmitir:

- Orden.
- Velocidad.
- Claridad operativa.
- Confianza técnica.
- Producto terminado.

## Pantalla inicial

La primera pantalla debe ser el dashboard funcional. No crear landing page ni portada comercial.

## Personalidad visual

Usar una estética premium sobria:

- Fondo principal claro con tonos cálidos muy suaves.
- Panel lateral oscuro grafito.
- Acentos verde técnico y cian moderado.
- Tablas densas pero respirables.
- Bordes finos.
- Sombras sutiles.
- Microinteracciones discretas.

## Paleta sugerida

| Uso | Color |
|---|---|
| Fondo app | `#F7F7F2` |
| Superficie | `#FFFFFF` |
| Superficie secundaria | `#EFEFE8` |
| Texto principal | `#171717` |
| Texto secundario | `#60615C` |
| Panel lateral | `#111412` |
| Borde | `#DADBD2` |
| Acento principal | `#18A058` |
| Acento secundario | `#00A7A7` |
| Crítico | `#D92D20` |
| Alta | `#E56B2F` |
| Media | `#C99700` |
| Baja | `#2E7D32` |

Evitar:

- Gradientes morados.
- Fondos azul oscuro genéricos.
- Tarjetas enormes sin contenido útil.
- Ilustraciones abstractas.
- Hero section.
- Esquinas excesivamente redondeadas.
- Tarjetas anidadas.

## Layout

### Desktop

- Sidebar izquierda fija de 248px.
- Header superior con buscador, estado IA y botón "Nuevo ticket".
- Contenido en grid.
- Dashboard con:
  - Fila de métricas compactas.
  - Columna principal con tabla de tickets recientes.
  - Columna lateral con riesgos y estado de IA.

### Mobile

- Sidebar convertida en drawer o navegación inferior.
- Métricas en una columna.
- Tablas convertidas en tarjetas compactas.
- Formularios de una columna.

## Componentes base

Crear componentes reutilizables:

- `AppShell`.
- `Sidebar`.
- `Topbar`.
- `MetricTile`.
- `TicketTable`.
- `PriorityBadge`.
- `StatusBadge`.
- `CategoryPill`.
- `AiStatusIndicator`.
- `CommandButton`.
- `Field`.
- `TextareaField`.
- `SelectField`.
- `EmptyState`.
- `ErrorState`.
- `LoadingState`.
- `AnalysisPanel`.
- `Timeline`.

## Detalles distintivos

Para que no parezca una plantilla genérica, incluir:

### 1. Estado IA siempre visible

Un indicador en el header:

- `Gemini activo`
- `Modo demo`
- `Sin configurar`

Con punto de estado y tooltip.

### 2. Código visual de prioridad

Badges con color, icono y texto:

- Crítica.
- Alta.
- Media.
- Baja.

### 3. Panel "Diagnóstico IA"

En nuevo ticket, mostrar el análisis como una ficha técnica:

- Categoría.
- Prioridad.
- Confianza.
- Posible causa.
- Pasos.
- Respuesta sugerida.

### 4. Casos rápidos

Botones compactos con ejemplos:

- Internet.
- CRM.
- Impresora.
- Usuario nuevo.
- PC lenta.
- Email.

Al hacer clic, cargan título y descripción.

### 5. Timeline del ticket

En el detalle, mostrar eventos:

- Creado.
- Analizado con IA.
- Prioridad asignada.
- Estado modificado.
- Nota agregada.

## Tipografía

Usar fuente del sistema o Inter si se instala.

Escala sugerida:

- Título página: 24px, peso 700.
- Subtítulo: 14px, color secundario.
- Métricas: 28px, peso 700.
- Labels: 13px, peso 600.
- Body: 14px.
- Tabla: 13px.

No usar textos gigantes. Es una herramienta operativa.

## Espaciado y bordes

- Radio máximo de tarjetas: 8px.
- Botones: 6px.
- Inputs: 6px.
- Bordes: 1px.
- Padding de tarjetas: 16px o 20px.
- Gap principal: 16px.

## Estados obligatorios

Cada pantalla debe contemplar:

- Cargando.
- Error.
- Sin datos.
- Datos cargados.

## Iconos

Usar `lucide-react`.

Iconos sugeridos:

- `Ticket`
- `LayoutDashboard`
- `Sparkles`
- `AlertTriangle`
- `CheckCircle2`
- `Clock`
- `Wrench`
- `Network`
- `Printer`
- `Shield`
- `Mail`
- `UserPlus`

## Animaciones

Usar transiciones breves:

- Hover en botones.
- Cambio de badges.
- Aparición del panel de análisis.

Evitar animaciones llamativas que distraigan.

## Copy de interfaz

Usar lenguaje claro y profesional:

- "Analizar con IA"
- "Guardar ticket"
- "Respuesta sugerida"
- "Pasos recomendados"
- "Confianza del análisis"
- "Modo demo activo"

No agregar textos largos explicando cómo usar controles básicos.

## Resultado esperado

La app debe verse como un producto interno premium de soporte IT: sobrio, rápido y confiable, con detalles propios relacionados al diagnóstico técnico.

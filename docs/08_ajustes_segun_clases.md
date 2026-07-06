# 08 - Ajustes según clases

Este archivo resume refuerzos detectados en las transcripciones de clase para que el proyecto quede alineado con la forma de trabajo explicada por la cátedra.

## 1. No pedir una app de forma abstracta

La consigna para Codex no debe ser "haceme una aplicación de tickets". Debe partir de una especificación con:

- Usuarios y roles.
- Problema concreto.
- Objetivo del producto.
- Alcance de la primera versión.
- Funcionalidades fuera de alcance.
- Datos que se deben guardar.
- Pantallas esperadas.
- Reglas de negocio.
- Estados principales.
- Criterios de aceptación.

Los archivos de esta carpeta cumplen esa función y Codex debe leerlos antes de implementar.

## 2. Documentar RF y RNF

Agregar al README o a `docs/memoria-desarrollo.md` una sección breve con requisitos funcionales y no funcionales.

### Requisitos funcionales sugeridos

| Código | Requisito | Prioridad |
|---|---|---|
| RF-01 | Registrar tickets con título, descripción, solicitante, área y canal. | Alta |
| RF-02 | Analizar un ticket con Gemini API o modo demo. | Alta |
| RF-03 | Clasificar automáticamente categoría, prioridad, impacto y urgencia. | Alta |
| RF-04 | Generar resumen, posible causa, pasos recomendados y respuesta sugerida. | Alta |
| RF-05 | Guardar tickets y consultar historial. | Alta |
| RF-06 | Cambiar estado del ticket. | Media |
| RF-07 | Agregar notas internas. | Media |
| RF-08 | Gestionar categorías básicas. | Media |
| RF-09 | Visualizar métricas en dashboard. | Alta |

### Requisitos no funcionales sugeridos

| Código | Requisito | Prioridad |
|---|---|---|
| RNF-01 | La API key de Gemini no debe exponerse en frontend. | Alta |
| RNF-02 | La app debe funcionar en modo demo si Gemini no está configurado. | Alta |
| RNF-03 | La interfaz debe ser responsive básica. | Alta |
| RNF-04 | El flujo principal debe poder demostrarse en menos de 2 minutos. | Alta |
| RNF-05 | El diseño debe ser consistente y accesible: labels, contraste y foco visible. | Media |
| RNF-06 | El README debe permitir instalar, ejecutar y desplegar el proyecto. | Alta |
| RNF-07 | No deben usarse datos sensibles reales en la demo pública. | Alta |

## 3. Criterios de aceptación

Agregar criterios concretos para probar que cada función está terminada.

| Funcionalidad | Criterio de aceptación |
|---|---|
| Crear ticket | Dado un formulario válido, al guardar se crea un ticket con código `HD-000X`. |
| Validar formulario | Dado un título vacío, el sistema muestra un error y no permite analizar. |
| Analizar con IA | Dado un ticket válido, el sistema devuelve categoría, prioridad, resumen y pasos. |
| Modo demo | Dado que no existe `GEMINI_API_KEY`, el sistema analiza usando reglas demo. |
| Historial | Dado un ticket guardado, aparece en el listado y puede abrirse el detalle. |
| Cambio de estado | Dado un ticket abierto, el usuario puede pasarlo a "En progreso". |
| Dashboard | Dado que existen tickets, las métricas se actualizan según los datos guardados. |

## 4. Base de datos y despliegue

SQLite con Prisma sirve bien para desarrollo local y demo simple. Para despliegue real, conviene contemplar PostgreSQL porque algunas plataformas no conservan archivos SQLite entre reinicios o redeploys.

Recomendación:

- Desarrollo local: SQLite.
- Producción: PostgreSQL en Supabase, Railway, Render u otro proveedor.

El README debe aclarar ambas opciones.

## 5. Despliegue y verificación

Antes de desplegar, Codex debe ejecutar:

```bash
npm run build
```

También debe verificar:

- Backend inicia sin errores.
- Frontend compila.
- Variables de entorno documentadas.
- Modo demo funciona sin Gemini.
- El link público abre el dashboard.

## 6. Uso de agentes con control humano

En la memoria, explicar que Codex/Gemini se usaron como copilotos y que el estudiante fue controlando el proceso por etapas.

Puntos a mencionar:

- Se trabajó con especificaciones en `.md`.
- Se avanzó de forma incremental.
- Se revisaron errores y decisiones.
- Se verificó build antes del despliegue.
- La IA asistió, pero las decisiones finales de alcance, diseño y validación fueron humanas.

## 7. Capturas o evidencia visual

Para la entrega, incluir capturas de:

- Dashboard.
- Nuevo ticket.
- Resultado del análisis IA.
- Historial.
- Detalle con timeline.
- Configuración IA o estado Gemini/modo demo.

## 8. Sugerencia de mejora opcional

Si queda tiempo, agregar una pantalla simple llamada "Especificación" o "Acerca del proyecto" dentro de la app. Puede mostrar:

- Problema.
- Usuarios.
- Tecnologías.
- Flujo principal.
- Uso de IA.

No es obligatoria, pero ayuda en la defensa porque deja visible dentro de la propia aplicación que el proyecto fue pensado como producto.

# 01 - Especificación funcional

## Navegación principal

La aplicación debe tener navegación lateral o superior con estas secciones:

- Dashboard.
- Nuevo ticket.
- Tickets.
- Categorías.
- Configuración IA.
- Documentación del proyecto.

## Pantalla 1 - Dashboard

Debe ser la primera pantalla de la app. No crear landing page.

Mostrar:

- Total de tickets.
- Tickets abiertos.
- Tickets en progreso.
- Tickets resueltos.
- Promedio de prioridad.
- Cantidad de tickets analizados con IA.
- Tickets recientes.
- Distribución por categoría.
- Distribución por prioridad.

Componentes sugeridos:

- Tarjetas de métricas compactas.
- Gráfico de barras por categoría.
- Gráfico de dona por prioridad.
- Tabla de últimos tickets.
- Panel "Riesgos del día" con tickets críticos.

## Pantalla 2 - Nuevo ticket

Formulario:

- Título.
- Descripción.
- Solicitante.
- Área solicitante.
- Canal de origen: WhatsApp, email, llamada, presencial, sistema interno.
- Impacto inicial: bajo, medio, alto.
- Urgencia inicial: baja, media, alta.
- Caso de ejemplo.

Acciones:

- Cargar ejemplo.
- Analizar con IA.
- Guardar ticket.
- Limpiar formulario.

Validaciones:

- Título obligatorio, mínimo 5 caracteres.
- Descripción obligatoria, mínimo 20 caracteres.
- Solicitante obligatorio.
- Área obligatoria.
- Canal obligatorio.

## Pantalla 3 - Resultado del análisis IA

Luego de analizar, mostrar:

- Categoría sugerida.
- Prioridad sugerida.
- Nivel de impacto.
- Nivel de urgencia.
- Resumen del problema.
- Posible causa.
- Pasos recomendados.
- Área responsable.
- Respuesta sugerida para el usuario.
- Confianza del análisis: baja, media o alta.
- Advertencias si el ticket está incompleto.

El resultado debe poder editarse antes de guardar.

## Pantalla 4 - Listado de tickets

Debe permitir:

- Buscar por título, solicitante o descripción.
- Filtrar por estado.
- Filtrar por prioridad.
- Filtrar por categoría.
- Ordenar por fecha, prioridad o estado.
- Abrir detalle.

Columnas sugeridas:

- Código.
- Título.
- Solicitante.
- Categoría.
- Prioridad.
- Estado.
- Fecha.
- IA.

## Pantalla 5 - Detalle de ticket

Mostrar:

- Información general.
- Descripción original.
- Análisis IA.
- Pasos sugeridos.
- Respuesta sugerida.
- Historial de cambios.
- Estado actual.

Acciones:

- Cambiar estado: abierto, en progreso, esperando usuario, resuelto, cerrado.
- Copiar respuesta sugerida.
- Editar prioridad.
- Agregar nota interna.

## Pantalla 6 - Categorías

Categorías iniciales:

- Red e Internet.
- Hardware.
- Software.
- Accesos y usuarios.
- Impresoras.
- Correo electrónico.
- CRM o sistema interno.
- Seguridad.
- Otro.

Cada categoría debe tener:

- Nombre.
- Descripción.
- Color.
- Área responsable.
- Activa/inactiva.

## Pantalla 7 - Configuración IA

Mostrar:

- Estado del proveedor: Gemini, demo o no configurado.
- Modelo configurado.
- Indicador de modo demo.
- Texto explicando que la API key se guarda en backend mediante variable de entorno.

No mostrar claves reales en pantalla.

## Reglas de negocio

### Prioridad

La prioridad final se calcula a partir de impacto y urgencia.

| Impacto | Urgencia | Prioridad |
|---|---|---|
| Alto | Alta | Crítica |
| Alto | Media | Alta |
| Medio | Alta | Alta |
| Medio | Media | Media |
| Bajo | Alta | Media |
| Bajo | Media | Baja |
| Bajo | Baja | Baja |

Gemini puede sugerir prioridad, pero el backend debe normalizar el valor para evitar respuestas inválidas.

### Estados del ticket

- `open`: abierto.
- `in_progress`: en progreso.
- `waiting_user`: esperando usuario.
- `resolved`: resuelto.
- `closed`: cerrado.

### Estado de análisis

- `not_analyzed`: sin analizar.
- `analyzed`: analizado con IA.
- `demo`: analizado con motor demo.
- `error`: error de análisis.

### Código de ticket

Cada ticket debe tener código legible:

```txt
HD-0001
HD-0002
HD-0003
```

## Automatización principal

Al presionar **Analizar con IA**, la aplicación debe:

1. Validar el formulario.
2. Enviar el ticket al backend.
3. El backend arma el prompt.
4. Gemini o el modo demo devuelve análisis estructurado.
5. El backend normaliza la respuesta.
6. El frontend muestra el resultado editable.
7. El usuario guarda el ticket.

## Criterios de aceptación

- El flujo principal debe funcionar en menos de 2 minutos durante la defensa.
- La app debe tener datos de ejemplo.
- La app debe funcionar aunque no haya API key.
- Los mensajes de error deben ser claros.
- La UI debe verse terminada y profesional.

# 07 - Checklist final

## Requisitos del enunciado

- [ ] La aplicación resuelve una necesidad concreta.
- [ ] Están definidos problema y usuarios.
- [ ] Hay interfaz web navegable.
- [ ] El diseño es responsive básico.
- [ ] Hay lógica de negocio.
- [ ] Hay manejo de datos persistentes.
- [ ] Hay integración externa con Gemini API.
- [ ] Hay automatización útil.
- [ ] Está documentado el uso de IA.
- [ ] La app está desplegada o tiene instrucciones claras.
- [ ] Existe README.
- [ ] Existe memoria de desarrollo.
- [ ] Existe guion de defensa.
- [ ] Existen RF, RNF y criterios de aceptación documentados.

## Flujo principal

- [ ] El dashboard carga correctamente.
- [ ] Se ve el estado de IA.
- [ ] Se puede crear un ticket.
- [ ] Se puede cargar un caso de ejemplo.
- [ ] Se puede analizar con IA.
- [ ] Se muestra categoría sugerida.
- [ ] Se muestra prioridad sugerida.
- [ ] Se muestra resumen.
- [ ] Se muestran pasos recomendados.
- [ ] Se muestra respuesta sugerida.
- [ ] Se puede guardar el ticket.
- [ ] El ticket aparece en el historial.
- [ ] Se puede abrir el detalle.
- [ ] Se puede cambiar estado.
- [ ] Se puede agregar nota interna.

## Backend

- [ ] `/api/health` responde.
- [ ] `/api/dashboard` responde.
- [ ] `/api/tickets` lista tickets.
- [ ] `/api/tickets/analyze` analiza con Gemini o demo.
- [ ] `/api/categories` lista categorías.
- [ ] Las validaciones funcionan.
- [ ] Los errores son controlados.
- [ ] Prisma migra correctamente.
- [ ] El seed carga datos iniciales.
- [ ] No se imprimen API keys en logs.

## Frontend

- [ ] AppShell implementado.
- [ ] Sidebar implementada.
- [ ] Topbar implementada.
- [ ] Dashboard implementado.
- [ ] Nuevo ticket implementado.
- [ ] Listado implementado.
- [ ] Detalle implementado.
- [ ] Categorías implementadas.
- [ ] Configuración IA implementada.
- [ ] Estados loading/error/empty implementados.
- [ ] Diseño mobile aceptable.

## Diseño premium

- [ ] No parece una plantilla genérica.
- [ ] Usa paleta definida.
- [ ] Sidebar grafito.
- [ ] Fondo claro cálido.
- [ ] Acentos verde/cian.
- [ ] Badges de prioridad claros.
- [ ] Panel de diagnóstico IA distintivo.
- [ ] Timeline en detalle.
- [ ] Casos rápidos visibles.
- [ ] Radio de tarjetas máximo 8px.
- [ ] Sin tarjetas anidadas.

## IA

- [ ] Gemini se llama desde backend.
- [ ] API key está en variable de entorno.
- [ ] Existe modo demo.
- [ ] Se normaliza respuesta IA.
- [ ] Se maneja JSON inválido.
- [ ] Se documenta prompt usado.
- [ ] Se explica uso responsable.

## Despliegue

- [ ] `npm run build` funciona.
- [ ] El backend inicia en producción.
- [ ] `.env.example` está completo.
- [ ] README explica despliegue.
- [ ] README aclara estrategia de base de datos local y producción.
- [ ] El link público funciona.
- [ ] La demo funciona sin datos manuales complejos.

## Prueba de defensa

Antes de entregar, hacer esta prueba:

1. Abrir app desde cero.
2. Entrar a Nuevo ticket.
3. Cargar ejemplo "No puedo ingresar al CRM".
4. Analizar con IA.
5. Guardar.
6. Ir a Tickets.
7. Abrir detalle.
8. Cambiar estado a "En progreso".
9. Copiar respuesta sugerida.
10. Mostrar dashboard actualizado.

Si este flujo funciona, el TP está defendible.

## Criterios vistos en clase

- [ ] La especificación define usuarios y roles.
- [ ] La especificación define problema concreto.
- [ ] La especificación separa MVP de funcionalidades futuras.
- [ ] La especificación define datos a guardar.
- [ ] La especificación define pantallas esperadas.
- [ ] La especificación define reglas de negocio y estados.
- [ ] La especificación incluye criterios de aceptación.
- [ ] Se ejecutó `npm run build` antes de desplegar.
- [ ] Se documentaron pruebas manuales.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  ["Red e Internet", "Problemas de conectividad, WiFi, cableado y acceso a red.", "#00A7A7", "Infraestructura"],
  ["Hardware", "Equipos, componentes, rendimiento fisico y perifericos.", "#2E7D32", "Soporte Tecnico"],
  ["Software", "Aplicaciones de escritorio, instalacion y errores generales.", "#18A058", "Soporte Tecnico"],
  ["Accesos y usuarios", "Altas, bajas, bloqueos y permisos de usuario.", "#C99700", "Mesa de ayuda"],
  ["Impresoras", "Impresion, toner, colas y equipos multifuncion.", "#E56B2F", "Soporte Tecnico"],
  ["Correo electronico", "Outlook, mail, recepcion, envio y configuracion.", "#00A7A7", "Mesa de ayuda"],
  ["CRM o sistema interno", "Errores de CRM, sistemas internos y procesos operativos.", "#D92D20", "Aplicaciones"],
  ["Seguridad", "Phishing, virus, accesos sospechosos y politicas.", "#D92D20", "Seguridad IT"],
  ["Otro", "Casos que requieren clasificacion manual.", "#60615C", "Mesa de ayuda"]
];

async function main() {
  for (const [name, description, color, responsibleArea] of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { description, color, responsibleArea, active: true },
      create: { name, description, color, responsibleArea, active: true }
    });
  }

  const internet = await prisma.category.findUnique({ where: { name: "Red e Internet" } });
  const crm = await prisma.category.findUnique({ where: { name: "CRM o sistema interno" } });

  const demoTickets = [
    {
      code: "HD-0001",
      title: "No tengo internet",
      description: "No tengo internet en mi computadora desde esta manana.",
      requesterName: "Juan Diaz",
      requesterArea: "Administracion",
      sourceChannel: "whatsapp",
      priority: "high",
      impact: "high",
      urgency: "medium",
      categoryId: internet?.id,
      aiStatus: "demo",
      aiProvider: "demo",
      aiConfidence: "medium",
      summary: "El usuario informa falta de conectividad en su equipo.",
      possibleCause: "Puede tratarse de WiFi, cableado o configuracion local.",
      responsibleArea: "Infraestructura",
      suggestedReply: "Vamos a revisar si el problema afecta solo a tu equipo o al area completa.",
      suggestedSteps: ["Verificar conectividad de otros equipos", "Revisar cable o WiFi", "Ejecutar diagnostico de red"]
    },
    {
      code: "HD-0002",
      title: "CRM muestra error 500",
      description: "El sistema de tickets muestra error 500 al guardar un caso.",
      requesterName: "Ana Gomez",
      requesterArea: "Comercial",
      sourceChannel: "sistema_interno",
      priority: "medium",
      impact: "medium",
      urgency: "medium",
      categoryId: crm?.id,
      aiStatus: "demo",
      aiProvider: "demo",
      aiConfidence: "medium",
      summary: "Error del sistema interno al intentar guardar informacion.",
      possibleCause: "Puede haber una falla de aplicacion o base de datos.",
      responsibleArea: "Aplicaciones",
      suggestedReply: "Vamos a revisar el error del sistema y validar si afecta a otros usuarios.",
      suggestedSteps: ["Reproducir el error", "Revisar logs de aplicacion", "Escalar a aplicaciones si persiste"]
    }
  ];

  for (const ticket of demoTickets) {
    const { suggestedSteps, ...ticketData } = ticket;
    await prisma.ticket.upsert({
      where: { code: ticket.code },
      update: ticketData,
      create: {
        ...ticketData,
        suggestedSteps: {
          create: suggestedSteps.map((text, index) => ({ order: index + 1, text }))
        },
        events: {
          create: [{ type: "created", description: "Ticket demo creado por seed inicial." }]
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

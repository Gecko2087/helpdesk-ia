import { prisma } from "../config/prisma.js";

const priorityScores = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export async function getDashboard() {
  const tickets = await prisma.ticket.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" }
  });

  const totalTickets = tickets.length;
  const analyzedTickets = tickets.filter((ticket) => ["analyzed", "demo"].includes(ticket.aiStatus)).length;
  const averagePriority = totalTickets
    ? Number((tickets.reduce((sum, ticket) => sum + (priorityScores[ticket.priority] ?? 0), 0) / totalTickets).toFixed(1))
    : 0;

  return {
    metrics: {
      totalTickets,
      openTickets: tickets.filter((ticket) => ticket.status === "open").length,
      inProgressTickets: tickets.filter((ticket) => ticket.status === "in_progress").length,
      resolvedTickets: tickets.filter((ticket) => ticket.status === "resolved").length,
      averagePriority,
      analyzedTickets
    },
    byCategory: groupBy(tickets, (ticket) => ticket.category?.name ?? "Sin categoria"),
    byPriority: groupBy(tickets, (ticket) => ticket.priority),
    recentTickets: tickets.slice(0, 5),
    dailyRisks: tickets.filter((ticket) => ["critical", "high"].includes(ticket.priority)).slice(0, 5)
  };
}

function groupBy(items, getKey) {
  return Object.values(
    items.reduce((acc, item) => {
      const key = getKey(item);
      acc[key] ??= { name: key, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {})
  );
}

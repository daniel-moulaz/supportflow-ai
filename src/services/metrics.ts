import type {
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../domain/ticket.js';

type CountMap<T extends string> = Record<T, number>;

function createCountMap<T extends string>(
  values: readonly T[],
): CountMap<T> {
  return Object.fromEntries(values.map((value) => [value, 0])) as CountMap<T>;
}

export function calculateMetrics(tickets: Ticket[]) {
  const byStatus = createCountMap<TicketStatus>([
    'open',
    'in_progress',
    'resolved',
  ]);

  const byCategory = createCountMap<TicketCategory>([
    'payment_access',
    'access',
    'payment',
    'technical',
    'commercial',
    'general',
  ]);

  const byPriority = createCountMap<TicketPriority>([
    'low',
    'medium',
    'high',
    'critical',
  ]);

  for (const ticket of tickets) {
    byStatus[ticket.status] += 1;
    byCategory[ticket.category] += 1;
    byPriority[ticket.priority] += 1;
  }

  return {
    total: tickets.length,
    requiresHuman: tickets.filter((ticket) => ticket.requiresHuman).length,
    byStatus,
    byCategory,
    byPriority,
  };
}

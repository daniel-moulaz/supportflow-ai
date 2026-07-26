import { randomUUID } from 'node:crypto';
import type {
  CreateTicketInput,
  Ticket,
  TicketClassification,
  TicketStatus,
} from '../domain/ticket.js';
import type {
  TicketFilters,
  TicketRepository,
} from './ticket-repository.js';

export class InMemoryTicketRepository implements TicketRepository {
  private readonly tickets = new Map<string, Ticket>();

  async create(
    input: CreateTicketInput,
    classification: TicketClassification,
  ): Promise<Ticket> {
    const now = new Date().toISOString();

    const ticket: Ticket = {
      id: randomUUID(),
      ...input,
      ...classification,
      status: 'open',
      assignedTo: null,
      createdAt: now,
      updatedAt: now,
    };

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async list(filters: TicketFilters = {}): Promise<Ticket[]> {
    return [...this.tickets.values()]
      .filter((ticket) => {
        if (filters.status && ticket.status !== filters.status) {
          return false;
        }

        if (filters.category && ticket.category !== filters.category) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.tickets.get(id) ?? null;
  }

  async updateStatus(
    id: string,
    status: TicketStatus,
  ): Promise<Ticket | null> {
    const current = this.tickets.get(id);

    if (!current) {
      return null;
    }

    const updated: Ticket = {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
    };

    this.tickets.set(id, updated);
    return updated;
  }

  async assign(
    id: string,
    assignee: string | null,
  ): Promise<Ticket | null> {
    const current = this.tickets.get(id);

    if (!current) {
      return null;
    }

    const updated: Ticket = {
      ...current,
      assignedTo: assignee,
      updatedAt: new Date().toISOString(),
    };

    this.tickets.set(id, updated);
    return updated;
  }
}

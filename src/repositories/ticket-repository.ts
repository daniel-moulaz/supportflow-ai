import type {
  CreateTicketInput,
  Ticket,
  TicketCategory,
  TicketClassification,
  TicketStatus,
} from '../domain/ticket.js';

export interface TicketFilters {
  status?: TicketStatus;
  category?: TicketCategory;
}

export interface TicketRepository {
  create(
    input: CreateTicketInput,
    classification: TicketClassification,
  ): Promise<Ticket>;
  list(filters?: TicketFilters): Promise<Ticket[]>;
  findById(id: string): Promise<Ticket | null>;
  updateStatus(id: string, status: TicketStatus): Promise<Ticket | null>;
  assign(id: string, assignee: string | null): Promise<Ticket | null>;
  close?(): void;
}

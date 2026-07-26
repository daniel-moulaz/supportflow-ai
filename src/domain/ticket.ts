export const ticketChannels = ['whatsapp', 'email', 'chat', 'portal'] as const;
export type TicketChannel = (typeof ticketChannels)[number];

export const ticketCategories = [
  'payment_access',
  'access',
  'payment',
  'technical',
  'commercial',
  'general',
] as const;
export type TicketCategory = (typeof ticketCategories)[number];

export const ticketPriorities = ['low', 'medium', 'high', 'critical'] as const;
export type TicketPriority = (typeof ticketPriorities)[number];

export const ticketStatuses = ['open', 'in_progress', 'resolved'] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

export interface Ticket {
  id: string;
  customer: string;
  channel: TicketChannel;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  summary: string;
  confidence: number;
  requiresHuman: boolean;
  suggestedReply: string;
  status: TicketStatus;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  customer: string;
  channel: TicketChannel;
  message: string;
}

export interface TicketClassification {
  category: TicketCategory;
  priority: TicketPriority;
  summary: string;
  confidence: number;
  requiresHuman: boolean;
  suggestedReply: string;
}

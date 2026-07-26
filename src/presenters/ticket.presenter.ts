import type {
  Ticket,
  TicketCategory,
  TicketChannel,
  TicketPriority,
  TicketStatus,
} from '../domain/ticket.js';

const channelLabels: Record<TicketChannel, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  chat: 'Chat',
  portal: 'Portal',
};

const categoryLabels: Record<TicketCategory, string> = {
  payment_access: 'Pagamento e acesso',
  access: 'Acesso',
  payment: 'Pagamento',
  technical: 'Problema técnico',
  commercial: 'Comercial',
  general: 'Solicitação geral',
};

const priorityLabels: Record<TicketPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const statusLabels: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
};

export function presentTicket(ticket: Ticket) {
  return {
    ...ticket,
    labels: {
      channel: channelLabels[ticket.channel],
      category: categoryLabels[ticket.category],
      priority: priorityLabels[ticket.priority],
      status: statusLabels[ticket.status],
    },
  };
}

import { z } from 'zod';
import { ticketChannels, ticketStatuses } from '../domain/ticket.js';

export const createTicketSchema = z.object({
  customer: z
    .string()
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  channel: z.enum(ticketChannels),
  message: z
    .string()
    .trim()
    .min(10, 'A mensagem deve ter pelo menos 10 caracteres.')
    .max(2000, 'A mensagem deve ter no máximo 2000 caracteres.'),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(ticketStatuses),
});

export const assignTicketSchema = z.object({
  assignee: z
    .string()
    .trim()
    .min(2, 'O nome do responsável deve ter pelo menos 2 caracteres.')
    .max(100, 'O nome do responsável deve ter no máximo 100 caracteres.')
    .nullable(),
});

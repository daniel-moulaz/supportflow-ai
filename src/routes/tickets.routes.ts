import type { FastifyInstance } from 'fastify';
import {
  ticketCategories,
  ticketStatuses,
  type TicketCategory,
  type TicketStatus,
} from '../domain/ticket.js';
import { presentTicket } from '../presenters/ticket.presenter.js';
import type {
  TicketFilters,
  TicketRepository,
} from '../repositories/ticket-repository.js';
import {
  assignTicketSchema,
  createTicketSchema,
  updateTicketStatusSchema,
} from '../schemas/ticket.schemas.js';
import { calculateMetrics } from '../services/metrics.js';
import { classifyTicket } from '../services/ticket-classifier.js';

type TicketParams = {
  id: string;
};

type TicketQuery = {
  status?: string;
  category?: string;
};

function isTicketStatus(value: string | undefined): value is TicketStatus {
  return value !== undefined && ticketStatuses.includes(value as TicketStatus);
}

function isTicketCategory(
  value: string | undefined,
): value is TicketCategory {
  return (
    value !== undefined &&
    ticketCategories.includes(value as TicketCategory)
  );
}

export async function registerTicketRoutes(
  app: FastifyInstance,
  repository: TicketRepository,
): Promise<void> {
  app.post('/tickets', async (request, reply) => {
    const parsed = createTicketSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Os dados enviados são inválidos.',
        details: parsed.error.flatten(),
      });
    }

    const classification = classifyTicket(parsed.data);
    const ticket = await repository.create(parsed.data, classification);

    return reply.status(201).send(presentTicket(ticket));
  });

  app.get<{ Querystring: TicketQuery }>('/tickets', async (request, reply) => {
    const { status, category } = request.query;

    if (status && !isTicketStatus(status)) {
      return reply.status(400).send({
        error: 'INVALID_STATUS',
        message: `Status inválido. Use: ${ticketStatuses.join(', ')}.`,
      });
    }

    if (category && !isTicketCategory(category)) {
      return reply.status(400).send({
        error: 'INVALID_CATEGORY',
        message: `Categoria inválida. Use: ${ticketCategories.join(', ')}.`,
      });
    }

    const filters: TicketFilters = {};

if (isTicketStatus(status)) {
  filters.status = status;
}

if (isTicketCategory(category)) {
  filters.category = category;
}

const tickets = await repository.list(filters);

    return {
      data: tickets.map(presentTicket),
      total: tickets.length,
    };
  });

  app.get<{ Params: TicketParams }>('/tickets/:id', async (request, reply) => {
    const ticket = await repository.findById(request.params.id);

    if (!ticket) {
      return reply.status(404).send({
        error: 'TICKET_NOT_FOUND',
        message: 'Chamado não encontrado.',
      });
    }

    return presentTicket(ticket);
  });

  app.patch<{ Params: TicketParams }>(
    '/tickets/:id/status',
    async (request, reply) => {
      const parsed = updateTicketStatusSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'O status enviado é inválido.',
          details: parsed.error.flatten(),
        });
      }

      const ticket = await repository.updateStatus(
        request.params.id,
        parsed.data.status,
      );

      if (!ticket) {
        return reply.status(404).send({
          error: 'TICKET_NOT_FOUND',
          message: 'Chamado não encontrado.',
        });
      }

      return presentTicket(ticket);
    },
  );

  app.patch<{ Params: TicketParams }>(
    '/tickets/:id/assignee',
    async (request, reply) => {
      const parsed = assignTicketSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'O responsável informado é inválido.',
          details: parsed.error.flatten(),
        });
      }

      const ticket = await repository.assign(
        request.params.id,
        parsed.data.assignee,
      );

      if (!ticket) {
        return reply.status(404).send({
          error: 'TICKET_NOT_FOUND',
          message: 'Chamado não encontrado.',
        });
      }

      return presentTicket(ticket);
    },
  );

  app.get('/metrics', async () => {
    const tickets = await repository.list();
    return calculateMetrics(tickets);
  });
}

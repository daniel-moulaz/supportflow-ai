import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { InMemoryTicketRepository } from '../src/repositories/in-memory-ticket-repository.js';

let app: FastifyInstance | undefined;

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('tickets API', () => {
  it('cria um chamado e retorna rótulos em português', async () => {
    app = await buildApp(new InMemoryTicketRepository());

    const creationResponse = await app.inject({
      method: 'POST',
      url: '/tickets',
      payload: {
        customer: 'Maria',
        channel: 'whatsapp',
        message:
          'Meu pagamento foi aprovado, mas ainda não tenho acesso ao curso.',
      },
    });

    expect(creationResponse.statusCode).toBe(201);

    const ticket = creationResponse.json();
    expect(ticket.category).toBe('payment_access');
    expect(ticket.status).toBe('open');
    expect(ticket.assignedTo).toBeNull();
    expect(ticket.labels).toMatchObject({
      category: 'Pagamento e acesso',
      priority: 'Alta',
      status: 'Aberto',
    });

    const metricsResponse = await app.inject({
      method: 'GET',
      url: '/metrics',
    });

    expect(metricsResponse.statusCode).toBe(200);
    expect(metricsResponse.json()).toMatchObject({
      total: 1,
      requiresHuman: 1,
      byStatus: {
        open: 1,
      },
    });
  });

  it('permite atribuir um responsável ao chamado', async () => {
    app = await buildApp(new InMemoryTicketRepository());

    const creationResponse = await app.inject({
      method: 'POST',
      url: '/tickets',
      payload: {
        customer: 'Ana',
        channel: 'chat',
        message: 'Nao consigo acessar minha conta com a minha senha.',
      },
    });

    const ticket = creationResponse.json();

    const assignmentResponse = await app.inject({
      method: 'PATCH',
      url: `/tickets/${ticket.id}/assignee`,
      payload: {
        assignee: 'Daniel',
      },
    });

    expect(assignmentResponse.statusCode).toBe(200);
    expect(assignmentResponse.json().assignedTo).toBe('Daniel');
  });

  it('rejeita dados inválidos', async () => {
    app = await buildApp(new InMemoryTicketRepository());

    const response = await app.inject({
      method: 'POST',
      url: '/tickets',
      payload: {
        customer: 'M',
        channel: 'whatsapp',
        message: 'Oi',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');
  });
});

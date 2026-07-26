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

describe('Swagger documentation', () => {
  it('gera a especificação OpenAPI com as rotas principais', async () => {
    app = await buildApp(new InMemoryTicketRepository());

    const response = await app.inject({
      method: 'GET',
      url: '/docs/json',
    });

    expect(response.statusCode).toBe(200);

    const document = response.json();

    expect(document.info).toMatchObject({
      title: 'SupportFlow AI API',
      version: '1.3.0',
    });

    expect(document.paths).toHaveProperty('/tickets');
    expect(document.paths).toHaveProperty('/tickets/{id}');
    expect(document.paths).toHaveProperty('/tickets/{id}/status');
    expect(document.paths).toHaveProperty('/tickets/{id}/assignee');
    expect(document.paths).toHaveProperty('/metrics');
  });
});

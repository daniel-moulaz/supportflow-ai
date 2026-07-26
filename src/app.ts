import Fastify, { type FastifyInstance } from 'fastify';
import { SQLiteTicketRepository } from './repositories/sqlite-ticket-repository.js';
import type { TicketRepository } from './repositories/ticket-repository.js';
import { registerTicketRoutes } from './routes/tickets.routes.js';

export async function buildApp(
  repository?: TicketRepository,
): Promise<FastifyInstance> {
  const ticketRepository =
    repository ??
    new SQLiteTicketRepository(
      process.env.DB_PATH ?? 'data/supportflow.db',
    );

  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'supportflow-ai',
    database: 'sqlite',
    timestamp: new Date().toISOString(),
  }));

  await registerTicketRoutes(app, ticketRepository);

  app.addHook('onClose', async () => {
    ticketRepository.close?.();
  });

  app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);

  const httpError = error as Error & {
    statusCode?: number;
  };

  const statusCode = httpError.statusCode ?? 500;

  return reply.status(statusCode).send({
    error:
      statusCode >= 500
        ? 'INTERNAL_SERVER_ERROR'
        : 'BAD_REQUEST',
    message:
      statusCode >= 500
        ? 'Ocorreu um erro inesperado.'
        : httpError.message,
  });
});

  return app;
}

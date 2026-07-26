import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance } from 'fastify';
import { healthResponseSchema } from './docs/openapi.schemas.js';
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

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'SupportFlow AI API',
        description:
          'API para criar, classificar, acompanhar e organizar chamados de suporte.',
        version: '1.3.0',
      },
      tags: [
        {
          name: 'Sistema',
          description: 'Verificação do funcionamento da API.',
        },
        {
          name: 'Chamados',
          description: 'Criação e acompanhamento dos chamados.',
        },
        {
          name: 'Métricas',
          description: 'Indicadores básicos da operação.',
        },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
    },
    staticCSP: true,
  });

  app.get(
    '/health',
    {
      schema: {
        tags: ['Sistema'],
        summary: 'Verificar a saúde da API',
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async () => ({
      status: 'ok',
      service: 'supportflow-ai',
      database: 'sqlite',
      timestamp: new Date().toISOString(),
    }),
  );

  await registerTicketRoutes(app, ticketRepository);

  app.addHook('onClose', async () => {
    ticketRepository.close?.();
  });

  app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);

  const httpError = error as Error & {
    statusCode?: number;
    validation?: unknown;
    validationContext?: string;
  };

  // Erros gerados automaticamente pela validação dos schemas do Fastify
  if (httpError.validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Os dados enviados são inválidos.',
      details: {
        context: httpError.validationContext,
        issues: httpError.validation,
      },
    });
  }

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

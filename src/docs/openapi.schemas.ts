import { z } from 'zod';
import {
  ticketCategories,
  ticketStatuses,
} from '../domain/ticket.js';
import {
  assignTicketSchema,
  createTicketSchema,
  updateTicketStatusSchema,
} from '../schemas/ticket.schemas.js';

function toOpenApiSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'input',
  });
}

export const createTicketBodySchema =
  toOpenApiSchema(createTicketSchema);

export const updateStatusBodySchema =
  toOpenApiSchema(updateTicketStatusSchema);

export const assignTicketBodySchema =
  toOpenApiSchema(assignTicketSchema);

export const ticketParamsSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Identificador do chamado.',
    },
  },
  required: ['id'],
};

export const ticketQuerySchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: [...ticketStatuses],
      description: 'Filtra os chamados por status.',
    },
    category: {
      type: 'string',
      enum: [...ticketCategories],
      description: 'Filtra os chamados por categoria.',
    },
  },
};

const labelsSchema = {
  type: 'object',
  properties: {
    channel: { type: 'string', example: 'WhatsApp' },
    category: { type: 'string', example: 'Pagamento e acesso' },
    priority: { type: 'string', example: 'Alta' },
    status: { type: 'string', example: 'Aberto' },
  },
  required: ['channel', 'category', 'priority', 'status'],
};

export const ticketResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    customer: { type: 'string', example: 'Maria' },
    channel: {
      type: 'string',
      enum: ['whatsapp', 'email', 'chat', 'portal'],
    },
    message: { type: 'string' },
    category: {
      type: 'string',
      enum: [
        'payment_access',
        'access',
        'payment',
        'technical',
        'commercial',
        'general',
      ],
    },
    priority: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical'],
    },
    summary: { type: 'string' },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
    },
    requiresHuman: { type: 'boolean' },
    suggestedReply: { type: 'string' },
    status: {
      type: 'string',
      enum: ['open', 'in_progress', 'resolved'],
    },
    assignedTo: {
      anyOf: [
        { type: 'string' },
        { type: 'null' },
      ],
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    labels: labelsSchema,
  },
  required: [
    'id',
    'customer',
    'channel',
    'message',
    'category',
    'priority',
    'summary',
    'confidence',
    'requiresHuman',
    'suggestedReply',
    'status',
    'assignedTo',
    'createdAt',
    'updatedAt',
    'labels',
  ],
};

export const ticketListResponseSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: ticketResponseSchema,
    },
    total: {
      type: 'integer',
      minimum: 0,
    },
  },
  required: ['data', 'total'],
};

export const metricsResponseSchema = {
  type: 'object',
  properties: {
    total: { type: 'integer', minimum: 0 },
    requiresHuman: { type: 'integer', minimum: 0 },
    byStatus: {
      type: 'object',
      properties: {
        open: { type: 'integer', minimum: 0 },
        in_progress: { type: 'integer', minimum: 0 },
        resolved: { type: 'integer', minimum: 0 },
      },
      required: ['open', 'in_progress', 'resolved'],
    },
    byCategory: {
      type: 'object',
      properties: {
        payment_access: { type: 'integer', minimum: 0 },
        access: { type: 'integer', minimum: 0 },
        payment: { type: 'integer', minimum: 0 },
        technical: { type: 'integer', minimum: 0 },
        commercial: { type: 'integer', minimum: 0 },
        general: { type: 'integer', minimum: 0 },
      },
      required: [
        'payment_access',
        'access',
        'payment',
        'technical',
        'commercial',
        'general',
      ],
    },
    byPriority: {
      type: 'object',
      properties: {
        low: { type: 'integer', minimum: 0 },
        medium: { type: 'integer', minimum: 0 },
        high: { type: 'integer', minimum: 0 },
        critical: { type: 'integer', minimum: 0 },
      },
      required: ['low', 'medium', 'high', 'critical'],
    },
  },
  required: [
    'total',
    'requiresHuman',
    'byStatus',
    'byCategory',
    'byPriority',
  ],
};

export const healthResponseSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', example: 'ok' },
    service: { type: 'string', example: 'supportflow-ai' },
    database: { type: 'string', example: 'sqlite' },
    timestamp: { type: 'string', format: 'date-time' },
  },
  required: ['status', 'service', 'database', 'timestamp'],
};

export const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', example: 'VALIDATION_ERROR' },
    message: { type: 'string' },
    details: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['error', 'message'],
};

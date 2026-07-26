import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  CreateTicketInput,
  Ticket,
  TicketCategory,
  TicketChannel,
  TicketClassification,
  TicketPriority,
  TicketStatus,
} from '../domain/ticket.js';
import type {
  TicketFilters,
  TicketRepository,
} from './ticket-repository.js';

interface TicketRow {
  id: string;
  customer: string;
  channel: string;
  message: string;
  category: string;
  priority: string;
  summary: string;
  confidence: number;
  requires_human: number;
  suggested_reply: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface TableColumn {
  name: string;
}

function mapRow(row: TicketRow): Ticket {
  return {
    id: row.id,
    customer: row.customer,
    channel: row.channel as TicketChannel,
    message: row.message,
    category: row.category as TicketCategory,
    priority: row.priority as TicketPriority,
    summary: row.summary,
    confidence: row.confidence,
    requiresHuman: row.requires_human === 1,
    suggestedReply: row.suggested_reply,
    status: row.status as TicketStatus,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SQLiteTicketRepository implements TicketRepository {
  private readonly database: DatabaseSync;

  constructor(databasePath = 'data/supportflow.db') {
    const absolutePath =
      databasePath === ':memory:' ? databasePath : resolve(databasePath);

    if (absolutePath !== ':memory:') {
      mkdirSync(dirname(absolutePath), { recursive: true });
    }

    this.database = new DatabaseSync(absolutePath, {
      timeout: 5000,
    });

    this.initialize();
  }

  private initialize(): void {
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        customer TEXT NOT NULL,
        channel TEXT NOT NULL
          CHECK (channel IN ('whatsapp', 'email', 'chat', 'portal')),
        message TEXT NOT NULL,
        category TEXT NOT NULL
          CHECK (
            category IN (
              'payment_access',
              'access',
              'payment',
              'technical',
              'commercial',
              'general'
            )
          ),
        priority TEXT NOT NULL
          CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        summary TEXT NOT NULL,
        confidence REAL NOT NULL
          CHECK (confidence >= 0 AND confidence <= 1),
        requires_human INTEGER NOT NULL
          CHECK (requires_human IN (0, 1)),
        suggested_reply TEXT NOT NULL,
        status TEXT NOT NULL
          CHECK (status IN ('open', 'in_progress', 'resolved')),
        assigned_to TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_tickets_status
        ON tickets(status);

      CREATE INDEX IF NOT EXISTS idx_tickets_category
        ON tickets(category);

      CREATE INDEX IF NOT EXISTS idx_tickets_created_at
        ON tickets(created_at);
    `);

    this.addAssignedToColumnToOlderDatabases();
  }

  private addAssignedToColumnToOlderDatabases(): void {
    const columns = this.database
      .prepare('PRAGMA table_info(tickets)')
      .all() as unknown as TableColumn[];

    const alreadyExists = columns.some(
      (column) => column.name === 'assigned_to',
    );

    if (!alreadyExists) {
      this.database.exec(
        'ALTER TABLE tickets ADD COLUMN assigned_to TEXT',
      );
    }
  }

  async create(
    input: CreateTicketInput,
    classification: TicketClassification,
  ): Promise<Ticket> {
    const now = new Date().toISOString();

    const ticket: Ticket = {
      id: randomUUID(),
      ...input,
      ...classification,
      status: 'open',
      assignedTo: null,
      createdAt: now,
      updatedAt: now,
    };

    this.database
      .prepare(`
        INSERT INTO tickets (
          id,
          customer,
          channel,
          message,
          category,
          priority,
          summary,
          confidence,
          requires_human,
          suggested_reply,
          status,
          assigned_to,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        ticket.id,
        ticket.customer,
        ticket.channel,
        ticket.message,
        ticket.category,
        ticket.priority,
        ticket.summary,
        ticket.confidence,
        ticket.requiresHuman ? 1 : 0,
        ticket.suggestedReply,
        ticket.status,
        ticket.assignedTo,
        ticket.createdAt,
        ticket.updatedAt,
      );

    return ticket;
  }

  async list(filters: TicketFilters = {}): Promise<Ticket[]> {
    const conditions: string[] = [];
    const values: string[] = [];

    if (filters.status) {
      conditions.push('status = ?');
      values.push(filters.status);
    }

    if (filters.category) {
      conditions.push('category = ?');
      values.push(filters.category);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = this.database
      .prepare(`
        SELECT *
        FROM tickets
        ${where}
        ORDER BY created_at DESC
      `)
      .all(...values) as unknown as TicketRow[];

    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Ticket | null> {
    const row = this.database
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .get(id) as TicketRow | undefined;

    return row ? mapRow(row) : null;
  }

  async updateStatus(
    id: string,
    status: TicketStatus,
  ): Promise<Ticket | null> {
    const updatedAt = new Date().toISOString();

    const result = this.database
      .prepare(`
        UPDATE tickets
        SET status = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(status, updatedAt, id);

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  }

  async assign(
    id: string,
    assignee: string | null,
  ): Promise<Ticket | null> {
    const updatedAt = new Date().toISOString();

    const result = this.database
      .prepare(`
        UPDATE tickets
        SET assigned_to = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(assignee, updatedAt, id);

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  }

  close(): void {
    this.database.close();
  }
}

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { SQLiteTicketRepository } from '../src/repositories/sqlite-ticket-repository.js';
import { classifyTicket } from '../src/services/ticket-classifier.js';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('SQLiteTicketRepository', () => {
  it('mantém o chamado e o responsável após reabrir o banco', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'supportflow-ai-'));
    directories.push(directory);

    const databasePath = join(directory, 'tickets.db');
    const input = {
      customer: 'Maria',
      channel: 'whatsapp' as const,
      message:
        'Meu pagamento foi aprovado, mas ainda não tenho acesso ao curso.',
    };

    const firstRepository = new SQLiteTicketRepository(databasePath);
    const ticket = await firstRepository.create(
      input,
      classifyTicket(input),
    );

    await firstRepository.assign(ticket.id, 'Daniel');
    firstRepository.close();

    const secondRepository = new SQLiteTicketRepository(databasePath);
    const persistedTicket = await secondRepository.findById(ticket.id);

    expect(persistedTicket).toMatchObject({
      id: ticket.id,
      customer: 'Maria',
      category: 'payment_access',
      status: 'open',
      assignedTo: 'Daniel',
    });

    secondRepository.close();
  });

  it('filtra chamados por status e categoria', async () => {
    const repository = new SQLiteTicketRepository(':memory:');

    const accessInput = {
      customer: 'Ana',
      channel: 'chat' as const,
      message: 'Nao consigo acessar minha conta com minha senha.',
    };

    const commercialInput = {
      customer: 'João',
      channel: 'email' as const,
      message: 'Gostaria de saber o valor do plano anual.',
    };

    const accessTicket = await repository.create(
      accessInput,
      classifyTicket(accessInput),
    );

    await repository.create(
      commercialInput,
      classifyTicket(commercialInput),
    );

    await repository.updateStatus(accessTicket.id, 'resolved');

    const resolved = await repository.list({ status: 'resolved' });
    const commercial = await repository.list({
      category: 'commercial',
    });

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.id).toBe(accessTicket.id);
    expect(commercial).toHaveLength(1);
    expect(commercial[0]?.customer).toBe('João');

    repository.close();
  });
});

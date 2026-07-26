import { describe, expect, it } from 'vitest';
import { classifyTicket } from '../src/services/ticket-classifier.js';

describe('classifyTicket', () => {
  it('classifica pagamento aprovado sem acesso como alta prioridade', () => {
    const result = classifyTicket({
      customer: 'Maria',
      channel: 'whatsapp',
      message:
        'Meu pagamento foi aprovado, mas ainda não tenho acesso ao curso.',
    });

    expect(result.category).toBe('payment_access');
    expect(result.priority).toBe('high');
    expect(result.requiresHuman).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('classifica interesse em plano como comercial', () => {
    const result = classifyTicket({
      customer: 'João',
      channel: 'chat',
      message: 'Gostaria de saber o preço e os detalhes do plano anual.',
    });

    expect(result.category).toBe('commercial');
    expect(result.priority).toBe('low');
  });

  it('classifica indisponibilidade geral como crítica', () => {
    const result = classifyTicket({
      customer: 'Equipe Operacional',
      channel: 'portal',
      message: 'O sistema está fora e indisponível para todos os usuários.',
    });

    expect(result.category).toBe('technical');
    expect(result.priority).toBe('critical');
    expect(result.requiresHuman).toBe(true);
  });
});

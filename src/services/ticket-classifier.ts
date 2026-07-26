import type {
  CreateTicketInput,
  TicketCategory,
  TicketClassification,
  TicketPriority,
} from '../domain/ticket.js';

type KeywordRule = {
  category: TicketCategory;
  keywords: string[];
};

const categoryRules: KeywordRule[] = [
  {
    category: 'payment_access',
    keywords: [
      'pagamento aprovado',
      'paguei e nao tenho acesso',
      'paguei mas nao tenho acesso',
      'pagamento confirmado sem acesso',
      'compra aprovada sem acesso',
    ],
  },
  {
    category: 'access',
    keywords: [
      'acesso',
      'login',
      'senha',
      'entrar',
      'liberacao',
      'liberado',
      'bloqueado',
    ],
  },
  {
    category: 'payment',
    keywords: [
      'pagamento',
      'pix',
      'boleto',
      'cobranca',
      'reembolso',
      'estorno',
      'fatura',
    ],
  },
  {
    category: 'technical',
    keywords: [
      'erro',
      'falha',
      'bug',
      'integracao',
      'webhook',
      'api',
      'sistema',
      'indisponivel',
    ],
  },
  {
    category: 'commercial',
    keywords: [
      'preco',
      'valor',
      'plano',
      'contratar',
      'comprar',
      'orcamento',
      'proposta',
    ],
  },
];

const criticalKeywords = [
  'sistema fora',
  'todos os usuarios',
  'indisponivel para todos',
  'incidente geral',
  'vazamento',
];

const urgentKeywords = [
  'urgente',
  'nao consigo acessar',
  'nao tenho acesso',
  'pagamento aprovado',
  'cliente parado',
  'producao',
];

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.reduce(
    (total, keyword) => total + (text.includes(keyword) ? 1 : 0),
    0,
  );
}

function detectCategory(normalizedMessage: string): {
  category: TicketCategory;
  confidence: number;
} {
  const scores = categoryRules.map((rule) => ({
    category: rule.category,
    score: countMatches(normalizedMessage, rule.keywords),
  }));

  const paymentScore =
    scores.find((item) => item.category === 'payment')?.score ?? 0;
  const accessScore =
    scores.find((item) => item.category === 'access')?.score ?? 0;

  if (paymentScore > 0 && accessScore > 0) {
    return { category: 'payment_access', confidence: 0.96 };
  }

  const winner = scores.sort((a, b) => b.score - a.score)[0];

  if (!winner || winner.score === 0) {
    return { category: 'general', confidence: 0.55 };
  }

  const confidence = Math.min(0.65 + winner.score * 0.12, 0.95);
  return { category: winner.category, confidence };
}

function detectPriority(
  normalizedMessage: string,
  category: TicketCategory,
): TicketPriority {
  if (criticalKeywords.some((keyword) => normalizedMessage.includes(keyword))) {
    return 'critical';
  }

  if (
    category === 'payment_access' ||
    urgentKeywords.some((keyword) => normalizedMessage.includes(keyword))
  ) {
    return 'high';
  }

  if (
    category === 'access' ||
    category === 'payment' ||
    category === 'technical'
  ) {
    return 'medium';
  }

  return 'low';
}

function buildSummary(
  message: string,
  category: TicketCategory,
): string {
  const cleanMessage = message.replace(/\s+/g, ' ').trim();
  const shortened =
    cleanMessage.length > 110
      ? `${cleanMessage.slice(0, 107).trim()}...`
      : cleanMessage;

  const labels: Record<TicketCategory, string> = {
    payment_access: 'Pagamento e acesso',
    access: 'Acesso',
    payment: 'Pagamento',
    technical: 'Problema técnico',
    commercial: 'Interesse comercial',
    general: 'Solicitação geral',
  };

  return `${labels[category]}: ${shortened}`;
}

function buildSuggestedReply(
  customer: string,
  category: TicketCategory,
): string {
  const firstName = customer.trim().split(/\s+/)[0] ?? customer;

  const replies: Record<TicketCategory, string> = {
    payment_access:
      `Olá, ${firstName}! Vou verificar os dados do pagamento e o status do seu acesso. ` +
      'Para seguirmos com segurança, não envie senhas ou dados completos do cartão.',
    access:
      `Olá, ${firstName}! Vou ajudar com o seu acesso. ` +
      'Confirme, por favor, qual mensagem aparece ao tentar entrar.',
    payment:
      `Olá, ${firstName}! Vou analisar a situação do pagamento. ` +
      'Informe apenas o identificador do pedido ou os últimos dados não sensíveis disponíveis.',
    technical:
      `Olá, ${firstName}! Vou investigar o comportamento informado. ` +
      'Pode me dizer quando o erro começou e quais passos você realizou antes dele acontecer?',
    commercial:
      `Olá, ${firstName}! Obrigado pelo interesse. ` +
      'Vou organizar sua necessidade para direcionar a melhor opção.',
    general:
      `Olá, ${firstName}! Recebi sua solicitação e vou analisar o melhor encaminhamento para ajudar.`,
  };

  return replies[category];
}

function shouldRequireHuman(
  category: TicketCategory,
  priority: TicketPriority,
): boolean {
  return (
    priority === 'critical' ||
    priority === 'high' ||
    category === 'payment' ||
    category === 'general'
  );
}

export function classifyTicket(
  input: CreateTicketInput,
): TicketClassification {
  const normalizedMessage = normalizeText(input.message);
  const { category, confidence } = detectCategory(normalizedMessage);
  const priority = detectPriority(normalizedMessage, category);

  return {
    category,
    priority,
    summary: buildSummary(input.message, category),
    confidence,
    requiresHuman: shouldRequireHuman(category, priority),
    suggestedReply: buildSuggestedReply(input.customer, category),
  };
}

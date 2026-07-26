# SupportFlow AI

Criei este projeto para praticar TypeScript em um problema próximo da minha
rotina: receber uma solicitação de suporte, organizar as informações e indicar
o melhor encaminhamento.

A ideia não é substituir uma equipe de atendimento. O objetivo é automatizar a
triagem inicial, deixando o chamado mais claro para quem vai atendê-lo.

## O que o projeto faz

Quando uma mensagem chega, a API:

- valida os dados recebidos;
- identifica a categoria e a prioridade;
- gera um resumo;
- sugere uma primeira resposta;
- informa se o caso precisa de uma pessoa;
- permite definir um responsável;
- salva o chamado em SQLite;
- mantém os dados após o servidor reiniciar;
- gera métricas básicas.

Os códigos internos continuam em inglês, porque são mais fáceis de usar no
código e nos filtros. A resposta da API também traz rótulos em português para
facilitar a leitura.

## Exemplo de uso

Uma mensagem como:

```text
Meu pagamento foi aprovado, mas ainda não tenho acesso ao curso.
```

é classificada como:

```text
Categoria: Pagamento e acesso
Prioridade: Alta
Status: Aberto
Precisa de atendimento humano: Sim
```

## Tecnologias que estou praticando

- TypeScript;
- Node.js;
- Fastify;
- APIs REST;
- validação com Zod;
- SQLite;
- testes com Vitest;
- documentação OpenAPI com Swagger UI;
- organização do código em camadas.

## Como executar

É necessário usar Node.js 22.13 ou mais recente.

```bash
npm install
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3333
```

O banco é criado automaticamente em:

```text
data/supportflow.db
```

A documentação interativa fica disponível em:

```text
http://localhost:3333/docs
```

Nessa página é possível visualizar e testar as rotas pelo navegador.

## Testes

```bash
npm test
```

Os testes cobrem:

- classificação dos chamados;
- validação das rotas;
- criação e atualização;
- atribuição de responsável;
- persistência no SQLite.

## Rotas

| Método | Rota | O que faz |
|---|---|---|
| GET | `/health` | Verifica se a API está funcionando |
| POST | `/tickets` | Cria e classifica um chamado |
| GET | `/tickets` | Lista os chamados |
| GET | `/tickets/:id` | Busca um chamado |
| PATCH | `/tickets/:id/status` | Atualiza o status |
| PATCH | `/tickets/:id/assignee` | Define ou remove o responsável |
| GET | `/metrics` | Exibe métricas simples |

## Criando um chamado no PowerShell

```powershell
$body = @{
  customer = "Maria"
  channel  = "whatsapp"
  message  = "Meu pagamento foi aprovado, mas ainda nao tenho acesso ao curso."
} | ConvertTo-Json -Compress

$utf8Body = [System.Text.Encoding]::UTF8.GetBytes($body)

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3333/tickets" `
  -ContentType "application/json; charset=utf-8" `
  -Body $utf8Body
```

## Definindo um responsável

Primeiro copie o `id` retornado na criação do chamado:

```powershell
$ticketId = "COLE_O_ID_AQUI"

$body = @{
  assignee = "Daniel"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3333/tickets/$ticketId/assignee" `
  -ContentType "application/json" `
  -Body $body
```

Para remover o responsável, envie `null`:

```json
{
  "assignee": null
}
```

## Como fui evoluindo o projeto

1. Comecei com os chamados salvos apenas em memória.
2. Adicionei testes para validar as regras.
3. Troquei o armazenamento por SQLite.
4. Adicionei responsável pelo chamado e rótulos em português.

Esse histórico também está registrado no [CHANGELOG](CHANGELOG.md).

## Uso de inteligência artificial

Usei ferramentas de IA como apoio para estudar conceitos, revisar partes do
código e identificar possíveis melhorias. As decisões do projeto, os testes e
as alterações foram validados por mim durante o desenvolvimento.

Mais detalhes estão em [docs/uso-de-ia.md](docs/uso-de-ia.md).

## Limitações atuais

- a classificação ainda usa regras por palavras-chave;
- não há autenticação;
- não existe interface visual;
- as métricas ainda são simples;
- o projeto ainda não está publicado em um servidor.

## Próximos passos

- publicar a documentação junto com a API;
- criar uma interface simples;
- permitir comentários no histórico do chamado;
- integrar uma LLM de forma opcional;
- publicar a API.

## Observação

Todos os nomes, mensagens e cenários são fictícios. O repositório não utiliza
dados, credenciais ou fluxos privados de nenhuma empresa.

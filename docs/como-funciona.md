# Como o projeto funciona

Este arquivo é uma anotação de estudo para eu conseguir explicar o projeto sem
depender apenas do código.

## 1. Entrada da requisição

A criação começa na rota:

```text
POST /tickets
```

A rota recebe nome, canal e mensagem.

## 2. Validação

O Zod verifica se:

- o nome possui tamanho válido;
- o canal está entre os canais permitidos;
- a mensagem possui conteúdo suficiente.

Se algo estiver errado, a API responde com erro 400.

## 3. Classificação

O arquivo `ticket-classifier.ts` normaliza a mensagem e procura palavras-chave.

Exemplo:

- `pagamento`, `pix` e `boleto` apontam para pagamento;
- `senha`, `login` e `acesso` apontam para acesso;
- quando pagamento e acesso aparecem juntos, a categoria vira
  `payment_access`.

Depois, outra regra define a prioridade.

## 4. Persistência

O repositório recebe o chamado classificado e grava os dados no SQLite.

Usei uma interface de repositório para não prender as rotas diretamente ao
banco. Por isso existem duas implementações:

- uma em memória, utilizada nos testes da API;
- uma com SQLite, utilizada quando o servidor roda normalmente.

## 5. Apresentação

Os valores internos continuam em inglês, como `high` e `open`.

Antes de enviar a resposta, o presenter acrescenta rótulos como `Alta` e
`Aberto`. Assim, a lógica interna continua padronizada e a saída fica mais
amigável.

## 6. Documentação OpenAPI

O `@fastify/swagger` lê os schemas definidos nas rotas e gera uma especificação
OpenAPI.

O `@fastify/swagger-ui` transforma essa especificação em uma página interativa
disponível em:

```text
http://localhost:3333/docs
```

Usei os schemas do Zod para gerar a documentação dos corpos das requisições.
Os schemas de resposta ficam em `src/docs/openapi.schemas.ts`.

## 7. Testes

Os testes verificam quatro partes:

- regras de classificação;
- comportamento das rotas;
- persistência do banco;
- geração da documentação OpenAPI.

O teste de persistência fecha o banco, abre novamente e confirma que o chamado
continua salvo.

## O que ainda quero entender melhor

- migrations de banco de dados;
- autenticação;
- integração segura com modelos de linguagem;
- deploy e observabilidade.

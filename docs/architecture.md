# Arquitetura

## Fluxo principal

```mermaid
flowchart LR
    A[Cliente envia mensagem] --> B[POST /tickets]
    B --> C[Validação com Zod]
    C --> D[Classificador]
    D --> E[Categoria e prioridade]
    D --> F[Resumo e resposta sugerida]
    E --> G[Repositório]
    F --> G
    G --> H[Resposta da API]
```

## Camadas

### Domain

Define os tipos e as entidades centrais do projeto.

### Schemas

Valida os dados recebidos pela API.

### Services

Concentra as regras de classificação e priorização.

### Repositories

Abstrai o armazenamento. O MVP utiliza memória, permitindo substituir a
implementação por SQLite ou PostgreSQL sem alterar as rotas.

### Routes

Expõe as funcionalidades por meio de endpoints HTTP.

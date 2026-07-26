# Deploy no Railway

O projeto utiliza `railway.json` para manter parte da configuração de deploy
versionada junto ao código.

## Configuração automática

O arquivo define:

- build com Railpack;
- instalação reproduzível com `npm ci`;
- compilação com `npm run build`;
- inicialização com `npm start`;
- health check em `/health`;
- reinício automático em caso de falha.

## Configuração manual no Railway

Depois de conectar o repositório ao Railway:

1. Crie um volume e conecte-o ao serviço da API.
2. Configure o caminho de montagem como:

```text
/app/data
```

3. Na aba **Variables**, adicione:

```text
DB_PATH=/app/data/supportflow.db
NODE_ENV=production
```

O Railway fornece a variável `PORT` automaticamente. O servidor já utiliza
`process.env.PORT`, portanto não é necessário criar essa variável manualmente.

## Criar o domínio público

No serviço da API:

1. Abra **Settings**;
2. localize **Networking**;
3. clique em **Generate Domain**.

Depois, teste:

```text
https://SEU-DOMINIO.railway.app/health
https://SEU-DOMINIO.railway.app/docs
```

## Persistência

O SQLite fica armazenado dentro do volume em:

```text
/app/data/supportflow.db
```

Sem o volume, o armazenamento do serviço é temporário e o banco pode ser
perdido após novos deploys ou reinicializações.

## Observação sobre deploys com volume

Como apenas um deployment pode utilizar o volume por vez, pode existir uma
breve indisponibilidade durante uma nova publicação.

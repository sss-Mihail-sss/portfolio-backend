# Portfolio with elysia

## Getting Started

```text
src/
├── main.ts                         # только listen + graceful shutdown (SIGINT/SIGTERM → app.stop())
├── app/
│   ├── app.ts                      # композиция: глобальные плагины + router
│   └── router.ts                   # монтирует фичи; export type App = typeof app — для Eden Treaty
├── config/
│   ├── env.ts                      # TypeBox-валидация process.env (уже есть)
│   └── logger.ts
├── db/
│   ├── schema.ts                   # prisma-next contract — единственный источник правды
│   ├── schema.json / schema.d.ts   # генерируются, коммитятся, проверяются в CI (emit:check уже есть)
│   ├── client.ts                   # singleton клиента
│   ├── db.plugin.ts                # named-плагин с onStop → close()
│   └── seed.ts
├── plugins/                        # кросс-каттинг: error, logger, rate-limit, redis, ip, user-agent
│   └── auth.plugin.ts              # macro-guard (см. ниже), а не derive + auth!
├── features/
│   └── <feature>/
│       ├── index.ts                # Elysia-инстанс: только HTTP (парсинг, куки, статусы)
│       ├── schemas.ts              # TypeBox: body + response-схемы (важно для Eden/OpenAPI)
│       ├── commands/               # use-case = чистая функция, зависимости первым аргументом
│       ├── queries/                # чтение отдельно от записи, когда появится
│       ├── repos/                  # доступ к данным поверх db-клиента
│       ├── repos.plugin.ts         # decorate реп (named, дедуплицируется)
│       └── errors.ts               # типизированные AppError фичи
├── mail/                           # mailer + react-email шаблоны
└── shared/                         # errors, crypto, messages — без зависимостей на фичи

```

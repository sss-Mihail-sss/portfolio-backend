# Elysia with Bun runtime

## Getting Started

To get started with this template, simply paste this command into your terminal:

```bash
bun create elysia ./elysia-example
```

## Development

To start the development server run:

```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

```text
src/
  ├── app.ts
  ├── app.routes.ts
  │
  ├── infrastructure/                      # Внешние зависимости
  │   ├── database/
  │   │   └── contract.ts                  # @prisma-next схема (расширить)
  │   ├── env.ts
  │   ├── logger.ts
  │   ├── cache/
  │   │   └── cache.service.ts             # Redis (OTP, rate-limit, сессии)
  │   ├── mailer/
  │   │   ├── mailer.service.ts            # Resend / Nodemailer
  │   │   └── templates/                   # React Email / MJML шаблоны
  │   └── sms/
  │       └── sms.service.ts               # Twilio / AWS SNS
  │
  ├── plugins/                             # Elysia cross-cutting plugins
  │   ├── error.plugin.ts                  ✓
  │   ├── logger.plugin.ts                 ✓
  │   ├── jwt.plugin.ts                    ✓
  │   ├── session.plugin.ts                # derive: user из access token
  │   ├── tenant.plugin.ts                 # derive: org + membership из header
  │   ├── permission.plugin.ts             # macro: requires("resource:action")
  │   ├── i18n.plugin.ts                   # derive: t(), locale из Accept-Language
  │   ├── rate-limit.plugin.ts             # macro: rateLimit({ window, max })
  │   └── auth.guard.plugin.ts             ✓ (доработать)
  │
  ├── modules/
  │   │
  │   ├── auth/
  │   │   ├── domain/
  │   │   │   ├── entities/
  │   │   │   │   ├── session.entity.ts
  │   │   │   │   └── identity.entity.ts
  │   │   │   └── value-objects/
  │   │   │       ├── password.vo.ts       # bcrypt hash/verify
  │   │   │       └── token.vo.ts          # signed URL / OTP генерация
  │   │   ├── application/
  │   │   │   ├── commands/
  │   │   │   │   ├── credential-sign-in.command.ts
  │   │   │   │   ├── sign-up.command.ts
  │   │   │   │   ├── sign-out.command.ts
  │   │   │   │   ├── refresh-token.command.ts
  │   │   │   │   ├── send-magic-link.command.ts
  │   │   │   │   ├── verify-magic-link.command.ts
  │   │   │   │   ├── send-otp.command.ts
  │   │   │   │   ├── verify-otp.command.ts
  │   │   │   │   ├── oauth-callback.command.ts
  │   │   │   │   ├── passkey-register-begin.command.ts
  │   │   │   │   ├── passkey-register-finish.command.ts
  │   │   │   │   ├── passkey-auth-begin.command.ts
  │   │   │   │   └── passkey-auth-finish.command.ts
  │   │   │   └── queries/
  │   │   │       └── list-sessions.query.ts
  │   │   ├── infrastructure/
  │   │   │   ├── auth.routes.ts
  │   │   │   ├── session.repository.ts
  │   │   │   ├── identity.repository.ts
  │   │   │   └── verification-token.repository.ts
  │   │   └── providers/
  │   │       ├── credential.provider.ts
  │   │       ├── magic-link.provider.ts
  │   │       ├── otp.provider.ts
  │   │       ├── passkey.provider.ts      # @simplewebauthn/server
  │   │       ├── oauth/
  │   │       │   ├── oauth.provider.ts    # базовый PKCE flow
  │   │       │   ├── google.provider.ts
  │   │       │   ├── github.provider.ts
  │   │       │   └── apple.provider.ts
  │   │       └── sso/
  │   │           ├── saml.provider.ts     # samlify
  │   │           └── oidc.provider.ts     # openid-client
  │   │
  │   ├── users/
  │   │   ├── domain/entities/user.entity.ts
  │   │   ├── application/
  │   │   │   ├── commands/
  │   │   │   │   ├── update-profile.command.ts
  │   │   │   │   ├── change-email.command.ts
  │   │   │   │   ├── verify-email.command.ts
  │   │   │   │   ├── verify-phone.command.ts
  │   │   │   │   └── delete-account.command.ts
  │   │   │   └── queries/get-me.query.ts
  │   │   └── infrastructure/
  │   │       ├── user.routes.ts
  │   │       └── user.repository.ts
  │   │
  │   ├── organizations/
  │   │   ├── domain/entities/
  │   │   │   ├── organization.entity.ts
  │   │   │   └── membership.entity.ts
  │   │   ├── application/
  │   │   │   ├── commands/
  │   │   │   │   ├── create-organization.command.ts
  │   │   │   │   ├── update-organization.command.ts
  │   │   │   │   ├── invite-member.command.ts
  │   │   │   │   ├── accept-invite.command.ts
  │   │   │   │   ├── update-member-role.command.ts
  │   │   │   │   └── remove-member.command.ts
  │   │   │   └── queries/
  │   │   │       ├── get-organization.query.ts
  │   │   │       └── list-members.query.ts
  │   │   └── infrastructure/
  │   │       ├── organization.routes.ts
  │   │       ├── organization.repository.ts
  │   │       ├── membership.repository.ts
  │   │       └── invitation.repository.ts
  │   │
  │   ├── teams/
  │   │   ├── domain/entities/team.entity.ts
  │   │   ├── application/commands/ queries/
  │   │   └── infrastructure/
  │   │       ├── team.routes.ts
  │   │       └── team.repository.ts
  │   │
  │   ├── rbac/
  │   │   ├── domain/entities/
  │   │   │   ├── role.entity.ts
  │   │   │   └── permission.entity.ts
  │   │   ├── application/
  │   │   │   ├── commands/
  │   │   │   │   ├── create-role.command.ts
  │   │   │   │   ├── assign-permission.command.ts
  │   │   │   │   └── assign-role.command.ts
  │   │   │   └── queries/
  │   │   │       └── check-permission.query.ts
  │   │   ├── infrastructure/
  │   │   │   ├── rbac.routes.ts
  │   │   │   └── rbac.repository.ts
  │   │   └── rbac.service.ts              # кеширует permissions в Redis
  │   │
  │   ├── notifications/
  │   │   ├── domain/entities/notification.entity.ts
  │   │   ├── application/
  │   │   │   ├── channels/
  │   │   │   │   ├── channel.interface.ts
  │   │   │   │   ├── email.channel.ts
  │   │   │   │   └── sms.channel.ts
  │   │   │   ├── notification.service.ts  # оркестратор каналов
  │   │   │   └── commands/send-notification.command.ts
  │   │   └── infrastructure/
  │   │       ├── notification.routes.ts   # preferences, history
  │   │       ├── template.repository.ts
  │   │       └── notification-log.repository.ts
  │   │
  │   ├── subscriptions/
  │   │   ├── domain/entities/
  │   │   │   ├── plan.entity.ts
  │   │   │   └── subscription.entity.ts
  │   │   ├── application/
  │   │   │   ├── commands/
  │   │   │   │   ├── create-subscription.command.ts
  │   │   │   │   ├── change-plan.command.ts
  │   │   │   │   └── cancel-subscription.command.ts
  │   │   │   └── queries/
  │   │   │       ├── get-active-plan.query.ts
  │   │   │       └── check-feature-access.query.ts
  │   │   ├── infrastructure/
  │   │   │   ├── subscription.routes.ts
  │   │   │   ├── plan.repository.ts
  │   │   │   └── subscription.repository.ts
  │   │   └── subscription.service.ts     # guard: hasFeature(), getLimit()
  │   │
  │   └── i18n/
  │       ├── locales/
  │       │   ├── en.json
  │       │   ├── ru.json
  │       │   └── de.json
  │       └── i18n.service.ts             # t(key, vars, locale)
  │
  └── shared/
      ├── types/
      │   ├── access-token.ts
      │   ├── refresh-token.ts
      │   ├── pagination.ts                # t.Object cursor/offset schemas
      │   └── context.ts                   # AppContext type
      └── utils/
          ├── hash.ts                      # crypto helpers
          └── slug.ts

```

База данных — новые модели (дополнение к contract.ts)

User
id, email, emailVerifiedAt, phoneNumber, phoneNumberVerifiedAt
locale (default: "en"), timezone (default: "UTC")
→ identities[], sessions[], memberships[]

UserIdentity # одна запись на каждый способ входа
id, userId
provider: CREDENTIAL | GOOGLE | GITHUB | APPLE | MICROSOFT | PASSKEY | SSO
providerAccountId: string # email / OAuth sub / credentialId
passwordHash? # только CREDENTIAL
externalAccessToken? # OAuth/SSO
externalRefreshToken?
tokenExpiresAt?
credentialPublicKey? # Passkey (bytes)
counter? # Passkey replay protection
createdAt, updatedAt

VerificationToken # OTP, magic link, email/phone verify, password reset
id, type: EMAIL_VERIFY | PHONE_VERIFY | PASSWORD_RESET | MAGIC_LINK | OTP_EMAIL | OTP_SMS
target: string # email или номер телефона
tokenHash: string # bcrypt hash от токена/OTP
expiresAt, usedAt?
attempts: int # защита от брутфорса
createdAt

Organization
id, name, slug (unique), logoUrl?
ssoEnabled: boolean
createdAt, updatedAt
→ memberships[], teams[], subscription?

SsoConfiguration # одна на организацию
id, organizationId
provider: SAML | OIDC
domain: string # example.com → редирект на SSO
config: JSON # entryPoint, cert, clientId и т.д.
createdAt, updatedAt

Membership # User ↔ Organization
id, userId, organizationId
role: OWNER | ADMIN | MEMBER | VIEWER
invitedByUserId?
joinedAt?
createdAt, updatedAt

Invitation
id, organizationId, email
role: OWNER | ADMIN | MEMBER | VIEWER
invitedByUserId, tokenHash
expiresAt, acceptedAt?
createdAt

Team
id, organizationId, name, slug
createdAt, updatedAt

TeamMembership
id, teamId, userId
role: LEAD | MEMBER
createdAt

Role # глобальные + org-уровень
id, organizationId? # null = системная роль
name, slug
createdAt, updatedAt

Permission
id, resource: string # "users" | "organizations" | "billing" | ...
action: string # "read" | "write" | "delete" | "manage"

RolePermission
roleId, permissionId

UserRoleAssignment
userId, roleId
organizationId?, teamId? # scope
grantedAt, expiresAt?

Plan
id, name, slug
price: Decimal, interval: MONTHLY | YEARLY | LIFETIME
isPublic: boolean, isActive: boolean
createdAt, updatedAt

Feature
id, key: string # "max_members" | "sso_enabled" | "api_calls_month"
type: BOOLEAN | LIMIT | METERED

PlanFeature
planId, featureId
value: string # "true" | "50" | "10000"

Subscription
id, organizationId
planId, status: TRIAL | ACTIVE | PAST_DUE | CANCELLED | EXPIRED
trialEndsAt?, currentPeriodStart, currentPeriodEnd
cancelledAt?, externalId? # Stripe subscription ID
createdAt, updatedAt

NotificationTemplate # шаблоны с i18n
id, key: string # "auth.magic_link" | "auth.otp" | "invite.member"
channel: EMAIL | SMS
locale: string
subject? # только EMAIL
body: string # {{variable}} синтаксис
createdAt, updatedAt

NotificationLog
id, userId?, channel, recipient
templateKey, variables: JSON
status: QUEUED | SENT | FAILED | DELIVERED
sentAt?, failedAt?, error?
createdAt

NotificationPreference
userId
channel: EMAIL | SMS
category: string # "auth" | "billing" | "invites" | "product"
enabled: boolean

---

Plugins — ответственности

// session.plugin.ts — resolve user из access token (заменяет auth.guard)
.derive({ as: "scoped" }, async ({ cookie, accessJwt }) => {
// → { user: { id, sessionId } | null }
})

// tenant.plugin.ts — resolve org/team контекст
.derive({ as: "scoped" }, async ({ headers, user }) => {
// читает X-Organization-Id header
// проверяет membership
// → { org: { id, role } | null }
})

// permission.plugin.ts — RBAC macro
.macro({
requires: (permission: `${string}:${string}`) => ({
async beforeHandle({ user, org }) {
// rbacService.check(user.id, permission, org?.id)
// кешируется в Redis на 60s
}
})
})

// i18n.plugin.ts — locale detection
.derive({ as: "global" }, ({ headers, user }) => {
// Accept-Language → user.locale → "en"
// → { t: (key, vars?) => string, locale: string }
})

// rate-limit.plugin.ts — защита для auth endpoints
.macro({
rateLimit: ({ window: number, max: number, key?: "ip" | "user" }) => ({
async beforeHandle({ request, user }) {
// Redis INCR с TTL
}
})
})

---

Auth routes

POST /auth/sign-up
POST /auth/sign-in
POST /auth/sign-out
POST /auth/refresh

GET /auth/oauth/:provider # redirect → provider
GET /auth/oauth/:provider/callback # обработка кода

POST /auth/magic-link/send
POST /auth/magic-link/verify

POST /auth/otp/send # { target: email|phone, type: "email"|"sms" }
POST /auth/otp/verify

POST /auth/passkey/register/begin
POST /auth/passkey/register/finish
POST /auth/passkey/authenticate/begin
POST /auth/passkey/authenticate/finish

GET /auth/sso/:orgSlug # redirect → IdP (SAML/OIDC)
POST /auth/sso/callback

POST /auth/password/reset/request
POST /auth/password/reset/confirm

GET /auth/sessions # активные сессии пользователя
DELETE /auth/sessions/:sessionId # отозвать конкретную сессию

---

RBAC — модель

System roles: SUPER_ADMIN → все права
Org roles: OWNER > ADMIN > MEMBER > VIEWER
Team roles: LEAD > MEMBER

Permissions: "<resource>:<action>"
users:read, users:write, users:delete
organizations:read, organizations:manage
teams:read, teams:manage
billing:read, billing:manage
rbac:read, rbac:manage
sso:manage

Проверка в порядке приоритета:

1. Прямое назначение UserRoleAssignment
2. Org membership role
3. System role
4. Кеш в Redis (TTL 60s) — invalidate при изменении ролей

   ***

   Subscriptions — Feature Guard

// В subscription.service.ts:
hasFeature(orgId, "sso_enabled") // boolean feature
getLimit(orgId, "max_members") // number | Infinity
checkUsage(orgId, "api_calls_month") // usage vs limit

// В маршрутах:
.use(subscriptionGuardPlugin)
.macro({
requiresFeature: (key: string) => ({
async beforeHandle({ org }) {
const ok = await subscriptionService.hasFeature(org.id, key);
if (!ok) throw new ForbiddenError("Feature not available on current plan");
}
})
})

---

Notifications — архитектура

NotificationService.send(notification)
→ определяет channel (EMAIL | SMS)
→ загружает шаблон по key + locale из БД
→ рендерит template с переменными
→ вызывает EmailChannel или SmsChannel
→ сохраняет NotificationLog

EmailChannel → mailer.service.ts → Resend API
SmsChannel → sms.service.ts → Twilio API

---

i18n — стратегия

┌──────────────────────────┬─────────────────────────────────────────────────────┐
│ Что │ Где хранится │
├──────────────────────────┼─────────────────────────────────────────────────────┤
│ UI-сообщения, ошибки API │ locales/\*.json (статика, fast lookup) │
├──────────────────────────┼─────────────────────────────────────────────────────┤
│ Email/SMS шаблоны │ NotificationTemplate в БД (можно менять без деплоя) │
├──────────────────────────┼─────────────────────────────────────────────────────┤
│ Данные пользователя │ user.locale поле │
├──────────────────────────┼─────────────────────────────────────────────────────┤
│ Определение локали │ Accept-Language → user.locale → "en" │
└──────────────────────────┴─────────────────────────────────────────────────────┘

---

Порядок подключения плагинов в app.ts

new Elysia()
.use(cors())
.use(errorPlugin) // 1. форматирует все ошибки
.use(loggerPlugin) // 2. логирует запросы
.use(i18nPlugin) // 3. определяет locale (нужен для error messages)
.use(sessionPlugin) // 4. resolve user из токена
.use(tenantPlugin) // 5. resolve org context (зависит от user)
.use(AppRoutes)

---

Что реализовано сейчас vs что нужно добавить

┌──────────────────────────────┬────────────────┐
│ Компонент │ Статус │
├──────────────────────────────┼────────────────┤
│ logger plugin │ ✅ готов │
├──────────────────────────────┼─────────────────────────────────┤
│ error plugin + AppError │ ✅ готов │
├──────────────────────────────┼─────────────────────────────────┤
│ JWT (access + refresh) │ ✅ готов │
├──────────────────────────────┼─────────────────────────────────┤
│ credential sign-in / refresh │ 🔧 в процессе │
├──────────────────────────────┼─────────────────────────────────┤
│ session plugin │ ❌ пустой файл │
├──────────────────────────────┼─────────────────────────────────┤
│ permission plugin │ ❌ пустой файл │
├──────────────────────────────┼─────────────────────────────────┤
│ UserIdentity модель │ ❌ нужно добавить в contract.ts │
├──────────────────────────────┼─────────────────────────────────┤
│ VerificationToken модель │ ❌ │
├──────────────────────────────┼─────────────────────────────────┤
│ Organization / Membership │ ❌ │
├──────────────────────────────┼─────────────────────────────────┤
│ RBAC │ ❌ │
├──────────────────────────────┼─────────────────────────────────┤
│ OAuth providers │ ❌ │
├──────────────────────────────┼─────────────────────────────────┤
│ Passkey │ ❌ │
├──────────────────────────────┼─────────────────────────────────┤
│ Magic link / OTP │ ❌ │
├──────────────────────────────┼─────────────────────────────────┤
│ SSO │ ❌ │
├──────────────────────────────┼─────────────────────────────────┤
│ Notifications │ ❌ │
├──────────────────────────────┼─────────────────────────────────┤
│ Subscriptions │ ❌ │
├──────────────────────────────┼─────────────────────────────────┤
│ i18n │ ❌ │
└──────────────────────────────┴─────────────────────────────────┘

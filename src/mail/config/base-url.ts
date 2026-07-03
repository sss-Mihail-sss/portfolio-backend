// Read loosely on purpose: templates also run under the react-email preview
// server (`bun run email`), where the strict schema in src/config/env.ts
// would fail on missing variables. Empty fallback keeps preview-relative
// paths (/static/...) working; in production PUBLIC_URL must be set or
// email images will be broken.
// oxlint-disable-next-line node/no-process-env
export const baseUrl = process.env.PUBLIC_URL ?? "";
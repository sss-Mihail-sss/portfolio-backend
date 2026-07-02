import type { Static } from "typebox";

import { t } from "elysia";

// Single error shape for the whole API — referenced by response schemas
// and produced by the error plugin.
export const ErrorShape = t.Object({ code: t.String(), message: t.String() });
export type ErrorShape = Static<typeof ErrorShape>;

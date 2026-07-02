import { Elysia } from "elysia";

import { authFeature } from "../features/auth";
import { usersFeature } from "../features/users";

export const router = new Elysia().use(authFeature).use(usersFeature);

import { Resend } from "resend";

import { env } from "../config/env";

export const mailer = new Resend(env.RESEND_API_KEY);

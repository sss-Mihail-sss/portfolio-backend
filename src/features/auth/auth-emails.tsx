import type { Resend } from "resend";

import { SignJWT } from "jose";
import React from "react";

import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { DEFAULT_LOCALE } from "../../mail/config/translator";
import { ConfirmEmail } from "../../mail/templates/confirm-email";
import { WelcomeEmail } from "../../mail/templates/welcome";

const COMPANY_NAME = "Dither";

/**
 * Creates a self-contained JWT for email verification.
 * Signed with ACCESS_JWT_SECRET, valid for 24 h.
 * No DB row required — the token is verified by signature on click.
 */
async function createVerificationToken(userId: string, email: string): Promise<string> {
  const secret = new TextEncoder().encode(env.ACCESS_JWT_SECRET);
  return new SignJWT({ email, type: "email-verify" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

interface SendSignUpEmailsOptions {
  email: string;
  userId: string;
  locale?: string;
}

/**
 * Sends welcome + confirm-email letters after a successful sign-up.
 *
 * Call fire-and-forget (`void sendSignUpEmails(...)`) from the route handler
 * so a mail failure never blocks the HTTP response.
 */
export async function sendSignUpEmails(
  mailer: Resend,
  { email, userId, locale = DEFAULT_LOCALE }: SendSignUpEmailsOptions,
): Promise<void> {
  const token = await createVerificationToken(userId, email);
  const confirmUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const appUrl = env.FRONTEND_URL;

  const results = await Promise.allSettled([
    mailer.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: `Welcome to ${COMPANY_NAME}`,
      react: <WelcomeEmail url={appUrl} locale={locale} companyName={COMPANY_NAME} />,
    }),
    mailer.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Confirm your email address",
      react: <ConfirmEmail url={confirmUrl} locale={locale} companyName={COMPANY_NAME} />,
    }),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      logger.error({ err: result.reason }, "Failed to send sign-up email");
    }
  }
}

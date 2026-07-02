import { createTranslator } from "next-intl";

import { logger } from "../../config/logger";

export const DEFAULT_LOCALE = "en";

export async function loadMessages(locale: string) {
  try {
    return await import(`../../../messages/${locale}.json`);
  } catch {
    logger.warn(`Failed to load ${locale}.json`);
    return (await import(`../../../messages/${DEFAULT_LOCALE}.json`)).default;
  }
}

interface TranslatorProps {
  locale?: string;
  namespace?: string;
}

export const initializeTranslator = async ({ locale, namespace }: TranslatorProps) => {
  const fallback = locale ?? DEFAULT_LOCALE;

  return createTranslator({
    messages: await loadMessages(fallback),
    namespace,
    locale: fallback,
  });
};

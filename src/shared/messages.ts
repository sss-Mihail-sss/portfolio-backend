import { logger } from "../config/logger";

const DEFAULT_LOCALE = "en";

export async function loadMessages(locale: string) {
  try {
    return await import(`../../messages/${locale}.json`);
  } catch {
    logger.warn(`Failed to load ${locale}.json`);
    return (await import(`../../messages/${DEFAULT_LOCALE}.json`)).default;
  }
}

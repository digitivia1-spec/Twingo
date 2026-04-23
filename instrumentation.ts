// Next.js 15 instrumentation hook — Sentry bootstraps here on server/edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = async (...args: unknown[]) => {
  const Sentry = await import('@sentry/nextjs');
  // @ts-expect-error — forward the args to Sentry's upstream handler
  return Sentry.captureRequestError(...args);
};

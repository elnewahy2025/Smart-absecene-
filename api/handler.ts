// Vercel serverless entry point.
//
// All traffic under /api/* is funnelled here by the rewrite in vercel.json and
// handed to the shared Express app, so local development (`tsx server.ts`) and
// production exercise exactly the same routes, middleware and auth.
export default async function handler(req: any, res: any) {
  // The rewrite may or may not preserve the original request path, so rebuild it
  // from the injected `__apipath` segment whenever it is present.
  try {
    const parsed = new URL(req.url || '/', 'http://localhost');
    if (parsed.searchParams.has('__apipath')) {
      const remainder = parsed.searchParams.get('__apipath') || '';
      parsed.searchParams.delete('__apipath');
      const query = parsed.searchParams.toString();
      req.url = `/api/${remainder}${query ? `?${query}` : ''}`;
    }
  } catch {
    // Fall through with the URL as received.
  }

  let app: any;
  try {
    const serverModule: any = await import('../server.js');
    app = serverModule.app;
    await serverModule.prepareRuntime();
  } catch (error: any) {
    console.error('[VERCEL_BOOT_ERROR]', error);
    res.status(500).json({
      code: 'FUNCTION_BOOT_ERROR',
      name: error?.name,
      message: String(error?.message || error).slice(0, 300),
    });
    return;
  }

  return app(req, res);
}

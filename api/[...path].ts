// Vercel serverless entry point.
//
// Every request under /api/* is matched by this catch-all function and handed to
// the shared Express app, so local development (`tsx server.ts`) and production
// exercise exactly the same routes, middleware and auth.
//
// NOTE: the boot guard below is a temporary diagnostic so a module-load failure
// surfaces in the response body instead of an opaque FUNCTION_INVOCATION_FAILED.
export default async function handler(req: any, res: any) {
  let app: any;
  let prepareRuntime: any;
  try {
    const serverModule: any = await import('../server.ts');
    app = serverModule.app;
    prepareRuntime = serverModule.prepareRuntime;
    await prepareRuntime();
  } catch (error: any) {
    console.error('[VERCEL_BOOT_ERROR]', error);
    res.status(500).json({
      code: 'FUNCTION_BOOT_ERROR',
      name: error?.name,
      message: String(error?.message || error).slice(0, 600),
    });
    return;
  }

  // Depending on the routing mode the matched `/api` prefix may have been
  // stripped from the request URL. The Express router mounts everything under
  // `/api`, so restore it when missing to keep route matching identical.
  const url: string = req.url || '/';
  if (!url.startsWith('/api')) {
    req.url = `/api${url.startsWith('/') ? url : `/${url}`}`;
  }

  return app(req, res);
}

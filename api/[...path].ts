// Vercel serverless entry point.
//
// Every request under /api/* is matched by this catch-all function and handed to
// the shared Express app, so local development (`tsx server.ts`) and production
// exercise exactly the same routes, middleware and auth.
import { app, prepareRuntime } from '../server.ts';

export default async function handler(req: any, res: any) {
  // Wire the Firestore-backed tenant secret store once per instance.
  await prepareRuntime();

  // Depending on the routing mode the matched `/api` prefix may have been
  // stripped from the request URL. The Express router mounts everything under
  // `/api`, so restore it when missing to keep route matching identical.
  const url: string = req.url || '/';
  if (!url.startsWith('/api')) {
    req.url = `/api${url.startsWith('/') ? url : `/${url}`}`;
  }

  return app(req, res);
}

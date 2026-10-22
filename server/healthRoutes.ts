import express from 'express';
import fs from 'fs';
import path from 'path';

interface HealthRoutesDeps {
  app: express.Express;
  baseDir: string;
  isVercel: boolean;
  hasGeminiKey: boolean;
  isFirebaseAdminReady: () => boolean;
  firebaseAdminInitialized: boolean;
  adminKeyLoaded: boolean;
  hasSharedAuthValue: boolean;
  getChromePath: () => string | null | undefined;
}

export function registerHealthRoutes({
  app,
  baseDir,
  isVercel,
  hasGeminiKey,
  isFirebaseAdminReady,
  firebaseAdminInitialized,
  adminKeyLoaded,
  hasSharedAuthValue,
  getChromePath,
}: HealthRoutesDeps) {
  app.get('/api/health', (req, res) => {
    let dynamicTenantsCount = 0;
    try {
      const dynamicPath = path.resolve(baseDir, 'src/config/dynamicTenants.json');
      if (fs.existsSync(dynamicPath)) {
        const list = JSON.parse(fs.readFileSync(dynamicPath, 'utf8'));
        dynamicTenantsCount = Array.isArray(list) ? list.length : 0;
      }
    } catch (err) {
      console.warn('[HEALTH] Could not read dynamic tenant registry:', err);
    }

    const chromePath = getChromePath();

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      status: 'ok',
      appName: 'Smart School Attendance System',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      services: {
        aiGemini: hasGeminiKey,
        pdfPuppeteer: Boolean(chromePath) || isVercel,
        firebaseAdmin: isFirebaseAdminReady(),
        firebaseAdminInitialized,
        adminKeyLoaded,
        dynamicTenantsCount,
      },
    });
  });

  app.get('/api/readyz', (req, res) => {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      requiresAuth: Boolean(hasSharedAuthValue),
    });
  });
}

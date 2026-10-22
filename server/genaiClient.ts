import { GoogleGenAI } from '@google/genai';
import { getTenantApiKey } from '../src/utils/tenantAISecrets';

// Initialize GoogleGenAI SDK with required telemetry header
export const geminiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to get GoogleGenAI client for a specific tenant or system default
export function getGenAIClientForTenant(tenantId?: string): { client: GoogleGenAI; keySource: 'tenant' | 'system' | 'none' } {
  // 1. Check custom school/tenant API key (AES-256 decrypted)
  if (tenantId) {
    const customTenantKey = getTenantApiKey(tenantId);
    if (customTenantKey && customTenantKey.trim() !== '' && customTenantKey !== 'your-gemini-key-here') {
      return {
        client: new GoogleGenAI({
          apiKey: customTenantKey.trim(),
          httpOptions: { headers: { 'User-Agent': 'aistudio-build-tenant' } },
        }),
        keySource: 'tenant',
      };
    }
  }

  // 2. Fall back to system-wide default key from .env (Policy Option A)
  const defaultKey = process.env.GEMINI_API_KEY || '';
  if (defaultKey && defaultKey.trim() !== '' && defaultKey !== 'your-gemini-key-here') {
    return {
      client: new GoogleGenAI({
        apiKey: defaultKey.trim(),
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      }),
      keySource: 'system',
    };
  }

  return { client: ai, keySource: 'none' };
}

// Helper for model calling with per-tenant key and graceful fallback
export async function callGeminiWithFallback(
  modelCandidates: string[],
  promptPayload: any,
  tenantId?: string
): Promise<{ text: string; modelUsed: string; keySource: 'tenant' | 'system' } | null> {
  const { client: activeAi, keySource } = getGenAIClientForTenant(tenantId);
  if (keySource === 'none') {
    return null;
  }

  let lastError: any = null;
  for (const model of modelCandidates) {
    try {
      const response = await activeAi.models.generateContent({
        model,
        ...promptPayload,
      });
      if (response && response.text) {
        return { text: response.text, modelUsed: model, keySource };
      }
    } catch (err: any) {
      console.warn(`[TENANT-AI:${tenantId || 'system'}] Model ${model} failed, trying next candidate. Error:`, err?.message || err);
      lastError = err;
    }
  }
  return null;
}

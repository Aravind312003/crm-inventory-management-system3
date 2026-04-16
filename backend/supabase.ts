import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Try to load .env first, then .env.example as fallback
if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
  dotenv.config();
} else if (fs.existsSync(path.resolve(process.cwd(), '.env.example'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.example') });
}

let supabaseClient: any = null;

export function getSupabase() {
  if (!supabaseClient) {
    let url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    // Remove quotes if present
    if (url?.startsWith('"') && url?.endsWith('"')) {
      url = url.substring(1, url.length - 1);
    } else if (url?.startsWith("'") && url?.endsWith("'")) {
      url = url.substring(1, url.length - 1);
    }

    if (!url || url === 'your_supabase_project_url' || !key || key === 'your_supabase_service_role_key') {
      throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the Settings menu.');
    }

    if (url.startsWith('eyJ')) {
      throw new Error("It looks like you've accidentally put your Supabase Key into the URL field. Please check the Settings menu in the top right and ensure SUPABASE_URL starts with 'https://'.");
    }

    if (!url.startsWith('http')) {
      throw new Error(`Invalid SUPABASE_URL: "${url}". It must start with http:// or https://. Please check your settings.`);
    }

    try {
      // Custom fetch with retry logic for handling transient network timeouts
      const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        let lastError: any;
        const maxRetries = 5;
        const baseDelay = 1000;

        for (let i = 0; i < maxRetries; i++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
            
            const response = await fetch(input, {
              ...init,
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
          } catch (err: any) {
            lastError = err;
            const isRetryable = 
              err.name === 'AbortError' || 
              err.message?.toLowerCase().includes('timeout') || 
              err.message?.toLowerCase().includes('fetch failed') ||
              err.message?.toLowerCase().includes('network') ||
              err.code === 'ECONNRESET' ||
              err.code === 'ETIMEDOUT';

            if (isRetryable) {
              const delay = baseDelay * Math.pow(2, i);
              console.warn(`Supabase fetch attempt ${i + 1} failed, retrying in ${delay}ms...`, err.message);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            throw err;
          }
        }
        console.error(`Supabase fetch failed after ${maxRetries} attempts:`, lastError.message);
        throw lastError;
      };

      supabaseClient = createClient(url, key, {
        global: {
          fetch: customFetch
        }
      });
    } catch (err) {
      throw new Error(`Failed to initialize Supabase client: ${(err as Error).message}. Please check your SUPABASE_URL in the Settings menu.`);
    }
  }
  return supabaseClient;
}

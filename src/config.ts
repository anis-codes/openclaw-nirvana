import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_KEY: z.string().min(20),
  TELEGRAM_BOT_TOKEN: z.string().includes(':'),
  TELEGRAM_USER_ID: z.string().regex(/^\d+$/),
  OPENAI_API_KEY: z.string().optional().default(""),
  GMAIL_CLIENT_ID: z.string().optional().default(""),
  GMAIL_CLIENT_SECRET: z.string().optional().default(""),
  GMAIL_REFRESH_TOKEN: z.string().optional().default(""),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().default('3000'),
});

export const config = envSchema.parse(process.env);

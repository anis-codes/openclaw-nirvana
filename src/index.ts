import express from 'express';
import { config } from './config';
import { logger } from './logger';
import { supabase } from './supabase';

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const { error } = await supabase.from('agent_logs').select('id').limit(1);
    const dbOk = !error;
    res.json({
      status: dbOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbOk ? 'connected' : error?.message,
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: String(err) });
  }
});

app.listen(Number(config.PORT), () => {
  logger.info(`OpenClaw server running on port ${config.PORT}`);
});

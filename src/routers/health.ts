import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import os from 'os';
import { getEnvVar } from '../utils/getEnvVar';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbStatus = dbStatusMap[dbState] || 'unknown';

  // System information
  const systemInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    loadAverage: os.loadavg(),
  };

  // Process information
  const processInfo = {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    pid: process.pid,
    env: process.env.NODE_ENV || 'development',
  };

  // Database information
  const dbInfo = {
    status: dbStatus,
    host: getEnvVar('MONGODB_HOST', 'localhost'),
    name: getEnvVar('MONGODB_DB', 'unknown'),
    collections: Object.keys(mongoose.connection.collections),
  };

  // Response time
  const responseTime = process.hrtime();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    system: systemInfo,
    process: processInfo,
    database: dbInfo,
    responseTime: `${process.hrtime(responseTime)[1] / 1000000}ms`,
  });
});

export default router;

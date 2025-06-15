import { getEnvVar } from './getEnvVar';

interface Config {
  NODE_ENV: string;
  PORT: number;
  JWT_SECRET: string;
  MONGODB_URI?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM?: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
}

const validateConfig = (): Config => {
  const config: Config = {
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
    PORT: Number(getEnvVar('PORT', '3000')),
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    CORS_ORIGIN: getEnvVar('CORS_ORIGIN', '*'),
    RATE_LIMIT_WINDOW_MS: Number(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000')), // 15 minutes
    RATE_LIMIT_MAX: Number(getEnvVar('RATE_LIMIT_MAX', '100')),
  };

  // Optional configurations
  try {
    config.MONGODB_URI = getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/contacts_app');
  } catch (error) {
    console.warn('MONGODB_URI not set, using default local connection');
  }

  try {
    config.SMTP_HOST = getEnvVar('SMTP_HOST');
    config.SMTP_PORT = Number(getEnvVar('SMTP_PORT', '587'));
    config.SMTP_USER = getEnvVar('SMTP_USER');
    config.SMTP_PASSWORD = getEnvVar('SMTP_PASSWORD');
    config.SMTP_FROM = getEnvVar('SMTP_FROM');
  } catch (error) {
    console.warn('SMTP configuration not set, email functionality will be disabled');
  }

  // Validate required fields
  const requiredFields: (keyof Config)[] = ['JWT_SECRET'];

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required environment variable: ${field}`);
    }
  }

  // Validate numeric fields
  const numericFields: (keyof Config)[] = ['PORT', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX'];
  for (const field of numericFields) {
    if (isNaN(config[field] as number)) {
      throw new Error(`Invalid numeric value for environment variable: ${field}`);
    }
  }

  return config;
};

export const config = validateConfig();

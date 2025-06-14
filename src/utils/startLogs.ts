import chalk from 'chalk';
import boxen from 'boxen';
import os from 'os';
import { getEnvVar } from './getEnvVar.ts';
import mongoose from 'mongoose';

const getLocalIP = (): string => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

export const startLogs = (): void => {
  const port = getEnvVar('PORT', '3000');
  const mode = getEnvVar('NODE_ENV', 'development');
  const db = getEnvVar('MONGODB_DB', 'contacts_db');
  const localIP = getLocalIP();

  const mongoStatus =
    mongoose.connection.readyState === 1
      ? chalk.greenBright('Connected')
      : chalk.red('Not connected');

  const message = `
${chalk.bold.greenBright('🚀 SERVER STARTED')}
${chalk.green('🌐 Local:')}      ${chalk.blue.underline(
    `http://localhost:${port}`,
  )}
${chalk.green('📡 Network:')}    ${chalk.blue.underline(
    `http://${localIP}:${port}`,
  )}
${chalk.green('🔧 Mode:')}       ${chalk.yellowBright(mode)}
${chalk.green('📟 MongoDB:')}    ${mongoStatus} (${db})
${chalk.green('🕒 Started at:')} ${chalk.greenBright(
    new Date().toLocaleString(),
  )}
`;

  console.log(
    boxen(message.trim(), {
      padding: 1,
      margin: 1,
      borderColor: 'cyan',
      borderStyle: 'round',
      title: "💻 eXocriador's server",
      titleAlignment: 'center',
    }),
  );
};

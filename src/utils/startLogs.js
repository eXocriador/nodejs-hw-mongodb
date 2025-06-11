import chalk from 'chalk';
import boxen from 'boxen';
import os from 'os';
import { getEnvVar } from './getEnvVar.js';
import mongoose from 'mongoose';

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

export const startLogs = () => {
  const port = getEnvVar('PORT', '3000');
  const mode = getEnvVar('NODE_ENV', 'development');
  const localIP = getLocalIP();

  const mongoStatus =
    mongoose.connection.readyState === 1
      ? chalk.green('Connected')
      : chalk.red('Not connected');

  const message = `
${chalk.bold.greenBright('🚀 SERVER STARTED')}
${chalk.cyan('🌐 Local:')}      http://${chalk.underline(`localhost:${port}`)}
${chalk.cyan('📡 Network:')}    http://${chalk.underline(`${localIP}:${port}`)}
${chalk.cyan('🔧 Mode:')}       ${chalk.yellowBright(mode)}
${chalk.cyan('📟 MongoDB:')}    ${mongoStatus}
${chalk.cyan('🕒 Started at:')} ${chalk.magentaBright(
    new Date().toLocaleString(),
  )}
`;

  console.log(
    boxen(message.trim(), {
      padding: 1,
      margin: 1,
      borderColor: 'cyan',
      borderStyle: 'round',
      title: '💻 App Info',
      titleAlignment: 'center',
    }),
  );
};

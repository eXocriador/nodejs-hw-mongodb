import nodemailer from 'nodemailer';
import { getEnvVar } from '../utils/getEnvVar.ts';
import { EmailOptions } from '../types/models.ts';
import createHttpError from 'http-errors';

const SMTP_HOST = getEnvVar('SMTP_HOST', 'smtp-relay.brevo.com');
const SMTP_PORT = Number(getEnvVar('SMTP_PORT', '587'));
const SMTP_USER = getEnvVar('SMTP_USER');
const SMTP_PASSWORD = getEnvVar('SMTP_PASSWORD');
const SMTP_FROM = getEnvVar('SMTP_FROM', SMTP_USER);

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  let lastError: Error | null = null;

  console.log('Attempting to send email with configuration:', {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    from: SMTP_FROM,
    to: options.to,
    subject: options.subject
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${MAX_RETRIES} to send email...`);

      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log('Email sent successfully:', info);
      return; // Success, exit the function
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt < MAX_RETRIES) {
        console.log(`Waiting ${RETRY_DELAY * attempt}ms before next attempt...`);
        await sleep(RETRY_DELAY * attempt); // Exponential backoff
        continue;
      }
    }
  }

  // If we get here, all retries failed
  console.error('All email sending attempts failed:', lastError);
  throw createHttpError(500, {
    message: 'Failed to send the email after multiple attempts.',
    cause: lastError
  });
};

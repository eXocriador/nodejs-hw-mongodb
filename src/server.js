import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';

import { getEnvVar } from './utils/getEnvVar.js';
import { getAllContacts, getContactById } from './services/contacts.js';


dotenv.config();

const PORT = Number(getEnvVar('PORT', '3000'));

export const serverSetup = () => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(pino({
        transport: {
          target: 'pino-pretty',
        },
      }));

    // Routes
    app.get('/', (req, res) => {
        res.send('Hey yo!');
    });

    app.get('/contacts', async (req, res, next) => {
        try {
            const contacts = await getAllContacts();
            res.status(200).json({
                status: 200,
                message: "Successfully found contacts!",
                data: contacts
            });
        } catch (err) {
            next(err);
        }
    });

    app.get('/contacts/:contactId', async (req, res, next) => {
        try {
            const { contactId } = req.params;
            const contact = await getContactById(contactId);
            if (!contact) {
                return res.status(404).json({ message: 'Contact not found' });
            }
            res.status(200).json({
                status: 200,
                message: `Successfully found contact with id ${contactId}!`,
                data: contact
            });
        } catch (err) {
            next(err);
        }
    });

    app.use((req, res) => {
        res.status(404).json({ message: 'Not found' });
    });

    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(500).json({
        message: 'Something went wrong',
        error: err.message,
        });
        next(err);
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

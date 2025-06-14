import 'dotenv/config';

import { initMongoConnection } from "./db/initMongoConnection.ts";
import { createDirIfNotExists } from './utils/createDirIfNotExists.ts';
import { TEMP_UPLOAD_DIR, UPLOAD_DIR } from './constants/index.ts';
import { serverSetup } from "./server.ts";

const bootstrap = async (): Promise<void> => {
    try {
        await initMongoConnection();
        await createDirIfNotExists(TEMP_UPLOAD_DIR);
        await createDirIfNotExists(UPLOAD_DIR);
        serverSetup();
    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
};

bootstrap();

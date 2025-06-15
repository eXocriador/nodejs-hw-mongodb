import 'dotenv/config';

import { initMongoConnection } from "./db/initMongoConnection";
import { createDirIfNotExists } from './utils/createDirIfNotExists';
import { TEMP_UPLOAD_DIR, UPLOAD_DIR } from './constants/index';
import { serverSetup } from "./server";

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

import { serverSetup } from "./server.js";
import { initMongoConnection } from "./db/initMongoConnection.js";


const bootstrap = async () => {
    await initMongoConnection();
    serverSetup();
}

bootstrap()

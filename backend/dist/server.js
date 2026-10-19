"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const client_1 = require("./prisma/client");
async function bootstrap() {
    try {
        await client_1.prisma.$connect();
        logger_1.logger.info('Database connected successfully');
        app_1.app.listen(config_1.config.port, () => {
            logger_1.logger.info(`Server listening on port ${config_1.config.port} in ${config_1.config.nodeEnv} mode`);
        });
    }
    catch (err) {
        logger_1.logger.error(err, 'Failed to start server');
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map
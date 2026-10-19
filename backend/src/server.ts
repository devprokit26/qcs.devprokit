import { app } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './prisma/client';

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();

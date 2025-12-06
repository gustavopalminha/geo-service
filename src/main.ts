import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const dynamicModule = await AppModule.createDynamicModule();
  const app = await NestFactory.create(dynamicModule);
  
  const configService = app.get(ConfigService);
  
  // CORS
  app.enableCors({
    origin: configService.get('corsAccepted'),
  });
  
  // Global prefix
  app.setGlobalPrefix(configService.get('apiRoot'));
  
  const port = configService.get('port');
  const host = configService.get('host');
  
  await app.listen(port, host);
  console.log(`🚀 Server running on http://${host}:${port}${configService.get('apiRoot')}`);
}
bootstrap();

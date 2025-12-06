import { Module, NestModule, MiddlewareConsumer, DynamicModule } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { DataModule } from './data/data.module';
import { ControllersModule } from './controllers/controllers.module';
import { SecurityMiddleware } from './middleware/security.middleware';
import { ConfigService } from './config/config.service';

@Module({})
export class AppModule implements NestModule {
  static async createDynamicModule(): Promise<DynamicModule> {
    const configService = new ConfigService();
    
    return {
      module: AppModule,
      imports: [
        ConfigModule,
        DatabaseModule.forRoot(configService),
        DataModule,
        ControllersModule.forRoot(configService),
      ],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware).forRoutes('*');
  }
}

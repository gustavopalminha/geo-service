import { Module, DynamicModule } from '@nestjs/common';
import { TypesController } from './types.controller';
import { DataModule } from '../data/data.module';
import { ConfigService } from '../config/config.service';
import { createDataController } from './dynamic-data.controller';

@Module({})
export class ControllersModule {
  static forRoot(configService: ConfigService): DynamicModule {
    const DynamicDataController = createDataController(configService);
    
    return {
      module: ControllersModule,
      imports: [DataModule],
      controllers: [DynamicDataController, TypesController],
    };
  }
}

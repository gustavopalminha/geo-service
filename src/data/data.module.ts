import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { SpatialService } from './spatial.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [DataService, SpatialService],
  exports: [DataService, SpatialService],
})
export class DataModule {}

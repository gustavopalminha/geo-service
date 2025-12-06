import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '../config/config.service';
import * as path from 'path';

@Module({})
export class DatabaseModule {
  static forRoot(configService: ConfigService): DynamicModule {
    const dbType = configService.get('dbType');
    const datasourceString = configService.get('datasourceString');
    const tableName = configService.get('dbTable');

    // Try to load the generated entity
    let entities: any[] = [];
    try {
      const entityPath = path.join(__dirname, '../generated/data.entity');
      const entityModule = require(entityPath);
      const entityClass = Object.values(entityModule)[0];
      if (entityClass) {
        entities = [entityClass];
      }
    } catch (e) {
      console.warn('Generated entity not found, continuing without entities');
    }

    const typeOrmConfig = dbType === 'postgres' ? {
      type: 'postgres' as const,
      url: datasourceString,
      entities,
      synchronize: false,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    } : {
      type: 'better-sqlite3' as const,
      database: datasourceString,
      entities,
      synchronize: false,
      driver: require('better-sqlite3'),
      prepareDatabase: (db: any) => {
        db.pragma('foreign_keys = ON');
      },
    };

    console.log(`📊 Database configured for table: ${tableName}`);

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot(typeOrmConfig),
        ...(entities.length > 0 && tableName ? [TypeOrmModule.forFeature(entities)] : []),
      ],
      exports: [TypeOrmModule],
    };
  }
}

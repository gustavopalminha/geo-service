import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export interface AppConfig {
  dbType: 'sqlite' | 'postgres';
  datasourceString: string;
  dbSchema: string;
  dbTable: string;
  host: string;
  port: number;
  apiRoot: string;
  apiSubpath: string;
  apiTypePath: string;
  allowedCrud: string;
  serviceHeader: string;
  corsAccepted: string;
  defaultSrid: number;
  defaultGeomColumn: string;
  allowSpatialQueries: boolean;
}

export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    const datasourceString = process.env.DATASOURCE_STRING || './data/sample.sqlite';
    const dbType = this.detectDbType(datasourceString);
    
    return {
      dbType,
      datasourceString,
      dbSchema: process.env.DB_SCHEMA || 'public',
      dbTable: process.env.DB_TABLE || this.deriveTableName(datasourceString, dbType),
      host: process.env.HOST || 'localhost',
      port: parseInt(process.env.PORT || '8090', 10),
      apiRoot: process.env.API_ROOT || '/geo',
      apiSubpath: process.env.API_SUBPATH || this.deriveSubpath(datasourceString),
      apiTypePath: process.env.API_TYPE_PATH || '/types',
      allowedCrud: process.env.ALLOWED_CRUD || 'R',
      serviceHeader: process.env.SERVICE_HEADER || '',
      corsAccepted: process.env.CORS_ACCEPTED || '*',
      defaultSrid: parseInt(process.env.DEFAULT_SRID || '4326', 10),
      defaultGeomColumn: process.env.DEFAULT_GEOM_COLUMN || 'geom',
      allowSpatialQueries: process.env.ALLOW_SPATIAL_QUERIES !== 'false',
    };
  }

  private detectDbType(datasourceString: string): 'sqlite' | 'postgres' {
    if (process.env.DB_TYPE) {
      return process.env.DB_TYPE as 'sqlite' | 'postgres';
    }
    return datasourceString.startsWith('postgres://') || datasourceString.startsWith('postgresql://') 
      ? 'postgres' 
      : 'sqlite';
  }

  private deriveSubpath(datasourceString: string): string {
    const filename = path.basename(datasourceString, path.extname(datasourceString));
    return `/${filename}`;
  }

  private deriveTableName(datasourceString: string, dbType: string): string {
    if (dbType === 'postgres') {
      // For postgres, we need to inspect the database or use a default
      return 'locations'; // fallback
    }
    // For SQLite, derive from filename
    const filename = path.basename(datasourceString, path.extname(datasourceString));
    return filename;
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  getAll(): AppConfig {
    return { ...this.config };
  }
}

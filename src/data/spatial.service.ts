import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '../config/config.service';

export interface SpatialQueryDto {
  operation: 'intersects' | 'touches' | 'contains' | 'within' | 'distance';
  geometry: string; // WKT format
  geometryColumn?: string;
  srid?: number;
  distance?: number; // For distance operation
  outputFormat?: 'wkt' | 'geojson';
}

@Injectable()
export class SpatialService {
  private geometryMetadata: any;
  private repository: Repository<any>;

  constructor(
    @Inject(DataSource) private dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.initializeRepository();
    try {
      this.geometryMetadata = require('../generated/geometry.metadata').GeometryMetadata;
    } catch (e) {
      this.geometryMetadata = { geometryColumns: [], defaultGeomColumn: null };
    }
  }

  private initializeRepository() {
    const tableName = this.configService.get('dbTable');
    if (tableName) {
      this.repository = this.dataSource.getRepository(tableName);
    }
  }

  async spatialQuery(dto: SpatialQueryDto): Promise<any[]> {
    if (!this.repository) {
      throw new Error('Repository not initialized');
    }

    const geomColumn = dto.geometryColumn ||
      this.geometryMetadata.defaultGeomColumn ||
      this.configService.get('defaultGeomColumn');

    const srid = dto.srid || this.configService.get('defaultSrid');
    const outputFormat = dto.outputFormat || 'wkt';
    const dbType = this.configService.get('dbType');

    if (!geomColumn) {
      throw new Error('No geometry column specified or detected');
    }

    // Load SpatiaLite extension for SQLite
    if (dbType === 'sqlite') {
      try {
        // Access the underlying better-sqlite3 driver via connection
        const driver = this.repository.manager.connection.driver as any;

        if (driver && driver.options.type === 'better-sqlite3') {
          // TypeORM's better-sqlite3 driver exposes the database connection via `databaseConnection` property
          const db = driver.databaseConnection;

          if (db && typeof db.loadExtension === 'function') {
            const extensions = [
              'mod_spatialite',
              'mod_spatialite.dylib',
              'libspatialite',
              'libspatialite.dylib',
              '/usr/local/lib/mod_spatialite.dylib',
              '/opt/homebrew/lib/mod_spatialite.dylib',
              '/usr/lib/x86_64-linux-gnu/mod_spatialite.so'
            ];

            let loaded = false;
            for (const ext of extensions) {
              try {
                db.loadExtension(ext);
                console.log(`✅ SpatiaLite loaded: ${ext}`);
                loaded = true;
                break;
              } catch (e) {
                // Continue to next extension
              }
            }

            if (!loaded) {
              console.warn('⚠️ Failed to load SpatiaLite extension. Checked paths:', extensions.join(', '));
            }
          }
        } else {
          // Fallback for other drivers
          await this.dataSource.query("SELECT load_extension('mod_spatialite')");
        }
      } catch (e: any) {
        console.warn('Failed to load SpatiaLite extension:', e.message);
      }

      // Verify SpatiaLite is loaded
      try {
        const version = await this.dataSource.query("SELECT spatialite_version()");
        console.log('SpatiaLite version:', version[0]['spatialite_version()']);
      } catch (e) {
        console.warn('Could not verify SpatiaLite version. Extension might not be loaded.');
      }
    }

    const tableName = this.repository.metadata.tableName;
    const query = this.buildSpatialQuery(
      tableName,
      geomColumn,
      dto.operation,
      dto.geometry,
      srid,
      outputFormat,
      dbType,
      dto.distance
    );

    try {
      return await this.repository.query(query);
    } catch (e) {
      console.error('Spatial query failed:', e);
      throw e;
    }
  }

  private buildSpatialQuery(
    tableName: string,
    geomColumn: string,
    operation: string,
    geometry: string,
    srid: number,
    outputFormat: string,
    dbType: string,
    distance?: number
  ): string {
    const isPostgres = dbType === 'postgres';

    // Function mapping
    const funcs = {
      asText: isPostgres ? 'ST_AsText' : 'AsText',
      asGeoJson: isPostgres ? 'ST_AsGeoJSON' : 'AsGeoJSON',
      geomFromText: isPostgres ? 'ST_GeomFromText' : 'GeomFromText',
      intersects: isPostgres ? 'ST_Intersects' : 'Intersects',
      touches: isPostgres ? 'ST_Touches' : 'Touches',
      contains: isPostgres ? 'ST_Contains' : 'Contains',
      within: isPostgres ? 'ST_Within' : 'Within',
      distance: isPostgres ? 'ST_Distance' : 'Distance',
    };

    const geomOutput = outputFormat === 'geojson'
      ? `${funcs.asGeoJson}(${geomColumn})`
      : `${funcs.asText}(${geomColumn})`;

    const columns = this.repository.metadata.columns
      .map(col => col.databaseName === geomColumn
        ? `${geomOutput} as ${geomColumn}`
        : col.databaseName)
      .join(', ');

    const spatialFunc = this.getSpatialFunction(operation, geomColumn, geometry, srid, funcs, distance);

    return `SELECT ${columns} FROM ${tableName} WHERE ${spatialFunc}`;
  }

  private getSpatialFunction(
    operation: string,
    geomColumn: string,
    geometry: string,
    srid: number,
    funcs: any,
    distance?: number
  ): string {
    const geomFromText = `${funcs.geomFromText}('${geometry}', ${srid})`;

    switch (operation) {
      case 'intersects':
        return `${funcs.intersects}(${geomColumn}, ${geomFromText})`;
      case 'touches':
        return `${funcs.touches}(${geomColumn}, ${geomFromText})`;
      case 'contains':
        return `${funcs.contains}(${geomColumn}, ${geomFromText})`;
      case 'within':
        return `${funcs.within}(${geomColumn}, ${geomFromText})`;
      case 'distance':
        if (!distance) throw new Error('Distance parameter required for distance operation');
        return `${funcs.distance}(${geomColumn}, ${geomFromText}) <= ${distance}`;
      default:
        throw new Error(`Unsupported spatial operation: ${operation}`);
    }
  }

  getGeometryMetadata() {
    return this.geometryMetadata;
  }
}

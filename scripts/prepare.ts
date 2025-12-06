import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const DATASOURCE_STRING = process.env.DATASOURCE_STRING || './data/sample.sqlite';
const DB_TYPE = detectDbType(DATASOURCE_STRING);
const DB_SCHEMA = process.env.DB_SCHEMA || 'public';
const DB_TABLE = process.env.DB_TABLE || '';
const GENERATED_DIR = path.join(__dirname, '../src/generated');

function detectDbType(datasourceString: string): 'sqlite' | 'postgres' {
  if (process.env.DB_TYPE) {
    return process.env.DB_TYPE as 'sqlite' | 'postgres';
  }
  return datasourceString.startsWith('postgres://') || datasourceString.startsWith('postgresql://')
    ? 'postgres'
    : 'sqlite';
}

async function prepare() {
  console.log('🚀 Starting preparation script...');
  console.log(`📦 Database type: ${DB_TYPE}`);

  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }

  const dataSource = createDataSource();

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const queryRunner = dataSource.createQueryRunner();
    const tables = await getTables(queryRunner);

    if (tables.length === 0) {
      throw new Error('No tables found in database');
    }

    const tableName = DB_TABLE || tables[0];
    console.log(`📊 Introspecting table: ${tableName}`);

    const columns = await getColumns(queryRunner, tableName);
    await queryRunner.release();

    const geometryColumns = await getGeometryColumns(queryRunner, tableName);

    generateEntity(tableName, columns);
    generateInterface(tableName, columns);
    generateGeometryMetadata(tableName, geometryColumns);

    console.log('✅ Entity and interface generated successfully');
    if (geometryColumns.length > 0) {
      console.log(`📍 Found ${geometryColumns.length} geometry column(s): ${geometryColumns.map(g => g.name).join(', ')}`);
    }
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error during preparation:', error);
    process.exit(1);
  }
}

function createDataSource(): DataSource {
  if (DB_TYPE === 'postgres') {
    return new DataSource({
      type: 'postgres',
      url: DATASOURCE_STRING,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }
  return new DataSource({
    type: 'better-sqlite3',
    database: DATASOURCE_STRING,
    driver: require('better-sqlite3'),
  });
}

async function getTables(queryRunner: any): Promise<string[]> {
  if (DB_TYPE === 'postgres') {
    const result = await queryRunner.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = $1 AND table_type = 'BASE TABLE'`,
      [DB_SCHEMA]
    );
    return result.map((row: any) => row.table_name);
  }
  const result = await queryRunner.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  return result.map((row: any) => row.name);
}

async function getGeometryColumns(queryRunner: any, tableName: string): Promise<any[]> {
  if (DB_TYPE === 'postgres') {
    const result = await queryRunner.query(
      `SELECT f_geometry_column as name, type, srid
       FROM geometry_columns
       WHERE f_table_schema = $1 AND f_table_name = $2`,
      [DB_SCHEMA, tableName]
    );
    return result;
  }
  // SpatiaLite - try both exact and case-insensitive match
  try {
    let result = await queryRunner.query(
      `SELECT f_geometry_column as name, geometry_type as type, srid
       FROM geometry_columns
       WHERE f_table_name = ?`,
      [tableName]
    );
    if (result.length === 0) {
      result = await queryRunner.query(
        `SELECT f_geometry_column as name, geometry_type as type, srid
         FROM geometry_columns
         WHERE LOWER(f_table_name) = LOWER(?)`,
        [tableName]
      );
    }
    return result;
  } catch (e) {
    return [];
  }
}

async function getColumns(queryRunner: any, tableName: string): Promise<any[]> {
  if (DB_TYPE === 'postgres') {
    const result = await queryRunner.query(
      `SELECT column_name, data_type, is_nullable, column_default,
              CASE WHEN pk.constraint_type = 'PRIMARY KEY' THEN 1 ELSE 0 END as is_primary
       FROM information_schema.columns c
       LEFT JOIN (
         SELECT kcu.column_name, tc.constraint_type
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu 
           ON tc.constraint_name = kcu.constraint_name
         WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
       ) pk ON c.column_name = pk.column_name
       WHERE c.table_schema = $1 AND c.table_name = $2
       ORDER BY c.ordinal_position`,
      [DB_SCHEMA, tableName]
    );
    return result.map((col: any) => ({
      name: col.column_name,
      type: col.data_type,
      pk: col.is_primary,
      notnull: col.is_nullable === 'NO' ? 1 : 0,
    }));
  }
  return queryRunner.query(`PRAGMA table_info(${tableName})`);
}

function generateEntity(tableName: string, columns: any[]) {
  const className = toPascalCase(tableName);

  let entityCode = `import { Entity, Column, PrimaryColumn } from 'typeorm';\n\n`;
  entityCode += `@Entity('${tableName}')\n`;
  entityCode += `export class ${className} {\n`;

  columns.forEach((col) => {
    const isPrimary = col.pk === 1;
    const decorator = isPrimary ? '  @PrimaryColumn()' : '  @Column()';
    const tsType = mapSqliteTypeToTs(col.type);

    entityCode += `${decorator}\n`;
    entityCode += `  ${col.name}: ${tsType};\n\n`;
  });

  entityCode += `}\n`;

  fs.writeFileSync(path.join(GENERATED_DIR, 'data.entity.ts'), entityCode);
}

function generateInterface(tableName: string, columns: any[]) {
  const interfaceName = toPascalCase(tableName);

  let interfaceCode = `export interface ${interfaceName} {\n`;

  columns.forEach((col) => {
    const tsType = mapSqliteTypeToTs(col.type);
    interfaceCode += `  ${col.name}: ${tsType};\n`;
  });

  interfaceCode += `}\n`;

  fs.writeFileSync(path.join(GENERATED_DIR, 'data.interface.ts'), interfaceCode);
}

function generateGeometryMetadata(tableName: string, geometryColumns: any[]) {
  const metadata = {
    tableName,
    geometryColumns: geometryColumns.map(col => ({
      name: col.name,
      type: col.type,
      srid: col.srid,
    })),
    defaultGeomColumn: geometryColumns.length > 0 ? geometryColumns[0].name : null,
  };

  const metadataCode = `export const GeometryMetadata = ${JSON.stringify(metadata, null, 2)};
`;
  fs.writeFileSync(path.join(GENERATED_DIR, 'geometry.metadata.ts'), metadataCode);
}

function mapSqliteTypeToTs(sqlType: string): string {
  const type = sqlType.toUpperCase();
  if (type.includes('INT') || type.includes('SERIAL')) return 'number';
  if (type.includes('REAL') || type.includes('FLOAT') || type.includes('DOUBLE') || type.includes('NUMERIC') || type.includes('DECIMAL')) return 'number';
  if (type.includes('TEXT') || type.includes('CHAR') || type.includes('CLOB') || type.includes('VARCHAR')) return 'string';
  if (type.includes('BLOB') || type.includes('BYTEA')) return 'Buffer';
  if (type.includes('BOOL')) return 'boolean';
  if (type.includes('JSON')) return 'any';
  if (type.includes('DATE') || type.includes('TIME')) return 'Date';
  if (type.includes('UUID')) return 'string';
  if (type.includes('GEOMETRY') || type.includes('GEOGRAPHY') || type.includes('POLYGON') || type.includes('POINT') || type.includes('LINESTRING')) return 'Buffer';
  return 'any';
}

function toPascalCase(str: string): string {
  return str
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

prepare();

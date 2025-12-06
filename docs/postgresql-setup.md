# PostgreSQL/PostGIS Setup Guide

This guide explains how to configure the geo-service to work with PostgreSQL and PostGIS databases.

## Quick Start with PostgreSQL

### Option 1: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL + geo-service
docker-compose -f docker-compose.postgres.yml up -d

# The service will be available at http://localhost:8090/geo
```

### Option 2: Connect to Existing PostgreSQL

```bash
# Update .env file
DB_TYPE=postgres
DATASOURCE_STRING=postgresql://username:password@localhost:5432/database_name
DB_SCHEMA=public
DB_TABLE=your_table_name

# Run the service
npm run dev
```

## Environment Variables for PostgreSQL

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DB_TYPE` | No | Database type (auto-detected) | `postgres` |
| `DATASOURCE_STRING` | Yes | PostgreSQL connection URL | `postgresql://user:pass@host:5432/db` |
| `DB_SCHEMA` | No | Database schema | `public` (default) |
| `DB_TABLE` | No | Specific table to use | `locations` (uses first table if not set) |
| `DB_SSL` | No | Enable SSL connection | `true` or `false` |

## Connection String Formats

### Standard PostgreSQL
```
postgresql://username:password@hostname:5432/database_name
```

### With SSL
```
postgresql://username:password@hostname:5432/database_name?sslmode=require
```

### AWS RDS
```
postgresql://username:password@mydb.abc123.us-east-1.rds.amazonaws.com:5432/mydb
```

### Heroku Postgres
```
postgres://username:password@ec2-host.compute-1.amazonaws.com:5432/database
```

## PostGIS Support

The service automatically handles PostGIS geometry types:

- `GEOMETRY` columns are mapped to `string` type
- `GEOGRAPHY` columns are mapped to `string` type
- GeoJSON can be stored and retrieved as strings

### Example PostGIS Table

```sql
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location GEOMETRY(Point, 4326),
  description TEXT
);

INSERT INTO locations (name, location, description) VALUES
  ('New York', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326), 'The Big Apple'),
  ('London', ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326), 'Capital of England');
```

## Type Mapping

| PostgreSQL Type | TypeScript Type |
|----------------|-----------------|
| INTEGER, SERIAL, BIGINT | number |
| NUMERIC, DECIMAL, REAL, DOUBLE PRECISION | number |
| VARCHAR, TEXT, CHAR | string |
| BOOLEAN | boolean |
| BYTEA | Buffer |
| JSON, JSONB | any |
| DATE, TIMESTAMP, TIME | Date |
| UUID | string |
| GEOMETRY, GEOGRAPHY | string |

## Common Issues

### Connection Refused
- Ensure PostgreSQL is running
- Check firewall settings
- Verify connection string credentials

### SSL Required
```bash
DB_SSL=true
DATASOURCE_STRING=postgresql://user:pass@host:5432/db?sslmode=require
```

### Schema Not Found
```bash
DB_SCHEMA=your_schema_name
```

### Multiple Tables
Specify which table to use:
```bash
DB_TABLE=your_table_name
```

## Production Deployment

### Using Managed PostgreSQL (AWS RDS, Azure, etc.)

```bash
# .env
DB_TYPE=postgres
DATASOURCE_STRING=postgresql://admin:password@mydb.region.rds.amazonaws.com:5432/production
DB_SSL=true
ALLOWED_CRUD=R
SERVICE_HEADER=your-secret-key
```

### Docker with External PostgreSQL

```bash
docker run -d \
  -p 8090:8090 \
  -e DB_TYPE=postgres \
  -e DATASOURCE_STRING=postgresql://user:pass@host:5432/db \
  -e ALLOWED_CRUD=CRUD \
  geo-service
```

## Testing the Connection

```bash
# Test with curl
curl http://localhost:8090/geo/your_table

# Test with authentication
curl -H "x-geo-call: your-secret" http://localhost:8090/geo/your_table
```

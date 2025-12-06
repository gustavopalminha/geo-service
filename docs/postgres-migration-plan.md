# PostgreSQL/PostGIS Migration Plan

## Summary of Changes

This document outlines all changes needed to support PostgreSQL/PostGIS alongside SQLite.

---

## ✅ Completed Changes

### 1. **Configuration Service** (`src/config/config.service.ts`)
- ✅ Added `dbType` field to AppConfig interface
- ✅ Added `dbSchema` and `dbTable` fields for PostgreSQL
- ✅ Implemented `detectDbType()` method (auto-detects from connection string)
- ✅ Supports both file paths (SQLite) and URLs (PostgreSQL)

### 2. **Database Module** (`src/database/database.module.ts`)
- ✅ Made TypeORM configuration dynamic based on `dbType`
- ✅ Added PostgreSQL connection with URL parsing
- ✅ Added SSL support for PostgreSQL (`DB_SSL` env variable)
- ✅ Maintains backward compatibility with SQLite

### 3. **Prepare Script** (`scripts/prepare.ts`)
- ✅ Added database type detection
- ✅ Created `createDataSource()` for multi-database support
- ✅ Implemented `getTables()` with PostgreSQL `information_schema` queries
- ✅ Implemented `getColumns()` with PostgreSQL schema introspection
- ✅ Enhanced type mapping for PostgreSQL types (SERIAL, VARCHAR, UUID, GEOMETRY, etc.)
- ✅ Added support for `DB_SCHEMA` and `DB_TABLE` environment variables

### 4. **Dependencies** (`package.json`)
- ✅ Added `pg` package for PostgreSQL support
- ✅ Kept `sqlite3` for backward compatibility

### 5. **Configuration Files**
- ✅ Created `.env.example` with PostgreSQL examples
- ✅ Created `docker-compose.postgres.yml` for PostgreSQL deployment
- ✅ Created `docs/postgresql-setup.md` with comprehensive guide

---

## 📋 Implementation Steps

### Step 1: Install Dependencies
```bash
npm install pg
```

### Step 2: Update Environment Variables
Add to your `.env` file:
```bash
# For PostgreSQL
DB_TYPE=postgres
DATASOURCE_STRING=postgresql://username:password@localhost:5432/database_name
DB_SCHEMA=public
DB_TABLE=your_table_name
DB_SSL=false
```

### Step 3: Run Prepare Script
```bash
npm run prepare
```
This will:
- Connect to PostgreSQL
- Introspect the schema
- Generate TypeORM entities
- Generate TypeScript interfaces

### Step 4: Start the Service
```bash
npm run dev
```

---

## 🔄 Migration Workflow

### From SQLite to PostgreSQL

1. **Export SQLite data** (if needed):
   ```bash
   sqlite3 data/sample.sqlite .dump > backup.sql
   ```

2. **Create PostgreSQL table** with equivalent schema

3. **Update .env**:
   ```bash
   DB_TYPE=postgres
   DATASOURCE_STRING=postgresql://user:pass@localhost:5432/mydb
   ```

4. **Regenerate entities**:
   ```bash
   npm run prepare
   ```

5. **Test the service**:
   ```bash
   npm run dev
   curl http://localhost:8090/geo/your_table
   ```

---

## 🐳 Docker Deployment

### SQLite (Original)
```bash
docker-compose up -d
```

### PostgreSQL + PostGIS
```bash
docker-compose -f docker-compose.postgres.yml up -d
```

This starts:
- PostGIS container with sample database
- geo-service connected to PostgreSQL

---

## 🧪 Testing

### Test SQLite (Backward Compatibility)
```bash
DB_TYPE=sqlite DATASOURCE_STRING=./data/sample.sqlite npm run prepare
npm run dev
curl http://localhost:8090/geo/sample
```

### Test PostgreSQL
```bash
DB_TYPE=postgres DATASOURCE_STRING=postgresql://user:pass@localhost:5432/db npm run prepare
npm run dev
curl http://localhost:8090/geo/your_table
```

---

## 🔍 Key Features

### Auto-Detection
The service automatically detects database type from connection string:
- `./data/file.sqlite` → SQLite
- `postgresql://...` → PostgreSQL
- `postgres://...` → PostgreSQL

### Type Mapping
Enhanced type mapping supports:
- PostgreSQL: SERIAL, VARCHAR, UUID, JSONB, GEOMETRY, GEOGRAPHY
- SQLite: INTEGER, TEXT, REAL, BLOB

### Schema Support
PostgreSQL schemas are fully supported:
```bash
DB_SCHEMA=myschema
DB_TABLE=mytable
```

### SSL Support
For production PostgreSQL:
```bash
DB_SSL=true
DATASOURCE_STRING=postgresql://user:pass@host:5432/db?sslmode=require
```

---

## 📊 Comparison

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Connection | File path | URL string |
| Schema introspection | `PRAGMA table_info` | `information_schema` |
| Primary key detection | `pk` column | JOIN with constraints |
| SSL | N/A | Supported |
| Schema support | N/A | `DB_SCHEMA` variable |
| Spatial data | Spatialite | PostGIS |

---

## ⚠️ Breaking Changes

**None!** All changes are backward compatible:
- Existing SQLite configurations work without modification
- Default behavior unchanged (SQLite with `./data/sample.sqlite`)
- Auto-detection prevents need for manual `DB_TYPE` setting

---

## 🚀 Next Steps

1. **Install dependencies**: `npm install`
2. **Choose your database**: Update `.env` file
3. **Run prepare**: `npm run prepare`
4. **Start service**: `npm run dev`
5. **Test endpoints**: Use curl or Postman

---

## 📚 Additional Resources

- [PostgreSQL Setup Guide](./postgresql-setup.md)
- [Original README](../README.md)
- [TypeORM PostgreSQL Documentation](https://typeorm.io/#/connection-options/postgres-connection-options)
- [PostGIS Documentation](https://postgis.net/documentation/)

---

## ✅ Verification Checklist

- [ ] `pg` package installed
- [ ] `.env` configured with PostgreSQL connection
- [ ] `npm run prepare` executes successfully
- [ ] Entity files generated in `src/generated/`
- [ ] Service starts without errors
- [ ] API endpoints return data
- [ ] CRUD operations work (if enabled)
- [ ] Type schema endpoint works (`/geo/types`)

---

## 🐛 Troubleshooting

### "Cannot find module 'pg'"
```bash
npm install pg
```

### "Connection refused"
- Check PostgreSQL is running
- Verify connection string
- Check firewall/network settings

### "relation does not exist"
- Verify `DB_SCHEMA` is correct
- Check `DB_TABLE` name
- Ensure table exists in database

### "SSL required"
```bash
DB_SSL=true
```

---

**Status**: ✅ Ready for implementation and testing

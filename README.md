# 🌐 Data-Agnostic Geo API Service

A self-contained REST API built with NestJS and TypeScript that provides CRUD operations over dynamically determined data sources. The service introspects your database schema and automatically generates TypeORM entities and TypeScript interfaces.

## 📚 Context
The main motivation to build this project was to achieve an Udemy certificate in NestJs: The Complete Developer's Guide.


## ✨ Features

- **Data Agnostic**: Works with any SQLite/Spatialite database
- **Dynamic Entity Generation**: Automatically generates TypeORM entities from database schema
- **TypeScript Generics**: Type-safe CRUD operations using generics
- **Configurable CRUD**: Control which operations are exposed (Create, Read, Update, Delete)
- **Geometry Exclusion**: Automatically excludes heavy geometry columns from standard CRUD operations
- **Security**: Optional header-based authentication
- **CORS Support**: Configurable cross-origin resource sharing
- **Docker Ready**: Multi-stage Dockerfile for production deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (v24+ recommended for better-sqlite3 compatibility on macOS)
- npm

### Installation

```bash
# Clone the repository
cd geo-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run in development mode
npm run dev
```

The server will start at `http://localhost:8090/geo`

### Using Docker

```bash
# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📋 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATASOURCE_STRING` | `./data/sample.sqlite` | Path to SQLite database file |
| `DB_TABLE` | (first table found) | Specific table name to use. If not set, uses the first table found in database |
| `HOST` | `localhost` | Server host address |
| `PORT` | `8090` | Server port |
| `API_ROOT` | `/geo` | Root path for all API endpoints |
| `API_SUBPATH` | (auto-derived) | Subpath for data CRUD (e.g., `/sample`) |
| `API_TYPE_PATH` | `/types` | Path for schema endpoint |
| `ALLOWED_CRUD` | `R` | Allowed operations: C=Create, R=Read, U=Update, D=Delete |
| `SERVICE_HEADER` | (empty) | If set, requires matching `x-geo-call` header |
| `CORS_ACCEPTED` | `*` | CORS allowed origins |
| `ALLOW_SPATIAL_QUERIES` | `true` | Enable/disable spatial query endpoints |
| `DEFAULT_SRID` | `4326` | Default SRID for spatial queries (WGS84) |
| `DEFAULT_GEOM_COLUMN` | `geom` | Default geometry column name |

## 🔌 API Endpoints

Assuming `API_ROOT=/geo` and `API_SUBPATH=/sample`:

> **Note**: Standard CRUD operations (`GET /geo/sample`, etc.) automatically exclude geometry columns to improve performance. To retrieve or query geometry data, use the `/spatial` endpoints.

### Read Operations (R)

```bash
# Get all entities
GET /geo/sample

# Get all with pagination
GET /geo/sample?skip=0&take=10

# Get all with sorting
GET /geo/sample?orderBy=name&order=ASC

# Get single entity by ID
GET /geo/sample/:id
```

### Create Operations (C)

```bash
# Create new entity
POST /geo/sample
Content-Type: application/json

{
  "id": 4,
  "name": "Paris",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "description": "City of Light"
}
```

### Update Operations (U)

```bash
# Update entity (PUT or PATCH)
PATCH /geo/sample/:id
Content-Type: application/json

{
  "description": "Updated description"
}
```

### Delete Operations (D)

```bash
# Delete entity
DELETE /geo/sample/:id
```

### Schema Information

```bash
# Get TypeScript interface schema
GET /geo/types
```

### Spatial Query Operations (SpatiaLite/PostGIS)

```bash
# Spatial query - Find all entities that intersect with geometry
POST /geo/sample/spatial
Content-Type: application/json

{
  "operation": "intersects",
  "geometry": "POINT(-74.006 40.7128)",
  "srid": 4326,
  "outputFormat": "wkt"
}

# Spatial query - Find entities that touch a line
POST /geo/sample/spatial
Content-Type: application/json

{
  "operation": "touches",
  "geometry": "LINESTRING(0 0, 10 10)",
  "geometryColumn": "shape"
}

# Spatial query - Find entities within distance
POST /geo/sample/spatial
Content-Type: application/json

{
  "operation": "distance",
  "geometry": "POINT(-74.006 40.7128)",
  "distance": 1000,
  "outputFormat": "geojson"
}

# Get geometry metadata
GET /geo/sample/spatial/metadata
```

**Supported Operations:**
- `intersects` - Geometries intersect
- `touches` - Geometries touch but don't overlap
- `contains` - Geometry A contains geometry B
- `within` - Geometry A is within geometry B
- `distance` - Within specified distance (requires `distance` parameter)

**Parameters:**
- `operation` (required) - Spatial operation to perform
- `geometry` (required) - WKT format geometry
- `geometryColumn` (optional) - Column name (auto-detected if not provided)
- `srid` (optional) - Spatial reference system ID (default: 4326)
- `distance` (optional) - Distance threshold for distance operation
- `outputFormat` (optional) - `wkt` or `geojson` (default: wkt)

## 🛠️ Development

### Project Structure

```
geo-service/
├── src/
│   ├── config/          # Configuration service
│   ├── controllers/     # API controllers
│   ├── data/           # Data service layer
│   ├── database/       # TypeORM configuration
│   ├── generated/      # Auto-generated entities (gitignored)
│   ├── middleware/     # Security middleware
│   ├── pipes/          # Validation pipes
│   ├── app.module.ts   # Root module
│   └── main.ts         # Application entry point
├── scripts/
│   └── prepare.ts      # Database introspection script
├── data/               # Database files (if not used, delete any sample files)
├── docs/               # Documentation
└── dist/               # Compiled output
```

### NPM Scripts

```bash
# Run preparation script (introspect DB and generate entities)
npm run prepare

# Build for production
npm run build

# Start production server
npm start

# Development mode with watch
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## 🔒 Security

### Header-Based Authentication

Set `SERVICE_HEADER` environment variable to require authentication:

```bash
SERVICE_HEADER=my-secret-key
```

All requests must include the header:

```bash
curl -H "x-geo-call: my-secret-key" http://localhost:8090/geo/sample
```

### CRUD Access Control

Control which operations are available using `ALLOWED_CRUD`:

- `R` - Read only (default)
- `CR` - Create and Read
- `CRUD` - Full CRUD access
- `RU` - Read and Update only

## 📊 Using Your Own Database

1. Place your SQLite database in the `data/` directory
2. Update `DATASOURCE_STRING` in `.env`:
   ```
   DATASOURCE_STRING=./data/your-database.sqlite
   ```
3. Run the prepare script:
   ```bash
   npm run prepare
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

The service will automatically introspect your database schema and generate the necessary entities.

### Using SpatiaLite Databases

For databases with spatial data:

1. Ensure your database has the SpatiaLite extension loaded
2. The prepare script will auto-detect geometry columns
3. Spatial query endpoints will be automatically available
4. Check detected geometry columns:
   ```bash
   curl http://localhost:8090/geo/sample/spatial/metadata
   ```

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t geo-service .
```

### Run Container

```bash
docker run -d \
  -p 8090:8090 \
  -v $(pwd)/data:/app/data \
  -e ALLOWED_CRUD=CRUD \
  -e DATASOURCE_STRING=./data/sample.sqlite \
  geo-service
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# Scale services
docker-compose up -d --scale geo-service=3

# View logs
docker-compose logs -f geo-service

# Stop services
docker-compose down
```

## 📝 Examples

### Example: Read-Only API

```bash
# .env
ALLOWED_CRUD=R
DATASOURCE_STRING=./data/locations.sqlite
```

### Example: Full CRUD with Authentication

```bash
# .env
ALLOWED_CRUD=CRUD
SERVICE_HEADER=secure-token-123
CORS_ACCEPTED=https://myapp.com
```

### Example: Multiple Instances

Deploy multiple instances with different databases:

```bash
# Instance 1: Locations
PORT=8091 DATASOURCE_STRING=./data/locations.sqlite npm start

# Instance 2: Users
PORT=8092 DATASOURCE_STRING=./data/users.sqlite npm start
```

### Example: Using Your County Database

Step-by-step guide to use your existing `county.sqlite` database:

**Step 1:** Place your database file in the `data/` directory
```bash
cp /path/to/county.sqlite ./data/county.sqlite
```

**Step 2:** Update your `.env` file
```bash
DATASOURCE_STRING=./data/county.sqlite
DB_TABLE=county
ALLOWED_CRUD=R
```

**Step 3:** Generate entities from your database schema
```bash
npm run prepare
```

**Step 4:** Start the API service
```bash
npm run dev
```

**Step 5:** Query your data
```bash
# Get all records
curl http://localhost:8090/geo/county

# Get with pagination
curl http://localhost:8090/geo/county?skip=0&take=20

# Get specific record by ID
curl http://localhost:8090/geo/county/1

# View the data schema
curl http://localhost:8090/geo/types

# Perform spatial query (if database has geometry columns)
curl -X POST http://localhost:8090/geo/county/spatial \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "intersects",
    "geometry": "POINT(-74.006 40.7128)"
  }'
```

### Example: Spatial Queries with SpatiaLite

Using a SpatiaLite database with geometry data:

**Step 1:** Ensure your database has spatial data
```sql
-- Example: Create a spatial table
SELECT InitSpatialMetadata();
CREATE TABLE counties (
  id INTEGER PRIMARY KEY,
  name TEXT,
  population INTEGER
);
SELECT AddGeometryColumn('counties', 'geom', 4326, 'POLYGON', 'XY');
```

**Step 2:** Configure and start the service
```bash
DATASOURCE_STRING=./data/counties.sqlite npm run prepare
npm run dev
```

**Step 3:** Query spatial data
```bash
# Find counties intersecting with a point
curl -X POST http://localhost:8090/geo/counties/spatial \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "intersects",
    "geometry": "POINT(-74.006 40.7128)",
    "outputFormat": "geojson"
  }'

# Find counties within 50km of a point
curl -X POST http://localhost:8090/geo/counties/spatial \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "distance",
    "geometry": "POINT(-74.006 40.7128)",
    "distance": 50000,
    "srid": 4326
  }'

# Check geometry metadata
curl http://localhost:8090/geo/counties/spatial/metadata
```

## 🧪 Testing

The project includes comprehensive unit tests for all core components.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run tests for SpatiaLite support
npm run test:spatialite
```

If you plan to run the geo-service with local spatialite support, you need to have the SpatiaLite extension for SQLite installed.
When running `npm run test:spatialite`, the script will attempt to load the SpatiaLite extension for SQLite and print the result to the console. 
If it's not successfull, it will print an error message and that means will not be able to run localy the geo-service with local spatialite support.

### Test Coverage

Tests cover:
- ✅ Configuration service
- ✅ Data service (CRUD operations)
- ✅ Spatial service (spatial queries)
- ✅ Controllers (API endpoints)
- ✅ Security middleware
- ✅ Validation pipes

### Writing Tests

Unit tests are located alongside source files with `.spec.ts` extension:
```
src/
├── config/
│   ├── config.service.ts
│   └── config.service.spec.ts
├── data/
│   ├── data.service.ts
│   ├── data.service.spec.ts
│   ├── spatial.service.ts
│   └── spatial.service.spec.ts
```

For detailed testing guidelines and comprehensive documentation, see:
- [docs/testing.md](docs/testing.md) - Testing documentation
- [docs/spatial-queries.md](docs/spatial-queries.md) - How to use / do spatial queries
- [docs/postgresql-setup.md](docs/postgresql-setup.md) - How to setup a PostgreSQL database
- [docs/postgresql-migration-plan.md](docs/postgresql-migration-plan.md) - How to migrate a PostgreSQL database

For sample data to test the geo-service, see the [data](data) folder.

## 🤝 Contributing

This is a blueprint implementation. Feel free to extend and customize for your needs.

## 📄 License

ISC

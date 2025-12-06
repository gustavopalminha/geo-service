const Database = require('better-sqlite3');

const db = new Database(':memory:');

console.log('Checking SpatiaLite support...');

const paths = [
    'mod_spatialite',
    'mod_spatialite.dylib',
    '/opt/homebrew/lib/mod_spatialite.dylib',
    '/usr/local/lib/mod_spatialite.dylib',
    'libspatialite',
    'libspatialite.dylib',
    '/opt/homebrew/lib/libspatialite.dylib',
    '/usr/local/lib/libspatialite.dylib',
    '/usr/lib/x86_64-linux-gnu/mod_spatialite.so'
];

let loaded = false;

for (const libName of paths) {
    try {
        console.log(`Attempting to load ${libName}...`);
        db.loadExtension(libName);
        console.log(`✅ Successfully loaded ${libName}`);
        loaded = true;
        break;
    } catch (e: any) {
        // console.log(`❌ Failed to load ${libName}: ${e.message}`);
    }
}

if (!loaded) {
    console.log('❌ Could not load SpatiaLite from any of the attempted paths.');
    process.exit(1);
}

try {
    const version = db.prepare("SELECT spatialite_version()").get();
    console.log('✅ SpatiaLite version:', version['spatialite_version()']);

    db.prepare("SELECT InitSpatialMetadata(1)").get();
    console.log('✅ InitSpatialMetadata successful');

    db.prepare("CREATE TABLE test_geom (id INTEGER PRIMARY KEY, name TEXT)").run();
    db.prepare("SELECT AddGeometryColumn('test_geom', 'geom', 4326, 'POINT', 'XY')").get();
    console.log('✅ AddGeometryColumn successful');

} catch (e: any) {
    console.error('❌ Error during spatial operations:', e.message);
    process.exit(1);
}


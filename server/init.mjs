import { db } from './database.mjs';
console.log('Database initialized. Migrations:',db.prepare('SELECT version,appliedAt FROM schema_migrations ORDER BY version').all());
db.close();

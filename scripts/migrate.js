#!/usr/bin/env node
'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('Connected to database');

    const dbDir = path.join(__dirname, '..', 'db');
    const files = fs.readdirSync(dbDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // lexicographic order: 001 → 005

    console.log(`Found ${files.length} migration file(s): ${files.join(', ')}`);

    for (const file of files) {
      const filePath = path.join(dbDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Applying migration: ${file}`);
      await client.query(sql);
      console.log(`  ✓ ${file} applied`);
    }

    console.log('All migrations applied successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();

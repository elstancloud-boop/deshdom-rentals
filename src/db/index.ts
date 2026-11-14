import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";
import { DDL } from "./migrate";

const g = globalThis as unknown as { __sqlite?: Database.Database };

function open() {
  const file = path.resolve(process.env.DATABASE_PATH ?? "./data/deshdom.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.exec(DDL);
  return sqlite;
}

export const sqlite = (g.__sqlite ??= open());
export const db = drizzle(sqlite, { schema });
export * as t from "./schema";

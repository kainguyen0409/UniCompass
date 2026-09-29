// Use the standard PostgreSQL environment variables for another machine or host.

import pg from "pg";

const pool = new pg.Pool({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
    database: process.env.PGDATABASE || "lo_trinh",
    host: process.env.PGHOST || "localhost"
  })
});

export default pool;

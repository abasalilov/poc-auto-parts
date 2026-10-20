import { attachDatabasePool } from "@vercel/functions";
import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

const globalForDb = globalThis as unknown as { mysqlPool?: Pool };

/**
 * Seconds MySQL keeps an idle connection. Serverless instances are frozen between requests and
 * can't close their own sockets, so the server must drop them or they exhaust max_connections.
 */
const SERVER_IDLE_TIMEOUT_SECONDS = 20;

/**
 * MySQL allows 60 connections shared by every serverless instance, so each keeps a small pool and
 * a request's parallel queries wait for a free connection. The SEO build sets a larger limit.
 */
const CONNECTIONS_PER_INSTANCE = Number(process.env.MYSQL_CONNECTION_LIMIT) || 2;

const POOL_IDLE_TIMEOUT_MS = 10000;

/** Waits before retrying when MySQL is out of connections; other instances free theirs quickly. */
const FULL_RETRY_DELAYS_MS = [150, 400, 900];

const createPool = () => {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: CONNECTIONS_PER_INSTANCE,
    maxIdle: 1,
    idleTimeout: POOL_IDLE_TIMEOUT_MS,
    connectTimeout: 10000,
    waitForConnections: true,
    enableKeepAlive: true,
  });
  pool.on("connection", (connection) => {
    connection.query(`SET SESSION wait_timeout = ${SERVER_IDLE_TIMEOUT_SECONDS}`);
  });
  // Keeps a Fluid compute instance awake until idle connections close, instead of suspending
  // with them open. Vercel doesn't recognise the mysql2 promise pool, so it gets the pool's shape.
  attachDatabasePool({
    on: (event: "release", listener: () => void) => pool.on(event, listener),
    config: { idleTimeout: POOL_IDLE_TIMEOUT_MS },
  });
  return pool;
};

export const getPool = (): Pool => {
  if (!globalForDb.mysqlPool) {
    globalForDb.mysqlPool = createPool();
  }
  return globalForDb.mysqlPool;
};

const isStaleConnectionError = (error: unknown) => {
  const { code, message } = (error ?? {}) as { code?: string; message?: string };
  return (
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    /closed state/i.test(message ?? "")
  );
};

const isTooManyConnections = (error: unknown) =>
  (error as { code?: string } | null)?.code === "ER_CON_COUNT_ERROR";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function query<T extends RowDataPacket>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const [rows] = await getPool().query<T[]>(sql, params);
      return rows;
    } catch (error) {
      if (isStaleConnectionError(error) && attempt === 0) continue;
      const delay = FULL_RETRY_DELAYS_MS[attempt];
      if (!isTooManyConnections(error) || delay === undefined) throw error;
      await sleep(delay + Math.random() * delay);
    }
  }
}

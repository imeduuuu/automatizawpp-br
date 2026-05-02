/**
 * _check_postgres.ts — Verificación atómica de credenciales Postgres.
 *
 * Fase 2 del Protocolo V.L.A.E.G. (Link de Credenciales).
 * Lee DATABASE_URL desde .env y ejecuta una query read-only.
 * NO escribe ni modifica datos.
 *
 * Uso: npx tsx tools/_check_postgres.ts
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const SERVICIO = "postgres";
const TIMEOUT_MS = 5000;

// Cargar .env de forma nativa (Node 20.6+)
function cargarEnv(): void {
  const candidatos = [".env.local", ".env"];
  for (const archivo of candidatos) {
    const ruta = resolve(process.cwd(), archivo);
    if (existsSync(ruta)) {
      try {
        // @ts-ignore — process.loadEnvFile es nativo en Node 20.6+
        process.loadEnvFile(ruta);
      } catch {
        // ignore — puede ya estar cargado
      }
    }
  }
}

async function principal(): Promise<number> {
  cargarEnv();

  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === "") {
    console.log(`[SKIP] ${SERVICIO}: credenciales no configuradas en .env`);
    return 0;
  }

  // Cargar Prisma Client dinámicamente (evita fallar en import-time)
  let PrismaClient: any;
  try {
    ({ PrismaClient } = await import("@prisma/client"));
  } catch (err) {
    console.log(`[FAIL] ${SERVICIO}: dependencia @prisma/client no disponible — ${(err as Error).message}`);
    return 1;
  }

  const cliente = new PrismaClient({
    datasources: { db: { url } },
    log: [],
  });

  const inicio = Date.now();
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`timeout tras ${TIMEOUT_MS}ms`)), TIMEOUT_MS),
  );

  try {
    const filas: Array<{ pg_version: string; db: string; usr: string; now: Date }> =
      await Promise.race([
        cliente.$queryRawUnsafe(
          `SELECT version() AS pg_version, current_database() AS db, current_user AS usr, NOW() AS now`,
        ),
        timeoutPromise,
      ]);

    const ms = Date.now() - inicio;
    const fila = filas?.[0];
    if (!fila) {
      console.log(`[FAIL] ${SERVICIO}: query retornó vacío`);
      return 1;
    }

    // Versión simplificada (ej: "PostgreSQL 16.2")
    const versionCorta = (fila.pg_version || "").split(" ").slice(0, 2).join(" ") || "desconocida";

    console.log(
      `[OK] ${SERVICIO} conectado en ${ms}ms — version=${versionCorta} db=${fila.db} user=${fila.usr}`,
    );
    return 0;
  } catch (err) {
    const mensaje = (err as Error).message || String(err);
    console.log(`[FAIL] ${SERVICIO}: ${mensaje}`);
    return 1;
  } finally {
    try {
      await cliente.$disconnect();
    } catch {
      // ignore
    }
  }
}

principal()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.log(`[FAIL] ${SERVICIO}: error fatal — ${(err as Error).message}`);
    process.exit(1);
  });

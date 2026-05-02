/**
 * _check_redis.ts — Verificación atómica de credenciales Redis.
 *
 * Fase 2 del Protocolo V.L.A.E.G. (Link de Credenciales).
 * Lee REDIS_URL desde .env y ejecuta PING + INFO server.
 * NO escribe ni modifica datos.
 *
 * Uso: npx tsx tools/_check_redis.ts
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const SERVICIO = "redis";
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
        // ignore
      }
    }
  }
}

function extraerVersion(info: string): string {
  const linea = info.split(/\r?\n/).find((l) => l.startsWith("redis_version:"));
  return linea ? linea.split(":")[1].trim() : "desconocida";
}

async function principal(): Promise<number> {
  cargarEnv();

  const url = process.env.REDIS_URL;
  if (!url || url.trim() === "") {
    console.log(`[SKIP] ${SERVICIO}: credenciales no configuradas en .env`);
    return 0;
  }

  // Cargar ioredis dinámicamente
  let Redis: any;
  try {
    const mod = await import("ioredis");
    Redis = mod.default || mod.Redis || mod;
  } catch (err) {
    console.log(`[FAIL] ${SERVICIO}: dependencia ioredis no disponible — ${(err as Error).message}`);
    return 1;
  }

  const cliente = new Redis(url, {
    connectTimeout: TIMEOUT_MS,
    commandTimeout: TIMEOUT_MS,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // no reintentar
    lazyConnect: false,
  });

  const inicio = Date.now();
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`timeout tras ${TIMEOUT_MS}ms`)), TIMEOUT_MS),
  );

  // Silenciar errores de event-emitter para evitar unhandled
  cliente.on("error", () => {});

  try {
    const pong: string = await Promise.race([cliente.ping(), timeoutPromise]);
    if (pong !== "PONG") {
      console.log(`[FAIL] ${SERVICIO}: PING retornó '${pong}' en lugar de PONG`);
      return 1;
    }

    const info: string = await Promise.race([cliente.info("server"), timeoutPromise]);
    const ms = Date.now() - inicio;
    const version = extraerVersion(info);

    console.log(`[OK] ${SERVICIO} conectado en ${ms}ms — version=${version}`);
    return 0;
  } catch (err) {
    const mensaje = (err as Error).message || String(err);
    console.log(`[FAIL] ${SERVICIO}: ${mensaje}`);
    return 1;
  } finally {
    try {
      cliente.disconnect();
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

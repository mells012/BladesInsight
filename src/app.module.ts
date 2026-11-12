import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { AdminGuard, AuthController, SeedService } from './auth/auth';
import { ALL_ENTITIES } from './entities';
import { ApiController, DashboardController } from './admin/misc.controllers';
import { TemporadasController } from './admin/temporadas.controller';
import { CompetenciasController } from './admin/competencias.controller';
import { PatinadorasController } from './admin/patinadoras.controller';
import { InscripcionesController } from './admin/inscripciones.controller';
import { ProgramasPlaneadosController } from './admin/programas-planeados.controller';
import { ElementosPlaneadosController } from './admin/elementos-planeados.controller';

function dbConfig(): any {
  if ((process.env.DB_TYPE ?? 'mssql') === 'sqlite') {
    const database = process.env.SQLITE_PATH ?? 'data/dev.sqlite';
    mkdirSync(dirname(database), { recursive: true });
    return { type: 'better-sqlite3', database, entities: ALL_ENTITIES, synchronize: true };
  }
  if (process.env.DB_TYPE === 'postgres') {
    // Render entrega DATABASE_URL; la conexión interna no requiere SSL (DB_SSL=true para la externa).
    return {
      type: 'postgres', url: process.env.DATABASE_URL, entities: ALL_ENTITIES, synchronize: process.env.DB_SYNC !== 'false',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
  }
  return {
    type: 'mssql',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 1433),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'bladesinsight',
    entities: ALL_ENTITIES,
    synchronize: process.env.DB_SYNC !== 'false',
    options: { encrypt: process.env.DB_ENCRYPT === 'true', trustServerCertificate: process.env.DB_TRUST_CERT !== 'false' },
  };
}

@Module({
  imports: [TypeOrmModule.forRoot(dbConfig()), TypeOrmModule.forFeature(ALL_ENTITIES)],
  controllers: [
    AuthController, DashboardController, ApiController,
    TemporadasController, CompetenciasController, PatinadorasController,
    InscripcionesController, ProgramasPlaneadosController, ElementosPlaneadosController,
  ],
  providers: [SeedService, { provide: APP_GUARD, useClass: AdminGuard }],
})
export class AppModule {}

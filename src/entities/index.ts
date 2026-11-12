import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique,
} from 'typeorm';

const num = { to: (v?: number) => v, from: (v: string | number) => (v == null ? v : Number(v)) };

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 150, unique: true }) email: string;
  @Column({ name: 'password_hash', length: 100 }) passwordHash: string;
  @Column({ length: 100 }) nombre: string;
  @Column({ length: 20, default: 'Aficionado' }) rol: 'Admin' | 'Aficionado';
}

@Entity('temporadas')
export class Temporada {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 7, unique: true }) nombre: string; // 2026/27
  @Column({ type: 'date', name: 'fecha_inicio' }) fechaInicio: string;
  @Column({ type: 'date', name: 'fecha_fin' }) fechaFin: string;
}

@Entity('competencias')
export class Competencia {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 150 }) nombre: string;
  @Column({ length: 30 }) tipo: string;
  @Column({ length: 120 }) sede: string;
  @Column({ type: 'date', name: 'fecha_inicio' }) fechaInicio: string;
  @Column({ type: 'date', name: 'fecha_fin' }) fechaFin: string;
  @ManyToOne(() => Temporada) @JoinColumn({ name: 'temporada_id' }) temporada: Temporada;
  @Column({ name: 'temporada_id' }) temporadaId: number;
}

@Entity('patinadoras')
export class Patinadora {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 60 }) nombre: string;
  @Column({ length: 60 }) apellido: string;
  @Column({ length: 3 }) pais: string;
  @Column({ type: 'date', name: 'fecha_nacimiento' }) fechaNacimiento: string;
  /** Dato sensible: identificador único con el que el proceso de carga enlaza resultados. */
  @Column({ name: 'isu_id', length: 10, unique: true }) isuId: string;
  @Column({ default: true }) activa: boolean;
}

@Entity('inscripciones')
@Unique(['competenciaId', 'patinadoraId'])
export class Inscripcion {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Competencia) @JoinColumn({ name: 'competencia_id' }) competencia: Competencia;
  @Column({ name: 'competencia_id' }) competenciaId: number;
  @ManyToOne(() => Patinadora) @JoinColumn({ name: 'patinadora_id' }) patinadora: Patinadora;
  @Column({ name: 'patinadora_id' }) patinadoraId: number;
}

@Entity('programas_planeados')
@Unique(['patinadoraId', 'temporadaId', 'tipoPrograma'])
export class ProgramaPlaneado {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Patinadora) @JoinColumn({ name: 'patinadora_id' }) patinadora: Patinadora;
  @Column({ name: 'patinadora_id' }) patinadoraId: number;
  @ManyToOne(() => Temporada) @JoinColumn({ name: 'temporada_id' }) temporada: Temporada;
  @Column({ name: 'temporada_id' }) temporadaId: number;
  @Column({ name: 'tipo_programa', length: 10 }) tipoPrograma: string; // Corto | Libre
}

@Entity('elementos_planeados')
@Unique(['programaPlaneadoId', 'orden'])
export class ElementoPlaneado {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => ProgramaPlaneado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programa_planeado_id' }) programaPlaneado: ProgramaPlaneado;
  @Column({ name: 'programa_planeado_id' }) programaPlaneadoId: number;
  @Column() orden: number;
  @Column({ length: 30 }) codigo: string;
  @Column({ length: 30 }) tipo: string; // Salto | Giro | SecuenciaPasos | SecuenciaCoreografica
  @Column('decimal', { name: 'valor_base', precision: 5, scale: 2, transformer: num }) valorBase: number;
  @Column({ name: 'segunda_mitad', default: false }) segundaMitad: boolean;
}

export const ALL_ENTITIES = [
  Usuario, Temporada, Competencia, Patinadora, Inscripcion, ProgramaPlaneado, ElementoPlaneado,
];

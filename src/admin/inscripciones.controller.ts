import { Controller } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PAISES } from '../common/catalogos';
import { CrudController, Field } from '../common/crud.controller';
import { FormError, parseId } from '../common/validators';
import { Competencia, Inscripcion, Patinadora, Temporada } from '../entities';

@Controller('admin/inscripciones')
export class InscripcionesController extends CrudController {
  slug = 'inscripciones';
  title = 'Inscripciones';
  singular = 'inscripción';
  columns = [
    { key: 'competencia', label: 'Competencia' },
    { key: 'temporada', label: 'Temporada' },
    { key: 'patinadora', label: 'Patinadora' },
    { key: 'pais', label: 'País' },
  ];
  constructor(
    @InjectRepository(Inscripcion) private repo: Repository<Inscripcion>,
    @InjectRepository(Competencia) private competencias: Repository<Competencia>,
    @InjectRepository(Patinadora) private patinadoras: Repository<Patinadora>,
    @InjectRepository(Temporada) private temporadas: Repository<Temporada>,
  ) { super(); }

  async rows() {
    const r = await this.repo.find({ relations: { competencia: { temporada: true }, patinadora: true }, order: { id: 'DESC' } });
    return r.map((i) => ({
      id: i.id, competencia: i.competencia.nombre, temporada: i.competencia.temporada.nombre,
      patinadora: `${i.patinadora.apellido}, ${i.patinadora.nombre}`, pais: PAISES[i.patinadora.pais] ?? i.patinadora.pais,
    }));
  }
  find(id: number) {
    return this.repo.findOne({ where: { id }, relations: { competencia: true, patinadora: true } });
  }
  remove(id: number) { return this.repo.delete(id).then(() => undefined); }

  async fields(e: any, b: any): Promise<Field[]> {
    const ts = await this.temporadas.find({ order: { fechaInicio: 'DESC' } });
    return [
      // Cascada 1: Temporada -> Competencia
      { name: 'temporadaId', label: 'Temporada', type: 'select', helper: true, required: true,
        value: b?.temporadaId ?? e?.competencia?.temporadaId ?? '',
        options: ts.map((t) => ({ value: t.id, label: t.nombre })) },
      { name: 'competenciaId', label: 'Competencia', type: 'select', required: true,
        value: this.v(e, b, 'competenciaId'), dependsOn: 'temporadaId', url: '/admin/api/competencias', param: 'temporadaId' },
      // Cascada 2: País -> Patinadora
      { name: 'pais', label: 'País', type: 'select', helper: true, required: true,
        value: b?.pais ?? e?.patinadora?.pais ?? '',
        options: Object.entries(PAISES).map(([value, label]) => ({ value, label })) },
      { name: 'patinadoraId', label: 'Patinadora', type: 'select', required: true,
        value: this.v(e, b, 'patinadoraId'), dependsOn: 'pais', url: '/admin/api/patinadoras', param: 'pais' },
    ];
  }

  async save(id: number | null, body: any) {
    const errors: Record<string, string> = {};
    const competenciaId = parseId(body.competenciaId);
    const patinadoraId = parseId(body.patinadoraId);
    const comp = competenciaId ? await this.competencias.findOneBy({ id: competenciaId }) : null;
    const pat = patinadoraId ? await this.patinadoras.findOneBy({ id: patinadoraId }) : null;
    if (!comp) errors.competenciaId = 'Seleccione una competencia.';
    if (!pat) errors.patinadoraId = 'Seleccione una patinadora.';
    if (pat && !pat.activa) errors.patinadoraId = 'La patinadora está inactiva.';
    // La cascada es solo UX: el servidor verifica la coherencia de los datos recibidos.
    const temporadaId = parseId(body.temporadaId);
    if (comp && temporadaId && comp.temporadaId !== temporadaId) errors.competenciaId = 'La competencia no pertenece a la temporada elegida.';
    if (pat && body.pais && pat.pais !== String(body.pais)) errors.patinadoraId = 'La patinadora no pertenece al país elegido.';
    if (comp && pat && !errors.competenciaId && !errors.patinadoraId) {
      const dup = await this.repo.findOneBy({ competenciaId: comp.id, patinadoraId: pat.id });
      if (dup && dup.id !== id) errors.patinadoraId = 'La patinadora ya está inscrita en esa competencia.';
    }
    if (Object.keys(errors).length) throw new FormError(errors);
    await this.repo.save({ id: id ?? undefined, competenciaId: comp!.id, patinadoraId: pat!.id });
  }
}

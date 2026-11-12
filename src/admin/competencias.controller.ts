import { Controller } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TIPOS_COMPETENCIA } from '../common/catalogos';
import { CrudController, Field } from '../common/crud.controller';
import { FormError, parseDate, parseId, str } from '../common/validators';
import { Competencia, Temporada } from '../entities';

@Controller('admin/competencias')
export class CompetenciasController extends CrudController {
  slug = 'competencias';
  title = 'Competencias';
  singular = 'competencia';
  columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'sede', label: 'Sede' },
    { key: 'fechas', label: 'Fechas' },
    { key: 'temporada', label: 'Temporada' },
  ];
  constructor(
    @InjectRepository(Competencia) private repo: Repository<Competencia>,
    @InjectRepository(Temporada) private temporadas: Repository<Temporada>,
  ) { super(); }

  async rows() {
    const r = await this.repo.find({ relations: { temporada: true }, order: { fechaInicio: 'DESC' } });
    return r.map((c) => ({ ...c, fechas: `${c.fechaInicio} → ${c.fechaFin}`, temporada: c.temporada.nombre }));
  }
  find(id: number) { return this.repo.findOneBy({ id }); }
  remove(id: number) { return this.repo.delete(id).then(() => undefined); }

  async fields(e: any, b: any): Promise<Field[]> {
    const ts = await this.temporadas.find({ order: { fechaInicio: 'DESC' } });
    return [
      { name: 'temporadaId', label: 'Temporada', type: 'select', required: true, value: this.v(e, b, 'temporadaId'),
        options: ts.map((t) => ({ value: t.id, label: t.nombre })) },
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, value: this.v(e, b, 'nombre') },
      { name: 'tipo', label: 'Tipo de competencia', type: 'select', required: true, value: this.v(e, b, 'tipo'),
        options: TIPOS_COMPETENCIA.map((t) => ({ value: t, label: t })) },
      { name: 'sede', label: 'Sede', type: 'text', required: true, value: this.v(e, b, 'sede') },
      { name: 'fechaInicio', label: 'Fecha de inicio', type: 'date', required: true, value: this.v(e, b, 'fechaInicio') },
      { name: 'fechaFin', label: 'Fecha de fin', type: 'date', required: true, value: this.v(e, b, 'fechaFin') },
    ];
  }

  async save(id: number | null, body: any) {
    const errors: Record<string, string> = {};
    const temporadaId = parseId(body.temporadaId);
    const temporada = temporadaId ? await this.temporadas.findOneBy({ id: temporadaId }) : null;
    if (!temporada) errors.temporadaId = 'Seleccione una temporada existente.';
    const nombre = str(body.nombre);
    if (nombre.length < 3 || nombre.length > 150) errors.nombre = 'Entre 3 y 150 caracteres.';
    const tipo = str(body.tipo);
    if (!TIPOS_COMPETENCIA.includes(tipo)) errors.tipo = 'Tipo de competencia inválido.';
    const sede = str(body.sede);
    if (sede.length < 2 || sede.length > 120) errors.sede = 'Entre 2 y 120 caracteres.';
    const ini = parseDate(str(body.fechaInicio));
    const fin = parseDate(str(body.fechaFin));
    if (!ini) errors.fechaInicio = 'Fecha inválida.';
    if (!fin) errors.fechaFin = 'Fecha inválida.';
    if (ini && fin && fin < ini) errors.fechaFin = 'La fecha de fin no puede ser anterior al inicio.';
    if (temporada && ini && fin && !errors.fechaFin) {
      if (str(body.fechaInicio) < temporada.fechaInicio || str(body.fechaFin) > temporada.fechaFin) {
        errors.fechaInicio = `Las fechas deben estar dentro de la temporada ${temporada.nombre} (${temporada.fechaInicio} a ${temporada.fechaFin}).`;
      }
    }
    if (Object.keys(errors).length) throw new FormError(errors);
    await this.repo.save({
      id: id ?? undefined, temporadaId: temporadaId!, nombre, tipo, sede,
      fechaInicio: str(body.fechaInicio), fechaFin: str(body.fechaFin),
    });
  }
}

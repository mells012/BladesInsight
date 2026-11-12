import { Controller } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudController, Field } from '../common/crud.controller';
import { FormError, parseDate, str } from '../common/validators';
import { Temporada } from '../entities';

@Controller('admin/temporadas')
export class TemporadasController extends CrudController {
  slug = 'temporadas';
  title = 'Temporadas';
  singular = 'temporada';
  columns = [
    { key: 'nombre', label: 'Temporada' },
    { key: 'fechaInicio', label: 'Inicio' },
    { key: 'fechaFin', label: 'Fin' },
  ];
  constructor(@InjectRepository(Temporada) private repo: Repository<Temporada>) { super(); }

  rows() { return this.repo.find({ order: { fechaInicio: 'DESC' } }); }
  find(id: number) { return this.repo.findOneBy({ id }); }
  remove(id: number) { return this.repo.delete(id).then(() => undefined); }

  async fields(e: any, b: any): Promise<Field[]> {
    return [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, value: this.v(e, b, 'nombre'), hint: 'Formato 2026/27' },
      { name: 'fechaInicio', label: 'Fecha de inicio', type: 'date', required: true, value: this.v(e, b, 'fechaInicio') },
      { name: 'fechaFin', label: 'Fecha de fin', type: 'date', required: true, value: this.v(e, b, 'fechaFin') },
    ];
  }

  async save(id: number | null, body: any) {
    const errors: Record<string, string> = {};
    const nombre = str(body.nombre);
    const m = /^(\d{4})\/(\d{2})$/.exec(nombre);
    if (!m || (Number(m[1]) + 1) % 100 !== Number(m[2])) errors.nombre = 'Use el formato 2026/27 con años consecutivos.';
    const ini = parseDate(str(body.fechaInicio));
    const fin = parseDate(str(body.fechaFin));
    if (!ini) errors.fechaInicio = 'Fecha inválida.';
    if (!fin) errors.fechaFin = 'Fecha inválida.';
    if (ini && fin && fin <= ini) errors.fechaFin = 'La fecha de fin debe ser posterior al inicio.';
    if (!errors.nombre) {
      const dup = await this.repo.findOneBy({ nombre });
      if (dup && dup.id !== id) errors.nombre = 'Ya existe una temporada con ese nombre.';
    }
    if (Object.keys(errors).length) throw new FormError(errors);
    await this.repo.save({ id: id ?? undefined, nombre, fechaInicio: str(body.fechaInicio), fechaFin: str(body.fechaFin) });
  }
}

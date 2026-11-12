import { Controller } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PAISES } from '../common/catalogos';
import { CrudController, Field } from '../common/crud.controller';
import { edadEn, FormError, parseDate, str } from '../common/validators';
import { Patinadora } from '../entities';

const NOMBRE = /^[\p{L}][\p{L} '.-]{1,59}$/u;
/** Código ISU: dato sensible, enlaza los resultados que importa el proceso de carga. */
const ISU_ID = /^ISU-\d{6}$/;

@Controller('admin/patinadoras')
export class PatinadorasController extends CrudController {
  slug = 'patinadoras';
  title = 'Patinadoras';
  singular = 'patinadora';
  columns = [
    { key: 'isuId', label: 'Código ISU' },
    { key: 'nombreCompleto', label: 'Nombre' },
    { key: 'paisNombre', label: 'País' },
    { key: 'fechaNacimiento', label: 'Nacimiento' },
    { key: 'estado', label: 'Estado' },
  ];
  constructor(@InjectRepository(Patinadora) private repo: Repository<Patinadora>) { super(); }

  async rows() {
    const r = await this.repo.find({ order: { apellido: 'ASC' } });
    return r.map((p) => ({
      ...p, nombreCompleto: `${p.apellido}, ${p.nombre}`, paisNombre: PAISES[p.pais] ?? p.pais,
      estado: p.activa ? 'Activa' : 'Inactiva',
    }));
  }
  find(id: number) { return this.repo.findOneBy({ id }); }
  remove(id: number) { return this.repo.delete(id).then(() => undefined); }

  async fields(e: any, b: any): Promise<Field[]> {
    return [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, value: this.v(e, b, 'nombre') },
      { name: 'apellido', label: 'Apellido', type: 'text', required: true, value: this.v(e, b, 'apellido') },
      { name: 'pais', label: 'País', type: 'select', required: true, value: this.v(e, b, 'pais'),
        options: Object.entries(PAISES).map(([value, label]) => ({ value, label })) },
      { name: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', required: true,
        value: this.v(e, b, 'fechaNacimiento'), hint: 'Categoría senior: 15 años cumplidos antes del 1 de julio.' },
      { name: 'isuId', label: 'Código ISU (dato sensible)', type: 'text', required: true, value: this.v(e, b, 'isuId'),
        hint: 'Formato ISU-123456. Se valida y se verifica unicidad en el servidor antes de guardar.' },
      { name: 'activa', label: 'Activa', type: 'checkbox', value: b ? b.activa === 'on' : (e?.activa ?? true) },
    ];
  }

  async save(id: number | null, body: any) {
    const errors: Record<string, string> = {};
    const nombre = str(body.nombre);
    const apellido = str(body.apellido);
    if (!NOMBRE.test(nombre)) errors.nombre = 'Solo letras, espacios, apóstrofe, punto o guion (2-60).';
    if (!NOMBRE.test(apellido)) errors.apellido = 'Solo letras, espacios, apóstrofe, punto o guion (2-60).';
    const pais = str(body.pais);
    if (!(pais in PAISES)) errors.pais = 'Seleccione un país del catálogo.';

    const nac = parseDate(str(body.fechaNacimiento));
    if (!nac) errors.fechaNacimiento = 'Fecha inválida.';
    else {
      const ref = new Date(Date.UTC(new Date().getUTCFullYear(), 6, 1)); // 1 de julio del año en curso
      const edad = edadEn(nac, ref);
      if (edad < 15) errors.fechaNacimiento = 'Categoría senior: debe tener 15 años cumplidos antes del 1 de julio.';
      else if (edad > 50) errors.fechaNacimiento = 'Fecha de nacimiento fuera de rango.';
    }

    // Dato sensible: normalización + formato + unicidad, siempre en servidor.
    const isuId = str(body.isuId).toUpperCase();
    if (!ISU_ID.test(isuId)) errors.isuId = 'Formato inválido. Use ISU-seguido de 6 dígitos (ej. ISU-123456).';
    else {
      const dup = await this.repo.findOneBy({ isuId });
      if (dup && dup.id !== id) errors.isuId = 'Ese código ISU ya está registrado para otra patinadora.';
    }
    if (Object.keys(errors).length) throw new FormError(errors);
    await this.repo.save({
      id: id ?? undefined, nombre, apellido, pais, isuId,
      fechaNacimiento: str(body.fechaNacimiento), activa: body.activa === 'on',
    });
  }
}

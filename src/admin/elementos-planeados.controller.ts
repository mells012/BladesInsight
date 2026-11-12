import { Controller } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PAISES, resolverElemento } from '../common/catalogos';
import { CrudController, Field } from '../common/crud.controller';
import { FormError, parseId, str } from '../common/validators';
import { ElementoPlaneado, ProgramaPlaneado } from '../entities';

const MAX_ELEMENTOS: Record<string, number> = { Corto: 7, Libre: 12 };

@Controller('admin/elementos-planeados')
export class ElementosPlaneadosController extends CrudController {
  slug = 'elementos-planeados';
  title = 'Elementos planeados';
  singular = 'elemento planeado';
  columns = [
    { key: 'programa', label: 'Programa' },
    { key: 'orden', label: '#' },
    { key: 'codigo', label: 'Código' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'valorBase', label: 'Valor base' },
    { key: 'segunda', label: '2ª mitad' },
  ];
  constructor(
    @InjectRepository(ElementoPlaneado) private repo: Repository<ElementoPlaneado>,
    @InjectRepository(ProgramaPlaneado) private programas: Repository<ProgramaPlaneado>,
  ) { super(); }

  async rows() {
    const r = await this.repo.find({
      relations: { programaPlaneado: { patinadora: true, temporada: true } },
      order: { programaPlaneadoId: 'ASC', orden: 'ASC' },
    });
    return r.map((x) => ({
      id: x.id, orden: x.orden, codigo: x.codigo, tipo: x.tipo, valorBase: x.valorBase.toFixed(2),
      segunda: x.segundaMitad ? 'Sí' : 'No',
      programa: `${x.programaPlaneado.patinadora.apellido} · ${x.programaPlaneado.temporada.nombre} · ${x.programaPlaneado.tipoPrograma}`,
    }));
  }
  find(id: number) {
    return this.repo.findOne({ where: { id }, relations: { programaPlaneado: { patinadora: true } } });
  }
  remove(id: number) { return this.repo.delete(id).then(() => undefined); }

  async fields(e: any, b: any): Promise<Field[]> {
    const patId = b?.patinadoraId ?? e?.programaPlaneado?.patinadoraId ?? '';
    return [
      // Cascada de 3 niveles: País -> Patinadora -> Programa planeado
      { name: 'pais', label: 'País', type: 'select', helper: true, required: true,
        value: b?.pais ?? e?.programaPlaneado?.patinadora?.pais ?? '',
        options: Object.entries(PAISES).map(([value, label]) => ({ value, label })) },
      { name: 'patinadoraId', label: 'Patinadora', type: 'select', helper: true, required: true, value: patId,
        dependsOn: 'pais', url: '/admin/api/patinadoras', param: 'pais' },
      { name: 'programaPlaneadoId', label: 'Programa planeado', type: 'select', required: true,
        value: this.v(e, b, 'programaPlaneadoId'),
        dependsOn: 'patinadoraId', url: '/admin/api/programas-planeados', param: 'patinadoraId' },
      { name: 'orden', label: 'Orden en el programa', type: 'number', required: true, value: this.v(e, b, 'orden') },
      { name: 'codigo', label: 'Código del elemento', type: 'text', required: true, value: this.v(e, b, 'codigo'),
        hint: 'Ej.: 3Lz+3T, 2A, FCSp4, StSq3. El tipo y el valor base los calcula el servidor.' },
      { name: 'segundaMitad', label: 'Segunda mitad (bonus ×1.1, solo salto en programa libre)', type: 'checkbox',
        value: b ? b.segundaMitad === 'on' : (e?.segundaMitad ?? false) },
    ];
  }

  async save(id: number | null, body: any) {
    const errors: Record<string, string> = {};
    const progId = parseId(body.programaPlaneadoId);
    const prog = progId ? await this.programas.findOneBy({ id: progId }) : null;
    if (!prog) errors.programaPlaneadoId = 'Seleccione un programa planeado.';

    // Validación de dato sensible para el estimador: el valor base NUNCA se acepta del cliente.
    const codigo = str(body.codigo);
    const info = resolverElemento(codigo);
    if (!info) errors.codigo = 'Código de elemento no reconocido en el catálogo ISU configurado.';

    const orden = Number(str(body.orden));
    if (!Number.isInteger(orden) || orden < 1 || orden > 12) errors.orden = 'El orden debe ser un entero entre 1 y 12.';
    const segunda = body.segundaMitad === 'on';
    if (segunda && prog && prog.tipoPrograma !== 'Libre') errors.segundaMitad = 'El bonus de segunda mitad solo aplica al programa libre.';
    if (segunda && info && info.tipo !== 'Salto') errors.segundaMitad = 'El bonus de segunda mitad solo aplica a saltos.';

    if (prog && !errors.orden) {
      const max = MAX_ELEMENTOS[prog.tipoPrograma];
      if (orden > max) errors.orden = `El programa ${prog.tipoPrograma.toLowerCase()} admite como máximo ${max} elementos.`;
      const dup = await this.repo.findOneBy({ programaPlaneadoId: prog.id, orden });
      if (dup && dup.id !== id) errors.orden = 'Ya existe un elemento con ese orden en el programa.';
    }
    if (Object.keys(errors).length) throw new FormError(errors);
    await this.repo.save({
      id: id ?? undefined, programaPlaneadoId: prog!.id, orden, codigo,
      tipo: info!.tipo, valorBase: info!.base, segundaMitad: segunda,
    });
  }
}

import { Controller } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PAISES, TIPOS_PROGRAMA } from '../common/catalogos';
import { CrudController, Field } from '../common/crud.controller';
import { FormError, parseId, str } from '../common/validators';
import { Patinadora, ProgramaPlaneado, Temporada } from '../entities';

@Controller('admin/programas-planeados')
export class ProgramasPlaneadosController extends CrudController {
  slug = 'programas-planeados';
  title = 'Programas planeados';
  singular = 'programa planeado';
  columns = [
    { key: 'patinadora', label: 'Patinadora' },
    { key: 'temporada', label: 'Temporada' },
    { key: 'tipoPrograma', label: 'Segmento' },
    { key: 'elementos', label: 'Elementos' },
  ];
  constructor(
    @InjectRepository(ProgramaPlaneado) private repo: Repository<ProgramaPlaneado>,
    @InjectRepository(Patinadora) private patinadoras: Repository<Patinadora>,
    @InjectRepository(Temporada) private temporadas: Repository<Temporada>,
  ) { super(); }

  async rows() {
    const r = await this.repo.find({ relations: { patinadora: true, temporada: true }, order: { id: 'DESC' } });
    const counts = await this.repo.query(
      'SELECT programa_planeado_id AS id, COUNT(*) AS n FROM elementos_planeados GROUP BY programa_planeado_id',
    );
    const byId = new Map<number, number>(counts.map((c: any) => [Number(c.id), Number(c.n)]));
    return r.map((p) => ({
      id: p.id, patinadora: `${p.patinadora.apellido}, ${p.patinadora.nombre}`, temporada: p.temporada.nombre,
      tipoPrograma: p.tipoPrograma, elementos: byId.get(p.id) ?? 0,
    }));
  }
  find(id: number) { return this.repo.findOne({ where: { id }, relations: { patinadora: true } }); }
  remove(id: number) { return this.repo.delete(id).then(() => undefined); }

  async fields(e: any, b: any): Promise<Field[]> {
    const ts = await this.temporadas.find({ order: { fechaInicio: 'DESC' } });
    return [
      // Cascada: País -> Patinadora
      { name: 'pais', label: 'País', type: 'select', helper: true, required: true,
        value: b?.pais ?? e?.patinadora?.pais ?? '',
        options: Object.entries(PAISES).map(([value, label]) => ({ value, label })) },
      { name: 'patinadoraId', label: 'Patinadora', type: 'select', required: true,
        value: this.v(e, b, 'patinadoraId'), dependsOn: 'pais', url: '/admin/api/patinadoras', param: 'pais' },
      { name: 'temporadaId', label: 'Temporada', type: 'select', required: true, value: this.v(e, b, 'temporadaId'),
        options: ts.map((t) => ({ value: t.id, label: t.nombre })) },
      { name: 'tipoPrograma', label: 'Segmento', type: 'select', required: true, value: this.v(e, b, 'tipoPrograma'),
        options: TIPOS_PROGRAMA.map((t) => ({ value: t, label: t })) },
    ];
  }

  async save(id: number | null, body: any) {
    const errors: Record<string, string> = {};
    const patinadoraId = parseId(body.patinadoraId);
    const temporadaId = parseId(body.temporadaId);
    const pat = patinadoraId ? await this.patinadoras.findOneBy({ id: patinadoraId }) : null;
    const temp = temporadaId ? await this.temporadas.findOneBy({ id: temporadaId }) : null;
    if (!pat) errors.patinadoraId = 'Seleccione una patinadora.';
    if (pat && body.pais && pat.pais !== String(body.pais)) errors.patinadoraId = 'La patinadora no pertenece al país elegido.';
    if (!temp) errors.temporadaId = 'Seleccione una temporada.';
    const tipo = str(body.tipoPrograma);
    if (!TIPOS_PROGRAMA.includes(tipo)) errors.tipoPrograma = 'Segmento inválido.';
    if (pat && temp && !errors.tipoPrograma) {
      const dup = await this.repo.findOneBy({ patinadoraId: pat.id, temporadaId: temp.id, tipoPrograma: tipo });
      if (dup && dup.id !== id) errors.tipoPrograma = 'Ya existe ese programa planeado para la patinadora en la temporada.';
    }
    if (Object.keys(errors).length) throw new FormError(errors);
    await this.repo.save({ id: id ?? undefined, patinadoraId: pat!.id, temporadaId: temp!.id, tipoPrograma: tipo });
  }
}

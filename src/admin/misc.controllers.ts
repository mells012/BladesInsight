import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { resolverElemento } from '../common/catalogos';
import { parseId } from '../common/validators';
import {
  Competencia, ElementoPlaneado, Inscripcion, Patinadora, ProgramaPlaneado, Temporada,
} from '../entities';

@Controller('admin')
export class DashboardController {
  constructor(
    @InjectRepository(Temporada) private t: Repository<Temporada>,
    @InjectRepository(Competencia) private c: Repository<Competencia>,
    @InjectRepository(Patinadora) private p: Repository<Patinadora>,
    @InjectRepository(Inscripcion) private i: Repository<Inscripcion>,
    @InjectRepository(ProgramaPlaneado) private pp: Repository<ProgramaPlaneado>,
    @InjectRepository(ElementoPlaneado) private e: Repository<ElementoPlaneado>,
  ) {}

  @Get()
  async index(@Req() req: any, @Res() res: any) {
    const [temporadas, competencias, patinadoras, inscripciones, programas, elementos] = await Promise.all(
      [this.t, this.c, this.p, this.i, this.pp, this.e].map((r: Repository<any>) => r.count()),
    );
    res.render('dashboard', {
      user: req.user, title: 'Panel',
      stats: [
        { label: 'Temporadas', n: temporadas, href: '/admin/temporadas' },
        { label: 'Competencias', n: competencias, href: '/admin/competencias' },
        { label: 'Patinadoras', n: patinadoras, href: '/admin/patinadoras' },
        { label: 'Inscripciones', n: inscripciones, href: '/admin/inscripciones' },
        { label: 'Programas planeados', n: programas, href: '/admin/programas-planeados' },
        { label: 'Elementos planeados', n: elementos, href: '/admin/elementos-planeados' },
      ],
    });
  }
}

/** Endpoints JSON que alimentan los dropdowns en cascada (protegidos por el guard global). */
@Controller('admin/api')
export class ApiController {
  constructor(
    @InjectRepository(Competencia) private c: Repository<Competencia>,
    @InjectRepository(Patinadora) private p: Repository<Patinadora>,
    @InjectRepository(ProgramaPlaneado) private pp: Repository<ProgramaPlaneado>,
  ) {}

  @Get('competencias')
  async competencias(@Query('temporadaId') temporadaId?: string) {
    const id = parseId(temporadaId);
    if (!id) return [];
    const rows = await this.c.find({ where: { temporadaId: id }, order: { fechaInicio: 'ASC' } });
    return rows.map((r) => ({ value: r.id, label: `${r.nombre} (${r.tipo})` }));
  }

  @Get('patinadoras')
  async patinadoras(@Query('pais') pais?: string) {
    if (!/^[A-Z]{3}$/.test(pais ?? '')) return [];
    const rows = await this.p.find({ where: { pais }, order: { apellido: 'ASC' } });
    return rows.map((r) => ({ value: r.id, label: `${r.apellido}, ${r.nombre}` }));
  }

  @Get('programas-planeados')
  async programas(@Query('patinadoraId') patinadoraId?: string) {
    const id = parseId(patinadoraId);
    if (!id) return [];
    const rows = await this.pp.find({ where: { patinadoraId: id }, relations: { temporada: true } });
    return rows.map((r) => ({ value: r.id, label: `${r.temporada.nombre} · ${r.tipoPrograma}` }));
  }

  @Get('valor-base')
  valorBase(@Query('codigo') codigo?: string) {
    const r = resolverElemento((codigo ?? '').trim());
    return r ? { valido: true, ...r } : { valido: false };
  }
}

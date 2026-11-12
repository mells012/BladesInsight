import { Body, Get, Param, ParseIntPipe, Post, Query, Req, Res } from '@nestjs/common';
import { FormError } from './validators';

export interface Option { value: string | number; label: string; selected?: boolean }
export interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  value?: any;
  required?: boolean;
  hint?: string;
  options?: Option[];
  /** Dropdown en cascada: nombre del campo padre, URL JSON y nombre del parámetro. */
  dependsOn?: string;
  url?: string;
  param?: string;
  /** Campo auxiliar (solo filtra el dropdown siguiente, no se guarda). */
  helper?: boolean;
  error?: string;
  readonly?: boolean;
}

/** Controlador MVC genérico: lista, formulario, alta, edición y baja. Cada recurso lo extiende. */
export abstract class CrudController {
  abstract readonly slug: string;
  abstract readonly title: string;
  abstract readonly singular: string;
  abstract readonly columns: { key: string; label: string }[];
  abstract rows(): Promise<Record<string, any>[]>;
  abstract find(id: number): Promise<any | null>;
  abstract fields(entity: any | null, body: any | null): Promise<Field[]>;
  abstract save(id: number | null, body: any): Promise<void>;
  abstract remove(id: number): Promise<void>;

  protected get base() { return `/admin/${this.slug}`; }
  protected v(e: any, b: any, name: string) { return b?.[name] ?? e?.[name] ?? ''; }

  @Get()
  async index(@Req() req: any, @Res() res: any, @Query('ok') ok?: string, @Query('err') err?: string) {
    const rows = await this.rows();
    res.render('list', {
      user: req.user, title: this.title, singular: this.singular, base: this.base,
      columns: this.columns, ok, err,
      rows: rows.map((r) => ({ id: r.id, cells: this.columns.map((c) => r[c.key]) })),
    });
  }

  @Get('nuevo')
  async nuevo(@Req() req: any, @Res() res: any) {
    await this.renderForm(req, res, null, null, {});
  }

  @Post()
  async crear(@Req() req: any, @Res() res: any, @Body() body: any) {
    await this.submit(req, res, null, body);
  }

  @Get(':id/editar')
  async editar(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: any) {
    const e = await this.find(id);
    if (!e) return res.redirect(`${this.base}?err=${encodeURIComponent('El registro no existe.')}`);
    await this.renderForm(req, res, id, e, {});
  }

  @Post(':id/eliminar')
  async eliminar(@Param('id', ParseIntPipe) id: number, @Res() res: any) {
    try {
      await this.remove(id);
      res.redirect(`${this.base}?ok=${encodeURIComponent('Registro eliminado.')}`);
    } catch {
      res.redirect(`${this.base}?err=${encodeURIComponent('No se puede eliminar: tiene registros relacionados.')}`);
    }
  }

  @Post(':id')
  async actualizar(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: any, @Body() body: any) {
    await this.submit(req, res, id, body);
  }

  private async submit(req: any, res: any, id: number | null, body: any) {
    try {
      await this.save(id, body ?? {});
      res.redirect(`${this.base}?ok=${encodeURIComponent('Registro guardado.')}`);
    } catch (e) {
      if (!(e instanceof FormError)) throw e;
      const entity = id ? await this.find(id) : null;
      await this.renderForm(req, res, id, entity, e.errors, body ?? {});
    }
  }

  private async renderForm(req: any, res: any, id: number | null, entity: any, errors: Record<string, string>, body: any = null) {
    const fields = (await this.fields(entity, body)).map((f) => ({
      ...f,
      error: errors[f.name],
      options: f.options?.map((o) => ({ ...o, selected: String(o.value) === String(f.value) })),
    }));
    if (Object.keys(errors).length) res.status(400);
    res.render('form', {
      user: req.user, title: id ? `Editar ${this.singular}` : `Nuevo ${this.singular}`,
      action: id ? `${this.base}/${id}` : this.base, base: this.base, fields,
      summary: Object.values(errors),
    });
  }
}

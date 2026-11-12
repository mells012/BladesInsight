import { CanActivate, Body, Controller, ExecutionContext, Get, Injectable, OnApplicationBootstrap, Post, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { Usuario } from '../entities';
import { str, validarPassword } from '../common/validators';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-no-usar-en-produccion';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en producción');
}

/** Guard global: todo /admin exige un token JWT válido con rol Admin. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    if (!req.path.startsWith('/admin')) return true;
    try {
      const p: any = jwt.verify(req.cookies?.token ?? '', SECRET);
      if (p.rol !== 'Admin') throw new Error('rol');
      req.user = { id: p.sub, nombre: p.nombre, email: p.email };
      return true;
    } catch {
      if (req.path.startsWith('/admin/api')) res.status(401).json({ error: 'No autenticado' });
      else res.redirect('/login');
      return false;
    }
  }
}

const intentos = new Map<string, { n: number; hasta: number }>();

@Controller()
export class AuthController {
  constructor(@InjectRepository(Usuario) private usuarios: Repository<Usuario>) {}

  @Get()
  home(@Res() res: any) { res.redirect('/admin'); }

  @Get('login')
  loginForm(@Res() res: any) { res.render('login', { layout: false }); }

  @Post('login')
  async login(@Req() req: any, @Res() res: any, @Body() body: any) {
    const ip = req.ip ?? 'x';
    const rec = intentos.get(ip);
    if (rec && rec.n >= 5 && rec.hasta > Date.now()) {
      return res.status(429).render('login', { layout: false, error: 'Demasiados intentos. Espere 15 minutos.' });
    }
    const u = await this.usuarios.findOne({ where: { email: str(body?.email).toLowerCase() } });
    const ok = u && u.rol === 'Admin' && (await bcrypt.compare(str(body?.password), u.passwordHash));
    if (!ok) {
      intentos.set(ip, { n: (rec && rec.hasta > Date.now() ? rec.n : 0) + 1, hasta: Date.now() + 15 * 60_000 });
      return res.status(401).render('login', { layout: false, error: 'Credenciales inválidas.' });
    }
    intentos.delete(ip);
    const token = jwt.sign({ sub: u!.id, rol: u!.rol, nombre: u!.nombre, email: u!.email }, SECRET, { expiresIn: '2h' });
    res.cookie('token', token, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 2 * 3600_000,
    });
    res.redirect('/admin');
  }

  @Post('logout')
  logout(@Res() res: any) { res.clearCookie('token'); res.redirect('/login'); }
}

/** Crea el administrador inicial si no existe ninguno. */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(@InjectRepository(Usuario) private usuarios: Repository<Usuario>) {}

  async onApplicationBootstrap() {
    if (await this.usuarios.count({ where: { rol: 'Admin' } })) return;
    const dev = process.env.NODE_ENV !== 'production';
    const email = (process.env.ADMIN_EMAIL ?? (dev ? 'admin@bladesinsight.local' : '')).toLowerCase();
    const pass = process.env.ADMIN_PASSWORD ?? (dev ? 'Admin12345!' : '');
    const err = !email || !pass ? 'faltan ADMIN_EMAIL / ADMIN_PASSWORD' : validarPassword(pass);
    if (err) { console.warn(`[seed] No se creó el administrador: ${err}`); return; }
    await this.usuarios.save({
      email, nombre: 'Administrador', rol: 'Admin', passwordHash: await bcrypt.hash(pass, 12),
    });
    console.log(`[seed] Administrador creado: ${email}`);
  }
}

export class FormError extends Error {
  constructor(public errors: Record<string, string>) {
    super('Datos inválidos');
  }
}

export function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function parseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T00:00:00Z');
  return isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}

export function parseId(v: unknown): number | null {
  const s = str(v);
  return /^\d{1,9}$/.test(s) && Number(s) > 0 ? Number(s) : null;
}

/** Edad cumplida en una fecha de referencia. */
export function edadEn(nacimiento: Date, ref: Date): number {
  let e = ref.getUTCFullYear() - nacimiento.getUTCFullYear();
  const m = ref.getUTCMonth() - nacimiento.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < nacimiento.getUTCDate())) e--;
  return e;
}

export function validarPassword(p: string): string | null {
  if (p.length < 10) return 'La contraseña debe tener al menos 10 caracteres.';
  if (!/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/\d/.test(p)) {
    return 'La contraseña debe incluir mayúsculas, minúsculas y números.';
  }
  return null;
}

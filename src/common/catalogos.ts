export const PAISES: Record<string, string> = {
  USA: 'Estados Unidos', JPN: 'Japón', KOR: 'Corea del Sur', RUS: 'Rusia (ISU)', BEL: 'Bélgica',
  CAN: 'Canadá', FRA: 'Francia', ITA: 'Italia', GER: 'Alemania', GBR: 'Reino Unido',
  GEO: 'Georgia', ESP: 'España', SUI: 'Suiza', FIN: 'Finlandia', SWE: 'Suecia', NED: 'Países Bajos',
  AUT: 'Austria', CZE: 'Chequia', POL: 'Polonia', HUN: 'Hungría', LAT: 'Letonia', EST: 'Estonia',
  AUS: 'Australia', CHN: 'China', ISR: 'Israel', ARM: 'Armenia', UKR: 'Ucrania', AZE: 'Azerbaiyán',
  MEX: 'México', ECU: 'Ecuador', BRA: 'Brasil', ARG: 'Argentina', COL: 'Colombia',
};

export const TIPOS_COMPETENCIA = [
  'GrandPrix', 'FinalGrandPrix', 'Mundial', 'CuatroContinentes', 'Europeo', 'JuegosOlimpicos', 'Challenger',
];
export const TIPOS_PROGRAMA = ['Corto', 'Libre'];

/**
 * Valores base de referencia (tabla de valores ISU, nivel 4 en giros).
 * Es configurable: verificar contra la última Comunicación ISU vigente antes de producción.
 */
export const SALTOS_BASE: Record<string, number> = {
  '1A': 1.1, '2A': 3.3, '3A': 8.0, '4A': 12.5,
  '1T': 0.4, '2T': 1.3, '3T': 4.2, '4T': 9.5,
  '1S': 0.4, '2S': 1.3, '3S': 4.3, '4S': 9.7,
  '1Lo': 0.5, '2Lo': 1.7, '3Lo': 4.9, '4Lo': 10.5,
  '1F': 0.5, '2F': 1.8, '3F': 5.3, '4F': 11.0,
  '1Lz': 0.6, '2Lz': 2.1, '3Lz': 5.9, '4Lz': 11.5,
};
export const OTROS_BASE: Record<string, { tipo: string; base: number }> = {
  FCSp4: { tipo: 'Giro', base: 3.2 }, LSp4: { tipo: 'Giro', base: 2.7 },
  CCoSp4: { tipo: 'Giro', base: 3.5 }, FCCoSp4: { tipo: 'Giro', base: 3.5 },
  FSSp4: { tipo: 'Giro', base: 3.0 }, CSp4: { tipo: 'Giro', base: 2.6 }, SSp4: { tipo: 'Giro', base: 2.5 },
  StSq3: { tipo: 'SecuenciaPasos', base: 3.3 }, StSq4: { tipo: 'SecuenciaPasos', base: 3.9 },
  ChSq1: { tipo: 'SecuenciaCoreografica', base: 3.0 },
};

/** Calcula tipo y valor base a partir del código (ej. 3Lz+3T = 10.10). Devuelve null si el código no es válido. */
export function resolverElemento(codigo: string): { tipo: string; base: number } | null {
  const partes = codigo.split('+');
  if (partes.length > 1) {
    let total = 0;
    for (const p of partes) {
      if (!(p in SALTOS_BASE)) return null;
      total += SALTOS_BASE[p];
    }
    return { tipo: 'Salto', base: Math.round(total * 100) / 100 };
  }
  if (codigo in SALTOS_BASE) return { tipo: 'Salto', base: SALTOS_BASE[codigo] };
  if (codigo in OTROS_BASE) return OTROS_BASE[codigo];
  return null;
}

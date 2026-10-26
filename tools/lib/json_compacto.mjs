// Formata JSON com 2 espaços, mas mantém numa linha só os arrays curtos de números/booleanos (legibilidade dos dados).
export function jsonCompacto(valor) {
  return JSON.stringify(valor, null, 2).replace(/\[\s*((?:-?\d+(?:\.\d+)?|true|false|null)(?:,\s*(?:-?\d+(?:\.\d+)?|true|false|null))*)\s*\]/g, (_, m) => `[${m.replace(/\s*\n\s*/g, ' ').replace(/,\s+/g, ', ')}]`) + '\n';
}

const blockedPatterns = [
  /\b(dosis|dosificación|mg\/?kg|medicamento|antibiótico|diagnóstico|tratamiento)\b/i,
  /\b(amoxicilina|prednisona|ibuprofeno|paracetamol)\b/i
];
const personalData=[/https?:\/\/|www\.|\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,/\b(?:\+?51\s*)?(?:9\d{8}|\d{3}[ -]?\d{3}[ -]?\d{3})\b/,/whats?app|wa\.me|telegram|instagram|facebook|tiktok|código\s*qr|qr\s*code/i];
const threats=/\b(te voy a|voy a mat|amenaz|golpear|destruir)\b/i;
const insults=/\b(idiota|imbécil|estúpido|basura de persona|inútil)\b/i;
const seriousClaims=/\b(fraude|estafa|estafador(?:a)?|robo|ladrón|delito|negligencia|maltrato)\b/i;

export function validateCommunityContent(value: string, minimumLength = 12) {
  if (value.trim().length < minimumLength) return "Cuéntanos un poco más sobre tu experiencia.";
  if(personalData.some(pattern=>pattern.test(value)))return "Por seguridad, no publiques URLs, correos, teléfonos, WhatsApp, redes sociales ni códigos QR.";
  if(threats.test(value)||insults.test(value))return "No permitimos amenazas, insultos ni ataques personales. Describe la experiencia y los hechos con respeto.";
  if (/(.)\1{8,}/.test(value) || /(.{20,})\1{2,}/i.test(value)) return "Detectamos contenido repetido. Escribe una sola experiencia original.";
  if (blockedPatterns.some(pattern => pattern.test(value))) {
    return "Miaupedia no admite diagnósticos, medicamentos, dosificaciones ni recomendaciones médicas.";
  }
  return "";
}

export function reviewNeedsModeration(value:string){return seriousClaims.test(value)}

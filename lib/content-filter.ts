const blockedPatterns = [
  /\b(dosis|dosificación|mg\/?kg|medicamento|antibiótico|diagnóstico|tratamiento)\b/i,
  /\b(amoxicilina|prednisona|ibuprofeno|paracetamol)\b/i
];

export function validateCommunityContent(value: string) {
  if (value.trim().length < 12) return "Cuéntanos un poco más sobre tu experiencia.";
  if (/(.)\1{8,}/.test(value) || /(https?:\/\/\S+.*){3,}/i.test(value)) return "El contenido parece repetitivo o publicitario.";
  if (blockedPatterns.some(pattern => pattern.test(value))) {
    return "Miaupedia no admite diagnósticos, medicamentos, dosificaciones ni recomendaciones médicas.";
  }
  return "";
}

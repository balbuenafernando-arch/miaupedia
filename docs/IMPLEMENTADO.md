# Funcionalidades implementadas

- Supabase Auth: registro, inicio, recuperación, cierre y restauración de sesión.
- Modo demo persistente en `localStorage` cuando no hay variables Supabase.
- Onboarding de seis pasos, visible para usuarios nuevos y repetible desde la cuenta.
- CRUD de gatos con preferencias, porcentaje de perfil y estructura de recomendaciones por similitud.
- Agenda persistente: crear, completar, reabrir y eliminar recordatorios.
- Directorio con búsqueda por distrito/categoría, fichas, iconografía veterinaria y seguimiento persistente.
- CRUD de reseñas de usuario, acciones útil/no útil/reportar y filtro de spam/contenido médico.
- Comparador real de hasta tres productos.
- Contacto privado preparado sin exponer correo o teléfono.
- Empty states, estados bloqueados, confirmaciones destructivas y disclaimers contextuales.
- SQL completo con tablas, índices, trigger de alta, colecciones iniciales y políticas RLS.
- URLs SEO preparadas para distritos y categorías.
- Compilación de producción verificada con Next.js 15.5.19.

## Refinamiento V1 para pruebas

- Edad calculada en años y meses desde fecha de nacimiento; se eliminó la edad manual.
- Perfil con peso/fecha, tipo de vida, personalidad, veterinaria habitual y observaciones.
- Porcentaje real, campos faltantes y acción para completar perfil.
- Cumpleaños anual automático y próximos eventos dentro del perfil.
- Informe ejecutivo corto/completo preparado para guardar como PDF.
- Reseñas con hasta cinco fotos, historial de edición y estados transparentes.
- Moderación automática de contacto/datos personales y revisión -sin eliminación- de acusaciones sensibles.
- Una reseña activa editable por usuario/ficha, utilidad positiva/negativa y respuestas públicas.
- Estados de ficha comunitaria/negocio verificado, dashboard básico y sugerencias moderadas de catálogo.
- Aviso antifraude y reporte de usuarios con motivos estructurados.

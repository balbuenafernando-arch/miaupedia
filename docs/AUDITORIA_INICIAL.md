# Auditoría inicial

Fecha: 20 de junio de 2026. Estado evaluado antes de modificar el proyecto.

## Funcional

- Navegación visual entre Inicio, Explorar, Mi gato y Agenda.
- Búsqueda y filtro por categoría en memoria.
- Apertura de fichas y estados temporales de favoritos/comparador.

## Simulado o incompleto

- Autenticación, onboarding, favoritos, agenda, gatos, reseñas, alertas, contacto y comparación no persistían.
- Los botones de añadir/editar/contactar y varios controles solo mostraban avisos o carecían de acción.
- Todo el directorio, gato, agenda, reseñas y estadísticas provenía de constantes hardcodeadas.
- Supabase tenía cliente y esquema parcial, pero ninguna operación de la interfaz lo utilizaba.

## UX y responsive

- Menú móvil sin apertura, controles ocultos en vez de adaptados, comparador con riesgo de superposición y modales sin manejo suficiente de alto/overflow.
- No había validación, confirmación destructiva, estados de autenticación/carga/error, onboarding ni persistencia al refrescar.
- Se detectaron caracteres mal codificados en visualizaciones de consola.

## Supabase requerido

Auth, gatos/preferencias, recordatorios, reseñas, follows, colecciones, notificaciones, conversaciones, negocios, reportes y moderación.

# Pasar la voz

## Operación y moderación

En el proyecto Supabase de MIAUPEDIA, abrir Table Editor con una cuenta autorizada.

1. Filtrar `businesses.community_state` por `pending`. Revisar nombre, distrito y dirección frente a las sedes existentes. Cambiar a `approved` o `rejected`. La aprobación hace visibles la sede y sus experiencias.
2. Filtrar `fija_reports.state` por `open`. Consultar su `fija_id`, `comment_id` o `update_id`. Marcar el reporte como `reviewed` o `dismissed`.
3. Ante una infracción, cambiar el contenido a `hidden` en `fijas`, `fija_comments` o `fija_updates`. Una mala calificación por sí sola no amerita ocultación. Los cambios de estado quedan en `community_moderation_log`. Si el editor actúa sin identidad de aplicación, el actor UUID queda vacío.
4. Publicar cambios legales con una nueva versión en `community_documents` y actualizar los textos versionados de la aplicación. Probar la aceptación y el bloqueo de la versión anterior en el mismo despliegue.

Antes de abrir contribuciones al público, validar el responsable y canal de privacidad, la retención y transferencias, y los textos con asesoría jurídica peruana. El acceso de Google requiere credenciales configuradas en el proyecto exclusivo de MIAUPEDIA.

## Historial de Supabase

Los scripts base se aplicaron en producción con sellos distintos de los locales. Correspondencia registrada durante la auditoría:

| Archivo o versión local | Versión remota |
| --- | --- |
| schema.sql | 20261123234430 |
| 003 | 20261123234451 |
| 004 | 20261123234522 |
| 005 | 20261123234603 |
| 20261123231604 | 20261123234614 |
| 20261123234509 | 20261123234623 |
| 20261123235046 | 20261123235112 |
| 20261123235520 | 20261123235520 |
| 20261124232445 | 20261124232905 |

Aplicar la migración nueva por nombre con Supabase y comprobar el historial remoto. Evitar `db push` sobre producción mientras difieran los sellos históricos, porque podría intentar reaplicar scripts ya ejecutados.

La migración local `20261125013230_pasar_la_voz.sql` figura en producción como `20261125014707 pasar_la_voz`.

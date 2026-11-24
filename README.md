# Miaupedia MVP funcional

Plataforma peruana, exclusivamente para gatos, orientada al descubrimiento de productos, veterinarias y servicios mediante experiencias comunitarias.

## Inicio rápido

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. Sin credenciales Supabase, la aplicación entra en un modo demo persistente y claramente identificado; los cambios permanecen al refrescar mediante almacenamiento local.

## Supabase

1. Crea un proyecto Supabase.
2. Ejecuta [supabase/schema.sql](supabase/schema.sql) en SQL Editor.
3. Completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Configura las Redirect URLs de Auth.

Con Supabase configurado, el registro, login, recuperación, sesión y sincronización de perfiles/agenda usan el backend real y sus políticas RLS.

## Recomendaciones

Aplica [la migración de Recomendaciones](supabase/migrations/20261123231604_product_recommendations.sql) en el entorno Supabase que vayas a usar. En un proyecto nuevo, ejecuta el esquema base y todas las migraciones en orden. El catálogo usa las filas existentes de `products` y las reseñas de `reviews` asociadas por `product_id`.

Para publicar un producto, abre **Supabase → Table Editor → products → Insert row**. Completa `nombre`, un `slug` único y la `categoria`. Usa un slug con letras minúsculas, números y guiones para que la ficha tenga una URL estable. Puedes completar `descripcion`, `imagen` con una URL HTTPS y `precio_referencia` en soles. Los juguetes, rascadores, transportadoras y fuentes de agua aparecen también con el filtro **Accesorios**. La ficha queda visible al guardar la fila con `publicado` activo. Desactiva ese campo para retirarla del catálogo sin perder la ficha ni sus reseñas.

Los usuarios con cuenta pueden usar **Proponer una ficha**. La propuesta queda en `products` con `publicado=false` y el catálogo público sigue mostrando solo fichas aprobadas. Para moderarla, busca las filas con `propuesto_por` en **Table Editor → products**. Revisa nombre, categoría y descripción antes de activar `publicado`. El nombre normalizado y la categoría evitan propuestas repetidas, incluso cuando una ficha todavía está en revisión.

Cada cuenta puede valorar una vez por producto. La calificación de 1 a 5 es obligatoria. Los motivos y el comentario son opcionales. Se conservan las reseñas y los campos de ventajas y desventajas que ya existían.

Para moderar una reseña pendiente, filtra `reviews` por `product_id` y `moderation_state = pending`. Cambia `moderation_state` a `approved` y `estado` a `Publicada` para hacerla visible, o cambia `moderation_state` a `rejected` para mantenerla fuera de la ficha.

## Datos guardados en este navegador

Los perfiles y recordatorios de la versión demo permanecen en el navegador donde se crearon. **Usar mi cuenta de Miaupedia** abre un espacio separado, con perfiles y agenda sincronizados para esa cuenta. **Ver mis datos de este navegador** vuelve al espacio anterior.

En producción, el inicio de sesión admite cuentas habilitadas por un administrador. Activa el registro y la recuperación de autoservicio solo cuando Supabase tenga un servicio de correo público configurado y verificado. Para mostrarlos en la aplicación, define `NEXT_PUBLIC_AUTH_EMAIL_ENABLED=true` y vuelve a desplegar.

## Instalar en Android

En Chrome para Android, abre `https://miaupedia.vercel.app` y elige **Instalar aplicación** o **Añadir a pantalla de inicio** en el menú. Miaupedia se abre como aplicación independiente desde el icono. Si pierdes la conexión, se muestra una página con un acceso para volver a intentar. La sesión, los perfiles y las reseñas usan la red.

## Verificación

```bash
npm run lint
npm run build
npx tsc --noEmit
```

Documentos de entrega:

- `docs/AUDITORIA_INICIAL.md`
- `docs/IMPLEMENTADO.md`
- `docs/PENDIENTE.md`
- `docs/DESPLIEGUE.md`

## Seguridad

La clave `SUPABASE_SERVICE_ROLE_KEY` es únicamente para procesos seguros del servidor y nunca debe exponerse con prefijo `NEXT_PUBLIC_`. Miaupedia no incluye diagnósticos, tratamientos, medicamentos ni dosificaciones.

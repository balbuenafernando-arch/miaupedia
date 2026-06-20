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

## Verificación

```bash
npm run build
```

Documentos de entrega:

- `docs/AUDITORIA_INICIAL.md`
- `docs/IMPLEMENTADO.md`
- `docs/PENDIENTE.md`
- `docs/DESPLIEGUE.md`

## Seguridad

La clave `SUPABASE_SERVICE_ROLE_KEY` es únicamente para procesos seguros del servidor y nunca debe exponerse con prefijo `NEXT_PUBLIC_`. Miaupedia no incluye diagnósticos, tratamientos, medicamentos ni dosificaciones.

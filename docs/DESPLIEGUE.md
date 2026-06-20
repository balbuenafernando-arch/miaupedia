# Despliegue

1. Crear un proyecto en Supabase y ejecutar `supabase/schema.sql` en SQL Editor.
2. Copiar `.env.example` a `.env.local` y completar URL y claves. La service role nunca debe exponerse al navegador.
3. En Supabase Auth, agregar la URL local y el dominio Vercel a Redirect URLs.
4. Ejecutar `npm install` y `npm run build`.
5. Importar el repositorio en Vercel, declarar las mismas variables y desplegar.
6. Verificar registro por correo, recuperación, RLS y políticas de Storage antes de abrir al público.

## Errores corregidos

- Acciones visuales sin persistencia ni formularios.
- Falta de autenticación/onboarding y estados vacíos.
- Menú móvil inerte, modales desbordados y comparador superpuesto.
- Base de datos incompleta y sin mensajería, colecciones, notificaciones o geografía.
- Falta de moderación básica y restricciones de contenido médico.
- Next.js fijado exactamente en 15.5.19 y advertencia de raíz de compilación corregida.

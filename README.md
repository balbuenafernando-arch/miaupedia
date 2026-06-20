# Miaupedia MVP

Aplicación mobile-first para descubrir y comparar productos, servicios y veterinarias felinas en Perú.

## Ejecutar

```bash
npm install
npm run dev
```

La interfaz funciona de inmediato con datos demo. Para conectar Supabase, copia `.env.example` a `.env.local`, completa las dos variables y ejecuta `supabase/schema.sql` en el editor SQL de tu proyecto.

## Incluido

- Inicio, directorio con búsqueda y filtros, favoritos y fichas con reseñas.
- Perfil de múltiples gatos, preferencias y recomendaciones.
- Agenda de cumpleaños, vacunas y desparasitaciones.
- Base visual del comparador, alertas, confianza y publicidad identificada.
- Esquema PostgreSQL con roles y políticas RLS preparado para Supabase.
- Diseño responsive y disclaimer en las zonas relevantes.

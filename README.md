# Alisan PG · Pantalla de servicio

Aplicación para visualizar en tiempo real las placas en servicio, llamados de turno y contenido audiovisual de Alisan PG.

## Funciones principales

- Tablero público de placas en proceso y llamados de turno.
- Actualización en tiempo real mediante Supabase Realtime.
- Acceso de empleados y área administrativa.
- Carga de videos MP4 desde el panel de empleados.
- Fila persistente de reproducción: el empleado puede ordenar, eliminar y elegir el video que inicia primero.
- Perfil de Instagram preparado para integración con Meta OAuth.

## Videos de la pantalla

Desde **Panel empleado → Pantalla y videos**, el equipo puede subir un archivo MP4 de hasta **500 MB**. El video se guarda en Supabase Storage, se registra en la fila y aparece en la pantalla pública sin recargarla.

Para que esta función quede operativa en cada entorno, aplica las migraciones de `supabase/migrations/`. Estas crean las tablas de medios, habilitan Realtime y configuran el bucket público `display-videos` para MP4 de hasta 500 MB.

> La importación automática de Reels requiere una aplicación de Meta con OAuth configurado en el backend. Guardar solo una URL de Instagram no concede permisos para leer los videos privados de una cuenta.

### Conectar Instagram

1. Convierte `@alisanpg` en cuenta profesional y vincúlala a una página de Facebook.
2. En Meta for Developers crea una app, agrega **Facebook Login** e incluye esta URL de redirección: `https://fznhdcfexzybvvdzwjkm.supabase.co/functions/v1/instagram-connect`.
3. Configura en los secretos de Supabase: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` (la URL anterior) y `APP_URL` (la URL pública de Vercel).
4. Despliega la función `instagram-connect` y aplica las migraciones. Desde el panel, pulsa **Conectar con Instagram**, aprueba el acceso y luego **Sincronizar Reels**.

## Desarrollo local

1. Instala dependencias: `pnpm install`.
2. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en `.env`.
3. Ejecuta `pnpm run dev`.
4. Abre `http://127.0.0.1:5173`.

## Verificación y despliegue

```bash
pnpm run build
```

El repositorio está conectado a GitHub. Si el proyecto de Vercel está enlazado con la rama `main`, cada `git push origin main` genera un despliegue automático. Comprueba que las mismas variables de Supabase estén configuradas en Vercel antes de publicar.

## Tecnologías

- React + TanStack Start + Vite
- Supabase (Database, Storage y Realtime)
- Tailwind CSS
- TypeScript

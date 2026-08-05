# Alisan PG · Pantalla de servicio

Aplicación web para el taller Alisan PG. Muestra placas en proceso y llamados de turno, y permite al equipo administrar una fila audiovisual para la pantalla de atención al cliente.

## Estado del proyecto

| Servicio | Uso |
| --- | --- |
| Vercel | Aplicación web, despliegues y variables de entorno |
| Neon PostgreSQL | Fila, orden y estado de reproducción de videos |
| Cloudinary Free | Almacenamiento de MP4 cargados por el equipo |
| Supabase | Funciones existentes del taller, autenticación y datos heredados |

Producción: [alisanpgpantalla1.vercel.app](https://alisanpgpantalla1.vercel.app)

## Funcionalidades

- Tablero público de placas en proceso, llamados y sonido de atención.
- Panel de empleados con acceso facial o modo demostración.
- Catálogo, servicios, facturación y formularios operativos.
- Fila audiovisual persistente en PostgreSQL: ordenar, eliminar y elegir el primer video.
- Reproducción automática en la pantalla pública; consulta la fila periódicamente para reflejar cambios.
- Carga de MP4 hasta 500 MB mediante Cloudinary, con aviso claro del límite.
- Perfil de Instagram predeterminado `@alisanpg`, preparado para OAuth oficial de Meta.

## Arquitectura de videos

```text
Empleado → Cloudinary (MP4) → URL pública
                           ↓
                     Neon PostgreSQL (fila)
                           ↓
                  Pantalla pública de Alisan PG
```

PostgreSQL guarda solamente los metadatos y la fila. Los archivos de video se almacenan fuera de la base para evitar problemas de tamaño, rendimiento y costos.

## Variables de entorno

No publiques secretos ni agregues archivos `.env*` al repositorio.

| Variable | Dónde | Propósito |
| --- | --- | --- |
| `DATABASE_URL` | Vercel / Neon | Conexión privada a PostgreSQL; se crea al vincular Neon. |
| `VITE_CLOUDINARY_CLOUD_NAME` | Vercel | Nombre de nube de Cloudinary. |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Vercel | Preset de subida sin firma limitado a la carpeta de videos. |
| `VITE_SUPABASE_URL` | Vercel | Servicios existentes de Supabase. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel | Clave pública de Supabase. |

### Cloudinary Free

Para habilitar la carga de MP4 propios:

1. Crea una cuenta gratuita en Cloudinary.
2. Crea un **unsigned upload preset** restringido al tipo `video` y, si es posible, a la carpeta `alisanpg-display`.
3. Agrega el cloud name y el preset en las variables de entorno de Vercel.
4. Redespiega la aplicación.

## Desarrollo local

```bash
pnpm install
pnpm run dev
```

Abre `http://127.0.0.1:5173`. Para usar Neon localmente ejecuta `vercel env pull .env.local` tras enlazar el proyecto.

## Verificación

```bash
pnpm run lint
pnpm run build
pnpm run check
```

## CI/CD

El repositorio está conectado a Vercel:

- Cada push a `main` crea un despliegue de producción automático.
- Cada pull request recibe una validación de compilación de producción desde GitHub Actions.
- El workflow **Manual production deploy** permite desplegar un artefacto precompilado desde GitHub Actions.

Para el workflow manual configura estos secretos del repositorio en GitHub:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

No es necesario usar el workflow manual en condiciones normales: el despliegue por integración GitHub–Vercel es el camino recomendado.

## Integración de Instagram

Instagram no permite leer Reels de una cuenta solo con una URL. Para sincronización automática se necesita una cuenta profesional de Instagram, una aplicación de Meta, OAuth y permisos aprobados. Nunca guardes el token de Meta en el cliente ni en GitHub.

## Operación

1. El empleado abre **Panel empleado → Pantalla y videos**.
2. Sube un MP4 o selecciona el video que debe iniciar primero.
3. La pantalla pública consulta la fila y reproduce el contenido activo.
4. Para retirar un video, elimínalo desde la fila del panel.

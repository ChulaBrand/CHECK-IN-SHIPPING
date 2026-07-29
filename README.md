# Check-In Shipping

Aplicación propia de check-in de camiones (carga/descarga) para reemplazar el
formulario de JotForm del mismo nombre. Mismo flujo de trabajo, pero con base
de datos propia y totalmente editable por ustedes.

Flujo de trabajo:

1. **El chofer** llena el formulario público (`/`) al llegar: datos suyos y
   del camión, si viene a cargar o descargar, qué producto trae, acomodo de
   la carga y # de orden.
2. **El personal** entra a `/staff`, ve todos los check-ins, y completa cada
   registro (hora de entrada, forklift, dock, # de tarimas) hasta cerrarlo
   con "Completar Check-In".

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Prisma ORM](https://www.prisma.io) + SQLite (archivo propio, sin depender
  de ningún servicio externo)
- Tailwind CSS (componentes propios en `src/components/ui/`, sin librería de
  terceros)
- [iron-session](https://github.com/vvo/iron-session) para la sesión del
  personal (contraseña compartida, no hay cuentas individuales)
- [Zod](https://zod.dev) para validar los formularios en el servidor

## Requisitos

- Node.js 22+

## Poner a correr el proyecto en tu máquina

```bash
npm install
cp .env.example .env      # y edita STAFF_PASSWORD / SESSION_SECRET
npx prisma migrate dev    # crea prisma/dev.db con las tablas
npx prisma db seed        # (opcional) llena unos registros de ejemplo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para el formulario, y
[http://localhost:3000/staff/login](http://localhost:3000/staff/login) para
el panel de personal (contraseña: la que pusiste en `STAFF_PASSWORD`).

## Cómo modificar cosas tú mismo

Este proyecto se hizo pensando en que ustedes (o Claude Code en otra sesión)
puedan seguir editándolo, sin las restricciones de JotForm.

**Agregar o cambiar opciones de una lista desplegable** (tipo de producto,
acomodo de carga, etc.): edita `src/lib/options.ts`. Es el único lugar donde
viven esas listas -- se reflejan solas en el formulario público, en la
pantalla del personal, y en las validaciones. Reinicia el servidor después de
editar.

**Agregar un campo nuevo al formulario:**
1. Agrega la columna en `prisma/schema.prisma`.
2. Corre `npx prisma migrate dev --name agrega_mi_campo`.
3. Agrégalo al esquema correspondiente en `src/lib/validation.ts`.
4. Agrega el `<input>` en `src/components/CheckInForm.tsx` (formulario del
   chofer) y/o `src/components/RecordEditForm.tsx` (pantalla del personal).

**Ver o editar los datos directamente** (como una hoja de cálculo):

```bash
npx prisma studio
```

**Cambiar la contraseña del personal:** edita `STAFF_PASSWORD` en tu `.env`
(o en las variables de entorno de donde esté desplegado) y reinicia.

## Pruebas

```bash
npm run test
```

Son pruebas ligeras (`vitest`) sobre las validaciones y utilidades en
`src/lib/`. La app en sí se verificó manualmente de punta a punta (llenar
check-in → login de personal → buscar → completar registro → cerrar sesión)
antes de entregarse.

## Base de datos: SQLite y sus límites

Los datos viven en un solo archivo SQLite que ustedes controlan. Esto
funciona muy bien en Railway, Render, Fly.io o un VPS/Docker con un volumen
persistente -- **pero no persiste en plataformas serverless efímeras como las
funciones por defecto de Vercel** (cada despliegue borra el archivo). Si más
adelante quieren usar Vercel o crecen más allá de SQLite, migrar a Postgres es
un cambio pequeño: cambiar `provider = "postgresql"` en
`prisma/schema.prisma`, apuntar `DATABASE_URL` a un Postgres (Neon, Supabase,
Railway Postgres, etc.), y correr `npx prisma migrate deploy`.

**Respaldo:** el archivo de base de datos es un solo archivo -- cópialo
(`dev.db` en local, o el volumen `checkin_data` en Docker) para respaldarlo.

## Despliegue con Docker

El repo incluye un `Dockerfile` y `docker-compose.yml` listos para usar en
Railway, Render, Fly.io o un VPS con Docker.

```bash
cp .env.example .env      # y edita STAFF_PASSWORD / SESSION_SECRET
docker compose up --build
```

Esto levanta la app en `http://localhost:3000`, aplica las migraciones
pendientes automáticamente al arrancar, y guarda `prod.db` en un volumen
Docker (`checkin_data`) que sobrevive a reinicios y redeploys.

> **Nota:** el Dockerfile no se pudo probar con un build real dentro de la
> sesión donde se construyó esta app (el entorno no tenía el daemon de Docker
> disponible), aunque sí se verificó con éxito el build y arranque de
> producción de Next.js (`npm run build && npm start`) que es la parte que
> corre dentro del contenedor. Antes de confiar en él para producción, corre
> tú mismo `docker compose up --build` una vez y confirma que todo funciona.

Para Railway o Render específicamente: conecta este repo, deja que detecten
el `Dockerfile`, agrega un volumen persistente montado en `/app/data`, y
configura las variables de entorno `STAFF_PASSWORD` y `SESSION_SECRET` (no
necesitas poner `DATABASE_URL`, el `docker-compose.yml`/Dockerfile ya la
apunta al volumen).

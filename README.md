# Check-In Shipping

Formulario propio de check-in de camiones (carga/descarga) para reemplazar
el formulario de JotForm del mismo nombre, sin sus restricciones de edición.

Flujo de trabajo:

1. **El chofer** llena el formulario público (`/`) al llegar: datos suyos y
   del camión, si viene a cargar o descargar, qué producto trae, acomodo de
   la carga y # de orden. Al enviarlo, se guarda como una fila nueva en tu
   Google Sheet.
2. **El personal** abre esa misma hoja de Google Sheets y completa el resto
   a mano: hora de entrada, forklift, dock, # de tarimas, hora de salida.

No hay servidor ni base de datos propia -- es una página estática (se puede
hospedar gratis en cualquier lado) que le escribe directo a tu Sheet
mediante un Google Apps Script.

## Stack

- [Next.js](https://nextjs.org) (App Router, exportado como sitio estático)
  + TypeScript
- Tailwind CSS (componentes propios en `src/components/ui/`, sin librería de
  terceros)
- [Zod](https://zod.dev) para validar el formulario en el navegador
- [Google Apps Script](https://developers.google.com/apps-script) como
  puente hacia Google Sheets (código en `google-apps-script/Code.gs`)

## 1. Configura tu Google Sheet (una sola vez)

1. Crea una hoja de cálculo nueva en Google Sheets. Nombra la primera
   pestaña **exactamente** `Check-Ins`.
2. Menú **Extensiones → Apps Script**.
3. Borra lo que haya en `Code.gs` y pega el contenido completo de
   [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) de este repo.
4. En el editor, en el menú desplegable de funciones (arriba), elige
   **setupHeaders** y presiona ▶ **Ejecutar** una vez. La primera vez te va
   a pedir autorizar permisos (es tu propio script sobre tu propia hoja, es
   seguro aceptar). Esto crea la fila de encabezados correcta.
5. **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Copia la URL que termina en `/exec` -- la vas a necesitar en el paso 3.

## 2. Corre el proyecto en tu máquina (opcional, para probar)

Requiere Node.js 22+.

```bash
npm install
cp .env.example .env.local   # pega tu URL de Apps Script del paso 1.6
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 3. Despliega el formulario (Netlify, gratis)

1. Ve a [netlify.com](https://netlify.com) → crea cuenta con tu GitHub.
2. **Add new site → Import an existing project** → selecciona este repo
   (`ChulaBrand/CHECK-IN-SHIPPING`) y la rama `claude/shipping-checkin-page-bkisxw`.
3. Netlify detecta Next.js solo. Antes de darle "Deploy", agrega la variable
   de entorno (Site configuration → Environment variables):
   - `NEXT_PUBLIC_APPS_SCRIPT_URL` = la URL que copiaste en el paso 1.6
4. Deploy. Netlify te da un link `https://algo.netlify.app` -- ya lo puedes
   abrir y compartir.

Como es un sitio estático, también funciona igual en GitHub Pages, Vercel,
Cloudflare Pages, etc. -- Netlify es solo la más simple de conectar.

## Cómo modificar cosas tú mismo

**Agregar o cambiar opciones de una lista desplegable** (tipo de producto,
acomodo de carga, etc.): edita `src/lib/options.ts`. Es el único lugar donde
viven esas listas -- se reflejan solas en el formulario y en las
validaciones.

**Agregar un campo nuevo al formulario** -- toca editar en dos lados, porque
son dos proyectos separados (el formulario y el Apps Script):
1. `src/lib/validation.ts`: agrega el campo al esquema de Zod.
2. `src/components/CheckInForm.tsx`: agrega el `<input>`.
3. `google-apps-script/Code.gs`: agrega el nombre del campo a `HEADERS` y a
   la lista que arma `appendRow(...)`, y si es obligatorio, a
   `REQUIRED_FIELDS`.
4. Vuelve a pegar el `Code.gs` actualizado en el editor de Apps Script
   (Extensiones → Apps Script en tu Sheet) y crea una **nueva
   implementación** (Implementar → Nueva implementación) para que los
   cambios apliquen -- la URL `/exec` se mantiene igual.

**Cambiar textos/estilos:** todo el formulario visual está en
`src/components/CheckInForm.tsx` y `src/components/ui/`.

## Pruebas

```bash
npm run test
```

Pruebas ligeras (`vitest`) sobre la validación del formulario en
`src/lib/`.

## Una limitación a tener en cuenta

Por cómo funciona Google Apps Script con peticiones desde el navegador (CORS),
el formulario no puede leer la respuesta del script -- solo sabe si la
petición salió de tu navegador, no si Apps Script realmente terminó de
guardar la fila. En la práctica casi siempre funciona (así lo usan miles de
formularios hechos con este mismo patrón), pero si algún día notas envíos
que no llegan a la hoja, revisa el registro de ejecuciones en el editor de
Apps Script (ícono de reloj, "Execuciones") para ver el error real.

## Si en algún momento quieres base de datos propia (MySQL, Postgres, etc.)

Antes de esta versión existió una con base de datos propia (Prisma +
SQLite), panel de personal con login, y un `Dockerfile` para desplegar en
Railway/Render -- queda en el historial de git de este repo por si algún día
quieres retomar ese camino (por ejemplo, cuando migres tus datos a MySQL).
Pídele a Claude Code que la recupere y la conecte a MySQL cuando llegue ese
momento.

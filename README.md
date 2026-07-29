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

El formulario replica el estilo "una pregunta por pantalla" del Jotform
original (tarjeta blanca, barra rosa Anterior/Siguiente, logo de Chula
Brand), incluyendo sus dos ramas: si eliges **Loading / Cargar** pregunta
placas, licencia, # de orden y acomodo de carga; si eliges **Unloading /
Descargar** pregunta # económico y qué producto trae. La secuencia completa
de pantallas vive en `src/lib/wizardSteps.ts`.

**Falta el logo:** sube tu logo a `public/chula-brand-logo.png` (Add file →
Upload files en GitHub, dentro de la carpeta `public`) -- el formulario ya
apunta a esa ruta, solo falta que el archivo exista.

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
   > Si ya habías pegado una versión anterior de `Code.gs` y corrido
   > `setupHeaders` antes, vuelve a correrla después de pegar la versión
   > nueva -- las columnas cambiaron (se quitó "SP # / Order" sin el `#`,
   > que nunca se llenaba) y necesitas que los encabezados coincidan.
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

## 3. Despliega el formulario (GitHub Pages, gratis, sin cuentas nuevas)

Como el repo es público, GitHub Pages lo hospeda gratis, y como ya está todo
armado (`.github/workflows/deploy-pages.yml`), solo te faltan 2 pasos en la
configuración del repo -- nada que instalar ni ninguna cuenta nueva:

1. En GitHub, entra a tu repo → **Settings → Secrets and variables →
   Actions → pestaña "Variables"** → **New repository variable**:
   - Name: `NEXT_PUBLIC_APPS_SCRIPT_URL`
   - Value: la URL que copiaste en el paso 1.6 (termina en `/exec`)
2. **Settings → Pages → Build and deployment → Source**: cambia a
   **"GitHub Actions"**.

Con eso, cada vez que se suba código a la rama
`claude/shipping-checkin-page-bkisxw` se publica solo. Para lanzar el primer
despliegue ahora mismo (sin esperar a un push nuevo): pestaña **Actions** de
tu repo → "Deploy to GitHub Pages" → **Run workflow**.

Cuando termine (1-2 minutos, lo ves en la pestaña Actions), tu link va a ser:

```
https://chulabrand.github.io/CHECK-IN-SHIPPING/
```

**Alternativas:** como es un sitio 100% estático, también funciona igual en
Netlify, Vercel o Cloudflare Pages si algún día prefieres alguna de esas --
solo conecta el repo ahí y ponles la misma variable de entorno
`NEXT_PUBLIC_APPS_SCRIPT_URL` (con esas sí hay que crear cuenta nueva, por
eso no son la opción por defecto).

## Cómo modificar cosas tú mismo

**Agregar o cambiar opciones de una lista desplegable** (tipo de producto,
acomodo de carga, etc.): edita `src/lib/options.ts`. Es el único lugar donde
viven esas listas -- se reflejan solas en el formulario y en las
validaciones.

**Agregar, quitar o reordenar una pantalla del formulario:** todo el flujo
(qué pregunta va en qué pantalla, en qué orden, y las dos ramas de Cargar/
Descargar) vive en un solo lugar: `src/lib/wizardSteps.ts`. Cada pantalla es
un objeto en `COMMON_STEPS`, `LOADING_BRANCH_STEPS` o `UNLOADING_BRANCH_STEPS`
-- copiar uno existente y ajustarlo es la forma más fácil de agregar uno
nuevo. Después:
1. `src/lib/validation.ts`: agrega el validador del campo a `fieldSchemas`.
2. `src/lib/wizardSteps.ts`: agrega el nuevo `StepConfig` (con su
   `answerKey`) en la rama que corresponda.
3. `google-apps-script/Code.gs`: agrega el nombre del campo a `HEADERS` y a
   la lista que arma `appendRow(...)`, y si es obligatorio, a
   `REQUIRED_FIELDS`.
4. Vuelve a pegar el `Code.gs` actualizado en el editor de Apps Script
   (Extensiones → Apps Script en tu Sheet), corre `setupHeaders` de nuevo, y
   crea una **nueva implementación** (Implementar → Nueva implementación)
   para que los cambios apliquen -- la URL `/exec` se mantiene igual.

**Cambiar textos/estilos:** los colores (rosa, azul marino) y el layout de
cada tipo de pregunta están en `src/components/QuestionCard.tsx`,
`src/components/WelcomeScreen.tsx` y `src/components/ui/`.

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

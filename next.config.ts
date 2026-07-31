import type { NextConfig } from "next";

// GitHub Pages sirve los sitios de proyecto bajo /<nombre-del-repo>/, no en
// la raíz del dominio. El workflow de despliegue (.github/workflows/
// deploy-pages.yml) define GITHUB_PAGES=true solo durante ese build, así
// `npm run dev` y un build normal (ej. para Netlify) siguen sirviendo en "/".
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Sin servidor: el formulario manda los datos directo a un Google Apps
  // Script desde el navegador, así que la página completa se genera como
  // HTML/CSS/JS estático y se puede hospedar en cualquier lado (GitHub
  // Pages, Netlify, etc.) sin Node corriendo detrás.
  output: "export",
  // Mismo valor que usa src/lib/asset.ts para las rutas manuales (logo, etc.)
  // — así basePath y esas rutas nunca quedan desincronizados.
  basePath: isGithubPagesBuild ? process.env.NEXT_PUBLIC_BASE_PATH : undefined,
};

export default nextConfig;

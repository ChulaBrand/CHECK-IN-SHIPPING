import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin servidor: el formulario manda los datos directo a un Google Apps
  // Script desde el navegador, así que la página completa se genera como
  // HTML/CSS/JS estático y se puede hospedar en cualquier lado (Netlify,
  // GitHub Pages, etc.) sin Node corriendo detrás.
  output: "export",
};

export default nextConfig;

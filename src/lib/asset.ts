// GitHub Pages sirve el sitio bajo /CHECK-IN-SHIPPING/, no en la raíz. Next
// ya ajusta esto solo para sus propios chunks (_next/...), pero para <img>
// que apuntan a archivos en public/ hay que anteponer la ruta a mano. El
// workflow de GitHub Pages define NEXT_PUBLIC_BASE_PATH; en local/otros
// hosts queda vacío y las rutas se sirven desde "/".
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetPath(path: string): string {
  return `${BASE_PATH}${path}`;
}

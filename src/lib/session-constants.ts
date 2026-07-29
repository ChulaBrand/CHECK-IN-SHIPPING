// Nombre de la cookie de sesión del personal. Vive en su propio archivo (sin
// otras dependencias) porque tanto src/lib/auth.ts como src/proxy.ts la
// necesitan, y proxy.ts debe mantenerse ligero.
export const STAFF_COOKIE_NAME = "checkin_staff_session";

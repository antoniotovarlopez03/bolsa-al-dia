// Guarda el perfil SOLO en este dispositivo (localStorage). Nada sale a internet.
import type { Perfil } from './datos/tipos';

// La clave conserva el nombre antiguo para no perder los datos de quien ya usaba la app.
const CLAVE = 'bolsa-al-dia:perfil';

export function cargarPerfil(): Perfil | null {
  try {
    const txt = localStorage.getItem(CLAVE);
    if (!txt) return null;
    const p = JSON.parse(txt) as Perfil;
    return p && p.version === 1 ? p : null;
  } catch {
    return null;
  }
}

export function guardarPerfil(p: Perfil): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(p));
  } catch {
    // Navegador en modo privado o sin espacio: la app sigue funcionando en memoria.
  }
}

export function borrarTodo(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('bolsa-al-dia:'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nada que borrar */
  }
}

export function exportarPerfil(p: Perfil): void {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bolsa-sur-copia-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importarPerfil(f: File): Promise<Perfil> {
  const p = JSON.parse(await f.text()) as Perfil;
  if (!p || p.version !== 1 || !Array.isArray(p.bolsas)) throw new Error('Archivo no válido');
  return p;
}

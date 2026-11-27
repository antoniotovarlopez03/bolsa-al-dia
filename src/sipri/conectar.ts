// Abre la web OFICIAL de SIPRI dentro de la app (navegador interno). El docente entra él mismo
// (localizador, usuario IdEA o certificado). Mientras navega, la app mira la página cada 1,5 s y,
// cuando aparece su consulta de bolsa, lee los números y cierra. Nada sale del móvil.
import { EXTRACTOR, leerConsulta, type BolsaLeida } from './leer';

const URL_SIPRI = 'https://sipri.juntadeandalucia.es/sipri/';

interface Navegador {
  executeScript(d: { code: string }, cb: (r: unknown[]) => void): void;
  addEventListener(evento: 'exit' | 'loadstop', cb: () => void): void;
  close(): void;
}

function abrir(): Navegador | null {
  const c = (window as unknown as { cordova?: { InAppBrowser?: { open: (u: string, t: string, o: string) => Navegador } } }).cordova;
  return c?.InAppBrowser?.open(
    URL_SIPRI,
    '_blank',
    'location=no,toolbar=yes,toolbarposition=top,closebuttoncaption=Cerrar,hidenavigationbuttons=no,toolbarcolor=#007a33,closebuttoncolor=#ffffff,navigationbuttoncolor=#ffffff',
  ) ?? null;
}

/** Devuelve las bolsas leídas, o null si el docente cierra sin llegar a su consulta. */
export function conectarConSipri(): Promise<BolsaLeida[] | null> {
  return new Promise((resolver) => {
    const nav = abrir();
    if (!nav) return resolver(null);
    let terminado = false;

    const mirar = () =>
      nav.executeScript({ code: EXTRACTOR }, (r) => {
        if (terminado) return;
        try {
          const { tokens } = JSON.parse(String(r?.[0] ?? '{}')) as { tokens?: string[] };
          const bolsas = leerConsulta(tokens ?? []);
          if (bolsas.length) {
            terminado = true;
            clearInterval(reloj);
            nav.close();
            resolver(bolsas);
          }
        } catch {
          /* página a medio cargar: se reintenta */
        }
      });

    const reloj = window.setInterval(mirar, 1500);
    nav.addEventListener('loadstop', mirar);
    nav.addEventListener('exit', () => {
      clearInterval(reloj);
      if (!terminado) resolver(null);
    });
  });
}

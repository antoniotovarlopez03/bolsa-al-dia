// Lectura de la consulta personal de SIPRI DENTRO del móvil del docente.
// 1) EXTRACTOR: código que se ejecuta en la página de SIPRI (navegador interno de la app) y devuelve
//    los textos visibles y los valores de las casillas, en orden. Nunca lee contraseñas.
// 2) leerConsulta(): busca en esos textos «Bolsa: código – nombre», «Orden en Bolsa», «Sit. tras la
//    última adjudicación», «tiempo real» y la situación por provincias. Solo se quedan los números.
import { PROVINCIAS_AND, type Provincia } from '../datos/tipos';

export const EXTRACTOR = `(function(){
  var out=[];
  function walk(n){
    if(!n) return;
    if(n.nodeType===3){ var t=n.textContent.replace(/\\s+/g,' ').trim(); if(t) out.push(t); return; }
    if(n.nodeType!==1) return;
    var tag=n.tagName;
    if(tag==='SCRIPT'||tag==='STYLE'||tag==='NOSCRIPT'||tag==='SVG') return;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'){
      var ty=(n.type||'').toLowerCase();
      if(ty!=='password'&&ty!=='hidden'){ var v=String(n.value||'').trim(); if(v) out.push('\\u27e6'+v+'\\u27e7'); }
      return;
    }
    for(var c=n.firstChild;c;c=c.nextSibling) walk(c);
  }
  walk(document.body);
  return JSON.stringify({ url: location.href, tokens: out.slice(0, 8000) });
})()`;

export interface BolsaLeida {
  puesto: string;
  nombre: string;
  ordenEnBolsa?: number;
  situacionTrasAdjudicacion?: number;
  situacionTiempoReal?: number;
  porProvincia: Partial<Record<Provincia, number>>;
}

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const valor = (t?: string) => (t ?? '').replace(/^⟦|⟧$/g, '').trim();
const esNumero = (t?: string) => /^\d{1,6}$/.test(valor(t).replace(/\./g, ''));
const aNumero = (t: string) => Number(valor(t).replace(/\./g, ''));

/** Busca el valor (número o «-») que sigue a una etiqueta, en los 3 textos siguientes. */
function siguienteValor(tokens: string[], i: number): number | undefined {
  for (let k = i + 1; k <= i + 3 && k < tokens.length; k++) {
    const v = valor(tokens[k]);
    if (esNumero(tokens[k])) return aNumero(tokens[k]);
    if (v === '-' || v === '—') return undefined;
    if (/:$/.test(v)) return undefined; // empieza otra etiqueta
  }
  return undefined;
}

export function leerConsulta(tokens: string[]): BolsaLeida[] {
  const bolsas: BolsaLeida[] = [];
  let actual: BolsaLeida | null = null;
  let modoProvincias: 'adj' | 'real' | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const t = valor(tokens[i]);
    const n = sinTildes(t);

    // «Bolsa: 00590018 - ORIENTACIÓN EDUCATIVA P.E.S.» (a veces partido en dos textos)
    const mb = /^bolsa:?\s*([0-9a-z]{6,10})\s*-\s*(.+)$/i.exec(t) ?? (/^bolsa:?$/i.test(t) ? /^([0-9A-Z]{6,10})\s*-\s*(.+)$/.exec(valor(tokens[i + 1])) : null);
    if (mb) {
      actual = bolsas.find((b) => b.puesto === mb[1].toUpperCase()) ?? null;
      if (!actual) {
        actual = { puesto: mb[1].toUpperCase(), nombre: mb[2].trim(), porProvincia: {} };
        bolsas.push(actual);
      }
      modoProvincias = null;
      continue;
    }
    if (!actual) continue;

    if (/^orden en bolsa:?$/.test(n)) actual.ordenEnBolsa = siguienteValor(tokens, i) ?? actual.ordenEnBolsa;
    else if (/provincias:?$/.test(n)) modoProvincias = n.includes('tiempo real') && !n.includes('adjudicacion') ? 'real' : 'adj';
    else if (/^sit(\.|uacion)? tras la ultima adjudicacion:?$/.test(n) || /^situacion provisional/.test(n))
      actual.situacionTrasAdjudicacion = siguienteValor(tokens, i) ?? actual.situacionTrasAdjudicacion;
    else if (/^sit(\.|uacion)? (en )?tiempo real:?$/.test(n)) actual.situacionTiempoReal = siguienteValor(tokens, i) ?? actual.situacionTiempoReal;
    else if (modoProvincias) {
      const prov = PROVINCIAS_AND.find((p) => sinTildes(p) + ':' === n || sinTildes(p) === n);
      if (prov) {
        const v = siguienteValor(tokens, i);
        if (v !== undefined && modoProvincias === 'adj') actual.porProvincia[prov] = v;
      }
    }
  }
  return bolsas.filter((b) => b.ordenEnBolsa !== undefined || b.situacionTrasAdjudicacion !== undefined || b.situacionTiempoReal !== undefined);
}

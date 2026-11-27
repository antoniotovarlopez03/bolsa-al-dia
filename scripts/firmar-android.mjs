// Firma el .aab de Android (descargado de Codemagic) con la llave de firma-android/.
// Uso: node scripts/firmar-android.mjs ruta/al/app-release.aab
// La contraseña se lee de firma-android/LEEME.txt y nunca se muestra.
import { readFileSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const entrada = process.argv[2];
if (!entrada) {
  console.error('Uso: node scripts/firmar-android.mjs ruta/al/app-release.aab');
  process.exit(1);
}
const leeme = readFileSync('firma-android/LEEME.txt', 'utf8');
const clave = leeme.match(/Contraseña[^:]*:\s*(\S+)/)?.[1];
if (!clave) throw new Error('No encuentro la contraseña en firma-android/LEEME.txt');

const salida = 'firma-android/bolsasur-firmada.aab';
copyFileSync(entrada, salida);
execFileSync('jarsigner', [
  '-keystore', 'firma-android/bolsasur-subida.jks',
  '-storepass:env', 'CLAVE_BOLSASUR', '-keypass:env', 'CLAVE_BOLSASUR',
  '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256',
  salida, 'bolsasur',
], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, CLAVE_BOLSASUR: clave } });
execFileSync('jarsigner', ['-verify', salida], { stdio: 'inherit' });
console.log('✔ Firmada:', salida, '→ súbela a Google Play Console');

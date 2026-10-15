// Trae perfil y últimos posts de cada cliente con la API de Instagram (Business Discovery),
// descarga las imágenes a assets/instagram/ (las URLs de Instagram vencen) y escribe data/instagram.json.
//
// Uso: IG_USER_ID=... IG_ACCESS_TOKEN=... node scripts/fetch-instagram.mjs
//   IG_USER_ID      id de la cuenta de Instagram de EP Design (Empresa, vinculada a una página de Facebook)
//   IG_ACCESS_TOKEN token de usuario de Facebook con instagram_basic, instagram_manage_insights y pages_read_engagement
// Las cuentas consultadas tienen que ser de tipo Empresa o Creador.

import { mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ACCOUNTS = [
  { username: 'grupoalbani_', name: 'Grupo Albani' },
  { username: 'big_globos', name: 'Big Globos' },
  { username: 'donaidesa', name: 'Donaide' },
  { username: 'meleycia', name: 'Melé y Cía' },
  { username: 'pallmetal', name: 'Pall-Metal' },
];
const POSTS_PER_ACCOUNT = 6;
const GRAPH_VERSION = process.env.GRAPH_VERSION || 'v26.0';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'data', 'instagram.json');
const MEDIA_DIR = path.join(ROOT, 'assets', 'instagram');

const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;
if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
  console.error('Faltan las variables IG_USER_ID y/o IG_ACCESS_TOKEN.');
  process.exit(1);
}

async function discover(username) {
  const fields =
    `business_discovery.username(${username}){username,name,profile_picture_url,followers_count,media_count,` +
    `media.limit(${POSTS_PER_ACCOUNT}){id,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp}}`;
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${IG_USER_ID}`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('access_token', IG_ACCESS_TOKEN);
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error?.message || `HTTP ${res.status}`);
  return body.business_discovery;
}

const EXT_BY_TYPE = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic' };

// Devuelve la ruta relativa al sitio. Solo reescribe el archivo si cambió, para no ensuciar el historial de git.
async function download(url, dir, baseName) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${baseName}`);
  const ext = EXT_BY_TYPE[(res.headers.get('content-type') || '').split(';')[0]] || '.jpg';
  const bytes = Buffer.from(await res.arrayBuffer());
  const file = path.join(dir, baseName + ext);
  const current = await readFile(file).catch(() => null);
  if (!current || !current.equals(bytes)) await writeFile(file, bytes);
  return path.relative(ROOT, file).split(path.sep).join('/');
}

async function buildAccount({ username, name }) {
  const ig = await discover(username);
  const dir = path.join(MEDIA_DIR, username);
  await mkdir(dir, { recursive: true });

  const profilePicture = ig.profile_picture_url ? await download(ig.profile_picture_url, dir, 'profile') : null;
  const media = [];
  for (const m of ig.media?.data || []) {
    const imageUrl = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
    if (!imageUrl) continue;
    media.push({
      id: m.id,
      media_type: m.media_type,
      media_url: await download(imageUrl, dir, m.id),
      permalink: m.permalink,
      like_count: m.like_count,
      comments_count: m.comments_count,
      timestamp: m.timestamp,
    });
  }

  // Borra imágenes de posts que ya no están entre los últimos
  const keep = new Set([profilePicture, ...media.map(m => m.media_url)].filter(Boolean).map(p => path.basename(p)));
  for (const f of await readdir(dir)) if (!keep.has(f)) await rm(path.join(dir, f));

  return {
    username: ig.username,
    name,
    profile_picture_url: profilePicture,
    followers_count: ig.followers_count,
    media_count: ig.media_count,
    media: { data: media },
  };
}

const previous = JSON.parse(await readFile(DATA_FILE, 'utf8').catch(() => '{}'));
const previousByUser = previous.sample ? {} : Object.fromEntries((previous.accounts || []).map(a => [a.username, a]));

const accounts = [];
let failures = 0;
for (const account of ACCOUNTS) {
  try {
    accounts.push(await buildAccount(account));
    console.log(`✓ @${account.username}`);
  } catch (err) {
    failures++;
    console.error(`✗ @${account.username}: ${err.message}`);
    // Si una cuenta falla, se mantiene lo último que se pudo traer (o solo el link al perfil)
    accounts.push(previousByUser[account.username] || { username: account.username, name: account.name });
  }
}

if (failures === ACCOUNTS.length) {
  console.error('No se pudo traer ninguna cuenta; data/instagram.json no se modifica.');
  process.exit(1);
}

await mkdir(path.dirname(DATA_FILE), { recursive: true });
await writeFile(DATA_FILE, JSON.stringify({
  source: 'instagram-graph-api/business_discovery',
  sample: false,
  updated_at: new Date().toISOString(),
  accounts,
}, null, 2) + '\n');
console.log(`data/instagram.json actualizado (${ACCOUNTS.length - failures}/${ACCOUNTS.length} cuentas).`);

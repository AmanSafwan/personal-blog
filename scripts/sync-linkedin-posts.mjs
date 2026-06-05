#!/usr/bin/env node
/**
 * Sync LinkedIn posts into data/linkedin-feed.json
 * Fetches public OG metadata + images from each post URL for native FB-style feed cards.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourcesPath = join(root, 'data', 'linkedin-post-urls.json');
const feedPath = join(root, 'data', 'linkedin-feed.json');
const imageDir = join(root, 'assets', 'img', 'linkedin');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function extractActivityId(url) {
  if (!url) return null;
  const patterns = [
    /activity[:-](\d{10,})/i,
    /urn:li:activity:(\d{10,})/i,
    /urn:li:share:(\d{10,})/i
  ];
  for (const re of patterns) {
    const m = String(url).match(re);
    if (m) return m[1];
  }
  return null;
}

function normalizePostUrl(url, activityId) {
  if (url && url.includes('linkedin.com')) return url.split('?')[0];
  return `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}`;
}

function parseOg(html, prop) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i')
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeHtml(m[1]);
  }
  return null;
}

function decodeHtml(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const BANNED_TAGS = new Set([
  'activity', 'posts', 'amansafwan', 'linkedin', 'urn', 'li', 'feed', 'update'
]);

function isValidTag(tag) {
  if (!tag || tag.length < 3) return false;
  if (/^\d+$/.test(tag)) return false;
  if (BANNED_TAGS.has(String(tag).toLowerCase())) return false;
  return true;
}

function extractHashtags(text, url) {
  const tags = new Set();
  const fromText = String(text || '').match(/#[\w\u00C0-\u024F]+/g) || [];
  fromText.forEach((t) => {
    const clean = t.replace(/^#/, '');
    if (isValidTag(clean)) tags.add(clean);
  });

  const slug = String(url || '').split('/posts/')[1] || '';
  const slugPart = slug.split('-activity-')[0] || '';
  slugPart.split('-').forEach((t) => {
    if (isValidTag(t) && t !== 'amansafwan') tags.add(t);
  });

  return [...tags].slice(0, 8);
}

function cleanPostText(raw, title) {
  let text = decodeHtml(raw || '');
  if (!text && title) {
    const parts = title.split('|');
    text = parts[0].trim();
  }
  text = text
    .replace(/\s*Aman Safwan on LinkedIn:\s*/gi, '')
    .replace(/\s*on LinkedIn:\s*/gi, ' ')
    .trim();
  return text;
}

function imageExtFromUrl(url, contentType) {
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('gif')) return '.gif';
  const ext = extname(new URL(url).pathname);
  if (ext && ext.length <= 5) return ext;
  return '.jpg';
}

async function downloadImage(imageUrl, activityId) {
  if (!imageUrl || !activityId) return null;
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA, Accept: 'image/*,*/*' },
      redirect: 'follow'
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) return null;
    mkdirSync(imageDir, { recursive: true });
    const ext = imageExtFromUrl(imageUrl, res.headers.get('content-type'));
    const filename = `${activityId}${ext}`;
    const full = join(imageDir, filename);
    writeFileSync(full, buf);
    return `assets/img/linkedin/${filename}`;
  } catch {
    return null;
  }
}

async function fetchPostMeta(url, entry) {
  const activityId = extractActivityId(url);
  if (!activityId) return null;

  let html = '';
  let ogTitle = null;
  let ogDesc = null;
  let ogImage = null;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow'
    });
    html = await res.text();
    ogTitle = parseOg(html, 'og:title');
    ogDesc = parseOg(html, 'og:description');
    ogImage = parseOg(html, 'og:image');
  } catch {
    /* use manual fallbacks */
  }

  const text = entry.text || cleanPostText(ogDesc, ogTitle);
  const hashtags = entry.hashtags || extractHashtags(text, url);
  let image = entry.image || null;

  if (!image && ogImage) {
    image = await downloadImage(ogImage, activityId);
  }

  return {
    id: `li-${activityId}`,
    publishedAt: entry.publishedAt || new Date().toISOString(),
    category: entry.category || 'all',
    type: 'native',
    postUrl: normalizePostUrl(url, activityId),
    activityUrn: `urn:li:activity:${activityId}`,
    text,
    hashtags,
    image,
    imageAlt: entry.imageAlt || (text ? text.slice(0, 120) : 'LinkedIn post image'),
    likes: entry.likes ?? null,
    comments: entry.comments ?? null,
    embedSrc: `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityId}`
  };
}

function loadSources() {
  return JSON.parse(readFileSync(sourcesPath, 'utf8'));
}

async function sync() {
  const sources = loadSources();
  const profileUrl = sources.profileUrl || 'https://www.linkedin.com/in/amansafwan/';
  const posts = [];

  for (const entry of sources.posts || []) {
    const url = typeof entry === 'string' ? entry : entry.url;
    console.log('Syncing:', url);
    const post = await fetchPostMeta(url, typeof entry === 'string' ? {} : entry);
    if (!post) {
      console.warn('Skipping (no activity id):', url);
      continue;
    }
    posts.push(post);
    await new Promise((r) => setTimeout(r, 400));
  }

  const feed = {
    version: 3,
    mode: 'native-feed',
    lastSynced: new Date().toISOString(),
    profile: {
      name: 'Aman Safwan Bin Musliyadi',
      headline: 'SMSKPP · Pembangunan Perisian · UniSZA FIK',
      subline: "PNGK 3.81 · Dean's List · Internship 20 Sep 2026 – 19 Mar 2027",
      url: profileUrl,
      activityUrl: sources.activityUrl || `${profileUrl.replace(/\/$/, '')}/recent-activity/all/`,
      avatar: 'assets/img/profile/aman-safwan.png',
      verified: true,
      followers: '1,164'
    },
    posts
  };

  writeFileSync(feedPath, JSON.stringify(feed, null, 2) + '\n', 'utf8');
  const withImages = posts.filter((p) => p.image).length;
  console.log(`Synced ${posts.length} post(s) (${withImages} with images) → data/linkedin-feed.json`);
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});

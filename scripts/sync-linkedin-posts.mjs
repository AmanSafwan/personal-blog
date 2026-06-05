#!/usr/bin/env node
/**
 * Sync real LinkedIn posts into data/linkedin-feed.json
 * Reads public post URLs from data/linkedin-post-urls.json
 * and generates native LinkedIn embed entries (real like/comment/share).
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourcesPath = join(root, 'data', 'linkedin-post-urls.json');
const feedPath = join(root, 'data', 'linkedin-feed.json');

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

function buildEmbedSrc(activityId) {
  return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityId}`;
}

function loadSources() {
  const raw = readFileSync(sourcesPath, 'utf8');
  return JSON.parse(raw);
}

function sync() {
  const sources = loadSources();
  const profileUrl = sources.profileUrl || 'https://www.linkedin.com/in/amansafwan/';
  const posts = [];

  for (const entry of sources.posts || []) {
    const url = typeof entry === 'string' ? entry : entry.url;
    const activityId = extractActivityId(url);
    if (!activityId) {
      console.warn('Skipping (no activity id):', url);
      continue;
    }
    posts.push({
      id: `li-${activityId}`,
      publishedAt: entry.publishedAt || new Date().toISOString(),
      category: entry.category || 'all',
      type: 'embed',
      postUrl: normalizePostUrl(url, activityId),
      embedSrc: buildEmbedSrc(activityId),
      activityUrn: `urn:li:activity:${activityId}`
    });
  }

  const feed = {
    version: 2,
    mode: 'live-embed',
    lastSynced: new Date().toISOString(),
    profile: {
      name: 'Aman Safwan Bin Musliyadi',
      headline: 'Software Development · UniSZA FIK',
      subline: 'CGPA 3.81 · Dean\'s List · Internship 20 Sep 2026 – 19 Mar 2027',
      url: profileUrl,
      activityUrl: sources.activityUrl || `${profileUrl.replace(/\/$/, '')}/recent-activity/all/`,
      avatar: 'img/profile/aman-safwan.png'
    },
    posts
  };

  writeFileSync(feedPath, JSON.stringify(feed, null, 2) + '\n', 'utf8');
  console.log(`Synced ${posts.length} real LinkedIn embed(s) → data/linkedin-feed.json`);
}

sync();

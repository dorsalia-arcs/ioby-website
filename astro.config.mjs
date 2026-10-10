// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://ioby.net',
  // Old TKclock URLs (product renamed to iObY Clock, 2026-10-10). Pages has no server redirects,
  // so Astro writes small pages that forward to the new URLs.
  redirects: {
    '/tkclock': '/iobyclock/',
    '/tkclock/privacy': '/iobyclock/privacy/',
  },
});

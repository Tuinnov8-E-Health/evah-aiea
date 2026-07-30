import { serwist } from '@serwist/next/config';

const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  crypto.randomUUID();

export default serwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  precachePrerendered: false,
  esbuildOptions: {
    target: 'es2017',
  },
  additionalPrecacheEntries: [
    '/',
    '/login',
    '/dashboard',
    '/dashboard/new-encounter',
    '/dashboard/assess',
  ].map((url) => ({ url, revision })),
});

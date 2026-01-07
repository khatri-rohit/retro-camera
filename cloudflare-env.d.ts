// Cloudflare environment types
// Augment the global CloudflareEnv interface provided by @opennextjs/cloudflare

import type { D1Database, R2Bucket, Ai } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    // Cloudflare bindings from wrangler.json
    DB: D1Database;
    retro_camera_photos: R2Bucket;
    AI: Ai;

    // Environment variables
    R2_PUBLIC_URL: string; // Public URL for R2 bucket (e.g., https://pub-xxxx.r2.dev)
  }
}

export {};

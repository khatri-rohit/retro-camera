// Cloudflare environment types
export interface CloudflareEnv {
  DB: D1Database;
  PHOTO_BUCKET: R2Bucket;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends CloudflareEnv {}
  }
}

export {};

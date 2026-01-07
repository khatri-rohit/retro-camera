-- Create photos table for Cloudflare D1
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  imageUrl TEXT NOT NULL,
  message TEXT,
  positionX REAL NOT NULL,
  positionY REAL NOT NULL,
  rotation REAL NOT NULL,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create index on createdAt for faster queries
CREATE INDEX IF NOT EXISTS idx_photos_createdAt ON photos(createdAt DESC);

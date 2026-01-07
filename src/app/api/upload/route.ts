/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/upload/route.ts - FIXED VERSION USING R2 STORAGE
import { getUserIP } from "@/utils/ip";
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Simple sanitization function (no JSDOM needed)
function sanitizeMessage(message: string): string {
  if (!message || typeof message !== "string") return "";

  return message
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>\"']/g, "") // Remove special chars
    .trim()
    .substring(0, 500); // Max 500 chars
}

const rateLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60 * 60 * 24, // 24 hours
});

// Explicitly set Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = await getUserIP();

  try {
    await rateLimiter.consume(ip, 2);
  } catch (error) {
    console.error("Rate limit exceeded for IP:", ip);
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please try again tomorrow.",
        success: false,
        status: 429,
      },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const photoData = formData.get("photo") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", success: false },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB.", success: false },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images allowed.", success: false },
        { status: 400 }
      );
    }

    // Parse and validate photo data
    let photo;
    try {
      photo = JSON.parse(photoData);
    } catch {
      return NextResponse.json(
        { error: "Invalid photo data format", success: false },
        { status: 400 }
      );
    }

    // Validation checks
    if (!photo?.id || typeof photo.id !== "string" || photo.id.length > 100) {
      return NextResponse.json(
        { error: "Invalid photo ID", success: false },
        { status: 400 }
      );
    }

    if (photo.message && typeof photo.message !== "string") {
      return NextResponse.json(
        { error: "Invalid message", success: false },
        { status: 400 }
      );
    }

    // Sanitize message (lightweight approach)
    const sanitizedMessage = sanitizeMessage(photo.message || "");

    if (
      !photo.position ||
      typeof photo.position.x !== "number" ||
      typeof photo.position.y !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid position data", success: false },
        { status: 400 }
      );
    }

    if (
      typeof photo.rotation !== "number" ||
      photo.rotation < -180 ||
      photo.rotation > 180
    ) {
      return NextResponse.json(
        { error: "Invalid rotation", success: false },
        { status: 400 }
      );
    }

    // ✅ Get Cloudflare bindings - PROPER WAY
    const { env } = getCloudflareContext();
    console.log(env);
    if (!env.retro_camera_photos) {
      console.error("R2 bucket binding not available");
      return NextResponse.json(
        {
          error: "Storage configuration error",
          success: false,
        },
        { status: 500 }
      );
    }

    if (!env.DB) {
      console.error("D1 database binding not available");
      return NextResponse.json(
        {
          error: "Database configuration error",
          success: false,
        },
        { status: 500 }
      );
    }

    // Process file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate filename with extension
    const fileExtension = file.type.split("/")[1] || "jpg";
    const filename = `${photo.id}.${fileExtension}`;

    // ✅ Upload to R2 Bucket - FIXED APPROACH
    await env.retro_camera_photos.put(filename, buffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      },
    });

    console.log(`File uploaded to R2: ${filename}`);

    // ✅ Construct public URL using R2_PUBLIC_URL
    const r2PublicUrl = env.R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
    console.log(r2PublicUrl);
    if (!r2PublicUrl) {
      console.error("R2_PUBLIC_URL not configured");
      return NextResponse.json(
        {
          error:
            "Storage URL not configured. Please set R2_PUBLIC_URL in environment.",
          success: false,
        },
        { status: 500 }
      );
    }

    const publicUrl = `${r2PublicUrl}/${filename}`;

    // ✅ Save to Cloudflare D1
    const createdAt = Date.now();
    await env.DB.prepare(
      `INSERT INTO photos (id, imageUrl, message, positionX, positionY, rotation, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        photo.id,
        publicUrl,
        sanitizedMessage,
        photo.position.x,
        photo.position.y,
        photo.rotation,
        createdAt
      )
      .run();

    console.log("Upload successful:", photo.id);

    return NextResponse.json({
      message: "File uploaded successfully!",
      success: true,
      data: {
        id: photo.id,
        url: publicUrl,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed. Please try again.",
        success: false,
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

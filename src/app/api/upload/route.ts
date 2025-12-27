/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/upload/route.ts
import { getUserIP } from "@/utils/ip";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

// Simple sanitization function (no JSDOM needed)
function sanitizeMessage(message: string): string {
  if (!message || typeof message !== "string") return "";

  return message
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>\"']/g, "") // Remove special chars
    .trim()
    .substring(0, 500); // Max 500 chars
}

const serviceAccount = {
  projectId: process.env.GOOGLE_APPLICATION_CREDENTIALS_PROJECT_ID as string,
  privateKey: (
    process.env.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY as string
  ).replace(/\\n/g, "\n"),
  clientEmail: process.env
    .GOOGLE_APPLICATION_CREDENTIALS_CLIENT_EMAIL as string,
  privateKeyId: process.env
    .GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY_ID as string,
  clientId: process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_ID as string,
  authUri: process.env.GOOGLE_APPLICATION_CREDENTIALS_AUTH_URI as string,
  tokenUri: process.env.GOOGLE_APPLICATION_CREDENTIALS_TOKEN_URI as string,
  authProviderX509CertUrl: process.env
    .GOOGLE_APPLICATION_CREDENTIALS_AUTH_PROVIDER_X509_CERT_URL as string,
  clientX509CertUrl: process.env
    .GOOGLE_APPLICATION_CREDENTIALS_CLIENT_X509_CERT_URL as string,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET as string,
  });
}

const storage = admin.storage().bucket();
const db = getFirestore();

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

    // Process file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `photos/${photo.id}-${Date.now()}.jpg`;
    const fileRef = storage.file(filename);

    // Upload to Firebase Storage
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          photoId: photo.id,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    await fileRef.makePublic();

    const publicUrl = `https://storage.googleapis.com/${storage.name}/${filename}`;

    // Save to Firestore
    const photoRef = db.collection("photos").doc(photo.id);

    await photoRef.set({
      id: photo.id,
      imageUrl: publicUrl,
      message: sanitizedMessage,
      position: photo.position,
      rotation: photo.rotation,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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

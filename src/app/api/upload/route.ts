import { getUserIP } from "@/utils/ip";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

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

const opts = {
  points: 20, // 20 points
  duration: 60 * 60 * 60 * 24, // 1 day
};

const rateLimiter = new RateLimiterMemory(opts);

// DOMPurify for server-side
const window = new JSDOM("").window;
const DOMPurifyServer = DOMPurify(window);

export async function POST(req: NextRequest) {
  const ip = await getUserIP();
  try {
    const rateLimitRes = await rateLimiter.consume(ip, 2);
    console.log(rateLimitRes);
    if (rateLimitRes.remainingPoints === 0) {
      console.log("Rate limit exceeded for IP:", ip);
      return NextResponse.json({
        error: "Rate limit exceeded",
        success: false,
        status: 429,
      });
    }
  } catch (error) {
    console.error("Error Rate limit", error);
    return NextResponse.json({
      error: "Rate limit exceeded",
      success: false,
      status: 429,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const photoData = formData.get("photo") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB." },
        { status: 400 }
      );
    }

    // Parse and validate photo data
    let photo;
    try {
      photo = JSON.parse(photoData);
    } catch {
      return NextResponse.json(
        { error: "Invalid photo data format" },
        { status: 400 }
      );
    }

    if (!photo || typeof photo !== "object") {
      return NextResponse.json(
        { error: "Invalid photo data" },
        { status: 400 }
      );
    }

    if (!photo.id || typeof photo.id !== "string" || photo.id.length > 100) {
      return NextResponse.json({ error: "Invalid photo ID" }, { status: 400 });
    }

    if (photo.message && typeof photo.message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    // Sanitize message
    const sanitizedMessage = DOMPurifyServer.sanitize(photo.message, {
      ALLOWED_TAGS: [],
    }).substring(0, 500); // Max 500 chars

    if (
      !photo.position ||
      typeof photo.position !== "object" ||
      typeof photo.position.x !== "number" ||
      typeof photo.position.y !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid position data" },
        { status: 400 }
      );
    }

    if (
      typeof photo.rotation !== "number" ||
      photo.rotation < -180 ||
      photo.rotation > 180
    ) {
      return NextResponse.json({ error: "Invalid rotation" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `photos/${photo.id}-${Date.now()}.jpg`;
    const fileRef = storage.file(filename);

    // Upload to storage first
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

    const batch = db.batch();
    const photoRef = db.collection("photos").doc(photo.id);

    batch.set(photoRef, {
      id: photo.id,
      imageUrl: publicUrl,
      message: sanitizedMessage,
      position: photo.position,
      rotation: photo.rotation,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (firestoreError) {
      try {
        await fileRef.delete();
        console.log("Cleaned up storage file due to Firestore batch error");
      } catch (cleanupError) {
        console.error("Failed to cleanup storage file:", cleanupError);
      }
      throw firestoreError;
    }

    console.log("Upload Success");
    return NextResponse.json({
      message: "File uploaded successfully!",
      success: true,
      data: {
        id: photo.id,
        url: publicUrl,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Something went wrong!", success: false, details: error },
      { status: 500 }
    );
  }
}

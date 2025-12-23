import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

const serviceAccount = process.env.SERVICE_ACCOUNT as string;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET as string,
  });
}

const storage = admin.storage().bucket();
const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const photoData = formData.get("photo") as string;
    const photo = JSON.parse(photoData);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `photos/${photo.id}-${Date.now()}.jpg`;
    const fileRef = storage.file(filename);

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

    await db.collection("photos").doc(photo.id).set({
      id: photo.id,
      imageUrl: publicUrl,
      message: photo.message,
      position: photo.position,
      rotation: photo.rotation,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: "File uploaded successfully!",
      data: {
        id: photo.id,
        url: publicUrl,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Something went wrong!", details: error },
      { status: 500 }
    );
  }
}

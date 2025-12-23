import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

const serviceAccount = process.env.SERVICE_ACCOUNT as string;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET as string,
  });
}

const db = getFirestore();

export async function GET() {
  try {
    const photos = await db.collection("photos").get();

    return NextResponse.json({
      message: "Photos retrieved successfully!",
      data: photos.docs.map((doc) => ({
        id: doc.id,
        imageUrl: doc.data().imageUrl,
        message: doc.data().message,
        position: doc.data().position,
        rotation: doc.data().rotation,
        createdAt: doc.data().createdAt,
      })),
    });
  } catch (error) {
    console.error("Error retrieving photos:", error);
    return NextResponse.json(
      { error: "Something went wrong!", details: error },
      { status: 500 }
    );
  }
}

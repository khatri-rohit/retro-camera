import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

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

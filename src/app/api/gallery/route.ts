import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

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

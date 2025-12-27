/* eslint-disable @typescript-eslint/no-unused-vars */
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getUserIP } from "@/utils/ip";
import { RateLimiterMemory } from "rate-limiter-flexible";

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

const opts = {
  points: 100, // 100 points
  duration: 60 * 15, // 15 minutes
};

const rateLimiter = new RateLimiterMemory(opts);

export async function GET(req: NextRequest) {
  const ip = await getUserIP();
  try {
    const rateLimitRes = await rateLimiter.consume(ip, 1);
    console.log(rateLimitRes);
    if (rateLimitRes.remainingPoints === 0) {
      console.log("Rate limit exceeded for IP:", ip);
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          success: false,
          status: 429,
        },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error("Error Rate limit", error);
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        success: false,
        status: 429,
      },
      { status: 429 }
    );
  }

  try {
    const photos = await db
      .collection("photos")
      .orderBy("createdAt", "desc")
      .limit(50) // Limit to 50 photos for performance
      .get();

    // Validate and sanitize data
    const validatedData = photos.docs
      .map((doc) => {
        const data = doc.data();
        // Validate required fields
        if (
          !data.id ||
          !data.imageUrl ||
          !data.message ||
          !data.position ||
          typeof data.rotation !== "number"
        ) {
          console.warn(`Invalid photo data for doc ${doc.id}, skipping`);
          return null;
        }
        // Sanitize message (though it should be sanitized on upload)
        const sanitizedMessage =
          typeof data.message === "string"
            ? data.message.substring(0, 500)
            : "";

        return {
          id: doc.id,
          imageUrl: data.imageUrl,
          message: sanitizedMessage,
          position: data.position,
          rotation: data.rotation,
          createdAt: data.createdAt,
        };
      })
      .filter(Boolean); // Remove null entries

    return NextResponse.json({
      message: "Photos retrieved successfully!",
      data: validatedData,
    });
  } catch (error) {
    console.error("Error retrieving photos:", error);
    return NextResponse.json(
      { error: "Something went wrong!", details: error },
      { status: 500 }
    );
  }
}

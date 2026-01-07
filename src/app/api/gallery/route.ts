/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { getUserIP } from "@/utils/ip";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const opts = {
  points: 100, // 100 points
  duration: 60 * 15, // 15 minutes
};

const rateLimiter = new RateLimiterMemory(opts);

export async function GET(req: NextRequest) {
  const ip = await getUserIP();
  try {
    const rateLimitRes = await rateLimiter.consume(ip, 1);
    // console.log(rateLimitRes);
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
    // Get Cloudflare bindings with defensive fallback
    let env;
    try {
      env = getCloudflareContext().env;
    } catch (err) {
      env = process.env as any; // or set defaults
      console.warn("Cloudflare context not initialized; using fallback env.");
    }

    // Query Cloudflare D1
    const result = await env.DB.prepare(
      `SELECT id, imageUrl, message, positionX, positionY, rotation, createdAt 
       FROM photos 
       ORDER BY createdAt DESC 
       LIMIT 50`
    ).all();

    const validatedData = result.results
      .map((row: any) => {
        // Validate required fields
        if (!row.id || !row.imageUrl || typeof row.rotation !== "number") {
          console.warn(`Invalid photo data for id ${row.id}, skipping`);
          return null;
        }
        const sanitizedMessage =
          typeof row.message === "string" ? row.message.substring(0, 500) : "";

        return {
          id: row.id,
          imageUrl: row.imageUrl,
          message: sanitizedMessage,
          position: {
            x: row.positionX,
            y: row.positionY,
          },
          rotation: row.rotation,
          createdAt: row.createdAt,
        };
      })
      .filter(Boolean);

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

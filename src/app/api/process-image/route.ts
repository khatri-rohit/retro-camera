import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    const prompt = formData.get("prompt") as string;

    if (!imageFile || !prompt) {
      return NextResponse.json(
        { error: "Missing image or prompt" },
        { status: 400 }
      );
    }

    // Get Cloudflare AI binding
    const { env } = getCloudflareContext();

    // Convert image file to base64
    const imageBytes = await imageFile.arrayBuffer();
    const imageB64 = Buffer.from(imageBytes).toString("base64");

    // Use Cloudflare Workers AI - Stable Diffusion img2img
    // Lower strength to preserve image content and only apply color grading
    const response = await env.AI.run(
      "@cf/runwayml/stable-diffusion-v1-5-img2img",
      {
        prompt: prompt,
        image_b64: imageB64,
        strength: 0.25, // Lower strength (25%) to preserve original content, only apply color/tone adjustments
        num_steps: 15, // Fewer steps for subtle changes
        guidance: 6.0, // Lower guidance to prevent over-generation
      }
    );

    // Response is a ReadableStream with image data
    const bytes = await new Response(response).arrayBuffer();

    // Return the processed image
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": bytes.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Error processing image with Workers AI:", error);
    return NextResponse.json(
      {
        error: "Failed to process image",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

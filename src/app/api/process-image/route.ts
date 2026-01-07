import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Helper: Convert File to Base64 data URI
async function fileToGenerativePart(
  file: File
): Promise<{ inlineData: { data: string; mimeType: string } }> {
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  return {
    inlineData: {
      data: base64,
      mimeType: file.type,
    },
  };
}

// Helper: Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    const delay = RETRY_DELAY_MS * (MAX_RETRIES - retries + 1);
    console.warn(
      `Retry attempt ${MAX_RETRIES - retries + 1}. Waiting ${delay}ms...`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1);
  }
}

const FILTER_PROMPTS: Record<string, string> = {
  "soft-retro": `Apply a subtle soft-retro photographic film look to this image. 
    Add: warm tone (amber/sepia tint), slight desaturation (85% of original), gentle contrast boost (+5%), 
    fine film grain texture, soft vignette around edges. 
    Preserve: original composition, all facial features, skin tones, lighting, background elements, objects.
    Do not: add, remove, or alter any objects, faces, or composition. Only apply color grading.
    Style: photographic color correction only, natural appearance.`,

  "golden-hour": `Apply a subtle golden hour photographic look to this image.
    Add: warm golden tone (sunrise/sunset colors), increased saturation (+20%), gentle contrast (+8%), 
    slight brightness lift (+5%), amber color cast.
    Preserve: original composition, all facial features, skin tones, lighting, background elements, objects.
    Do not: add, remove, or alter any objects, faces, or composition. Only apply color grading.
    Style: photographic color correction only, natural golden hour lighting.`,

  "porcelain-glow": `Apply a subtle porcelain skin photographic look to this image.
    Add: soft brightness (+8%), reduced saturation (-10%), gentle contrast reduction (-5%), 
    slight blur for smoothness, gentle glow effect.
    Preserve: original composition, all facial features, skin tones, lighting, background elements, objects.
    Do not: add, remove, or alter any objects, faces, or composition. Only apply color grading.
    Style: photographic beauty filter, soft and elegant.`,

  "black-white-film": `Convert this image to classic black and white photography.
    Add: grayscale conversion, increased contrast (+12%), slight brightness adjustment (-2%).
    Preserve: original composition, all facial features, details, lighting, background elements, objects.
    Do not: add, remove, or alter any objects, faces, or composition. Only convert to monochrome.
    Style: classic black and white photographic film look.`,

  "urban-high-contrast": `Apply a subtle urban high-contrast photographic look to this image.
    Add: increased contrast (+25%), reduced saturation (-20%), slight brightness reduction (-5%), 
    cool color shift (slightly towards blue/teal).
    Preserve: original composition, all facial features, skin tones, lighting, background elements, objects.
    Do not: add, remove, or alter any objects, faces, or composition. Only apply color grading.
    Style: urban street photography aesthetic, dramatic but natural.`,
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    const filterType = formData.get("prompt") as string;

    // Validation
    if (!imageFile) {
      return NextResponse.json(
        { error: "Missing image file" },
        { status: 400 }
      );
    }

    if (!filterType) {
      return NextResponse.json(
        { error: "Missing filter type" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for Gemini)
    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB." },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Gemini API key not configured");
      return NextResponse.json(
        { error: "Image processing service not configured" },
        { status: 500 }
      );
    }

    // Get the appropriate prompt for the filter
    const prompt = FILTER_PROMPTS[filterType] || FILTER_PROMPTS["soft-retro"];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
    });

    // Convert image to Gemini format
    const imagePart = await fileToGenerativePart(imageFile);

    // Generate with retry logic for production reliability
    const result = await retryWithBackoff(async () => {
      return await model.generateContent([prompt, imagePart]);
    });

    const response = result.response;

    // Extract image from response
    let imageBase64: string | null = null;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith("image/")) {
        imageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!imageBase64) {
      console.error("No image in Gemini response:", response);
      return NextResponse.json(
        { error: "Failed to process image. No image returned." },
        { status: 500 }
      );
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, "base64");

    // Return the processed image
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error processing image with Gemini:", error);

    // Detailed error response for debugging (only in development)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to process image",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

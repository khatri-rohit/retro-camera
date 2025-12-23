import {
  getAI,
  GoogleAIBackend,
  getGenerativeModel,
  ResponseModality,
} from "firebase/ai";
import { app as firebaseApp } from "./../../firebase";

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

const model = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-image",
  generationConfig: {
    responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
  },
});

async function blobToGenerativePart(blob: Blob) {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (!reader.result) reject("Failed to read image");
      resolve((reader.result as string).split(",")[1]);
    };
    reader.readAsDataURL(blob);
  });

  return {
    inlineData: {
      data: base64,
      mimeType: blob.type,
    },
  };
}

export async function editCapturedPhoto(photoBlob: Blob) {
  const imagePart = await blobToGenerativePart(photoBlob);

  const prompt =
    "Apply a retro instant-camera photo look to this image. Add soft faded colors, slightly warm tones, gentle film grain, mild vignetting, subtle blur, and reduced contrast. Preserve the original subject and composition. Do not add text, borders, or new objects. Make it look like a real printed photo from the late 1990s.";

  const result = await model.generateContent([prompt, imagePart]);
  const inlineData = result?.response.inlineDataParts()?.[0]?.inlineData;

  if (!inlineData) throw new Error("No image returned");

  const editedBlob = new Blob(
    [Uint8Array.from(atob(inlineData.data), (c) => c.charCodeAt(0))],
    { type: inlineData.mimeType }
  );

  return URL.createObjectURL(editedBlob);
}

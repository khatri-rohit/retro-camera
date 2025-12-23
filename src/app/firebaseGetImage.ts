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
    responseModalities: [ResponseModality.IMAGE],
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

export async function editCapturedPhoto(photoBlob: Blob, prompt: string) {
  if (!prompt) return;

  const imagePart = await blobToGenerativePart(photoBlob);

  const result = await model.generateContent([imagePart, prompt]);

  const inlineData = result?.response.inlineDataParts()?.[0]?.inlineData;

  if (!inlineData) {
    throw new Error("No image returned from Gemini");
  }

  const editedBlob = new Blob(
    [Uint8Array.from(atob(inlineData.data), (c) => c.charCodeAt(0))],
    { type: inlineData.mimeType }
  );

  return URL.createObjectURL(editedBlob);
}

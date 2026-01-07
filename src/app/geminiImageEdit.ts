// Image editing using Google Gemini API directly
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
  const imagePart = await blobToGenerativePart(photoBlob);

  // Use Google Gemini API directly
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [imagePart, { text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const result = await response.json();

  const inlineData = result?.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.inlineData
  )?.inlineData;

  if (!inlineData) {
    throw new Error("No image returned from Gemini");
  }

  const editedBlob = new Blob(
    [Uint8Array.from(atob(inlineData.data), (c) => c.charCodeAt(0))],
    { type: inlineData.mimeType }
  );

  return {
    url: URL.createObjectURL(editedBlob),
    processedBlob: editedBlob,
  };
}

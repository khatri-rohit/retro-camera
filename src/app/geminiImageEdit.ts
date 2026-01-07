// Image editing using Gemini 2.5 Flash via API route
// This function runs on the client and calls the server-side API

export async function editCapturedPhoto(photoBlob: Blob, filterId: string) {
  try {
    // Create form data for API request
    const formData = new FormData();
    formData.append("image", photoBlob, "photo.jpg");
    formData.append("prompt", filterId); // Send filter ID (e.g., "soft-retro")

    // Call the server-side API route
    const response = await fetch("/api/process-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    // Get the processed image as blob
    const processedBlob = await response.blob();

    return {
      url: URL.createObjectURL(processedBlob),
      processedBlob: processedBlob,
    };
  } catch (error) {
    console.error("Failed to edit photo with Gemini:", error);
    // Fallback: return original photo if AI fails
    return {
      url: URL.createObjectURL(photoBlob),
      processedBlob: photoBlob,
    };
  }
}

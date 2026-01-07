// Image editing using Cloudflare Workers AI via API route
// This function runs on the client and calls the server-side API

export async function editCapturedPhoto(photoBlob: Blob, prompt: string) {
  try {
    // Create form data for API request
    const formData = new FormData();
    formData.append("image", photoBlob, "photo.jpg");
    formData.append("prompt", prompt);

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
    console.error("Failed to edit photo with Workers AI:", error);
    // Fallback: return original photo if AI fails
    return {
      url: URL.createObjectURL(photoBlob),
      processedBlob: photoBlob,
    };
  }
}

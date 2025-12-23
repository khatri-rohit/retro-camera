// import { FirebaseError } from "firebase/app";
// import { storage } from "../../../firebase";

// export async function uploadImageToFirebase(
//   file: Buffer,
//   path: string,
//   metadata?: {
//     contentType?: string;
//     customMetadata?: Record<string, string>;
//   }
// ): Promise<string> {
//   try {
//     const fileUpload = storage.file(path);

//     const uploadMetadata = {
//       contentType: metadata?.contentType || "image/jpeg",
//       metadata: metadata?.customMetadata || {},
//     };

//     // Upload the file buffer
//     await fileUpload.save(file, uploadMetadata);

//     // Make the file publicly accessible
//     await fileUpload.makePublic();

//     // Get the public URL
//     const publicUrl = `https://storage.googleapis.com/${storage.name}/${path}`;

//     return publicUrl;
//   } catch (error) {
//     const err = error as FirebaseError;
//     console.error("Error uploading image to Firebase:", err.code);
//     throw new Error(`Failed to upload image: ${err.message}`);
//   }
// }

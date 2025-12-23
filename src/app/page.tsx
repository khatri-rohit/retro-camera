/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import PhotoCard from "../../components/PhotoCard";
// import { editCapturedPhoto } from "./firebaseGetImage";


interface Photo {
  id: string;
  blob: Blob;
  originalURL: string;
  editedURL: string | null;
  isProcessing: boolean;
  message: string;
  // Store the photo's position after initial animation or drag
  position: { x: number; y: number };
  rotation: number;
  hasAnimated: boolean; // Track if initial animation is complete
}


export default function InstantCameraCard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragContainer = useRef<HTMLDivElement>(null)

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [flippedPhotos, setFlippedPhotos] = useState<Set<string>>(new Set());
  const [isCapturing, setIsCapturing] = useState(false);

  // Ask camera permission
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 282,
        height: 282,
        facingMode: "user",
        aspectRatio: 1
      },
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  // Mock Gemini processing - replace with your actual editCapturedPhoto function
  const editCapturedPhoto = async (blob: Blob): Promise<string> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Return original for demo - replace with actual Gemini call
    return URL.createObjectURL(blob);
  };


  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    if (!videoRef.current.srcObject) {
      startCamera();
      return;
    }
    setIsCapturing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Draw current video frame
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsCapturing(false);
        return;
      }

      const photoId = `photo-${Date.now()}`;
      const originalURL = URL.createObjectURL(blob);

      // Calculate initial stack position for this new photo
      const stackIndex = photos.length;
      const stackOffset = stackIndex * 20;
      // const rotationOffset = (stackIndex % 3 - 1) * 8; // Vary rotation: -8, 0, 8

      // Add photo immediately with processing state
      const newPhoto: Photo = {
        id: photoId,
        blob,
        originalURL,
        editedURL: null,
        isProcessing: true,
        message: "",
        position: { x: -stackOffset, y: 0 }, // Final resting position
        rotation: 0,
        hasAnimated: false, // Will animate on mount
      };

      setPhotos((prev) => [newPhoto, ...prev]);
      setIsCapturing(false);

      // Process in background
      try {
        const editedURL = await editCapturedPhoto(blob);

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? { ...p, editedURL, isProcessing: false }
              : p
          )
        );
      } catch (err) {
        console.error("Failed to edit photo:", err);
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, isProcessing: false } : p
          )
        );
      }
    }, "image/png");
  };

  const toggleFlip = (photoId: string) => {
    setFlippedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const updatePhotoRotation = (photoId: string, rotation: number) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, rotation, hasAnimated: true } : p
      )
    );
  };

  const updatePhotoPosition = (photoId: string, x: number, y: number) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, position: { x, y }, hasAnimated: true } : p
      )
    );
  };

  const markAsAnimated = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, hasAnimated: true } : p))
    );
  };

  const updateMessage = (photoId: string, message: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, message } : p))
    );
  };

  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        URL.revokeObjectURL(photo.originalURL);
        if (photo.editedURL) URL.revokeObjectURL(photo.editedURL);
      });
    };
  }, [photos]);

  useEffect(() => {
    startCamera()
  }, [])

  return (
    <motion.div
      ref={dragContainer}
      className="relative flex items-center justify-center h-screen no-select overflow-hidden"
    >

      {/* Camera */}
      <div className="absolute bottom-20 right-10 w-[29.8vw] flex">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute top-[60.1%] right-2.5 -translate-y-1/2 -translate-x-1/2 object-cover ${!videoRef.current?.srcObject ? "bg-black w-68 h-80" : ""}`}
        >
          {!videoRef.current?.srcObject && (
            <p className="text-white absolute top-1/2 z-50">
              📷 Enable Camera
            </p>
          )}
        </video>
        <img src="/camera1.png" loading="eager" alt="camera"
          className="object-cover z-50"
        />

        <button
          onClick={capture}
          className="absolute top-72 left-27 w-23 h-23 rounded-full flex items-center justify-center z-50 cursor-pointer"
          disabled={isCapturing}
        >
        </button>
      </div>

      {!videoRef.current?.srcObject && (
        <button
          onClick={startCamera}
          className="absolute top-6 left-6 z-10 px-4 py-2 bg-gray-900 text-amber-100 border-2 border-gray-800 rounded font-serif shadow-lg hover:bg-gray-500 cursor-pointer transition-colors duration-200"
        >
          📷 Enable Camera
        </button>
      )}

      {/* Instant Card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {photos.map((photo, index) => {
            return (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                totalLength={photos.length}
                dragConstraints={dragContainer}
                isFlipped={flippedPhotos.has(photo.id)}
                onFlip={() => toggleFlip(photo.id)}
                onMessageChange={(msg) => updateMessage(photo.id, msg)}
                onPositionChange={(x, y) => updatePhotoPosition(photo.id, x, y)}
                onAnimationComplete={() => markAsAnimated(photo.id)}
                onRotationChange={(rotation) => updatePhotoRotation(photo.id, rotation)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}

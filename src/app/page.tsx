/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import PhotoCard from "../../components/PhotoCard";
import FilterSilder from "../../components/FilterSilder";
// import { editCapturedPhoto } from "./firebaseGetImage";
import { availableFilters } from "../../components/Filters";
import Link from "next/link";

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
  const [activeIndex, setActiveIndex] = useState(0);

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
  const editCapturedPhoto = async (blob: Blob, prompt: string) => {
    // Simulate processing delay
    setIsCapturing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(prompt);
    setIsCapturing(false);
    // Return original for demo - replace with actual Gemini call
    return { url: URL.createObjectURL(blob), processedBlob: blob };
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

      sessionStorage.setItem("photos", JSON.stringify([newPhoto, ...JSON.parse(sessionStorage.getItem("photos") || "[]")]));

      // Process in background
      try {
        const { url, processedBlob } = await editCapturedPhoto(
          blob,
          availableFilters[activeIndex].prompt
        );
        // uploadPhotoCard(newPhoto)
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? { ...p, editedURL: url ?? null, isProcessing: false, blob: processedBlob }
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

  const uploadPhotoCard = async (photo: Photo) => {
    const formData = new FormData();
    formData.append("file", photo.blob, `${photo.id}.jpg`);

    const photoData = {
      id: photo.id,
      message: photo.message,
      position: photo.position,
      rotation: photo.rotation,
      hasAnimated: photo.hasAnimated,
    };

    formData.append("photo", JSON.stringify(photoData));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Upload successful:", data);
      return data;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
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
      style={{
        background: 'url("/background.jpg") no-repeat center center fixed',
        backgroundSize: 'cover'
      }}
    >
      {/* Camera Flash Animation */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div
            className="fixed inset-0 bg-white pointer-events-none z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.4,
              times: [0, 0.2, 1],
              ease: "easeOut"
            }}
          />
        )}
      </AnimatePresence>

      {/* Camera */}
      <div className="absolute bottom-20 right-10 w-[30vw] flex">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute top-[60%] right-0 -translate-y-1/2 -translate-x-1/2 object-cover z-30 ${!videoRef.current?.srcObject ? "bg-black w-68 h-80" : ""}`}
        >
          {!videoRef.current?.srcObject && (
            <p className="text-white absolute top-1/2 z-50">
              📷 Enable Camera
            </p>
          )}
        </video>
        <img src="/camera1.png" loading="eager" alt="camera"
          className="object-cover z-40"
        />

        <button
          onClick={capture}
          className="absolute top-74 left-29.5 w-21 h-21 rounded-full flex items-center justify-center z-50 cursor-pointer"
          disabled={isCapturing}
        >
        </button>

        <div className="absolute -bottom-20 -right-12 -translate-x-1/2 z-50 w-[300px]">
          <FilterSilder activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
        </div>
      </div>

      {!videoRef.current?.srcObject && (
        <button
          onClick={startCamera}
          className="absolute top-6 left-6 z-10 px-4 py-2 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          📷 Enable Camera
        </button>
      )}

      {/* Gallery */}
      <div className="absolute bottom-10 left-4">
        <Link
          href="/gallery"
          className="px-6 py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          📸 Public Gallery
        </Link>
      </div>

      {/* Instant Card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {photos.map((photo, index) => {
            return (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                uploadPhotoCard={uploadPhotoCard}
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

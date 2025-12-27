/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import PhotoCard from "../../components/PhotoCard";
// import { editCapturedPhoto } from "./firebaseGetImage";
import { Camera, Images, SwitchCamera } from "lucide-react";
import FilterSlider from "../../components/FilterSilder";
import { useRouter } from "next/navigation";

interface Photo {
  id: string;
  blob: Blob | null;
  originalURL: string;
  editedURL: string | null;
  isProcessing: boolean;
  message: string;
  isUploading: boolean;
  position: { x: number; y: number };
  rotation: number;
  hasAnimated: boolean;
  response?: any;
}


export default function InstantCameraCard() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragContainer = useRef<HTMLDivElement>(null);

  const [demoData, setDemoData] = useState<Photo[]>(() => {
    const baseDemoData: Omit<Photo, 'position'>[] = [
      {
        id: "demo-1766831607496",
        blob: null,
        originalURL: "/self.jpg ",
        editedURL: null,
        isProcessing: false,
        isUploading: false,
        message: "",
        rotation: 10,
        hasAnimated: true,
      },
      {
        id: "demo-1766831608396",
        blob: null,
        originalURL: "/self1jfif.jfif ",
        editedURL: null,
        isProcessing: false,
        isUploading: false,
        message: "",
        rotation: -10,
        hasAnimated: true,
      },
      {
        id: "demo-1766831608397",
        blob: null,
        originalURL: "/self2jfif.jfif ",
        editedURL: null,
        isProcessing: false,
        isUploading: false,
        message: "",
        rotation: 0,
        hasAnimated: true,
      },
    ];

    const basePositions = [
      { x: -1617, y: 430 },
      { x: -1965, y: 518 },
      { x: -1873, y: 166 },
    ];

    const scale = Math.min(window.innerWidth / 2560, window.innerHeight / 1440);
    return baseDemoData.map((photo, index) => ({
      ...photo,
      position: {
        x: basePositions[index].x * scale + 200,
        y: basePositions[index].y * scale - 100,
      },
    }));
  });

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [flippedPhotos, setFlippedPhotos] = useState<Set<string>>(new Set());
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const startCamera = async () => {
    try {
      // Stop existing stream if any
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 1280 },
          facingMode: facingMode,
          aspectRatio: 1
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const switchCamera = async () => {
    if (videoRef.current?.srcObject) {
      const stream1 = videoRef.current.srcObject as MediaStream;
      stream1.getTracks().forEach(track => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 1280 },
          facingMode: facingMode,
          aspectRatio: 1
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
    setFacingMode(prev => prev === "user" ? "environment" : "user");
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

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsCapturing(false);
        return;
      }

      const photoId = `photo-${Date.now()}`;
      const originalURL = URL.createObjectURL(blob);
      const stackIndex = photos.length;
      const stackOffset = stackIndex * 20;

      const newPhoto: Photo = {
        id: photoId,
        blob,
        originalURL,
        editedURL: null,
        isProcessing: true,
        isUploading: false,
        message: "",
        position: { x: -stackOffset, y: 0 },
        rotation: 0,
        hasAnimated: false,
      };

      setPhotos((prev) => [newPhoto, ...prev]);
      setTimeout(() => {
        setIsCapturing(false);
      }, 1000);

      setTimeout(() => {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, editedURL: originalURL, isProcessing: false } : p
          )
        );
      }, 2000);
    }, "image/png");
  };

  const uploadPhotoCard = async (photo: Photo) => {
    console.log("Upload:", photo.id);
  };

  const toggleFlip = (photoId: string) => {
    setFlippedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) newSet.delete(photoId);
      else newSet.add(photoId);
      return newSet;
    });
  };

  const updatePhotoRotation = (photoId: string, rotation: number) => {
    const updateFn = (prev: Photo[]) =>
      prev.map((p) => (p.id === photoId ? { ...p, rotation, hasAnimated: true } : p));
    photos.length < 1 ? setDemoData(updateFn) : setPhotos(updateFn);
  };

  const updatePhotoPosition = (photoId: string, x: number, y: number) => {
    const updateFn = (prev: Photo[]) =>
      prev.map((p) => (p.id === photoId ? { ...p, position: { x, y }, hasAnimated: true } : p));
    photos.length < 1 ? setDemoData(updateFn) : setPhotos(updateFn);
  };

  const markAsAnimated = (photoId: string) => {
    const updateFn = (prev: Photo[]) =>
      prev.map((p) => (p.id === photoId ? { ...p, hasAnimated: true } : p));
    photos.length < 1 ? setDemoData(updateFn) : setPhotos(updateFn);
  };

  const updateMessage = (photoId: string, message: string) => {
    const updateFn = (prev: Photo[]) =>
      prev.map((p) => (p.id === photoId ? { ...p, message } : p));
    photos.length < 1 ? setDemoData(updateFn) : setPhotos(updateFn);
  };

  useEffect(() => {
    startCamera();
    return () => {
      photos.forEach(photo => {
        URL.revokeObjectURL(photo.originalURL);
        if (photo.editedURL) URL.revokeObjectURL(photo.editedURL);
      });
    };
  }, []);

  return (
    <motion.div
      ref={dragContainer}
      className="relative flex items-center justify-center min-h-screen w-full overflow-hidden"
      style={{
        background: 'url("/background.jpg") no-repeat center center fixed',
        backgroundSize: 'cover'
      }}
    >
      <AnimatePresence>
        {isCapturing && (
          <motion.div
            className="fixed inset-0 bg-white pointer-events-none z-9999"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, times: [0, 0.2, 1], ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Camera Container */}
      <div className="fixed bottom-2 right-4 sm:bottom-4 sm:right-6 xl:bottom-8 xl:right-10 w-80 sm:w-[320px] md:w-95 lg:w-112.5 z-50">
        <div className="relative w-full aspect-square">
          {/* Video positioned BELOW the overlay to show through the lens */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute object-cover rounded-full"
            style={{
              width: '35%',
              height: '35%',
              bottom: '23%',
              left: '45%',
              transform: 'scaleX(1)',
              zIndex: 1,
            }}
          />

          {/* Camera overlay on top */}
          <img
            src="/camera1.png"
            alt="camera"
            className="relative opacity-01 w-full h-full object-contain select-none pointer-events-none"
            style={{ zIndex: 2 }}
          />

          {/* Capture button */}
          <button
            onClick={capture}
            className="absolute rounded-full transition-all z-10 cursor-pointer"
            style={{
              width: '12%',
              height: '12%',
              top: '35.5%',
              left: '16%',
              // backgroundColor: 'rgba(255, 0, 0, 0.1)',
            }}
            disabled={isCapturing}
          />
        </div>

        {/* Filter Slider */}
        <div className="mt-4 w-full px-2 ml-10">
          <FilterSlider
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            capture={capture}
          />
        </div>
      </div>

      {/* Enable Camera Button */}
      {!videoRef.current?.srcObject && (
        <button
          onClick={startCamera}
          className="fixed flex top-4 left-4 sm:top-6 sm:left-6 z-50 px-3 py-2 sm:px-4 sm:py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif text-sm sm:text-base  shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <Camera className="w-5 h-5 mx-2" />
          Enable Camera
        </button>
      )}

      {/* Gallery Button */}
      <div className="hidden sm:flex fixed bottom-4 left-4 sm:bottom-6 sm:left-6 lg:bottom-10 lg:left-10 z-50">
        <button
          onClick={() => router.push('/gallery')}
          className="px-6 py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400">
          <Images className="w-5 h-5 inline-flex mx-1" /> Public Gallery
        </button>
      </div>

      {/* For Mobiles */}
      <div className="sm:hidden flex fixed top-4 right-4 sm:top-6 sm:right-6 lg:top-10 lg:right-10 z-50">
        <button
          onClick={() => router.push('/gallery')}
          className="w-fit p-2.5 px-3 bg-amber-100 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 text-sm sm:text-base">
          <Images className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="fixed top-18 right-4 sm:top-6 sm:right-6 lg:right-10 z-50">
        <button
          onClick={switchCamera}
          className="hidden sm:flex px-6 py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          title={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
          aria-label={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
        >
          <SwitchCamera className="w-5 h-5 inline-flex mx-1" />
          Switch Camera
        </button>
        <button
          onClick={switchCamera}
          className="sm:hidden flex px-3 py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          title={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
          aria-label={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
        >
          <SwitchCamera className="w-5 h-5" />
        </button>
      </div>


      {/* Photo Cards */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {(photos.length < 1 ? demoData : photos).map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              uploadPhotoCard={uploadPhotoCard}
              dragConstraints={dragContainer}
              isFlipped={flippedPhotos.has(photo.id)}
              onFlip={() => toggleFlip(photo.id)}
              onMessageChange={(msg: string) => updateMessage(photo.id, msg)}
              onPositionChange={(x: number, y: number) => updatePhotoPosition(photo.id, x, y)}
              onAnimationComplete={() => markAsAnimated(photo.id)}
              onRotationChange={(rotation: number) => updatePhotoRotation(photo.id, rotation)}
            />
          ))}
        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Images, SwitchCamera } from "lucide-react";
import PhotoCard from "../../components/PhotoCard";
import { editCapturedPhoto } from "./firebaseGetImage";
import FilterSlider from "../../components/FilterSilder";
import { availableFilters } from "../../components/Filters";
import { domToPng } from "modern-screenshot";

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
  const [enable, setEnable] = useState(true);

  const [demoData, setDemoData] = useState<Photo[]>([]);
  const photoCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [flippedPhotos, setFlippedPhotos] = useState<Set<string>>(new Set());
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const baseDemoData: Omit<Photo, "position">[] = [
      {
        id: `demo-${Date.now() + 100}`,
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
        id: `demo-${Date.now() + 1000}`,
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
        id: `demo-${Date.now()}`,
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

    setDemoData(
      baseDemoData.map((photo, index) => ({
        ...photo,
        position: {
          x: basePositions[index].x * scale + 200,
          y: basePositions[index].y * scale - 100,
        },
      }))
    );
  }, []);

  const startCamera = async () => {
    try {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 1280 },
          facingMode: facingMode,
          aspectRatio: 1,
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setEnable(true);
      }
    } catch (error) {
      setEnable(false);
      console.error("Camera error:", error);
    }
  };

  const switchCamera = async () => {
    if (videoRef.current?.srcObject) {
      const stream1 = videoRef.current.srcObject as MediaStream;
      stream1.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 1280 },
          facingMode: facingMode,
          aspectRatio: 1,
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setEnable(true);
      }
    }
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    if (!videoRef.current.srcObject) {
      setError("Camera not available. Please Grant Camera Access");
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
      setIsCapturing(false);

      try {
        const { url, processedBlob } = await editCapturedPhoto(
          blob,
          availableFilters[activeIndex].prompt
        );

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? { ...p, editedURL: url ?? null, isProcessing: false, blob: processedBlob }
              : p
          )
        );
      } catch (err) {
        console.error("Failed to edit photo:", err);
        setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, isProcessing: false } : p)));
      }
    }, "image/png");
  };

  const uploadPhotoCard = async (photo: Photo) => {
    setError(null);
    const formData = new FormData();
    if (photos.length < 1) {
      setDemoData((prev) => prev.map((p) => (p.id === photo.id ? { ...p, isUploading: true } : p)));
      const blob = await fetch(photo.originalURL).then((res) => res.blob());
      // console.log(blob);
      formData.append("file", blob, `${photo.id}.jpg`);
    } else {
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, isUploading: true } : p)));
      formData.append("file", photo.blob as Blob, `${photo.id}.jpg`);
    }

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

      const data = await res.json();
      // console.log("Upload successful:", data);

      if (photos.length < 1) {
        setDemoData((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, isUploading: false, response: data } : p))
        );
      } else {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, isUploading: false, response: data } : p))
        );
      }

      // Clear gallery cache to show new data
      if (data.success) {
        sessionStorage.removeItem('gallery_photos');
        sessionStorage.removeItem('gallery_photos_expiry');
      }

      if (!data.success && data.status === 429) {
        setError("Your Today's upload limit has been reached. Please try again tomorrow.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      if (photos.length < 1) {
        setDemoData((prev) => prev.map((p) => (p.id === photo.id ? { ...p, isUploading: false } : p)));
      } else {
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, isUploading: false } : p)));
      }
    }
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

  async function waitForImagesToLoad(root: ParentNode, timeout = 3000) {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            const im = img as HTMLImageElement;
            if (im.complete && im.naturalWidth) {
              return resolve();
            }
            let settled = false;
            const onDone = () => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              resolve();
            };
            const onErr = () => onDone();
            const timer = setTimeout(onDone, timeout);
            im.addEventListener("load", onDone, { once: true });
            im.addEventListener("error", onErr, { once: true });
          })
      )
    );
  }

  function createSanitizedClone(cardElement: HTMLElement) {
    const clone = cardElement.cloneNode(true) as HTMLElement;

    const rect = cardElement.getBoundingClientRect();

    clone.style.position = "relative";
    clone.style.left = "0";
    clone.style.top = "0";
    clone.style.margin = "0";
    clone.style.transform = "none";
    clone.style.width = `${Math.round(rect.width)}px`;
    clone.style.height = `${Math.round(rect.height)}px`;
    clone.style.boxSizing = "border-box";
    clone.style.pointerEvents = "none";

    Array.from(clone.querySelectorAll("textarea")).forEach((ta) => {
      const backContainer = (ta as HTMLElement).closest("div");
      if (backContainer) backContainer.style.display = "none";
    });

    const interactive = Array.from(
      clone.querySelectorAll<HTMLElement>("button, [role='button'], [data-no-export], [aria-hidden='true']")
    );
    interactive.forEach((el) => {
      el.style.display = "none";
    });

    const allNodes = Array.from(clone.querySelectorAll<HTMLElement>("*")).concat([clone]);
    allNodes.forEach((n) => {
      n.style.transition = "none";
      n.style.animation = "none";

      n.style.transform = "none";
      n.style.filter = "";
      n.style.opacity = n.style.opacity === "0" ? "1" : n.style.opacity;
      n.style.backfaceVisibility = "visible";
      n.style.pointerEvents = "none";
    });

    return { clone, rect };
  }

  const downloadPhoto = async (photo: Photo) => {
    try {
      setIsDownloading(photo.id);

      const cardElement = photoCardRefs.current.get(photo.id);
      if (!cardElement) {
        console.error("Photo card element not found for ID:", photo.id);
        setError("Unable to download photo. Please try again.");
        setIsDownloading(null);
        return;
      }

      await new Promise((r) => setTimeout(r, 100));

      const { clone, rect } = createSanitizedClone(cardElement);

      const offscreen = document.createElement("div");
      offscreen.setAttribute("aria-hidden", "true");
      offscreen.style.position = "fixed";
      offscreen.style.left = "-99999px";
      offscreen.style.top = "0";
      offscreen.style.width = `${Math.round(rect.width)}px`;
      offscreen.style.height = `${Math.round(rect.height)}px`;
      offscreen.style.overflow = "hidden";
      offscreen.style.zIndex = "9999999";
      offscreen.style.pointerEvents = "none";
      offscreen.style.background = "transparent";
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      await waitForImagesToLoad(clone, 4000);
      if ((document as any).fonts && (document as any).fonts.ready) {
        await Promise.race([(document as any).fonts.ready, new Promise((r) => setTimeout(r, 250))]);
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const dataUrl = await domToPng(clone, {
        quality: 1.0,
        scale: dpr,
        backgroundColor: "#ffffff",
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `polaroid-${timestamp}-${photo.id.slice(-8)}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1500);
      offscreen.remove();
      setIsDownloading(null);
    } catch (err) {
      console.error("Download failed with error:", err);
      setError(`Failed to download photo: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsDownloading(null);
    }
  };


  const setPhotoCardRef = (photoId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      photoCardRefs.current.set(photoId, el);
    } else {
      photoCardRefs.current.delete(photoId);
    }
  };

  useEffect(() => {
    startCamera();
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      photos.forEach((photo) => {
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
        backgroundSize: "cover",
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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute object-cover rounded-full"
            style={{
              width: "35%",
              height: "35%",
              bottom: "23%",
              left: "45%",
              transform: "scaleX(1)",
              zIndex: 1,
            }}
          />

          <img
            src="/camera1.png"
            alt="camera"
            className="relative opacity-01 w-full h-full object-contain select-none pointer-events-none"
            style={{ zIndex: 2 }}
          />

          <button
            onClick={capture}
            className="absolute rounded-full transition-all z-10 cursor-pointer"
            style={{
              width: "12%",
              height: "12%",
              top: "35.5%",
              left: "16%",
            }}
            disabled={isCapturing}
          />

          {!enable && (
            <div
              className="absolute flex items-center justify-center rounded-full transition-all bg-black cursor-pointer"
              style={{
                width: "50%",
                height: "50%",
                top: "35.5%",
                left: "38%",
                zIndex: 1,
              }}
            >
              <p className="text-white text-[10px] font-medium">Enable Camera to Capture</p>
            </div>
          )}
        </div>

        <div className="mt-4 w-full px-2 ml-10 sm:ml-16">
          <FilterSlider activeIndex={activeIndex} setActiveIndex={setActiveIndex} capture={capture} />
        </div>
      </div>

      {!videoRef.current?.srcObject && (
        <button
          onClick={startCamera}
          className="fixed flex top-4 left-4 sm:top-6 sm:left-6 z-50 px-3 py-2 sm:px-4 sm:py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif text-sm sm:text-base shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <Camera className="w-5 h-5 mx-2" />
          Enable Camera
        </button>
      )}

      <div className="hidden sm:flex fixed bottom-4 left-4 sm:bottom-6 sm:left-6 lg:bottom-10 lg:left-10 z-50">
        <button
          onClick={() => router.push("/gallery")}
          className="px-6 py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <Images className="w-5 h-5 inline-flex mx-1" /> Public Gallery
        </button>
      </div>

      <div className="sm:hidden flex fixed top-4 right-4 sm:top-6 sm:right-6 lg:top-10 lg:right-10 z-50">
        <button
          onClick={() => router.push("/gallery")}
          className="w-fit p-2.5 px-3 bg-amber-100 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 text-sm sm:text-base"
        >
          <Images className="w-5 h-5 text-gray-900" />
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
              ref={setPhotoCardRef(photo.id)}
              uploadPhotoCard={uploadPhotoCard}
              dragConstraints={dragContainer}
              isFlipped={flippedPhotos.has(photo.id)}
              onFlip={() => toggleFlip(photo.id)}
              onMessageChange={(msg: string) => updateMessage(photo.id, msg)}
              onPositionChange={(x: number, y: number) => updatePhotoPosition(photo.id, x, y)}
              onAnimationComplete={() => markAsAnimated(photo.id)}
              onRotationChange={(rotation: number) => updatePhotoRotation(photo.id, rotation)}
              downloadPhoto={downloadPhoto}
              isDownloading={isDownloading === photo.id}
            />
          ))}
        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence>
        {error && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-9999 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="text-red-600 text-lg font-semibold mb-4">Error</div>
              <p className="text-gray-700 mb-4">{error}</p>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { FlipHorizontal2, LoaderIcon } from "lucide-react";
import { editCapturedPhoto } from "./firebaseGetImage";

export default function InstantCameraCard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragContainer = useRef<HTMLDivElement>(null)

  const [photos, setPhotos] = useState<{
    blob: any,
    previewURL: any
  }[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [message, setMessage] = useState("");

  // Ask camera permission
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 282, height: 282 },
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const [loading, setLoading] = useState<boolean>(false);
  const [newImage, setNewImage] = useState<any>(null);

  // Capture image
  const capture = () => {
    setLoading(true);
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    ctx.drawImage(videoRef.current, 0, 0);
    const len = photos.length;
    setPhotos([...photos.slice(0, len), newImage]);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setNewImage(null);
      const image = {
        blob,
        previewURL: URL.createObjectURL(blob)
      };
      setNewImage(image);

      editCapturedPhoto(blob).then((image) => {
        console.log(image);
        setNewImage(image);
        setPhotos([...photos.slice(0, len), {
          blob,
          previewURL: image
        }]);
        setLoading(false);
      }).catch((err) => {
        console.log(err);
        setLoading(false);
      })

    }, "image/png");
    setLoading(false);
  };

  useEffect(() => {
    startCamera()
  }, [])

  return (
    <motion.div
      ref={dragContainer}
      className="relative flex items-center justify-center h-screen no-select overflow-hidden"
    >

      {newImage && (
        <motion.div
          drag
          dragConstraints={dragContainer}
          dragMomentum={false}
          className="absolute top-20 right-42 w-70 h-90 cursor-grab perspective-distant group"
          initial={{ y: 350 }}
          animate={{
            rotateY: flipped ? 180 : 0,
            y: 0,
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 bg-white shadow-xl rounded-sm p-3"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className={`bg-black w-full transition-all duration-200 h-60 overflow-hidden no-select ${loading ? "blur-sm" : ""}`}>
              <motion.img
                src={newImage?.previewURL}
                alt="captured"
                className="object-cover w-full h-full no-select"
              />
            </div>

            <div className="mt-3 text-black text-center text-sm font-mono">
              MAY I MEET YOU
              <br />
              <span className="text-xs opacity-60">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          <div
            className="absolute inset-0 bg-white shadow-xl rounded-sm p-4"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <textarea
              placeholder="SECRET MESSAGE"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-full resize-none outline-none border border-dashed p-3 text-sm font-mono text-black"
            />
          </div>
          <button
            onClick={() => setFlipped(prev => !prev)}
            className="absolute group-hover:opacity-100 opacity-0 transition-opacity -right-10 top-1/2 -translate-x-1/2 text-xs rotate-90 bg-gray-200/50 p-3 rounded-full text-gray-900 cursor-pointer"
          >
            <FlipHorizontal2 />
          </button>
        </motion.div>
      )}

      {/* Camera */}
      <div className="absolute bottom-20 right-10 w-[29.8vw] flex">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute top-[60.1%] right-2.5 -translate-y-1/2 -translate-x-1/2 object-cover"
        />
        <img src="/camera1.png" loading="eager" alt="camera"
          className="object-cover z-50"
        />

        <button
          onClick={capture}
          className="absolute top-72 left-27 w-23 h-23 rounded-full flex items-center justify-center z-50 cursor-pointer"
          disabled={loading}
        >
        </button>
      </div>

      {/* {!isCameraVisible && ( */}
      <button
        onClick={startCamera}
        className="absolute top-6 left-6 z-10 px-4 py-2 bg-black text-white"
      >
        Enable Camera
      </button>
      {/* )} */}

      {loading && <p className="text-lg animate-spin"><LoaderIcon /></p>}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Instant Card */}
      {photos.filter((_, index) => index + 1 < photos.length).length > 0 ? (
        photos.filter((_, index) => index + 1 < photos.length).map((photo, index) => (
          <motion.div
            key={`${photo?.previewURL}-${index}`}
            drag
            dragConstraints={dragContainer}
            dragMomentum={false}
            className="absolute w-70 h-90 cursor-grab perspective-distant"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute inset-0 bg-white shadow-xl rounded-sm p-3"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="bg-black w-full transition-all duration-200 h-60 overflow-hidden no-select">
                <motion.img
                  src={photo?.previewURL}
                  alt="captured"
                  className="object-cover w-full h-full no-select"
                />
              </div>

              <div className="mt-3 text-black text-center text-sm font-mono">
                MAY I MEET YOU
                <br />
                <span className="text-xs opacity-60">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            <div
              className="absolute inset-0 bg-white shadow-xl rounded-sm p-4"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <textarea
                placeholder="SECRET MESSAGE"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-full resize-none outline-none border border-dashed p-3 text-sm font-mono text-black"
              />
            </div>
            <button
              onClick={() => setFlipped(prev => !prev)}
              className="absolute group-hover:opacity-100 opacity-0 transition-opacity -right-10 top-1/2 -translate-x-1/2 text-xs rotate-90 bg-gray-200/50 p-3 rounded-full text-gray-900 cursor-pointer"
            >
              <FlipHorizontal2 />
            </button>
          </motion.div>
        ))
      ) : (
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={dragContainer}
          className="relative w-70 h-90 cursor-grab perspective-distant group"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 bg-white shadow-xl rounded-sm p-3"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="bg-black w-full h-60 overflow-hidden no-select">
              <motion.img
                src={'/cool-cat.jpg'}
                alt="captured"
                className="object-cover w-full h-full  no-select"
              />
            </div>

            <div className="mt-3 text-black text-center text-sm font-mono">
              MAY I MEET YOU
              <br />
              <span className="text-xs opacity-60">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          <div
            className="absolute inset-0 bg-white shadow-xl rounded-sm p-4"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <textarea
              placeholder="SECRET MESSAGE"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-full resize-none outline-none border border-dashed p-3 text-sm font-mono text-black"
            />
          </div>
          <button
            onClick={() => setFlipped(prev => !prev)}
            className="absolute group-hover:opacity-100 opacity-0 transition-opacity -right-10 top-1/2 -translate-x-1/2 text-xs rotate-90 bg-gray-200/50 p-3 rounded-full text-gray-900 cursor-pointer"
          >
            <FlipHorizontal2 />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

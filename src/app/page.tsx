"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { FlipHorizontal2 } from "lucide-react";

export default function InstantCameraCard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragContainer = useRef<HTMLDivElement>(null)

  const [isCameraVisible, setCameraVisible] = useState(false)
  const [photos, setPhotos] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [message, setMessage] = useState("");

  // Ask camera permission
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 400, height: 400 },
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      setCameraVisible(true)
    }
  };

  // Capture image
  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPhotos(prev => [...prev, URL.createObjectURL(blob)]);
    }, "image/png");
  };

  useEffect(() => {
    startCamera()
  }, [])

  return (
    <motion.div
      ref={dragContainer}
      className=" relative flex items-center justify-center h-screen no-select bg-neutral-100 overflow-hidden"
    >
      {/* Camera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-y-10 -inset-x-10 object-cover"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.dataTransfer.dropEffect = 'copy'
          console.log(e.dataTransfer.dropEffect)
          console.log(e.dataTransfer.effectAllowed)
        }}
      />

      {!isCameraVisible && (
        <button
          onClick={startCamera}
          className="absolute top-6 left-6 z-10 px-4 py-2 bg-black text-white"
        >
          Enable Camera
        </button>
      )}

      <button
        onClick={capture}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-white text-black rounded-full"
      >
        Capture
      </button>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Instant Card */}
      {photos.length > 0 ? (
        photos.map((photo) => (
          <motion.div
            key={photo}
            drag
            dragConstraints={{ left: 0, right: 300 }}
            dragMomentum={false}
            className="relative w-[280px] h-[360px] cursor-grab perspective-distant"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* FRONT */}
            <div
              className="absolute inset-0 bg-white shadow-xl rounded-sm p-3"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="bg-black w-full h-[240px] overflow-hidden no-select">
                <motion.img
                  src={photo}
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

            {/* BACK */}
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
              className="absolute -right-10 top-1/2 text-xs rotate-90 text-gray-900 cursor-pointer"
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
          className="relative w-[280px] h-[360px] cursor-grab perspective-distant"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 bg-white shadow-xl rounded-sm p-3"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="bg-black w-full h-[240px] overflow-hidden no-select">
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

          {/* BACK */}
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
            className="absolute -right-10 top-1/2 text-xs rotate-90 text-gray-900 cursor-pointer"
          >
            <FlipHorizontal2 />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

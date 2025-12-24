import { Loader2, RotateCcw, RotateCw, Upload } from "lucide-react";
import { motion, useMotionValue } from "motion/react";
import { useState } from "react";

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


interface PhotoCardProps {
    photo: Photo;
    dragConstraints: React.RefObject<HTMLDivElement | null>;
    index: number;
    totalLength: number;
    isFlipped: boolean;
    onFlip: () => void;
    onMessageChange: (msg: string) => void;
    onPositionChange: (x: number, y: number) => void;
    onAnimationComplete: () => void;
    onRotationChange: (rotation: number) => void;
    uploadPhotoCard: (photo: Photo) => void;
}

export default function PhotoCard({
    photo,
    // index,
    isFlipped,
    onFlip,
    onMessageChange,
    dragConstraints,
    // totalLength,
    onAnimationComplete,
    onPositionChange,
    onRotationChange,
    uploadPhotoCard
}: PhotoCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // const rotationOffset = (index - totalLength / 2) * 5;

    const displayURL = photo.editedURL || photo.originalURL;
    // Use motion values for smooth dragging
    const x = useMotionValue(photo.position.x);
    const y = useMotionValue(photo.position.y);

    return (
        <motion.div
            key={photo.id}
            drag
            dragConstraints={dragConstraints}
            className="absolute w-64 h-80 cursor-grab active:cursor-grabbing pointer-events-auto group top-1/12 right-1/12"
            onDragEnd={(_, info) => {
                const newX = photo.position.x + info.offset.x;
                const newY = photo.position.y + info.offset.y;
                onPositionChange(newX, newY);
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => {
                if (photo.rotation === 0) {
                    onRotationChange(10);
                } else if (photo.rotation === 10) {
                    onRotationChange(-10);
                } else {
                    onRotationChange(0);
                }
            }}
            initial={
                !photo.hasAnimated
                    ? {
                        y: 350,
                        rotate: 0,
                        scale: 0.8,
                    }
                    : {
                        // Already animated: use saved position
                        x: photo.position.x,
                        y: photo.position.y,
                        rotate: photo.rotation,
                        scale: 1,
                    }
            }
            animate={{
                x: photo.position.x,
                y: photo.position.y,
                rotate: photo.rotation,
                scale: 1,
                rotateY: isFlipped ? 180 : 0,
            }}
            transition={{
                type: "spring",
                mass: 0.8,
                y: {
                    type: "spring",
                },
                rotateY: {
                    duration: 0.6,
                    ease: "easeInOut",
                },
            }}
            exit={{
                opacity: 0,
                scale: 0.5,
                y: -200,
                transition: { duration: 0.4 },
            }}
            onAnimationComplete={() => {
                if (!photo.hasAnimated) {
                    onAnimationComplete();
                }
            }}
            style={{
                transformStyle: "preserve-3d",
                x,
                y,
            }}
            whileHover={{
                scale: 1.02,
                zIndex: 200,
                transition: { duration: 0.15 }
            }}
            whileTap={{
                scale: 0.98,
                cursor: "grabbing"
            }}
        >
            {/* Share Button */}
            <motion.button
                onClick={() => uploadPhotoCard(photo)}
                className="absolute -top-6 -translate-x-1/2 -translate-y-1/2 left-1/2 flex gap-2 px-3 py-3 text-black bg-white/50 backdrop-blur-sm font-mono shadow-xl cursor-pointer transition-all rounded-full z-50 w-full perspective-none"
                animate={{
                    opacity: isHovered ? 1 : 0,
                }}
                transition={{
                    duration: 0.1,
                    ease: "easeInOut",
                }}
                whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                }}
            >
                <span className="text-sm">Share it with the world</span>
                <Upload className="w-5 h-5 text-gray-800 rotate-90" />
            </motion.button>

            {/* Front Side */}
            <div
                className="absolute inset-0 bg-white shadow-2xl rounded-sm p-4"
                style={{ backfaceVisibility: "hidden" }}
            >
                <div className="relative bg-black w-full h-56 overflow-hidden">
                    {photo.isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <Loader2 className="w-12 h-12 text-white animate-spin" />
                            </motion.div>
                        </div>
                    )}
                    <motion.img
                        src={displayURL}
                        alt="Instant photo"
                        className="object-cover w-full h-full select-none"
                        animate={{
                            filter: photo.isProcessing
                                ? "blur(8px) brightness(0.7)"
                                : "blur(0px) brightness(1)",
                        }}
                        transition={{ duration: 0.3 }}
                        draggable={false}
                    />
                </div>

                <div className="mt-4 text-black text-center text-sm font-mono">
                    HEY YOU 👋
                    <br />
                    <span className="text-xs opacity-60">
                        {new Date().toLocaleDateString()}
                    </span>
                </div>
            </div>

            {/* Back Side */}
            <div
                className="absolute inset-0 bg-white shadow-2xl rounded-sm p-4"
                style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                }}
            >
                <textarea
                    placeholder="Write a special message..."
                    value={photo.message}
                    onChange={(e) => onMessageChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-full resize-none outline-none border-2 border-dashed border-gray-300 p-3 text-sm font-mono text-black focus:border-gray-500 transition-colors rounded"
                />
            </div>

            {/* Flip Button */}
            <motion.button
                onClick={(e) => {
                    e.stopPropagation();
                    onFlip();
                }}
                className="cursor-pointer absolute -right-3 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur-sm p-3 rounded-full shadow-xl hover:bg-white/80 transition-all z-201"
                style={{ pointerEvents: "auto" }}
                whileHover={{
                    opacity: 1,
                    x: 0,
                    scale: 1.1,
                }}
                animate={{
                    opacity: isHovered ? 1 : 0, // Control opacity with state
                }}
            >
                {isFlipped ? <RotateCw className="w-5 h-5 text-gray-800 rotate-90" /> : <RotateCcw className="w-5 h-5 text-gray-800 rotate-90" />}
            </motion.button>
        </motion.div>
    )
}
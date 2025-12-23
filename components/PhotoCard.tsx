import { Loader2, RotateCcw, RotateCw } from "lucide-react";
import { motion, useMotionValue } from "motion/react";

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
    onPositionChange
}: PhotoCardProps) {
    const displayURL = photo.editedURL || photo.originalURL;

    // const rotationOffset = (index - totalLength / 2) * 5;

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
                transition: { duration: 2.5 },
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
                    MAY I MEET YOU
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
                    placeholder="Write your secret message here..."
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
                className="absolute -right-14 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl hover:bg-white transition-all z-201 group-hover:opacity-100 opacity-0"
                style={{ pointerEvents: "auto" }}
                whileHover={{
                    opacity: 1,
                    x: 0,
                    scale: 1.1,
                }}
            >
                {isFlipped ? <RotateCw className="w-5 h-5 text-gray-800 rotate-90" /> : <RotateCcw className="w-5 h-5 text-gray-800 rotate-90" />}
            </motion.button>
        </motion.div>
    )
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RotateCcw, RotateCw } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface Photo {
    id: string;
    imageUrl: string,
    message: string,
    position: { x: number; y: number },
    rotation: number,
    createdAt: any,
}

interface PhotoCardProps {
    photo: Photo;
    isFlipped: boolean;
    onFlip: () => void;
}

export default function ViewCard({
    photo,
    isFlipped,
    onFlip,
}: PhotoCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const displayURL = photo.imageUrl;

    return (
        <div style={{ perspective: 1000 }}>
            <motion.div
                key={photo.id}
                className="relative w-64 h-80 cursor-pointer"
                style={{ transformStyle: "preserve-3d" }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                animate={{
                    rotate: photo.rotation,
                    rotateY: isFlipped ? 180 : 0,
                }}
                exit={{
                    opacity: 0,
                    scale: 0.5,
                    y: -200,
                    transition: { duration: 0.4 },
                }}
                whileHover={{
                    scale: 1.02,
                    zIndex: 200,
                    transition: { duration: 0.15 }
                }}
            >
                {/* Front Side */}
                <div
                    className="absolute inset-0 bg-white shadow-2xl rounded-sm p-4"
                    style={{
                        backfaceVisibility: "hidden",
                    }}
                >
                    <div className="relative bg-black w-full h-56 overflow-hidden">
                        <motion.img
                            src={displayURL}
                            alt="Instant photo"
                            className="object-cover w-full h-full select-none"
                            animate={{
                                filter: "blur(0px) brightness(1)",
                            }}
                            transition={{ duration: 0.3 }}
                            draggable={false}
                        />
                    </div>

                    <div className="mt-4 text-black text-center text-sm font-mono">
                        HEY YOU 👋
                        <br />
                        <span className="text-xs opacity-60">
                            {new Date(photo.createdAt._seconds * 1000 + photo.createdAt._nanoseconds / 1000000).toLocaleDateString()}
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
                        value={photo.message || 'No Secret Message'}
                        readOnly
                        // onChange={(e) => onMessageChange(e.target.value)}
                        // onClick={(e) => e.stopPropagation()}
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
                        opacity: isHovered ? 1 : 0,
                    }}
                >
                    {isFlipped ? <RotateCw className="w-5 h-5 text-gray-800 rotate-90" /> : <RotateCcw className="w-5 h-5 text-gray-800 rotate-90" />}
                </motion.button>
            </motion.div>
        </div>
    )
}
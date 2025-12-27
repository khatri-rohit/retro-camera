
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CheckCircle, Download, Loader2, Pin, RotateCcw, RotateCw, XCircle } from "lucide-react";
import { motion, useMotionValue } from "motion/react";
import { forwardRef, useState, useEffect } from "react";

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


interface PhotoCardProps {
    photo: Photo;
    dragConstraints: React.RefObject<HTMLDivElement | null>;
    isFlipped: boolean;
    onFlip: () => void;
    onMessageChange: (msg: string) => void;
    onPositionChange: (x: number, y: number) => void;
    onAnimationComplete: () => void;
    onRotationChange: (rotation: number) => void;
    uploadPhotoCard: (photo: Photo) => void;
    downloadPhoto: (photo: Photo) => void;
    isDownloading: boolean;
}


const PhotoCard = forwardRef<HTMLDivElement, PhotoCardProps>(
    (
        {
            photo,
            dragConstraints,
            isFlipped,
            onFlip,
            onMessageChange,
            onAnimationComplete,
            onPositionChange,
            onRotationChange,
            uploadPhotoCard,
            downloadPhoto,
            isDownloading,
        },
        ref
    ) => {
        const [isHovered, setIsHovered] = useState(false);
        const [isMobile, setIsMobile] = useState(false);
        const [isDragging, setIsDragging] = useState(false);

        useEffect(() => {
            const checkMobile = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
            checkMobile();
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }, []);

        const displayURL = photo.editedURL || photo.originalURL;
        // Use motion values for smooth dragging
        const x = useMotionValue(photo.position.x);
        const y = useMotionValue(photo.position.y);

        return (
            <motion.div
                key={photo.id}
                ref={ref}
                data-photo-id={photo.id}
                drag
                dragConstraints={dragConstraints}
                className="absolute w-32 h-44 md:w-40 md:h-56 xl:w-64 xl:h-80 cursor-grab active:cursor-grabbing pointer-events-auto group top-1/5 right-20 md:top-1/12 md:right-25"
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(_, info) => {
                    if (isMobile) {
                        setIsDragging(false);
                        setIsHovered(prev => !prev)
                    }
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
                    onClick={(e) => {
                        e.stopPropagation();
                        uploadPhotoCard(photo);
                    }}
                    className="absolute -top-8 -translate-x-1/2 -translate-y-1/2 left-1/2 flex items-center justify-center gap-2 px-4 py-2 text-amber-900 bg-amber-100/90 backdrop-blur-md font-serif shadow-2xl cursor-pointer transition-all duration-300 rounded-full z-50 min-w-30 sm:min-w-35 h-10 sm:h-12 border border-amber-300/50 hover:bg-amber-200/95 hover:shadow-3xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                    animate={{
                        opacity: (isHovered || (isMobile && isDragging)) && !isFlipped ? 1 : 0,
                        y: (isHovered || (isMobile && isDragging)) && !isFlipped ? 0 : 10,
                    }}
                    transition={{
                        duration: 0.2,
                        ease: "easeOut",
                    }}
                    whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(245, 158, 11, 0.95)",
                    }}
                    whileTap={{
                        scale: 0.95,
                    }}
                    disabled={photo.isUploading}
                    title={photo.isUploading ? "Uploading..." : "Share this photo"}
                    aria-label={photo.isUploading ? "Uploading photo" : "Share photo with the world"}
                >
                    {photo.response && photo.response.data?.id === photo.id ? (
                        <div className="flex items-center justify-center w-full h-full gap-2">
                            {photo.response.success ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-green-700 animate-pulse" />
                                    <span className="text-xs font-medium text-green-800">Shared! 🌍</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-5 h-5 text-red-700 animate-pulse" />
                                    <span className="text-xs font-medium text-red-800">Failed 😔</span>
                                </>
                            )}
                        </div>
                    ) : photo.isUploading ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <Loader2 className="w-5 h-5 text-amber-800 animate-spin" />
                            <span className="text-xs font-medium text-amber-900 ml-1">Sharing...</span>
                        </div>
                    ) : (
                        <>
                            <Pin className="w-4 h-4 text-amber-800" />
                            <span className="text-xs font-medium tracking-wide text-nowrap">Pin with others</span>
                        </>
                    )}
                </motion.button>

                {/* Front Side */}
                <div
                    className="absolute inset-0 bg-white shadow-2xl rounded-sm p-1 sm:p-2 xl:p-3"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <div className="relative bg-black w-full aspect-square overflow-hidden">
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
                                    <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-white animate-spin" />
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

                    <div className="mt-2 sm:mt-4 text-black text-center text-xs sm:text-sm font-mono">
                        HEY YOU 👋
                        <br />
                        <span className="text-xs opacity-60">
                            {new Date().toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Back Side */}
                <div
                    className="absolute inset-0 bg-white shadow-2xl rounded-sm p-2 sm:p-4"
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
                        className="w-full h-full resize-none outline-none border-2 border-dashed border-gray-300 p-2 sm:p-3 text-xs sm:text-sm font-mono text-black focus:border-gray-500 transition-colors rounded"
                    />
                </div>

                {/* Flip Button */}
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        onFlip();
                    }}
                    className="cursor-pointer absolute -right-3 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-xl hover:bg-white/80 transition-all z-201 min-w-10 min-h-10 sm:min-w-12 sm:min-h-12 flex items-center justify-center"
                    style={{ pointerEvents: "auto" }}
                    whileHover={{
                        opacity: 1,
                        x: 0,
                        scale: 1.1,
                    }}
                    animate={{
                        opacity: isHovered || (isMobile && isDragging) ? 1 : 0,
                    }}
                >
                    {isFlipped ? <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 rotate-90" /> : <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 rotate-90" />}
                </motion.button>

                {/* Download Button */}
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        downloadPhoto(photo);
                    }}
                    className="absolute -right-3 top-10/12 -translate-y-1/2 flex items-center justify-center p-2 sm:p-3 bg-amber-100/90 backdrop-blur-md shadow-2xl cursor-pointer transition-all duration-300 rounded-full z-50 border border-amber-300/50 hover:bg-amber-200/95 hover:shadow-3xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                    animate={{
                        opacity: (isHovered || isMobile) && !isFlipped ? 1 : 0,
                        y: (isHovered || isMobile) && !isFlipped ? 0 : 10,
                    }}
                    transition={{
                        duration: 0.2,
                        ease: "easeOut",
                    }}
                    whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(245, 158, 11, 0.95)",
                    }}
                    whileTap={{
                        scale: 0.95,
                    }}
                    disabled={photo.isUploading || photo.isProcessing || isDownloading}
                    title="Download this photo"
                    aria-label="Download photo as image"
                >
                    {isDownloading ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
                    )}
                </motion.button>
            </motion.div>
        )
    });

PhotoCard.displayName = "PhotoCard";

export default PhotoCard;
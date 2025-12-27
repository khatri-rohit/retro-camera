'use client';

import { useEffect, useState } from "react";
import ViewCard from "../../../components/ViewCard";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Loader } from "lucide-react";

interface Photo {
    id: string;
    imageUrl: string,
    message: string,
    position: { x: number; y: number },
    rotation: number,
    createdAt: Date,
}

const Gallery = () => {
    const [flippedPhotos, setFlippedPhotos] = useState<Set<string>>(new Set());
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
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

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/gallery");

                if (!res.ok) {
                    throw new Error(`Fetch failed: ${res.statusText}`);
                }

                const data = await res.json();
                setPhotos(data.data);
                setLoading(false);
                setError(null);
            } catch (error) {
                console.error("Fetch error:", error);
                setError("Failed to load photos.");
            }
        };

        fetchPhotos();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full h-screen bg-linear-to-br from-amber-100 via-orange-50 to-yellow-50">
                <div className="flex flex-col gap-2 items-center justify-center text-xl text-amber-900">
                    <Loader className="animate-spin" />
                    <p className="text-sm">Loading gallery...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center w-full h-screen bg-linear-to-br from-red-50 via-orange-50 to-yellow-50">
                <div className="text-xl text-red-700">{error}</div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-linear-to-br from-amber-50 via-orange-100 to-yellow-50 p-4 sm:p-6 lg:p-8">
            {/* Gallery */}
            <div className="absolute top-5 md:top-5 left-4 z-10">
                <Link
                    href="/"
                    className="hidden md:flex px-4 py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                    <Camera className="w-5 h-5 mx-2" />
                    <span>Instant Camera</span>
                </Link>
                <Link
                    href="/"
                    className="md:hidden flex px-3 py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                    <Camera className="w-5 h-5" />
                </Link>
            </div>
            <header className="text-center my-20">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-800 mb-2 drop-shadow-lg">Photo Gallery</h1>
                <p className="text-orange-700 text-sm sm:text-base font-medium tracking-wide">Explore your retro camera captures</p>
            </header>
            <div className="flex items-center justify-center mx-auto">

                {Array.isArray(photos) && photos.length === 0 || !photos ? (
                    <motion.div
                        className="flex items-center justify-center h-64"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <div className="flex flex-col gap-4 items-center justify-center text-center max-w-md">
                            <div className="relative">
                                <Camera className="w-16 h-16 text-amber-600 animate-pulse" />
                                <div className="absolute inset-0 bg-amber-200 rounded-full opacity-20 animate-ping"></div>
                            </div>
                            <p className="text-lg text-amber-900 font-medium leading-relaxed">
                                Your gallery is empty. Time to capture some retro memories!
                            </p>
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-8 py-4 bg-linear-to-r from-amber-100 to-orange-100 text-amber-900 border-2 border-amber-300 rounded-xl shadow-lg tracking-wider hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 hover:from-amber-200 hover:to-orange-200"
                            >
                                <Camera className="w-6 h-6" />
                                <span className="text-base font-semibold">Start Capturing</span>
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-44 sm:mb-28 sm:gap-y-20"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {photos.map((photo) => (
                            <motion.div key={photo.id} variants={itemVariants}>
                                <ViewCard
                                    photo={photo}
                                    isFlipped={flippedPhotos.has(photo.id)}
                                    onFlip={() => toggleFlip(photo.id)}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-amber-800 text-xs font-medium flex flex-col items-center text-center gap-1 bg-white/30 backdrop-blur-md rounded-xl px-6 py-3 shadow-lg border border-amber-200/60 transition-all duration-300 hover:bg-white/40 hover:shadow-xl">
                <span className="font-serif text-sm tracking-wide text-nowrap">
                    © 2025 Retro Camera
                </span>
                <span className="font-serif text-xs">
                    Designed by{" "}
                    <a
                        href="https://rohitkhatri.vercel.app/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-900 hover:text-amber-700 underline decoration-amber-400 decoration-2 underline-offset-2 hover:decoration-amber-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-sm"
                    >
                        Rohit Khatri
                    </a>
                </span>
            </footer>
        </div>
    );
};

export default Gallery;
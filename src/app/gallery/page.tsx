'use client';

import { useEffect, useState } from "react";
import ViewCard from "../../../components/ViewCard";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";

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
                console.log("Fetch successful:", data);
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
            <div className="absolute top-5 md:top-10 left-4 z-10">
                <Link
                    href="/"
                    className="hidden md:flex px-6 py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                    <span className="mr-2">📸</span>
                    <span>Instant Camera</span>
                </Link>
                <Link
                    href="/"
                    className="md:hidden flex px-2 pl-4 py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                    <span className="mr-2">📸</span>
                </Link>
            </div>
            <header className="text-center mb-25">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-800 mb-2 drop-shadow-lg">Photo Gallery</h1>
                <p className="text-orange-700 text-sm sm:text-base font-medium tracking-wide">Explore your retro camera captures</p>
            </header>
            {photos.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-700 text-lg bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">No photos available. Start capturing!</p>
                </div>
            ) : (
                <motion.div
                    className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-16"
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
            <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-amber-800 text-xs font-semibold">
                © 2025 Retro Camera App
            </footer>
        </div>
    );
};

export default Gallery;
'use client';

import { useEffect, useState } from "react";
import ViewCard from "../../../components/ViewCard";
import Link from "next/link";

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

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-50">
                <div className="text-xl text-amber-900 animate-pulse">Loading gallery...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center w-full h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
                <div className="text-xl text-red-700">{error}</div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-orange-100 to-yellow-50 p-4 sm:p-6 lg:p-8">
            {/* Gallery */}
            <div className="absolute top-10 left-4 z-10">
                <Link
                    href="/"
                    className="px-6 py-3 bg-amber-100 text-gray-900 border-2 border-amber-300 rounded-lg font-serif shadow-xl hover:bg-amber-200 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                    <span className="mr-2">📸</span>
                    Instant Camera
                </Link>
            </div>
            <header className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-800 mb-2 drop-shadow-lg">Photo Gallery</h1>
                <p className="text-orange-700 text-sm sm:text-base font-medium">Explore your retro camera captures</p>
            </header>
            {photos.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-700 text-lg bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">No photos available. Start capturing!</p>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
                    {photos.map((photo) => (
                        <ViewCard
                            key={photo.id}
                            photo={photo}
                            isFlipped={flippedPhotos.has(photo.id)}
                            onFlip={() => toggleFlip(photo.id)}
                        />
                    ))}
                </div>
            )}
            <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-amber-800 text-xs font-semibold">
                © 2025 Retro Camera App
            </footer>
        </div>
    );
};

export default Gallery;
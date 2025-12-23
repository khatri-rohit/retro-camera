'use client';

import { useEffect, useState } from "react";
import ViewCard from "../../../components/ViewCard";


interface Photo {
    id: string;
    blob: Blob;
    originalURL: string;
    editedURL: string | null;
    isProcessing: boolean;
    message: string;
    position: { x: number; y: number };
    rotation: number;
    hasAnimated: boolean;
}

const Gallery = () => {
    const [flippedPhotos, setFlippedPhotos] = useState<Set<string>>(new Set());
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simulate fetching photos from an API or local storage
        const fetchPhotos = async () => {
            try {
                // Replace with actual data fetching logic
                const mockPhotos: Photo[] = [
                    {
                        id: "1",
                        blob: new Blob(),
                        originalURL: "/cool-cat.jpg",
                        editedURL: null,
                        isProcessing: false,
                        message: "Rohit Khatri",
                        position: { x: 0, y: 0 },
                        rotation: -10,
                        hasAnimated: false,
                    },
                    // Add more mock photos as needed
                ];
                setPhotos(mockPhotos);
            } catch (err) {
                console.log(err);
                setError("Failed to load photos.");
            } finally {
                setLoading(false);
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
            <div className="flex items-center justify-center w-full h-screen bg-gray-100">
                <div className="text-xl text-gray-600">Loading gallery...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center w-full h-screen bg-gray-100">
                <div className="text-xl text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-2">Photo Gallery</h1>
                <p className="text-gray-600 text-sm sm:text-base">Explore your retro camera captures</p>
            </header>
            {photos.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 text-lg">No photos available. Start capturing!</p>
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
            <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs">
                © 2025 Retro Camera App
            </footer>
        </div>
    );
};

export default Gallery;
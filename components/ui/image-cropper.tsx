"use client";

import { useState, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageCropperProps {
    isOpen: boolean;
    imageFile: File;
    onClose: () => void;
    onCropComplete: (croppedImageDataUrl: string) => void;
}

export function ImageCropper({ isOpen, imageFile, onClose, onCropComplete }: ImageCropperProps) {
    const [imageSrc, setImageSrc] = useState<string>("");
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageSrc(e.target?.result as string);
            };
            reader.readAsDataURL(imageFile);
        }
    }, [imageFile]);

    const handleCrop = () => {
        if (!canvasRef.current || !imageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = imageRef.current;
        const outputSize = 400; // Higher resolution output

        canvas.width = outputSize;
        canvas.height = outputSize;

        // Clear canvas
        ctx.clearRect(0, 0, outputSize, outputSize);

        // Save context state
        ctx.save();

        // Move to center
        ctx.translate(outputSize / 2, outputSize / 2);

        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

        // Calculate scale to cover the square (like CSS object-cover)
        const imgAspect = img.naturalWidth / img.naturalHeight;
        let baseScale;

        if (imgAspect > 1) {
            // Landscape: scale based on height to cover
            baseScale = outputSize / img.naturalHeight;
        } else {
            // Portrait or square: scale based on width to cover
            baseScale = outputSize / img.naturalWidth;
        }

        // Apply both base scale (to cover) and user's scale adjustment
        const finalScale = baseScale * scale;
        const drawWidth = img.naturalWidth * finalScale;
        const drawHeight = img.naturalHeight * finalScale;

        // Draw image centered and cropped to square
        ctx.drawImage(
            img,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );

        // Restore context
        ctx.restore();

        // Get cropped image as data URL
        const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
        onCropComplete(croppedDataUrl);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-slate-200">
                        <div>
                            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                Crop Image
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                Adjust to fit the square frame
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    {/* Crop Area */}
                    <div className="p-4 bg-slate-50">
                        <div className="relative mx-auto" style={{ width: 250, height: 250 }}>
                            {/* Preview Container with Circular Mask */}
                            <div className="relative w-full h-full rounded-2xl overflow-hidden border-3 border-white shadow-xl bg-slate-100">
                                {imageSrc && (
                                    <img
                                        ref={imageRef}
                                        src={imageSrc}
                                        alt="Crop preview"
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{
                                            transform: `scale(${scale}) rotate(${rotation}deg)`,
                                            transformOrigin: "center",
                                        }}
                                    />
                                )}
                            </div>

                            {/* Grid Overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="border border-white/20" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-3 space-y-3 border-t border-slate-200">
                        {/* Zoom Control */}
                        <div>
                            <label className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    Zoom
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {Math.round(scale * 100)}%
                                </span>
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.1"
                                    value={scale}
                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
                                        [&::-webkit-slider-thumb]:appearance-none
                                        [&::-webkit-slider-thumb]:w-4
                                        [&::-webkit-slider-thumb]:h-4
                                        [&::-webkit-slider-thumb]:bg-emerald-600
                                        [&::-webkit-slider-thumb]:rounded-full
                                        [&::-webkit-slider-thumb]:cursor-pointer
                                        [&::-webkit-slider-thumb]:shadow-lg
                                        hover:[&::-webkit-slider-thumb]:bg-emerald-700"
                                />
                                <button
                                    onClick={() => setScale(Math.min(3, scale + 0.1))}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        {/* Rotation Control */}
                        <div>
                            <label className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    Rotation
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {rotation}°
                                </span>
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setRotation((rotation - 90 + 360) % 360)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    <RotateCw className="w-3.5 h-3.5 text-slate-600 transform -scale-x-100" />
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    step="1"
                                    value={rotation}
                                    onChange={(e) => setRotation(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
                                        [&::-webkit-slider-thumb]:appearance-none
                                        [&::-webkit-slider-thumb]:w-4
                                        [&::-webkit-slider-thumb]:h-4
                                        [&::-webkit-slider-thumb]:bg-emerald-600
                                        [&::-webkit-slider-thumb]:rounded-full
                                        [&::-webkit-slider-thumb]:cursor-pointer
                                        [&::-webkit-slider-thumb]:shadow-lg
                                        hover:[&::-webkit-slider-thumb]:bg-emerald-700"
                                />
                                <button
                                    onClick={() => setRotation((rotation + 90) % 360)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCrop}
                                className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Check className="w-3 h-3" />
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* Hidden canvas for processing */}
                    <canvas ref={canvasRef} className="hidden" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

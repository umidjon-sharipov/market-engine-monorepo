'use client'

import { Upload } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react'

const ImageUpload = ({ setImagesLength, index }: { setImagesLength: React.Dispatch<React.SetStateAction<number>>, index: number }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const isFirstRun = useRef(true)
    const hasImage = useRef(false)

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false
            return
        }

        if (imagePreview && !hasImage.current) {
            setImagesLength(prev => prev + 1)
            hasImage.current = true
        } else if (!imagePreview && hasImage.current) {
            setImagesLength(prev => prev - 1)
            hasImage.current = false
        }
    }, [imagePreview, setImagesLength])

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleButtonClick = () => {
        if (!imagePreview) {
            fileInputRef.current?.click();
        }
    };

    return (
        <button
            type='button'
            onClick={handleButtonClick}
            className="relative cursor-pointer w-20 h-20 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-neutral-300 overflow-hidden"
        >
            {imagePreview ? (
                <img src={imagePreview} alt="Uploaded" className="w-full h-full object-cover" />
            ) : (
                <div className="flex items-center justify-center p-2 w-full h-full">
                    <Upload className="w-14 h-14 text-sky-400 ml-1" />
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                name={`image-${index}`}
                className="hidden"
                onChange={handleImageUpload}
            />
        </button>
    )
}

export default ImageUpload
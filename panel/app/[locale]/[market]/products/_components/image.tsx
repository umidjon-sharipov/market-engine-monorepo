"use client";

import { Upload } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const ImageUpload = ({
  setImagesLength,
  index,
  defaultImage = "",
}: {
  setImagesLength: React.Dispatch<React.SetStateAction<number>>;
  index: number;
  defaultImage?: string;
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultImage || null,
  );
  const isFirstRun = useRef(true);
  const hasImage = useRef(Boolean(defaultImage));

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (imagePreview && !hasImage.current) {
      setImagesLength((previous) => previous + 1);
      hasImage.current = true;
    }
  }, [imagePreview, setImagesLength]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <label className="relative block h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 text-neutral-300 transition hover:bg-white/10">
      {imagePreview ? (
        <img src={imagePreview} alt="Product image preview" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center p-2">
          <Upload className="h-14 w-14 text-sky-400" />
        </span>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        name={`image-${index}`}
        className="sr-only"
        onChange={handleImageUpload}
      />
    </label>
  );
};

export default ImageUpload;

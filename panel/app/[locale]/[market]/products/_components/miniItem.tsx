"use client";

import { ImagePlus } from "lucide-react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassInput from "@/components/admin/GlassInput";
import React, { useEffect, useRef, useState } from "react";

const MiniItem = ({
  index,
  cIndex,
  setItemLenght,
  defaultKey = "",
  defaultValue,
  defaultImage = "",
}: {
  index: number;
  cIndex: number;
  setItemLenght: React.Dispatch<React.SetStateAction<number>>;
  defaultKey?: string;
  defaultValue?: number;
  defaultImage?: string;
}) => {
  const [title, setTitle] = useState(defaultKey);
  const [value, setValue] = useState<number | undefined>(defaultValue);
  const [imagePreview, setImagePreview] = useState(defaultImage);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const isFirstRun = useRef(true);
  const hasValue = useRef(Boolean(defaultKey.trim()));
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const currentlyHasValue = title.trim() !== "";
    if (currentlyHasValue && !hasValue.current) {
      setItemLenght((previous) => previous + 1);
      hasValue.current = true;
    } else if (!currentlyHasValue && hasValue.current) {
      setItemLenght((previous) => previous - 1);
      hasValue.current = false;
    }
  }, [setItemLenght, title]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center ${theme === "dark" ? "border-zinc-800 bg-zinc-800/20" : "border-zinc-200 bg-white"}`}
    >
      <div className="flex min-w-0 flex-1 gap-2">
        <GlassInput
          className="w-full"
          name={`title-${cIndex}-${index}`}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
          placeholder="Variant key"
        />
        <GlassInput
          className="w-28"
          name={`value-${cIndex}-${index}`}
          type="number"
          step="any"
          placeholder="Value"
          onChange={(event) => {
            const nextValue = event.target.value;
            setValue(nextValue === "" ? undefined : Number(nextValue));
          }}
          value={value ?? ""}
        />
      </div>
      <input
        type="hidden"
        name={`option-image-url-${cIndex}-${index}`}
        value={imageFile ? "" : defaultImage}
      />
      <label className="relative flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 text-sky-400">
        {imagePreview ? (
          <img src={imagePreview} alt={`${title || "Variant"} preview`} className="h-full w-full object-cover" />
        ) : (
          <ImagePlus size={20} />
        )}
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          name={`option-image-${cIndex}-${index}`}
          onChange={handleImageChange}
        />
      </label>
    </div>
  );
};

export default MiniItem;

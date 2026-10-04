"use client";

import React, { useEffect, useRef, useState } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassInput from "@/components/admin/GlassInput";
import MiniItem from "./miniItem";

type ProductOptionItemValue = {
  key: string;
  value: number;
  image?: string | null;
};

const Item = ({
  cIndex,
  setItemsLenght,
  defaultTitle = "",
  defaultItems = [],
  defaultSearchEnabled = false,
}: {
  cIndex: number;
  setItemsLenght: React.Dispatch<React.SetStateAction<number>>;
  defaultTitle?: string;
  defaultItems?: ProductOptionItemValue[];
  defaultSearchEnabled?: boolean;
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [itemLenght, setItemLenght] = useState(
    Math.max(1, defaultItems.length || 1),
  );
  const [searchEnabled, setSearchEnabled] = useState(defaultSearchEnabled);
  const isFirstRun = useRef(true);
  const hasValue = useRef(Boolean(defaultTitle.trim()));
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const currentlyHasValue = title.trim() !== "";
    if (currentlyHasValue && !hasValue.current) {
      setItemsLenght((previous) => previous + 1);
      hasValue.current = true;
    } else if (!currentlyHasValue && hasValue.current) {
      setItemsLenght((previous) => previous - 1);
      hasValue.current = false;
    }
  }, [setItemsLenght, title]);

  return (
    <div
      className={`flex flex-col gap-4 rounded-3xl border p-4 backdrop-blur-sm ${theme === "dark" ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-gray-50"}`}
    >
      <GlassInput
        onChange={(event) => setTitle(event.target.value)}
        value={title}
        name={`title-${cIndex}`}
        placeholder="Option title"
      />
      <input
        type="hidden"
        name={`searchEnabled-${cIndex}`}
        value={String(searchEnabled)}
      />
      <button
        type="button"
        role="switch"
        aria-checked={searchEnabled}
        onClick={() => setSearchEnabled((enabled) => !enabled)}
        className="flex items-center justify-between gap-3 text-left"
      >
        <span className="text-sm text-neutral-500">
          Qidiruvda foydalanish
        </span>
        <span
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${searchEnabled ? "bg-sky-500" : "bg-zinc-500/50"}`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${searchEnabled ? "left-6" : "left-1"}`}
          />
        </span>
      </button>
      <div className="flex flex-col gap-2">
        {Array.from({ length: itemLenght }, (_, index) => (
          <MiniItem
            key={`${cIndex}-${index}`}
            index={index}
            cIndex={cIndex}
            setItemLenght={setItemLenght}
            defaultKey={defaultItems[index]?.key ?? ""}
            defaultValue={defaultItems[index]?.value}
            defaultImage={defaultItems[index]?.image ?? ""}
          />
        ))}
      </div>
    </div>
  );
};

export default Item;

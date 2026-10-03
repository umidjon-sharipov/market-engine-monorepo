"use client";

import React, { useEffect, useState, useRef } from "react";
import MiniItem from "./miniItem";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassInput from "@/components/admin/GlassInput";

const Item = ({
  cIndex,
  setItemsLenght,
  defaultTitle = "",
  defaultItems = [],
  defaultSearchKeys = [],
}: {
  cIndex: number;
  setItemsLenght: React.Dispatch<React.SetStateAction<number>>;
  defaultTitle?: string;
  defaultItems?: { key: string; value: number }[];
  defaultSearchKeys?: string[];
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [itemLenght, setItemLenght] = useState(
    Math.max(1, defaultItems.length || 1),
  );
  const [searchKeys, setSearchKeys] = useState(defaultSearchKeys);
  const [searchKeyInput, setSearchKeyInput] = useState("");

  const isFirstRun = useRef(true);
  const hasValue = useRef(false);

  const theme = useThemeStore((state) => state.theme);

  const addSearchKey = () => {
    const key = searchKeyInput.trim().toLocaleLowerCase();
    if (key && !searchKeys.includes(key))
      setSearchKeys((prev) => [...prev, key]);
    setSearchKeyInput("");
  };

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const currentlyHasValue = title.trim() !== "";

    if (currentlyHasValue && !hasValue.current) {
      setItemsLenght((prev) => prev + 1);
      hasValue.current = true;
    } else if (!currentlyHasValue && hasValue.current) {
      setItemsLenght((prev) => prev - 1);
      hasValue.current = false;
    }
  }, [title, setItemsLenght]);

  return (
    <div
      className={`p-4 flex flex-col gap-4 backdrop-blur-sm rounded-3xl border ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-gray-50 border-zinc-200"}`}
    >
      <GlassInput
        onChange={(e) => setTitle(e.target.value)}
        value={title}
        name={`title-${cIndex}`}
        placeholder="option title"
      />
      <div className="space-y-2">
        <label
          htmlFor={`search-keys-${cIndex}`}
          className="text-xs font-medium text-neutral-400"
        >
          Search keys
        </label>
        <div className="flex flex-wrap gap-2">
          {searchKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setSearchKeys((prev) => prev.filter((item) => item !== key))
              }
              className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-500"
              aria-label={`${key} kalit so'zini o'chirish`}
            >
              {key} ×
            </button>
          ))}
        </div>
        <input
          id={`search-keys-${cIndex}`}
          type="text"
          value={searchKeyInput}
          onChange={(event) => setSearchKeyInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addSearchKey();
            }
            if (
              event.key === "Backspace" &&
              !searchKeyInput &&
              searchKeys.length
            ) {
              setSearchKeys((prev) => prev.slice(0, -1));
            }
          }}
          onBlur={addSearchKey}
          placeholder="Kalit so'zni yozib Enter bosing"
          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-sky-500 ${theme === "dark" ? "border-zinc-700 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-900"}`}
        />
        <input
          type="hidden"
          name={`searchKeys-${cIndex}`}
          value={JSON.stringify(searchKeys)}
        />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: itemLenght }).map((_, index) => (
          <MiniItem
            key={index}
            index={index}
            cIndex={cIndex}
            setItemLenght={setItemLenght}
            defaultKey={defaultItems[index]?.key ?? ""}
            defaultValue={defaultItems[index]?.value}
          />
        ))}
      </div>
    </div>
  );
};

export default Item;

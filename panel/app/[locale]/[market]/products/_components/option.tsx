"use client";

import React, { useEffect, useRef, useState } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassInput from "@/components/admin/GlassInput";
import Item from "./item";

interface OptionProps {
    cIndex: number;
    setItemsLenght: React.Dispatch<React.SetStateAction<number>>;
    defaultTitle?: string;
    products: { id: string; title: string; quantity: number }[];
    defaultProductIds?: string[];
    defaultIsOptional?: boolean;
    defaultSearchEnabled?: boolean;
    defaultSearchKeys?: string[];
}

const Option = ({
    cIndex,
    setItemsLenght,
    defaultTitle = "",
    products,
    defaultProductIds = [],
    defaultIsOptional = false,
    defaultSearchEnabled = false,
    defaultSearchKeys = [],
}: OptionProps) => {
    const [title, setTitle] = useState(defaultTitle);
    const [optional, setOptional] = useState(defaultIsOptional);
    const [searchEnabled, setSearchEnabled] = useState(defaultSearchEnabled);
    const [searchKeys, setSearchKeys] = useState(defaultSearchKeys);
    const [productIds, setProductIds] = useState<string[]>(
        defaultProductIds.length > 0 ? [...defaultProductIds, ""] : [""]
    );
    const theme = useThemeStore((state) => state.theme);
    const isFilled = useRef(Boolean(defaultTitle.trim()));

    useEffect(() => {
        const currentlyFilled = title.trim().length > 0;
        if (currentlyFilled && !isFilled.current) {
            setItemsLenght((previous) => previous + 1);
        } else if (!currentlyFilled && isFilled.current) {
            setItemsLenght((previous) => Math.max(1, previous - 1));
        }
        isFilled.current = currentlyFilled;
    }, [setItemsLenght, title]);

    const handleSelectProduct = (index: number, productId: string) => {
        setProductIds((prev) => {
            const updated = [...prev];
            updated[index] = productId;

            if (index === updated.length - 1 && productId !== "") {
                updated.push("");
            }
            return updated.filter((id, itemIndex) => !id || updated.indexOf(id) === itemIndex);
        });
    };

    const handleRemoveItem = (index: number) => {
        setProductIds((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.length > 0 ? updated : [""];
        });
    };

    return (
        <div
            className={`flex flex-col gap-4 rounded-3xl border p-4 backdrop-blur-sm ${
                theme === "dark" ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-gray-50"
            }`}
        >
            <GlassInput
                onChange={(event) => setTitle(event.target.value)}
                value={title}
                name={`title-${cIndex}`}
                placeholder="Option title (masalan: O'lcham, Rang)"
            />

            <input
                type="hidden"
                name={`searchEnabled-${cIndex}`}
                value={String(searchEnabled)}
            />
            <input
                type="hidden"
                name={`searchKeys-${cIndex}`}
                value={JSON.stringify(searchKeys)}
            />
            <button
                type="button"
                role="switch"
                aria-checked={searchEnabled}
                onClick={() => setSearchEnabled((enabled) => !enabled)}
                className="flex items-center justify-between gap-3 text-left"
            >
                <span className="text-sm text-neutral-500">Qidiruvda ishlatish</span>
                <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${searchEnabled ? "bg-sky-500" : "bg-zinc-500/50"}`}>
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${searchEnabled ? "left-6" : "left-1"}`} />
                </span>
            </button>
            {searchEnabled && (
                <GlassInput
                    value={searchKeys.join(", ")}
                    onChange={(event) => setSearchKeys(
                        event.target.value.split(",").map((key) => key.trim()).filter(Boolean)
                    )}
                    placeholder="Qidiruv kalitlari (vergul bilan)"
                />
            )}
            
            <input
                type="hidden"
                name={`optional-${cIndex}`}
                value={String(optional)}
            />

            <button
                type="button"
                role="switch"
                aria-checked={optional}
                onClick={() => setOptional((enabled) => !enabled)}
                className="flex items-center justify-between gap-3 text-left"
            >
                <span className="text-sm text-neutral-500">Is Optional</span>
                <span
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                        optional ? "bg-sky-500" : "bg-zinc-500/50"
                    }`}
                >
                    <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                            optional ? "left-6" : "left-1"
                        }`}
                    />
                </span>
            </button>

            <div className="flex flex-col gap-2">
                {productIds.map((pId, index) => (
                    <Item
                        key={`${cIndex}-${index}`}
                        index={index}
                        defaultProductId={pId}
                        products={products.filter((product) =>
                            product.id === pId || !productIds.includes(product.id)
                        )}
                        onSelectProduct={handleSelectProduct}
                        onRemove={handleRemoveItem}
                    />
                ))}
            </div>

            {productIds
                .filter((pId) => pId.trim() !== "")
                .map((pId, index) => (
                    <input
                        key={pId}
                        type="hidden"
                        name={`includeProductId-${cIndex}-${index}`}
                        value={pId}
                    />
                ))}
        </div>
    );
};

export default Option;
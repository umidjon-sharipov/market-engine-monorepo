"use client";

import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassModal from "@/components/admin/GlassModal";
import React, { useState } from "react";
import GlassButton from "@/components/admin/GlassButton";
import { Trash2 } from "lucide-react";

interface ItemProps {
    index: number;
    defaultProductId?: string;
    products: { id: string; title: string }[];
    onSelectProduct: (index: number, productId: string) => void;
    onRemove: (index: number) => void;
}

const Item = ({
    index,
    defaultProductId = "",
    products,
    onSelectProduct,
    onRemove,
}: ItemProps) => {
    const theme = useThemeStore((state) => state.theme);
    const [selectedProductId, setSelectedProductId] = useState<string>(defaultProductId);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selectedProduct = products.find((p) => p.id === selectedProductId);
    const matchingProducts = products.filter((product) =>
        product.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    );

    return (
        <div
            className={ `flex items-center justify-between gap-3 rounded-2xl border p-3 ${theme === "dark" ? "border-zinc-800 bg-zinc-800/20" : "border-zinc-200 bg-white"
                }` }
        >
            <button
                type="button"
                className="flex flex-1 items-center justify-between text-left text-sm"
                onClick={ () => setIsModalOpen(true) }
            >
                <span className={ selectedProduct ? (theme === "dark" ? "text-white" : "text-zinc-900") : "text-neutral-400" }>
                    { selectedProduct ? selectedProduct.title : "Mahsulotni tanlang..." }
                </span>
                <span className="text-xs text-sky-500 font-mono">
                    { selectedProductId ? `ID: ${selectedProductId}` : "" }
                </span>
            </button>

            <button
                type="button"
                onClick={ () => onRemove(index) }
                className="text-red-400 hover:text-red-300 p-1"
            >
                <Trash2 size={ 16 } />
            </button>

            <GlassModal title="Mahsulotni tanlang" open={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                <div className="p-4 max-h-60 overflow-y-auto flex flex-col gap-2">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Mahsulot qidirish..."
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                    />
                    { matchingProducts.map((product) => (
                        <GlassButton
                            type="button"
                            variant="ghost"
                            className="w-full justify-start text-left"
                            key={ product.id }
                            onClick={ () => {
                                setSelectedProductId(product.id);
                                onSelectProduct(index, product.id);
                                setIsModalOpen(false);
                                setSearch("");
                            } }
                        >
                            { product.title }
                        </GlassButton>
                    )) }
                    {matchingProducts.length === 0 && (
                        <p className="py-4 text-center text-sm text-neutral-500">
                            Mos mahsulot topilmadi.
                        </p>
                    )}
                </div>
            </GlassModal>
        </div>
    );
};

export default Item;
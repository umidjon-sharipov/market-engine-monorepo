"use client";

import React, { useCallback, useState, useEffect, Suspense } from "react";
import GlassTable from "@/components/admin/GlassTable";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { useParams } from "next/navigation";
import { MousePointerClick } from "lucide-react";
import { API_URL } from '@/lib/api';

interface Warehouse {
    id: string;
    title: string;
    lat: string;
    lng: string;
    marketId: string;
    [key: string]: unknown;
}

function WarehousesContent({ setWarehouseId, warehouseId }: { setWarehouseId: React.Dispatch<React.SetStateAction<string>>, warehouseId: string }) {
    const token = useTokenStore((state) => state.getActiveToken()) ?? "";
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState("");
    const params = useParams();
    const market = (params?.market as string) || "";

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const fetchData = useCallback(async () => {
        try {
            setError("");
            const res = await fetch(`${API_URL}/warehouses?marketId=${encodeURIComponent(market)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const req = await res.json();

            if (res.ok && Array.isArray(req)) {
                const filteredData = req.filter((item: Warehouse) => item.marketId === market);
                setWarehouses(filteredData);
            } else {
                setError(typeof req.message === "string" ? req.message : "Omborlar yuklanmadi.");
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Omborlar yuklanmadi.");
        } finally {
            setLoading(false);
        }
    }, [market, token]);

    useEffect(() => {
        void Promise.resolve().then(() => fetchData());
    }, [fetchData]);

    return (
        loading ? (
            <div className="text-center py-12 text-gray-500 text-lg">Loading...</div>
        ) : error ? (
            <div role="alert" className="text-center py-12 text-rose-400">{error}</div>
        ) : warehouses.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-base bg-white/5 rounded-2xl border border-white/10">
                Bu marketId uchun chegirmalar topilmadi.
            </div>
        ) : (
            <GlassTable
                columns={[
                    { key: "title", label: "Ombor Nomi" },
                    { key: "lat", label: "Latitude" },
                    { key: "lng", label: "Longitude" },
                ]}
                data={warehouses.map((warehouse) => ({
                    ...warehouse,
                    lat: warehouse.lat,
                    lng: warehouse.lng,
                })) as Record<string, unknown>[]}
                actions={(row) => {
                    const warehouse = row as unknown as Warehouse;
                    const originalWarehouse = warehouses.find(d => d.title === warehouse.title && d.marketId === market) || warehouse;

                    return (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setWarehouseId(originalWarehouse.id)}
                                className={`p-2 ${warehouseId === originalWarehouse.id ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-white/10 text-white hover:bg-white/20'} rounded-xl duration-300`}
                                title="Select"
                            >
                                <MousePointerClick className="w-4 h-4" />
                            </button>
                        </div>
                    );
                }}
            />
        )
    );
}

export default function WarehousePage({ setWarehouseId, warehouseId }: { setWarehouseId: React.Dispatch<React.SetStateAction<string>>, warehouseId: string }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-white">Loading...</div>}>
            <WarehousesContent setWarehouseId={setWarehouseId} warehouseId={warehouseId} />
        </Suspense>
    );
}
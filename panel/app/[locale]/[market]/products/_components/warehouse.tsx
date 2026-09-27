"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassTable from "@/components/admin/GlassTable";
import GlassModal from "@/components/admin/GlassModal";
import GlassButton from "@/components/admin/GlassButton";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { useNotification } from "@/components/Notification";
import { useParams } from "next/navigation";
import GlassInput from "@/components/admin/GlassInput";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Edit3, Trash2, Plus, Calendar, LayoutGrid, Table as TableIcon, Upload, Image as ImageIcon, MousePointerClick } from "lucide-react";
import Map from '@/app/_components/Map'
import { API_URL } from '@/lib/api';
import { useRoleStore } from "@/app/_store/useRoleStore";

interface Warehouse {
    id: string;
    title: string;
    lat: string;
    lng: string;
    marketId: string;
    [key: string]: unknown;
}

function WarehousesContent({ setWarehouseId, warehouseId }: { setWarehouseId: React.Dispatch<React.SetStateAction<string>>, warehouseId: string }) {
    const notify = useNotification();
    const [loading, setLoading] = useState<boolean>(true);
    const params = useParams();
    const market = (params?.market as string) || "";

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/warehouses`);
            const req = await res.json();

            if (res.ok && Array.isArray(req)) {
                const filteredData = req.filter((item: Warehouse) => item.marketId === market);
                setWarehouses(filteredData);
            }
        } catch (err) {
            console.error("Xatolik:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [market]);

    return (
        loading ? (
            <div className="text-center py-12 text-gray-500 text-lg">Loading...</div>
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
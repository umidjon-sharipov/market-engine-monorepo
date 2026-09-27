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
import { Edit3, Trash2, Plus, Calendar, LayoutGrid, Table as TableIcon, Upload, Image as ImageIcon } from "lucide-react";
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

function WarehousesContent() {
    const notify = useNotification();
    const role = useRoleStore(state => state.role)
    const [loading, setLoading] = useState<boolean>(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"map" | "table">("map");
    const [deleteModal, setDeleteModal] = useState<string | null>(null);
    const [openMap, setOpenMap] = useState(false)

    const {accounts, activeEmail, addOrUpdateAccount, getActiveToken, removeAccount, switchAccount} = useTokenStore((state) => state);
    const token = getActiveToken()
    const dark = useThemeStore((state) => state.theme) === "dark";
    const params = useParams();
    const market = (params?.market as string) || "";

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [warehouseountTitle, setWarehouseTitle] = useState("");
    const [warehouseountPercentage, setWarehousePercentage] = useState("");
    const [mapLat, setMapLat] = useState<number | string>(0);
    const [mapLng, setMapLng] = useState<number | string>(0);

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

    const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const url = editId
                ? `${API_URL}/warehouses/${editId}`
                : `${API_URL}/warehouses`;

            const method = editId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: warehouseountTitle,
                    lat: mapLat ? mapLat : 0,
                    lng: mapLng ? mapLng : 0,
                    marketId: market,
                    role: role
                }),
            });

            const req = await res.json();

            if (res.ok) {
                setIsOpen(false);
                setEditId(null);
                notify.show(
                    editId ? "Ombor yangilandi" : "Yangi ombor qo'shildi",
                    "success",
                    dark ? "dark" : "light"
                );
                resetForm();
                fetchData();
            } else {
                notify.show(req.message || "Nimadir xato ketdi", "error", dark ? "dark" : "light");
            }
        } catch (err) {
            notify.show("Serverga ulanishda xatolik", "error", dark ? "dark" : "light");
            console.log(err);
        }
    };

    const handleDeleteWarehouse = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/warehouses/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ "marketId": market, "role": role })
            });

            if (res.ok) {
                notify.show("Ombor o'chirildi", "success", dark ? "dark" : "light");
                fetchData();
            } else {
                notify.show("O'chirishda xatolik yuz berdi", "error", dark ? "dark" : "light");
            }
        } catch (err) {
            console.log(err);
            notify.show("Serverda xatolik", "error", dark ? "dark" : "light");
        }
    };

    const handleOpenEdit = (warehouse: Warehouse) => {
        setEditId(warehouse.id);
        setWarehouseTitle(warehouse.title);
        setMapLat(warehouse.lat || 0);
        setMapLng(warehouse.lng || 0);
        setIsOpen(true);
    };

    const handleOpenCreate = () => {
        setEditId(null);
        resetForm();
        setIsOpen(true);
    };

    const resetForm = () => {
        setWarehouseTitle("");
        setWarehousePercentage("");
        setMapLat(0);
        setMapLng(0);
    };

    return (
        <div className="w-full max-w-[1500px] mx-auto p-8">
            <div className="mb-8 border-l-4 border-sky-500 pl-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">Warehouses</h1>
                    <p className="text-sm text-neutral-400 mt-1">Do'kon omborlarini nazorat qilish</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode("map")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "map" ? "bg-sky-500 text-white shadow" : "text-neutral-400 hover:text-white"
                                }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" /> Warehouse
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "table" ? "bg-sky-500 text-white shadow" : "text-neutral-400 hover:text-white"
                                }`}
                        >
                            <TableIcon className="w-3.5 h-3.5" /> Table
                        </button>
                    </div>

                    <GlassButton onClick={handleOpenCreate}>
                        <Plus className="w-4 h-4 mr-2 inline" /> Create Warehouse
                    </GlassButton>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500 text-lg">Loading...</div>
            ) : warehouses.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-base bg-white/5 rounded-2xl border border-white/10">
                    Bu marketId uchun omborlar topilmadi.
                </div>
            ) : (
                viewMode === 'map' ? (
                    <Map
                        isDarkMode={dark}
                        onLocationSelect={(lat, lng) => {
                            console.log("Tanlangan koordinatalar:", lat, lng);
                            setMapLat(lat)
                            setMapLng(lng)
                        }}
                    />
                ) :
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
                            const originalDisc = warehouses.find(d => d.title === warehouse.title && d.marketId === market) || warehouse;

                            return (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(originalDisc as Warehouse)}
                                        className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition"
                                        title="Tahrirlash"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal(originalDisc.id)}
                                        className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                                        title="O'chirish"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        }}
                    />
            )}

            <GlassModal
                title={editId ? "Warehouse update" : "Create Warehouse"}
                open={isOpen}
                onClose={() => setIsOpen(false)}
            >
                <form className="space-y-4 w-full pb-10" onSubmit={handleSubmitForm}>
                    <GlassInput
                        label="Title"
                        placeholder="title..."
                        value={warehouseountTitle}
                        onChange={(e) => setWarehouseTitle(e.target.value)}
                        required
                    />

                    <GlassButton type="button" onClick={() => setOpenMap(true)} className="w-full">
                        Xaritadan joyni tanlash
                    </GlassButton>

                    <div className="z-[999] flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 pt-0 backdrop-blur-sm rounded-b-[28px]">
                        <button
                            onClick={() => setIsOpen(false)}
                            type="button"
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <GlassButton
                            type="submit"
                            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20"
                        >
                            {editId ? "Update" : "Save"}
                        </GlassButton>
                    </div>
                </form>
            </GlassModal>

            <GlassModal title="Delete warehouseount" open={!!deleteModal} onClose={() => setDeleteModal(null)}>
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Haqiqatan ham bu omborni o'chirib yubormoqchimisiz?</p>

                    <div className="z-[999] flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 pt-0 backdrop-blur-sm rounded-b-[28px]">
                        <button
                            onClick={() => setDeleteModal(null)}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (deleteModal) {
                                    handleDeleteWarehouse(deleteModal);
                                    setDeleteModal(null);
                                }
                            }}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </GlassModal>


            <GlassModal size='full' open={openMap} onClose={() => setOpenMap(false)} title='Xaritadan belgilang'>
                <Map
                    isDarkMode={dark}
                    onLocationSelect={(lat, lng) => {
                        console.log("Tanlangan koordinatalar:", lat, lng);
                        setMapLat(lat)
                        setMapLng(lng)
                    }} />

                <GlassButton
                    onClick={() => setOpenMap(false)}
                    className={`w-full mt-4 ${mapLng === 0 || mapLat === 0 ? '!bg-gray-200 !text-gray-400 cursor-not-allowed' : ''}`}
                    disabled={mapLng === 0 || mapLat === 0}
                >
                    Tanlandi
                </GlassButton>
            </GlassModal>
        </div>
    );
}

export default function WarehousePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-white">Loading...</div>}>
            <WarehousesContent />
        </Suspense>
    );
}
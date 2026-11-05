"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    ArrowRightLeft,
    Boxes,
    Check,
    ChartNoAxesCombined,
    CircleAlert,
    MapPin,
    PackagePlus,
    Plus,
    RefreshCw,
    Trash2,
    Warehouse as WarehouseIcon,
    X,
} from "lucide-react";
import LocationMap from "@/app/_components/Map";
import { useThemeStore } from "@/app/_store/useThemeStore";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { API_URL } from "@/lib/api";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import GlassModal from "@/components/admin/GlassModal";
import GlassInput from "@/components/admin/GlassInput";

type Warehouse = {
    id: string;
    title: string;
    code: string | null;
    address: string | null;
    lat: string;
    lng: string;
    marketId: string;
};

type WarehouseZoneType =
    | "RECEIVING"
    | "STORAGE"
    | "STAGING"
    | "PACKING"
    | "DISPATCH"
    | "RETURNS"
    | "QUARANTINE";
type WarehouseBinStatus = "active" | "blocked" | "maintenance";
type WarehouseZone = {
    id: string;
    warehouseId: string;
    code: string;
    title: string;
    type: WarehouseZoneType;
    aisles: WarehouseAisle[];
};
type WarehouseAisle = {
    id: string;
    zoneId: string;
    title: string | null;
    racks: WarehouseRack[];
};
type WarehouseRack = {
    id: string;
    aisleId: string;
    rackNumber: string | null;
    shelfs: WarehouseShelf[];
};
type WarehouseShelf = {
    id: string;
    rackId: string;
    shelfNumber: string | null;
    bins: StorageBin[];
};
type StorageBin = {
    id: string;
    shelfId?: string;
    code: string;
    title: string | null;
    capacity?: number | null;
    location_type?: string | null;
    status?: WarehouseBinStatus;
    allowed_product_types?: string | null;
    // Search APIs may include the computed legacy zone shortcut as well as the new relations.
    zone?: Pick<WarehouseZone, "id" | "code" | "title" | "type">;
    shelf?: WarehouseShelf & {
        rack?: WarehouseRack & {
            aisle?: WarehouseAisle & {
                zone?: Pick<WarehouseZone, "id" | "code" | "title" | "type">;
            };
        };
    };
};
type LocationEntityKind = "zone" | "aisle" | "rack" | "shelf" | "bin";
type LocationEntity = WarehouseZone | WarehouseAisle | WarehouseRack | WarehouseShelf | StorageBin;
type LocationModalState = {
    mode: "create" | "edit";
    kind: LocationEntityKind;
    entity?: LocationEntity;
    parentId?: string;
};
type DeleteTarget = {
    kind: "warehouse" | LocationEntityKind;
    id: string;
    label: string;
};

const zoneTypeLabels: Record<WarehouseZoneType, string> = {
    RECEIVING: "Qabul qilish",
    STORAGE: "Saqlash",
    STAGING: "Oraliq zona",
    PACKING: "Qadoqlash",
    DISPATCH: "Jo'natish",
    RETURNS: "Qaytarilganlar",
    QUARANTINE: "Karantin",
};
const binStatusLabels: Record<WarehouseBinStatus, string> = {
    active: "Faol",
    blocked: "Bloklangan",
    maintenance: "Texnik xizmat",
};

function locationKindLabel(kind: "warehouse" | LocationEntityKind): string {
    const labels: Record<"warehouse" | LocationEntityKind, string> = {
        warehouse: "Ombor",
        zone: "Zona",
        aisle: "Yo'lak",
        rack: "Stellaj",
        shelf: "Raf",
        bin: "Yacheyka",
    };
    return labels[kind];
}

type InventoryRow = {
    id: string;
    lotNumber: string;
    expiresAt: string | null;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    product: {
        id: string;
        title: string;
        images: string[];
        price: number;
        uom: Product["uom"];
    };
    bin: StorageBin & {
        shelf?: WarehouseShelf & {
            rack?: WarehouseRack & {
                aisle?: WarehouseAisle & {
                    zone?: Pick<WarehouseZone, "id" | "code" | "title" | "type">;
                };
            };
        };
        zone?: Pick<WarehouseZone, "id" | "code" | "title" | "type">;
    };
};

type Product = {
    id: string;
    title: string;
    marketId: string;
    uom: "PCS" | "KG" | "LITRE" | "METER";
};
type InventoryProduct = {
    id: string;
    productId: string;
    lotNumber: string;
    quantity: number;
    availableQuantity: number;
    product: Product;
};
type Discount = { id: string; title: string; marketId: string; percentage: number };
type Movement = {
    id: string;
    type: "INBOUND" | "OUTBOUND" | "TRANSFER" | "ADJUSTMENT";
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    quantity: number;
    lotNumber?: string | null;
    expiresAt?: string | null;
    note: string | null;
    createdAt: string;
    product: { id: string; title: string; uom: Product["uom"] };
    fromWarehouse?: { id: string; title: string } | null;
    fromBin?: { id: string; code: string } | null;
    toWarehouse?: { id: string; title: string } | null;
    toBin?: { id: string; code: string } | null;
};

type MovementType = Movement["type"];
type MovementStatus = Movement["status"];
type Tab = "locations" | "inventory" | "movements" | "analytics";

const movementLabels: Record<MovementType, string> = {
    INBOUND: "Kirim",
    OUTBOUND: "Chiqim",
    TRANSFER: "Ko'chirish",
    ADJUSTMENT: "Inventarizatsiya",
};

const statusLabels: Record<MovementStatus, string> = {
    PENDING: "Kutilmoqda",
    COMPLETED: "Yakunlandi",
    CANCELLED: "Bekor qilindi",
};

const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const inputClass =
    "w-full rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-sky-500";
const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10 disabled:opacity-50";

async function apiRequest<T>(
    path: string,
    token: string,
    init: RequestInit = {},
): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(init.body ? { "Content-Type": "application/json" } : {}),
            ...init.headers,
        },
    });
    const result: unknown = await response.json();
    if (!response.ok) {
        const message =
            result && typeof result === "object" && "message" in result
                ? String(result.message)
                : "So'rov bajarilmadi.";
        throw new Error(message);
    }
    return result as T;
}

export default function WarehouseManagement() {
    const { market: marketParam } = useParams<{ market: string }>();
    const marketId = marketParam ?? "";
    const searchParams = useSearchParams();
    const router = useRouter();
    const pinnedWarehouseId = searchParams.get("warehouseId") ?? "";
    const dark = useThemeStore((state) => state.theme === "dark");
    const token = useTokenStore((state) => state.getActiveToken()) ?? "";

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [productChoices, setProductChoices] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [binInventoryChoices, setBinInventoryChoices] = useState<InventoryProduct[]>([]);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [zones, setZones] = useState<WarehouseZone[]>([]);
    const [inventory, setInventory] = useState<InventoryRow[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [tab, setTab] = useState<Tab>("locations");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [warehouseFormOpen, setWarehouseFormOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [warehouseTitle, setWarehouseTitle] = useState("");
    const [warehouseCode, setWarehouseCode] = useState("");
    const [warehouseAddress, setWarehouseAddress] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [mapOpen, setMapOpen] = useState(false);

    const [locationModal, setLocationModal] = useState<LocationModalState | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [locationCode, setLocationCode] = useState("");
    const [locationTitle, setLocationTitle] = useState("");
    const [locationParentId, setLocationParentId] = useState("");
    const [locationZoneType, setLocationZoneType] = useState<WarehouseZoneType>("STORAGE");
    const [binCapacity, setBinCapacity] = useState("");
    const [binLocationType, setBinLocationType] = useState("");
    const [binStatus, setBinStatus] = useState<WarehouseBinStatus>("active");
    const [binAllowedProductTypes, setBinAllowedProductTypes] = useState("");

    const [movementType, setMovementType] = useState<MovementType>("INBOUND");
    const [movementProductId, setMovementProductId] = useState("");
    const [movementQuantity, setMovementQuantity] = useState("1");
    const [movementLotNumber, setMovementLotNumber] = useState("");
    const [movementExpiresAt, setMovementExpiresAt] = useState("");
    const [movementDiscountId, setMovementDiscountId] = useState("");
    const [sourceWarehouseId, setSourceWarehouseId] = useState("");
    const [sourceBinId, setSourceBinId] = useState("");
    const [targetWarehouseId, setTargetWarehouseId] = useState("");
    const [targetBinId, setTargetBinId] = useState("");
    const [movementNote, setMovementNote] = useState("");
    const [movementTypeFilter, setMovementTypeFilter] = useState("");
    const [movementStatusFilter, setMovementStatusFilter] = useState("");

    const selectedWarehouse = warehouses.find(
        (warehouse) => warehouse.id === selectedWarehouseId,
    );
    const selectedProduct = productChoices.find((product) => product.id === movementProductId);
    const pinnedWarehouse = warehouses.find((warehouse) => warehouse.id === pinnedWarehouseId);
    const inventoryByBin = useMemo(() => {
        const quantities = new globalThis.Map<string, number>();
        inventory.forEach((row) =>
            quantities.set(
                row.bin.id,
                (quantities.get(row.bin.id) ?? 0) + row.quantity,
            ),
        );
        return quantities;
    }, [inventory]);
    const inventoryAnalytics = useMemo(() => {
        const grouped = new Map<string, number>();
        inventory.forEach((row) => grouped.set(row.product.title, (grouped.get(row.product.title) ?? 0) + row.quantity));
        return [...grouped.entries()]
            .map(([title, quantity]) => ({ title, quantity }))
            .sort((left, right) => right.quantity - left.quantity)
            .slice(0, 10);
    }, [inventory]);
    const movementAnalytics = useMemo(
        () =>
            (["INBOUND", "OUTBOUND", "TRANSFER", "ADJUSTMENT"] as MovementType[]).map(
                (type) => ({
                    type: movementLabels[type],
                    quantity: movements
                        .filter((movement) => movement.type === type)
                        .reduce((sum, movement) => sum + movement.quantity, 0),
                }),
            ),
        [movements],
    );
    const loadMainData = useCallback(async () => {
        if (!isUuid(marketId) || !token) return;
        setError("");
        try {
            const [warehouseRows, discountRows] = await Promise.all([
                apiRequest<Warehouse[]>(
                    `/warehouses?marketId=${encodeURIComponent(marketId)}`,
                    token,
                ),
                apiRequest<Discount[]>("/discounts", token),
            ]);
            setWarehouses(warehouseRows);
            setDiscounts(discountRows.filter((discount) => discount.marketId === marketId));
            setSelectedWarehouseId((selected) =>
                pinnedWarehouseId && warehouseRows.some((warehouse) => warehouse.id === pinnedWarehouseId)
                    ? pinnedWarehouseId
                    : warehouseRows.some((warehouse) => warehouse.id === selected)
                        ? selected
                        : (warehouseRows[0]?.id ?? ""),
            );
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Ma'lumotlar yuklanmadi.");
        } finally {
            setLoading(false);
        }
    }, [marketId, pinnedWarehouseId, token]);

    const loadWarehouseData = useCallback(async () => {
        if (!selectedWarehouseId || !token) {
            setZones([]);
            setInventory([]);
            return;
        }
        try {
            const [zoneRows, inventoryRows] = await Promise.all([
                apiRequest<WarehouseZone[]>(
                    `/warehouses/${selectedWarehouseId}/zones`,
                    token,
                ),
                apiRequest<InventoryRow[]>(
                    `/warehouses/${selectedWarehouseId}/inventory`,
                    token,
                ),
            ]);
            setZones(zoneRows);
            setInventory(inventoryRows);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Ombor ma'lumotlari yuklanmadi.");
        }
    }, [selectedWarehouseId, token]);

    const loadMovements = useCallback(async () => {
        if (!isUuid(marketId) || !token) return;
        const params = new URLSearchParams({ marketId });
        if (movementTypeFilter) params.set("type", movementTypeFilter);
        if (movementStatusFilter) params.set("status", movementStatusFilter);
        try {
            setMovements(
                await apiRequest<Movement[]>(`/stock-movements?${params}`, token),
            );
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Harakatlar yuklanmadi.");
        }
    }, [marketId, movementStatusFilter, movementTypeFilter, token]);

    useEffect(() => {
        if (!isUuid(marketId) || !token) {
            return;
        }
        let active = true;
        Promise.all([
            apiRequest<Warehouse[]>(
                `/warehouses?marketId=${encodeURIComponent(marketId)}`,
                token,
            ),
            apiRequest<Discount[]>("/discounts", token),
        ])
            .then(([warehouseRows, discountRows]) => {
                if (!active) return;
                setWarehouses(warehouseRows);
                setDiscounts(discountRows.filter((discount) => discount.marketId === marketId));
                setSelectedWarehouseId((selected) =>
                    pinnedWarehouseId && warehouseRows.some((warehouse) => warehouse.id === pinnedWarehouseId)
                        ? pinnedWarehouseId
                        : warehouseRows.some((warehouse) => warehouse.id === selected)
                            ? selected
                            : (warehouseRows[0]?.id ?? ""),
                );
                setError("");
            })
            .catch((cause: unknown) => {
                if (active) setError(cause instanceof Error ? cause.message : "Ma'lumotlar yuklanmadi.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [marketId, pinnedWarehouseId, token]);

    useEffect(() => {
        if (!marketId || !token || !isUuid(marketId)) return;
        let active = true;
        const timer = window.setTimeout(() => {
            setProductChoices([]);
            setBinInventoryChoices([]);
            const inventorySource =
                movementType === "OUTBOUND" || movementType === "TRANSFER"
                    ? { warehouseId: sourceWarehouseId, binId: sourceBinId }
                    : movementType === "ADJUSTMENT"
                        ? { warehouseId: targetWarehouseId, binId: targetBinId }
                        : null;
            const query = new URLSearchParams({
                marketId,
                search: productSearch,
                page: "1",
                limit: "20",
            });
            const request = inventorySource?.warehouseId && inventorySource.binId
                ? apiRequest<{ data: InventoryProduct[] }>(
                    `/warehouses/${inventorySource.warehouseId}/bins/${inventorySource.binId}/inventory?${new URLSearchParams({ search: productSearch, page: "1", limit: "20" })}`,
                    token,
                ).then((response) => {
                    if (active) {
                        setBinInventoryChoices(response.data);
                        setProductChoices(
                            [...new Map(
                                response.data
                                    .filter((row) => movementType !== "OUTBOUND" || row.availableQuantity > 0)
                                    .map((row) => [row.productId, row.product]),
                            ).values()],
                        );
                    }
                })
                : movementType === "INBOUND"
                    ? apiRequest<{ data: Product[] }>(`/products/search?${query}`, token).then((response) => {
                        if (active) {
                            setBinInventoryChoices([]);
                            setProductChoices(response.data);
                        }
                    })
                    : Promise.resolve();
            void request.catch((cause: unknown) => {
                if (active) setError(cause instanceof Error ? cause.message : "Mahsulotlar qidirilmadi.");
            });
        }, 250);
        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [
        marketId,
        movementType,
        productSearch,
        sourceBinId,
        sourceWarehouseId,
        targetBinId,
        targetWarehouseId,
        token,
    ]);

    useEffect(() => {
        if (!selectedWarehouseId || !token || !isUuid(marketId)) return;
        let active = true;
        Promise.all([
            apiRequest<WarehouseZone[]>(
                `/warehouses/${selectedWarehouseId}/zones`,
                token,
            ),
            apiRequest<InventoryRow[]>(
                `/warehouses/${selectedWarehouseId}/inventory`,
                token,
            ),
        ])
            .then(([zoneRows, inventoryRows]) => {
                if (!active) return;
                setZones(zoneRows);
                setInventory(inventoryRows);
            })
            .catch((cause: unknown) => {
                if (active) setError(cause instanceof Error ? cause.message : "Ombor ma'lumotlari yuklanmadi.");
            });
        return () => {
            active = false;
        };
    }, [marketId, selectedWarehouseId, token]);

    useEffect(() => {
        if (!selectedWarehouseId) return;
        const refreshTimer = window.setInterval(() => {
            void loadWarehouseData();
        }, 15000);
        return () => window.clearInterval(refreshTimer);
    }, [loadWarehouseData, selectedWarehouseId]);

    useEffect(() => {
        if (!marketId || !token) return;
        let active = true;
        const params = new URLSearchParams({ marketId });
        if (movementTypeFilter) params.set("type", movementTypeFilter);
        if (movementStatusFilter) params.set("status", movementStatusFilter);
        apiRequest<Movement[]>(`/stock-movements?${params}`, token)
            .then((rows) => {
                if (active) setMovements(rows);
            })
            .catch((cause: unknown) => {
                if (active) setError(cause instanceof Error ? cause.message : "Harakatlar yuklanmadi.");
            });
        return () => {
            active = false;
        };
    }, [marketId, movementStatusFilter, movementTypeFilter, token]);

    useEffect(() => {
        if (notice) {
            const timer = window.setTimeout(() => setNotice(""), 3500);
            return () => window.clearTimeout(timer);
        }
    }, [notice]);

    const notifyError = (cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Amalni bajarib bo'lmadi.");
        setNotice("");
    };

    const openCreateWarehouse = () => {
        setEditingWarehouse(null);
        setWarehouseTitle("");
        setWarehouseCode("");
        setWarehouseAddress("");
        setLatitude("");
        setLongitude("");
        setWarehouseFormOpen(true);
    };

    const openEditWarehouse = (warehouse: Warehouse) => {
        setEditingWarehouse(warehouse);
        setWarehouseTitle(warehouse.title);
        setWarehouseCode(warehouse.code ?? "");
        setWarehouseAddress(warehouse.address ?? "");
        setLatitude(warehouse.lat);
        setLongitude(warehouse.lng);
        setWarehouseFormOpen(true);
    };

    const submitWarehouse = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isUuid(marketId)) {
            setError("URL parametrida yaroqli market UUID topilmadi.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const payload = {
                title: warehouseTitle.trim(),
                code: warehouseCode.trim() || undefined,
                address: warehouseAddress.trim() || undefined,
                lat: latitude.trim(),
                lng: longitude.trim(),
                marketId,
            };
            if (editingWarehouse) {
                await apiRequest(
                    `/warehouses/${editingWarehouse.id}`,
                    token,
                    { method: "PATCH", body: JSON.stringify(payload) },
                );
            } else {
                await apiRequest("/warehouses", token, {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }
            setWarehouseFormOpen(false);
            setNotice(editingWarehouse ? "Ombor yangilandi." : "Ombor yaratildi.");
            await loadMainData();
        } catch (cause) {
            notifyError(cause);
        } finally {
            setBusy(false);
        }
    };

    const resetLocationForm = () => {
        setLocationCode("");
        setLocationTitle("");
        setLocationParentId("");
        setLocationZoneType("STORAGE");
        setBinCapacity("");
        setBinLocationType("");
        setBinStatus("active");
        setBinAllowedProductTypes("");
    };

    const openCreateLocation = (kind: LocationEntityKind, parentId?: string) => {
        resetLocationForm();
        setLocationParentId(parentId ?? "");
        setLocationModal({ mode: "create", kind, parentId });
        setError("");
    };

    const openEditLocation = (kind: LocationEntityKind, entity: LocationEntity) => {
        resetLocationForm();
        setLocationModal({ mode: "edit", kind, entity });
        if (kind === "zone") {
            const zone = entity as WarehouseZone;
            setLocationCode(zone.code);
            setLocationTitle(zone.title);
            setLocationZoneType(zone.type ?? "STORAGE");
        } else if (kind === "aisle") {
            setLocationTitle((entity as WarehouseAisle).title ?? "");
        } else if (kind === "rack") {
            setLocationCode((entity as WarehouseRack).rackNumber ?? "");
        } else if (kind === "shelf") {
            setLocationCode((entity as WarehouseShelf).shelfNumber ?? "");
        } else {
            const bin = entity as StorageBin;
            setLocationCode(bin.code);
            setLocationTitle(bin.title ?? "");
            setLocationParentId(bin.shelfId ?? bin.shelf?.id ?? "");
            setBinCapacity(bin.capacity == null ? "" : String(bin.capacity));
            setBinLocationType(bin.location_type ?? "");
            setBinStatus(bin.status ?? "active");
            setBinAllowedProductTypes(bin.allowed_product_types ?? "");
        }
        setError("");
    };

    const submitLocation = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!locationModal || !selectedWarehouseId) return;
        const { kind, mode, entity, parentId } = locationModal;
        const id = entity?.id;
        setBusy(true);
        setError("");
        try {
            if (kind === "zone") {
                const payload = {
                    code: locationCode.trim(),
                    title: locationTitle.trim(),
                    type: locationZoneType,
                };
                if (mode === "edit" && id) {
                    await apiRequest(`/warehouses/zones/${id}`, token, {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                    });
                } else {
                    await apiRequest(`/warehouses/${selectedWarehouseId}/zones`, token, {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });
                }
            } else if (kind === "aisle") {
                const payload = { title: locationTitle.trim() || undefined };
                if (mode === "edit" && id) {
                    await apiRequest(`/warehouses/aisles/${id}`, token, {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                    });
                } else {
                    await apiRequest("/warehouses/aisles", token, {
                        method: "POST",
                        body: JSON.stringify({ zoneId: parentId, ...payload }),
                    });
                }
            } else if (kind === "rack") {
                const payload = { rackNumber: locationCode.trim() || undefined };
                if (mode === "edit" && id) {
                    await apiRequest(`/warehouses/racks/${id}`, token, {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                    });
                } else {
                    await apiRequest("/warehouses/racks", token, {
                        method: "POST",
                        body: JSON.stringify({ aisleId: parentId, ...payload }),
                    });
                }
            } else if (kind === "shelf") {
                const payload = { shelfNumber: locationCode.trim() || undefined };
                if (mode === "edit" && id) {
                    await apiRequest(`/warehouses/shelves/${id}`, token, {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                    });
                } else {
                    await apiRequest("/warehouses/shelves", token, {
                        method: "POST",
                        body: JSON.stringify({ rackId: parentId, ...payload }),
                    });
                }
            } else {
                const parsedCapacity = binCapacity.trim() ? Number(binCapacity) : undefined;
                if (parsedCapacity !== undefined && (!Number.isFinite(parsedCapacity) || parsedCapacity < 0)) {
                    throw new Error("Yacheyka sig'imi manfiy bo'lmagan son bo'lishi kerak.");
                }
                const payload = {
                    ...(mode === "edit" ? { shelfId: locationParentId || undefined } : { shelfId: parentId }),
                    code: locationCode.trim(),
                    title: locationTitle.trim() || undefined,
                    capacity: parsedCapacity,
                    location_type: binLocationType.trim() || undefined,
                    status: binStatus,
                    allowed_product_types: binAllowedProductTypes.trim() || undefined,
                };
                if (mode === "edit" && id) {
                    await apiRequest(`/warehouses/bins/${id}`, token, {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                    });
                } else {
                    await apiRequest("/warehouses/bins", token, {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });
                }
            }

            setLocationModal(null);
            setNotice(`${locationKindLabel(kind)} ${mode === "edit" ? "yangilandi" : "yaratildi"}.`);
            await loadWarehouseData();
        } catch (cause) {
            notifyError(cause);
        } finally {
            setBusy(false);
        }
    };

    const requestDelete = (target: DeleteTarget) => {
        setDeleteTarget(target);
        setError("");
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const target = deleteTarget;
        const paths: Record<LocationEntityKind, string> = {
            zone: `/warehouses/zones/${target.id}`,
            aisle: `/warehouses/aisles/${target.id}`,
            rack: `/warehouses/racks/${target.id}`,
            shelf: `/warehouses/shelves/${target.id}`,
            bin: `/warehouses/bins/${target.id}`,
        };
        setBusy(true);
        setError("");
        try {
            await apiRequest(
                target.kind === "warehouse" ? `/warehouses/${target.id}` : paths[target.kind],
                token,
                { method: "DELETE" },
            );
            setDeleteTarget(null);
            setNotice(`${target.kind === "warehouse" ? "Ombor" : locationKindLabel(target.kind)} o'chirildi.`);
            if (target.kind === "warehouse") {
                await loadMainData();
            } else {
                await loadWarehouseData();
            }
        } catch (cause) {
            notifyError(cause);
        } finally {
            setBusy(false);
        }
    };

    const submitMovement = async (completeImmediately: boolean) => {
        if (!movementProductId || !isUuid(marketId)) {
            setError(!isUuid(marketId) ? "Market UUID noto‘g‘ri." : "Mahsulotni tanlang.");
            return;
        }
        setBusy(true);
        setError("");
        let createdMovementId = "";
        try {
            const quantity = Number(movementQuantity);
            if (!Number.isFinite(quantity) || quantity < 0 || (movementType !== "ADJUSTMENT" && quantity <= 0)) {
                throw new Error("Miqdor yaroqli musbat son bo'lishi kerak.");
            }
            const payload: Record<string, string | number> = {
                productId: movementProductId,
                type: movementType,
                quantity,
                note: movementNote.trim(),
            };
            if (movementLotNumber.trim()) payload.lotNumber = movementLotNumber.trim();
            if (movementType === "INBOUND" || movementType === "ADJUSTMENT") {
                if (movementExpiresAt) payload.expiresAt = new Date(movementExpiresAt).toISOString();
                if (movementDiscountId) payload.discountId = movementDiscountId;
            }
            if (movementType === "OUTBOUND" || movementType === "TRANSFER") {
                payload.fromWarehouseId = sourceWarehouseId || pinnedWarehouseId;
                payload.fromBinId = sourceBinId;
            }
            if (
                movementType === "INBOUND" ||
                movementType === "TRANSFER" ||
                movementType === "ADJUSTMENT"
            ) {
                payload.toWarehouseId = targetWarehouseId || pinnedWarehouseId;
                payload.toBinId = targetBinId;
            }
            const created = await apiRequest<{ id: string }>(
                "/stock-movements",
                token,
                { method: "POST", body: JSON.stringify(payload) },
            );
            createdMovementId = created.id;
            if (completeImmediately) {
                await apiRequest(`/stock-movements/${created.id}/status`, token, {
                    method: "PATCH",
                    body: JSON.stringify({ status: "COMPLETED" }),
                });
            }
            setMovementNote("");
            setMovementLotNumber("");
            setMovementExpiresAt("");
            setMovementDiscountId("");
            setNotice(
                completeImmediately
                    ? "Harakat yaratildi va yakunlandi."
                    : "Harakat kutilayotgan holatda yaratildi.",
            );
        } catch (cause) {
            notifyError(cause);
        } finally {
            setBusy(false);
            if (createdMovementId) {
                await Promise.all([loadMovements(), loadWarehouseData()]);
            }
        }
    };

    const setMovementStatus = async (
        movement: Movement,
        status: "COMPLETED" | "CANCELLED",
    ) => {
        try {
            await apiRequest(`/stock-movements/${movement.id}/status`, token, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });
            setNotice(`Harakat ${statusLabels[status].toLocaleLowerCase()}.`);
            await Promise.all([loadMovements(), loadWarehouseData()]);
        } catch (cause) {
            notifyError(cause);
        }
    };

    const tabs: { id: Tab; label: string; icon: typeof Boxes }[] = [
        { id: "locations", label: "Joylashuvlar", icon: Boxes },
        { id: "inventory", label: "Inventar", icon: WarehouseIcon },
        { id: "movements", label: "Harakatlar", icon: ArrowRightLeft },
        { id: "analytics", label: "Analitika", icon: ChartNoAxesCombined },
    ];

    if (!isUuid(marketId)) {
        return (
            <main role="alert" className="p-10 text-center text-rose-300">
                URL parametrida yaroqli market UUID topilmadi.
            </main>
        );
    }

    if (loading) {
        return <div className="p-10 text-center text-zinc-400">WMS yuklanmoqda...</div>;
    }

    return (
        <main className="mx-auto min-h-screen max-w-[1600px] space-y-6 px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
            <header className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl shadow-black/10 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-2xl bg-sky-500/10 p-3 text-sky-400"><WarehouseIcon /></span>
                        <div>
                            <h1 className="text-2xl font-bold sm:text-3xl">Warehouse Management</h1>
                            <p className="mt-1 text-sm text-zinc-400">Omborlar, zaxiralar va mahsulot harakatlari</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button className={ secondaryButton } onClick={ () => void loadMainData() } type="button">
                        <RefreshCw size={ 16 } /> Yangilash
                    </button>
                    <button className={ primaryButton } onClick={ openCreateWarehouse } type="button">
                        <Plus size={ 16 } /> Ombor yaratish
                    </button>
                </div>
            </header>

            { error && (
                <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                    <span className="flex items-center gap-2"><CircleAlert size={ 17 } />{ error }</span>
                    <button onClick={ () => setError("") } aria-label="Xabarni yopish"><X size={ 17 } /></button>
                </div>
            ) }
            { notice && (
                <div role="status" className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{ notice }</div>
            ) }

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                { warehouses.map((warehouse) => {
                    const active = warehouse.id === selectedWarehouseId;
                    return (
                        <article key={ warehouse.id } className={ `rounded-2xl border p-4 transition ${active ? "border-sky-500/60 bg-sky-500/10" : "border-white/10 bg-zinc-900/60 hover:border-white/20"}` }>
                            <button className="w-full text-left" type="button" disabled={ Boolean(pinnedWarehouseId) } onClick={ () => {
                                setSelectedWarehouseId(warehouse.id);
                                const nextParams = new URLSearchParams(searchParams.toString());
                                nextParams.set("warehouseId", warehouse.id);
                                router.replace(`${window.location.pathname}?${nextParams.toString()}`);
                            } }>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h2 className="truncate font-semibold">{ warehouse.title }</h2>
                                        <p className="mt-1 text-xs text-zinc-400">{ warehouse.code || "Kodsiz ombor" }</p>
                                    </div>
                                    { active && <Check size={ 17 } className="text-sky-400" /> }
                                </div>
                                <p className="mt-3 flex items-center gap-1 truncate text-xs text-zinc-500"><MapPin size={ 13 } />{ warehouse.address || `${warehouse.lat}, ${warehouse.lng}` }</p>
                            </button>
                            <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
                                <button className={ secondaryButton } type="button" onClick={ () => openEditWarehouse(warehouse) }>Tahrirlash</button>
                                <button className="rounded-xl p-2 text-rose-300 hover:bg-rose-500/10" type="button" aria-label="Omborni o'chirish" onClick={ () => requestDelete({ kind: "warehouse", id: warehouse.id, label: warehouse.title }) }><Trash2 size={ 16 } /></button>
                            </div>
                        </article>
                    );
                }) }
            </section>
            { pinnedWarehouseId && (
                <button
                    className={ secondaryButton }
                    type="button"
                    onClick={ () => {
                        const nextParams = new URLSearchParams(searchParams.toString());
                        nextParams.delete("warehouseId");
                        router.replace(`${window.location.pathname}${nextParams.size ? `?${nextParams}` : ""}`);
                    } }
                >
                    Barcha omborlarni ko&apos;rsatish
                </button>
            ) }

            { warehouses.length === 0 ? (
                <section className="rounded-3xl border border-dashed border-white/15 bg-zinc-900/40 p-12 text-center">
                    <WarehouseIcon className="mx-auto mb-3 text-zinc-500" size={ 34 } />
                    <h2 className="font-semibold">Hozircha ombor yo&apos;q</h2>
                    <p className="mt-1 text-sm text-zinc-400">WMS ishini boshlash uchun birinchi omboringizni yarating.</p>
                    <button className={ `${primaryButton} mt-5` } onClick={ openCreateWarehouse } type="button"><Plus size={ 16 } />Ombor yaratish</button>
                </section>
            ) : (
                <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60">
                    <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
                        { tabs.map(({ id, label, icon: Icon }) => (
                            <button key={ id } type="button" onClick={ () => setTab(id) } className={ `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${tab === id ? "bg-sky-500 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}` }>
                                <Icon size={ 16 } />{ label }
                            </button>
                        )) }
                    </div>

                    { tab === "locations" && (
                        <div className="space-y-4 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold">Ombor joylashuvlari</h2>
                                    <p className="text-sm text-zinc-400">Zona → yo'lak → stellaj → raf → yacheyka</p>
                                </div>
                                <button type="button" className={ primaryButton } onClick={ () => openCreateLocation("zone", selectedWarehouseId) }>
                                    <Plus size={ 15 } /> Zona qo'shish
                                </button>
                            </div>

                            { !zones.length && (
                                <div className="rounded-2xl border border-dashed border-white/10 p-9 text-center text-sm text-zinc-400">
                                    Bu omborda zona yo'q. Boshlash uchun zona yarating.
                                </div>
                            ) }

                            { zones.map((zone) => (
                                <section key={ zone.id } className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold">{ zone.title }</h3>
                                                <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-200">{ zone.code }</span>
                                                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">{ zoneTypeLabels[zone.type] ?? zone.type }</span>
                                            </div>
                                            <p className="mt-1 text-xs text-zinc-500">{ (zone.aisles ?? []).length } yo'lak</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" className={ secondaryButton } onClick={ () => openCreateLocation("aisle", zone.id) }><Plus size={ 14 } /> Yo'lak</button>
                                            <button type="button" className={ secondaryButton } onClick={ () => openEditLocation("zone", zone) }>Tahrirlash</button>
                                            <button type="button" aria-label="Zonani o'chirish" className="rounded-xl p-2 text-rose-300 hover:bg-rose-500/10" onClick={ () => requestDelete({ kind: "zone", id: zone.id, label: zone.title }) }><Trash2 size={ 16 } /></button>
                                        </div>
                                    </div>

                                    { !(zone.aisles ?? []).length ? (
                                        <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">Yo'laklar hali yo'q.</p>
                                    ) : (
                                        <div className="space-y-3 border-l border-white/10 pl-3 sm:pl-5">
                                            { (zone.aisles ?? []).map((aisle) => (
                                                <section key={ aisle.id } className="space-y-3 rounded-xl border border-white/10 bg-zinc-950/35 p-3 sm:p-4">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div>
                                                            <h4 className="font-medium">{ aisle.title || "Nomsiz yo'lak" }</h4>
                                                            <p className="text-xs text-zinc-500">{ (aisle.racks ?? []).length } stellaj</p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button type="button" className={ secondaryButton } onClick={ () => openCreateLocation("rack", aisle.id) }><Plus size={ 13 } /> Stellaj</button>
                                                            <button type="button" className={ secondaryButton } onClick={ () => openEditLocation("aisle", aisle) }>Tahrirlash</button>
                                                            <button type="button" aria-label="Yo'lakni o'chirish" className="rounded-xl p-2 text-rose-300 hover:bg-rose-500/10" onClick={ () => requestDelete({ kind: "aisle", id: aisle.id, label: aisle.title || "Nomsiz yo'lak" }) }><Trash2 size={ 15 } /></button>
                                                        </div>
                                                    </div>

                                                    { !(aisle.racks ?? []).length ? <p className="text-xs text-zinc-500">Stellajlar hali yo'q.</p> : (
                                                        <div className="grid gap-3 xl:grid-cols-2">
                                                            { (aisle.racks ?? []).map((rack) => (
                                                                <section key={ rack.id } className="space-y-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <div>
                                                                            <h5 className="text-sm font-semibold">Stellaj { rack.rackNumber || "(raqamsiz)" }</h5>
                                                                            <p className="text-xs text-zinc-500">{ (rack.shelfs ?? []).length } raf</p>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            <button type="button" className={ secondaryButton } onClick={ () => openCreateLocation("shelf", rack.id) }><Plus size={ 13 } /> Raf</button>
                                                                            <button type="button" className={ secondaryButton } onClick={ () => openEditLocation("rack", rack) }>Tahrirlash</button>
                                                                            <button type="button" aria-label="Stellajni o'chirish" className="rounded-xl p-2 text-rose-300 hover:bg-rose-500/10" onClick={ () => requestDelete({ kind: "rack", id: rack.id, label: `Stellaj ${rack.rackNumber || "(raqamsiz)"}` }) }><Trash2 size={ 14 } /></button>
                                                                        </div>
                                                                    </div>

                                                                    { !(rack.shelfs ?? []).length ? <p className="text-xs text-zinc-500">Raflar hali yo'q.</p> : (
                                                                        <div className="space-y-2">
                                                                            { (rack.shelfs ?? []).map((shelf) => (
                                                                                <section key={ shelf.id } className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                                                        <div>
                                                                                            <p className="text-sm font-medium">Raf { shelf.shelfNumber || "(raqamsiz)" }</p>
                                                                                            <p className="text-xs text-zinc-500">{ (shelf.bins ?? []).length } yacheyka</p>
                                                                                        </div>
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                            <button type="button" className={ secondaryButton } onClick={ () => openCreateLocation("bin", shelf.id) }><Plus size={ 13 } /> Yacheyka</button>
                                                                                            <button type="button" className={ secondaryButton } onClick={ () => openEditLocation("shelf", shelf) }>Tahrirlash</button>
                                                                                            <button type="button" aria-label="Rafni o'chirish" className="rounded-xl p-2 text-rose-300 hover:bg-rose-500/10" onClick={ () => requestDelete({ kind: "shelf", id: shelf.id, label: `Raf ${shelf.shelfNumber || "(raqamsiz)"}` }) }><Trash2 size={ 14 } /></button>
                                                                                        </div>
                                                                                    </div>
                                                                                    { !(shelf.bins ?? []).length ? <p className="text-xs text-zinc-500">Yacheykalar hali yo'q.</p> : (
                                                                                        <div className="grid gap-2 sm:grid-cols-2">
                                                                                            { (shelf.bins ?? []).map((bin) => {
                                                                                                const occupied = (inventoryByBin.get(bin.id) ?? 0) > 0;
                                                                                                return (
                                                                                                    <div key={ bin.id } className="flex min-w-0 items-start justify-between gap-2 rounded-lg border border-white/5 bg-zinc-900/70 p-3">
                                                                                                        <div className="min-w-0">
                                                                                                            <p className="truncate text-sm font-medium">{ bin.code }</p>
                                                                                                            <p className="mt-0.5 truncate text-xs text-zinc-500">{ bin.title || "Nomsiz yacheyka" }</p>
                                                                                                            <p className={ `mt-1 text-xs ${bin.status === "blocked" ? "text-rose-300" : bin.status === "maintenance" ? "text-amber-300" : occupied ? "text-sky-300" : "text-emerald-300"}` }>{ binStatusLabels[bin.status ?? "active"] } · { occupied ? "Band" : "Bo'sh" }</p>
                                                                                                            { bin.capacity != null && <p className="mt-1 text-xs text-zinc-500">Sig'im: { bin.capacity }</p> }
                                                                                                        </div>
                                                                                                        <div className="flex shrink-0 gap-1">
                                                                                                            <button type="button" className="rounded-lg px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/5" onClick={ () => openEditLocation("bin", bin) }>Tahrirlash</button>
                                                                                                            <button type="button" aria-label={ `${bin.code} yacheykasini o'chirish` } className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10" onClick={ () => requestDelete({ kind: "bin", id: bin.id, label: bin.code }) }><Trash2 size={ 14 } /></button>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            }) }
                                                                                        </div>
                                                                                    ) }
                                                                                </section>
                                                                            )) }
                                                                        </div>
                                                                    ) }
                                                                </section>
                                                            )) }
                                                        </div>
                                                    ) }
                                                </section>
                                            )) }
                                        </div>
                                    ) }
                                </section>
                            )) }
                        </div>
                    ) }

                    { tab === "inventory" && (
                        <div className="p-5">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div><h2 className="text-lg font-semibold">{ selectedWarehouse?.title } inventari</h2><p className="text-sm text-zinc-400">Ombordagi barcha yacheykalar va mahsulotlar bo&apos;yicha qoldiq</p></div>
                                <button type="button" className={ secondaryButton } onClick={ () => void loadWarehouseData() }><RefreshCw size={ 15 } />Yangilash</button>
                            </div>
                            <div className="overflow-x-auto rounded-2xl border border-white/10">
                                <table className="w-full min-w-[900px] text-left text-sm">
                                    <thead className="bg-white/5 text-xs uppercase text-zinc-400"><tr><th className="px-4 py-3">Mahsulot / lot</th><th className="px-4 py-3">Joylashuv yo'li</th><th className="px-4 py-3">Yaroqlilik</th><th className="px-4 py-3 text-right">Amaldagi miqdor</th><th className="px-4 py-3 text-right">Band qilingan</th><th className="px-4 py-3 text-right">Sotuvga ochiq</th></tr></thead>
                                    <tbody className="divide-y divide-white/5">
                                        { inventory.map((row) => <tr key={ row.id } className="hover:bg-white/[0.025]"><td className="px-4 py-3 font-medium">{ row.product.title }<span className="block text-xs text-zinc-500">{ row.lotNumber || "Lot ko'rsatilmagan" }</span></td><td className="px-4 py-3 text-zinc-400">{ [row.bin.shelf?.rack?.aisle?.zone?.code ?? row.bin.zone?.code, row.bin.shelf?.rack?.aisle?.title, row.bin.shelf?.rack?.rackNumber, row.bin.shelf?.shelfNumber, row.bin.code].filter(Boolean).join(" · ") }</td><td className="px-4 py-3 text-zinc-400">{ row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : "—" }</td><td className="px-4 py-3 text-right tabular-nums">{ row.quantity } { row.product.uom }</td><td className="px-4 py-3 text-right tabular-nums text-amber-300">{ row.reservedQuantity } { row.product.uom }</td><td className="px-4 py-3 text-right tabular-nums text-emerald-300">{ row.availableQuantity } { row.product.uom }</td></tr>) }
                                        { !inventory.length && <tr><td colSpan={ 6 } className="px-4 py-10 text-center text-zinc-500">Bu omborda hozircha zaxira yo&apos;q.</td></tr> }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) }

                    { tab === "movements" && (
                        <div className="grid gap-6 p-5 2xl:grid-cols-[360px_minmax(0,1fr)]">
                            <form onSubmit={ (event) => { event.preventDefault(); void submitMovement(false); } } className="h-fit space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                                <div className="flex items-center gap-2"><PackagePlus className="text-sky-400" size={ 19 } /><h2 className="font-semibold">Yangi harakat</h2></div>
                                <label className="block space-y-1 text-xs text-zinc-400">Harakat turi<select className={ inputClass } value={ movementType } onChange={ (event) => setMovementType(event.target.value as MovementType) }><option value="INBOUND">Kirim</option><option value="OUTBOUND">Chiqim</option><option value="TRANSFER">Ko&apos;chirish</option><option value="ADJUSTMENT">Inventarizatsiya</option></select></label>
                                <label className="block space-y-1 text-xs text-zinc-400">Mahsulot qidirish<input className={ inputClass } type="search" value={ productSearch } onChange={ (event) => setProductSearch(event.target.value) } placeholder="Kamida bir necha harf kiriting" /></label>
                                <label className="block space-y-1 text-xs text-zinc-400">Mahsulot<select className={ inputClass } required value={ movementProductId } onChange={ (event) => { setMovementProductId(event.target.value); setMovementLotNumber(""); } }><option value="">Mahsulotni tanlang</option>{ productChoices.map((product) => <option key={ product.id } value={ product.id }>{ product.title }</option>) }</select></label>
                                { (movementType === "OUTBOUND" || movementType === "TRANSFER" || movementType === "ADJUSTMENT") && binInventoryChoices.filter((row) => row.productId === movementProductId).length > 0 && (
                                    <label className="block space-y-1 text-xs text-zinc-400">Lot<select className={ inputClass } required value={ movementLotNumber } onChange={ (event) => setMovementLotNumber(event.target.value) }><option value="">Lotni tanlang</option>{ binInventoryChoices.filter((row) => row.productId === movementProductId && (movementType !== "OUTBOUND" || row.availableQuantity > 0)).map((row) => <option key={ row.id } value={ row.lotNumber }>{ row.lotNumber || "Lot ko'rsatilmagan" } · { movementType === "OUTBOUND" ? row.availableQuantity : row.quantity } { row.product.uom }</option>) }</select></label>
                                ) }
                                <label className="block space-y-1 text-xs text-zinc-400">{ movementType === "ADJUSTMENT" ? "Yangi amaldagi miqdor" : "Miqdor" } ({ selectedProduct?.uom ?? "PCS" })<input className={ inputClass } type="number" min={ movementType === "ADJUSTMENT" ? 0 : 0.001 } step="0.001" required value={ movementQuantity } onChange={ (event) => setMovementQuantity(event.target.value) } /></label>
                                { movementType === "INBOUND" && <label className="block space-y-1 text-xs text-zinc-400">Lot raqami (ixtiyoriy)<input className={ inputClass } maxLength={ 100 } value={ movementLotNumber } onChange={ (event) => setMovementLotNumber(event.target.value) } placeholder="LOT-2026-001" /></label> }
                                { movementType === "ADJUSTMENT" && binInventoryChoices.filter((row) => row.productId === movementProductId).length === 0 && <label className="block space-y-1 text-xs text-zinc-400">Lot raqami (ixtiyoriy)<input className={ inputClass } maxLength={ 100 } value={ movementLotNumber } onChange={ (event) => setMovementLotNumber(event.target.value) } placeholder="LOT-2026-001" /></label> }
                                { (movementType === "INBOUND" || movementType === "ADJUSTMENT") && (
                                    <>
                                        <label className="block space-y-1 text-xs text-zinc-400">Yaroqlilik muddati (ixtiyoriy)<input className={ inputClass } type="date" value={ movementExpiresAt } onChange={ (event) => setMovementExpiresAt(event.target.value) } /></label>
                                        <label className="block space-y-1 text-xs text-zinc-400">Chegirma (ixtiyoriy)<select className={ inputClass } value={ movementDiscountId } onChange={ (event) => setMovementDiscountId(event.target.value) }><option value="">Chegirmasiz</option>{ discounts.map((discount) => <option key={ discount.id } value={ discount.id }>{ discount.title } · { discount.percentage }%</option>) }</select></label>
                                    </>
                                ) }

                                { (movementType === "OUTBOUND" || movementType === "TRANSFER") && (
                                    <LocationSelector title="Qayerdan" warehouses={ pinnedWarehouse ? [pinnedWarehouse] : warehouses } fixedWarehouseId={ pinnedWarehouseId } warehouseId={ sourceWarehouseId } binId={ sourceBinId } onWarehouseChange={ (id) => { setSourceWarehouseId(id); setSourceBinId(""); setMovementProductId(""); } } onBinChange={ (id) => { setSourceBinId(id); setMovementProductId(""); setMovementLotNumber(""); } } />
                                ) }
                                { (movementType === "INBOUND" || movementType === "TRANSFER" || movementType === "ADJUSTMENT") && (
                                    <LocationSelector title={ movementType === "TRANSFER" ? "Qayerga" : "Ombor / yacheyka" } warehouses={ pinnedWarehouse ? [pinnedWarehouse] : warehouses } fixedWarehouseId={ pinnedWarehouseId } warehouseId={ targetWarehouseId } binId={ targetBinId } onWarehouseChange={ (id) => { setTargetWarehouseId(id); setTargetBinId(""); if (movementType === "ADJUSTMENT") setMovementProductId(""); } } onBinChange={ (id) => { setTargetBinId(id); if (movementType === "ADJUSTMENT") { setMovementProductId(""); setMovementLotNumber(""); } } } />
                                ) }
                                <label className="block space-y-1 text-xs text-zinc-400">Izoh / sabab<textarea className={ `${inputClass} min-h-20 resize-y` } maxLength={ 2000 } value={ movementNote } onChange={ (event) => setMovementNote(event.target.value) } placeholder="Harakat sababini yozing" /></label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className={ secondaryButton } type="submit" disabled={ busy }>Kutilayotgan</button>
                                    <button className={ primaryButton } type="button" disabled={ busy } onClick={ (event) => {
                                        const form = event.currentTarget.form;
                                        if (form?.reportValidity()) {
                                            void submitMovement(true);
                                        }
                                    } }>Yakunlab saqlash</button>
                                </div>
                            </form>

                            <section className="min-w-0">
                                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                                    <div><h2 className="text-lg font-semibold">Harakatlar tarixi</h2><p className="text-sm text-zinc-400">Kirim, chiqim, ko&apos;chirish va inventarizatsiya</p></div>
                                    <div className="flex flex-wrap gap-2">
                                        <select className={ `${inputClass} w-auto min-w-36` } value={ movementTypeFilter } onChange={ (event) => setMovementTypeFilter(event.target.value) }><option value="">Barcha turlar</option>{ Object.entries(movementLabels).map(([value, label]) => <option key={ value } value={ value }>{ label }</option>) }</select>
                                        <select className={ `${inputClass} w-auto min-w-36` } value={ movementStatusFilter } onChange={ (event) => setMovementStatusFilter(event.target.value) }><option value="">Barcha statuslar</option>{ Object.entries(statusLabels).map(([value, label]) => <option key={ value } value={ value }>{ label }</option>) }</select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    { movements.map((movement) => (
                                        <article key={ movement.id } className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 lg:flex-row lg:items-center">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{ movementLabels[movement.type] }</span><span className={ `rounded-full px-2 py-0.5 text-xs ${movement.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-300" : movement.status === "CANCELLED" ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-200"}` }>{ statusLabels[movement.status] }</span><span className="text-xs text-zinc-500">{ new Date(movement.createdAt).toLocaleString() }</span></div>
                                                <p className="mt-1 truncate text-sm text-zinc-300">{ movement.product.title } · { movement.quantity } { movement.product.uom }{ movement.lotNumber ? ` · Lot ${movement.lotNumber}` : "" }{ movement.expiresAt ? ` · ${new Date(movement.expiresAt).toLocaleDateString()}` : "" }</p>
                                                <p className="mt-1 text-xs text-zinc-500">{ movement.fromWarehouse ? `${movement.fromWarehouse.title} / ${movement.fromBin?.code ?? ""} → ` : "" }{ movement.toWarehouse ? `${movement.toWarehouse.title} / ${movement.toBin?.code ?? ""}` : "" }{ movement.note ? ` · ${movement.note}` : "" }</p>
                                            </div>
                                            { movement.status === "PENDING" && <div className="flex shrink-0 gap-2"><button className={ primaryButton } type="button" onClick={ () => void setMovementStatus(movement, "COMPLETED") }><Check size={ 15 } />Yakunlash</button><button className="rounded-xl border border-rose-400/20 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10" type="button" onClick={ () => void setMovementStatus(movement, "CANCELLED") }>Bekor qilish</button></div> }
                                        </article>
                                    )) }
                                    { !movements.length && <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">Tanlangan filterlar bo&apos;yicha harakat topilmadi.</p> }
                                </div>
                            </section>
                        </div>
                    ) }
                    { tab === "analytics" && (
                        <div className="grid gap-6 p-5 xl:grid-cols-2">
                            <section className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                <h2 className="mb-4 font-semibold">Ombordagi qoldiq (top 10 mahsulot)</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={ inventoryAnalytics } margin={ { top: 8, right: 12, left: 0, bottom: 36 } }>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis dataKey="title" angle={ -25 } textAnchor="end" interval={ 0 } height={ 70 } stroke="#a1a1aa" />
                                            <YAxis stroke="#a1a1aa" />
                                            <Tooltip />
                                            <Bar dataKey="quantity" name="Qoldiq" fill="#0ea5e9" radius={ [5, 5, 0, 0] } />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>
                            <section className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                <h2 className="mb-4 font-semibold">Harakatlar aylanmasi</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={ movementAnalytics } margin={ { top: 8, right: 12, left: 0, bottom: 8 } }>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis dataKey="type" stroke="#a1a1aa" />
                                            <YAxis stroke="#a1a1aa" />
                                            <Tooltip />
                                            <Bar dataKey="quantity" name="Miqdor" fill="#22c55e" radius={ [5, 5, 0, 0] } />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>
                        </div>
                    ) }
                </section>
            ) }

            <GlassModal open={ warehouseFormOpen } onClose={ () => setWarehouseFormOpen(false) } title={ editingWarehouse ? "Omborni tahrirlash" : "Yangi ombor" }>
                <form onSubmit={ submitWarehouse } className="space-y-4">
                    <GlassInput required maxLength={ 255 } placeholder="Ombor nomi" value={ warehouseTitle } onChange={ (event) => setWarehouseTitle(event.target.value) } />
                    <GlassInput maxLength={ 100 } placeholder="Ombor kodi (ixtiyoriy)" value={ warehouseCode } onChange={ (event) => setWarehouseCode(event.target.value) } />
                    <GlassInput maxLength={ 2000 } placeholder="Manzil" value={ warehouseAddress } onChange={ (event) => setWarehouseAddress(event.target.value) } />
                    <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs text-zinc-400">Latitude<GlassInput type="number" step="any" required value={ latitude } onChange={ (event) => setLatitude(event.target.value) } /></label><label className="space-y-1 text-xs text-zinc-400">Longitude<GlassInput type="number" step="any" required value={ longitude } onChange={ (event) => setLongitude(event.target.value) } /></label></div>
                    <button type="button" className={ secondaryButton } onClick={ () => setMapOpen((open) => !open) }><MapPin size={ 15 } />{ mapOpen ? "Xaritani yopish" : "Xaritadan koordinata tanlash" }</button>
                    { mapOpen && <div className="h-64 overflow-hidden rounded-2xl"><LocationMap isDarkMode={ dark } onLocationSelect={ (lat, lng) => { setLatitude(String(lat)); setLongitude(String(lng)); } } /></div> }
                    <div className="flex justify-end gap-2 border-t border-white/10 pt-4"><button type="button" className={ secondaryButton } onClick={ () => setWarehouseFormOpen(false) }>Yopish</button><button type="submit" className={ primaryButton } disabled={ busy }>{ busy ? "Saqlanmoqda..." : "Saqlash" }</button></div>
                </form>
            </GlassModal>

            <GlassModal
                open={ Boolean(locationModal) }
                onClose={ () => { if (!busy) setLocationModal(null); } }
                title={ locationModal ? `${locationModal.mode === "edit" ? "Tahrirlash" : "Yaratish"}: ${locationKindLabel(locationModal.kind)}` : "Joylashuv" }
            >
                { locationModal && (
                    <form onSubmit={ submitLocation } className="space-y-4">
                        { locationModal.kind === "zone" && (
                            <>
                                <GlassInput required maxLength={ 100 } placeholder="Zona kodi (A)" value={ locationCode } onChange={ (event) => setLocationCode(event.target.value) } />
                                <GlassInput required maxLength={ 255 } placeholder="Zona nomi" value={ locationTitle } onChange={ (event) => setLocationTitle(event.target.value) } />
                                <label className="block space-y-1 text-sm text-zinc-400">Zona turi
                                    <select className={ inputClass } required value={ locationZoneType } onChange={ (event) => setLocationZoneType(event.target.value as WarehouseZoneType) }>
                                        { Object.entries(zoneTypeLabels).map(([value, label]) => <option key={ value } value={ value }>{ label }</option>) }
                                    </select>
                                </label>
                            </>
                        ) }
                        { locationModal.kind === "aisle" && <GlassInput maxLength={ 255 } placeholder="Yo'lak nomi (ixtiyoriy)" value={ locationTitle } onChange={ (event) => setLocationTitle(event.target.value) } /> }
                        { locationModal.kind === "rack" && <GlassInput maxLength={ 100 } placeholder="Stellaj raqami (masalan, R-01)" value={ locationCode } onChange={ (event) => setLocationCode(event.target.value) } /> }
                        { locationModal.kind === "shelf" && <GlassInput maxLength={ 100 } placeholder="Raf raqami (masalan, S-01)" value={ locationCode } onChange={ (event) => setLocationCode(event.target.value) } /> }
                        { locationModal.kind === "bin" && (
                            <>
                                <GlassInput required maxLength={ 100 } placeholder="Yacheyka kodi (masalan, A-01-02)" value={ locationCode } onChange={ (event) => setLocationCode(event.target.value) } />
                                <GlassInput maxLength={ 255 } placeholder="Yacheyka nomi (ixtiyoriy)" value={ locationTitle } onChange={ (event) => setLocationTitle(event.target.value) } />
                                <label className="block space-y-1 text-sm text-zinc-400">Ota raf
                                    <select className={ inputClass } required value={ locationParentId || locationModal.parentId || "" } disabled={ locationModal.mode === "create" } onChange={ (event) => setLocationParentId(event.target.value) }>
                                        <option value="">Rafni tanlang</option>
                                        { zones.flatMap((zone) => (zone.aisles ?? []).flatMap((aisle) => (aisle.racks ?? []).flatMap((rack) => (rack.shelfs ?? []).map((shelf) => ({
                                            id: shelf.id,
                                            label: `${zone.code} · ${aisle.title || "Yo'lak"} · ${rack.rackNumber || "Stellaj"} · ${shelf.shelfNumber || "Raf"}`,
                                        }))))).map((shelf) => <option key={ shelf.id } value={ shelf.id }>{ shelf.label }</option>) }
                                    </select>
                                </label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="block space-y-1 text-sm text-zinc-400">Sig'im (ixtiyoriy)
                                        <GlassInput type="number" min="0" step="any" placeholder="Masalan, 250" value={ binCapacity } onChange={ (event) => setBinCapacity(event.target.value) } />
                                    </label>
                                    <label className="block space-y-1 text-sm text-zinc-400">Holati
                                        <select className={ inputClass } value={ binStatus } onChange={ (event) => setBinStatus(event.target.value as WarehouseBinStatus) }>
                                            { Object.entries(binStatusLabels).map(([value, label]) => <option key={ value } value={ value }>{ label }</option>) }
                                        </select>
                                    </label>
                                </div>
                                <GlassInput maxLength={ 50 } placeholder="Joylashuv turi (ixtiyoriy)" value={ binLocationType } onChange={ (event) => setBinLocationType(event.target.value) } />
                                <GlassInput maxLength={ 255 } placeholder="Ruxsat etilgan mahsulot turlari (ixtiyoriy)" value={ binAllowedProductTypes } onChange={ (event) => setBinAllowedProductTypes(event.target.value) } />
                            </>
                        ) }
                        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                            <button type="button" className={ secondaryButton } disabled={ busy } onClick={ () => setLocationModal(null) }>Bekor qilish</button>
                            <button type="submit" className={ primaryButton } disabled={ busy }>{ busy ? "Saqlanmoqda..." : locationModal.mode === "edit" ? "O'zgarishlarni saqlash" : "Yaratish" }</button>
                        </div>
                    </form>
                ) }
            </GlassModal>

            <GlassModal open={ Boolean(deleteTarget) } onClose={ () => { if (!busy) setDeleteTarget(null); } } title="O'chirishni tasdiqlash">
                { deleteTarget && (
                    <div className="space-y-4">
                        <p className="text-sm leading-6 text-zinc-300">
                            <span className="font-semibold text-white">{ deleteTarget.label }</span> { locationKindLabel(deleteTarget.kind).toLocaleLowerCase() } elementini o'chirmoqchimisiz? Bu elementga bog'langan quyi joylashuvlar ham o'chishi mumkin.
                        </p>
                        { error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{ error }</p> }
                        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                            <button type="button" className={ secondaryButton } disabled={ busy } onClick={ () => setDeleteTarget(null) }>Bekor qilish</button>
                            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50" disabled={ busy } onClick={ () => void confirmDelete() }>{ busy ? "O'chirilmoqda..." : <><Trash2 size={ 15 } /> O'chirish</> }</button>
                        </div>
                    </div>
                ) }
            </GlassModal>
        </main>
    );
}

function LocationSelector({
    title,
    warehouses,
    warehouseId,
    fixedWarehouseId = "",
    binId,
    onWarehouseChange,
    onBinChange,
}: {
    title: string;
    warehouses: Warehouse[];
    warehouseId: string;
    fixedWarehouseId?: string;
    binId: string;
    onWarehouseChange: (id: string) => void;
    onBinChange: (id: string) => void;
}) {
    const token = useTokenStore((state) => state.getActiveToken()) ?? "";
    const effectiveWarehouseId = fixedWarehouseId || warehouseId;
    const [bins, setBins] = useState<Array<StorageBin & { zone?: Pick<WarehouseZone, "id" | "code" | "title" | "type"> }>>([]);
    const [binSearch, setBinSearch] = useState("");
    const [error, setError] = useState("");
    useEffect(() => {
        let current = true;
        if (!effectiveWarehouseId) {
            return;
        }
        const timer = window.setTimeout(() => {
            const query = new URLSearchParams({
                warehouseId: effectiveWarehouseId,
                search: binSearch,
                page: "1",
                limit: "20",
            });
            apiRequest<{ data: Array<StorageBin & { zone?: Pick<WarehouseZone, "id" | "code" | "title" | "type"> }> }>(
                `/warehouses/bins/search?${query}`,
                token,
            )
                .then((result) => {
                    if (current) {
                        setBins(result.data);
                        setError("");
                    }
                })
                .catch((cause: unknown) => {
                    if (current) setError(cause instanceof Error ? cause.message : "Yacheykalar yuklanmadi.");
                });
        }, 250);
        return () => {
            current = false;
            window.clearTimeout(timer);
        };
    }, [binSearch, effectiveWarehouseId, token]);

    return (
        <fieldset className="space-y-2 rounded-xl border border-white/10 p-3">
            <legend className="px-1 text-xs text-zinc-400">{ title }</legend>
            <select className={ inputClass } required disabled={ Boolean(fixedWarehouseId) } value={ effectiveWarehouseId } onChange={ (event) => { onWarehouseChange(event.target.value); onBinChange(""); } }>
                <option value="">Omborni tanlang</option>
                { warehouses.map((warehouse) => <option key={ warehouse.id } value={ warehouse.id }>{ warehouse.title }</option>) }
            </select>
            <input className={ inputClass } type="search" disabled={ !effectiveWarehouseId } value={ binSearch } onChange={ (event) => setBinSearch(event.target.value) } placeholder="Yacheyka kodini qidirish" />
            <select className={ inputClass } required disabled={ !effectiveWarehouseId } value={ binId } onChange={ (event) => onBinChange(event.target.value) }>
                <option value="">Yacheykani tanlang</option>
                { bins.map((bin) => <option key={ bin.id } value={ bin.id }>{ bin.shelf?.rack?.aisle?.zone?.code ?? bin.zone?.code ?? "Zona" } · { bin.code }</option>) }
            </select>
            { error && <p role="alert" className="text-xs text-rose-300">{ error }</p> }
        </fieldset>
    );
}

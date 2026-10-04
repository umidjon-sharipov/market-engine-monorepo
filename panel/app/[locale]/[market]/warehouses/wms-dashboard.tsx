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

type Warehouse = {
  id: string;
  title: string;
  code: string | null;
  address: string | null;
  lat: string;
  lng: string;
  marketId: string;
};

type StorageBin = { id: string; code: string; title: string | null };
type WarehouseZone = {
  id: string;
  warehouseId: string;
  code: string;
  title: string;
  bins: StorageBin[];
};

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
  bin: {
    id: string;
    code: string;
    title: string | null;
    zone: { id: string; code: string; title: string };
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

  const [zoneCode, setZoneCode] = useState("");
  const [zoneTitle, setZoneTitle] = useState("");
  const [binZoneId, setBinZoneId] = useState("");
  const [binCode, setBinCode] = useState("");
  const [binTitle, setBinTitle] = useState("");

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
      setBinZoneId((selected) =>
        zoneRows.some((zone) => zone.id === selected)
          ? selected
          : (zoneRows[0]?.id ?? ""),
      );
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
        setBinZoneId((selected) =>
          zoneRows.some((zone) => zone.id === selected)
            ? selected
            : (zoneRows[0]?.id ?? ""),
        );
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
        lat: Number(latitude),
        lng: Number(longitude),
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

  const deleteWarehouse = async (warehouse: Warehouse) => {
    if (!window.confirm(`"${warehouse.title}" omborini o'chirmoqchimisiz?`)) return;
    try {
      await apiRequest(`/warehouses/${warehouse.id}`, token, {
        method: "DELETE",
      });
      setNotice("Ombor o'chirildi.");
      await loadMainData();
    } catch (cause) {
      notifyError(cause);
    }
  };

  const submitZone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWarehouseId) return;
    setBusy(true);
    try {
      await apiRequest(`/warehouses/${selectedWarehouseId}/zones`, token, {
        method: "POST",
        body: JSON.stringify({ code: zoneCode.trim(), title: zoneTitle.trim() }),
      });
      setZoneCode("");
      setZoneTitle("");
      setNotice("Zona yaratildi.");
      await loadWarehouseData();
    } catch (cause) {
      notifyError(cause);
    } finally {
      setBusy(false);
    }
  };

  const editZone = async (zone: WarehouseZone) => {
    const title = window.prompt("Zona nomi", zone.title);
    if (title === null) return;
    const code = window.prompt("Zona kodi", zone.code);
    if (code === null) return;
    try {
      await apiRequest(`/warehouses/zones/${zone.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ title: title.trim(), code: code.trim() }),
      });
      setNotice("Zona yangilandi.");
      await loadWarehouseData();
    } catch (cause) {
      notifyError(cause);
    }
  };

  const deleteZone = async (zone: WarehouseZone) => {
    if (!window.confirm(`"${zone.title}" zonasini o'chirmoqchimisiz?`)) return;
    try {
      await apiRequest(`/warehouses/zones/${zone.id}`, token, {
        method: "DELETE",
      });
      setNotice("Zona o'chirildi.");
      await loadWarehouseData();
    } catch (cause) {
      notifyError(cause);
    }
  };

  const submitBin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await apiRequest("/warehouses/bins", token, {
        method: "POST",
        body: JSON.stringify({
          zoneId: binZoneId,
          code: binCode.trim(),
          title: binTitle.trim() || undefined,
        }),
      });
      setBinCode("");
      setBinTitle("");
      setNotice("Yacheyka yaratildi.");
      await loadWarehouseData();
    } catch (cause) {
      notifyError(cause);
    } finally {
      setBusy(false);
    }
  };

  const editBin = async (bin: StorageBin) => {
    const code = window.prompt("Yacheyka kodi", bin.code);
    if (code === null) return;
    const title = window.prompt("Yacheyka nomi", bin.title ?? "");
    if (title === null) return;
    try {
      await apiRequest(`/warehouses/bins/${bin.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ code: code.trim(), title: title.trim() || undefined }),
      });
      setNotice("Yacheyka yangilandi.");
      await loadWarehouseData();
    } catch (cause) {
      notifyError(cause);
    }
  };

  const deleteBin = async (bin: StorageBin) => {
    if (!window.confirm(`"${bin.code}" yacheykasini o'chirmoqchimisiz?`)) return;
    try {
      await apiRequest(`/warehouses/bins/${bin.id}`, token, {
        method: "DELETE",
      });
      setNotice("Yacheyka o'chirildi.");
      await loadWarehouseData();
    } catch (cause) {
      notifyError(cause);
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
    { id: "locations", label: "Zonalar va yacheykalar", icon: Boxes },
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
          <button className={secondaryButton} onClick={() => void loadMainData()} type="button">
            <RefreshCw size={16} /> Yangilash
          </button>
          <button className={primaryButton} onClick={openCreateWarehouse} type="button">
            <Plus size={16} /> Ombor yaratish
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          <span className="flex items-center gap-2"><CircleAlert size={17} />{error}</span>
          <button onClick={() => setError("")} aria-label="Xabarni yopish"><X size={17} /></button>
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {warehouses.map((warehouse) => {
          const active = warehouse.id === selectedWarehouseId;
          return (
            <article key={warehouse.id} className={`rounded-2xl border p-4 transition ${active ? "border-sky-500/60 bg-sky-500/10" : "border-white/10 bg-zinc-900/60 hover:border-white/20"}`}>
              <button className="w-full text-left" type="button" disabled={Boolean(pinnedWarehouseId)} onClick={() => {
                setSelectedWarehouseId(warehouse.id);
                const nextParams = new URLSearchParams(searchParams.toString());
                nextParams.set("warehouseId", warehouse.id);
                router.replace(`${window.location.pathname}?${nextParams.toString()}`);
              }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{warehouse.title}</h2>
                    <p className="mt-1 text-xs text-zinc-400">{warehouse.code || "Kodsiz ombor"}</p>
                  </div>
                  {active && <Check size={17} className="text-sky-400" />}
                </div>
                <p className="mt-3 flex items-center gap-1 truncate text-xs text-zinc-500"><MapPin size={13} />{warehouse.address || `${warehouse.lat}, ${warehouse.lng}`}</p>
              </button>
              <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
                <button className={secondaryButton} type="button" onClick={() => openEditWarehouse(warehouse)}>Tahrirlash</button>
                <button className="rounded-xl p-2 text-rose-300 hover:bg-rose-500/10" type="button" aria-label="Omborni o'chirish" onClick={() => void deleteWarehouse(warehouse)}><Trash2 size={16} /></button>
              </div>
            </article>
          );
        })}
      </section>
      {pinnedWarehouseId && (
        <button
          className={secondaryButton}
          type="button"
          onClick={() => {
            const nextParams = new URLSearchParams(searchParams.toString());
            nextParams.delete("warehouseId");
            router.replace(`${window.location.pathname}${nextParams.size ? `?${nextParams}` : ""}`);
          }}
        >
          Barcha omborlarni ko&apos;rsatish
        </button>
      )}

      {warehouses.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-white/15 bg-zinc-900/40 p-12 text-center">
          <WarehouseIcon className="mx-auto mb-3 text-zinc-500" size={34} />
          <h2 className="font-semibold">Hozircha ombor yo&apos;q</h2>
          <p className="mt-1 text-sm text-zinc-400">WMS ishini boshlash uchun birinchi omboringizni yarating.</p>
          <button className={`${primaryButton} mt-5`} onClick={openCreateWarehouse} type="button"><Plus size={16} />Ombor yaratish</button>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60">
          <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${tab === id ? "bg-sky-500 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>

          {tab === "locations" && (
            <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                {zones.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-400">Omborda zona yo&apos;q. Yangi zona qo&apos;shing.</p>}
                {zones.map((zone) => (
                  <section key={zone.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div><h3 className="font-semibold">{zone.title}</h3><p className="text-xs text-zinc-500">Kod: {zone.code} · {zone.bins.length} yacheyka</p></div>
                      <div className="flex gap-2">
                        <button type="button" className={secondaryButton} onClick={() => void editZone(zone)}>Tahrirlash</button>
                        <button type="button" aria-label="Zonani o'chirish" className="rounded-xl p-2 text-rose-300 hover:bg-rose-500/10" onClick={() => void deleteZone(zone)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {zone.bins.length ? (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {zone.bins.map((bin) => {
                          const occupied = (inventoryByBin.get(bin.id) ?? 0) > 0;
                          return (
                            <div key={bin.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-zinc-950/50 p-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{bin.code}</p>
                                <p className={`mt-1 text-xs ${occupied ? "text-amber-300" : "text-emerald-300"}`}>{occupied ? "Band" : "Bo'sh"}</p>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <button type="button" aria-label={`${bin.code} yacheykasini tahrirlash`} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white" onClick={() => void editBin(bin)}><span className="text-xs">Edit</span></button>
                                <button type="button" aria-label={`${bin.code} yacheykasini o'chirish`} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10" onClick={() => void deleteBin(bin)}><Trash2 size={14} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-xs text-zinc-500">Yacheykalar hali yaratilmagan.</p>}
                  </section>
                ))}
              </div>

              <aside className="space-y-4">
                <form onSubmit={submitZone} className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <h3 className="font-semibold">Zona qo&apos;shish</h3>
                  <input className={inputClass} required maxLength={100} placeholder="Zona kodi (A)" value={zoneCode} onChange={(event) => setZoneCode(event.target.value)} />
                  <input className={inputClass} required maxLength={255} placeholder="Zona nomi (Zone A)" value={zoneTitle} onChange={(event) => setZoneTitle(event.target.value)} />
                  <button className={primaryButton} disabled={busy} type="submit"><Plus size={15} />Zona yaratish</button>
                </form>
                <form onSubmit={submitBin} className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <h3 className="font-semibold">Yacheyka qo&apos;shish</h3>
                  <select className={inputClass} required value={binZoneId} onChange={(event) => setBinZoneId(event.target.value)}>
                    <option value="">Zonani tanlang</option>
                    {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.code} · {zone.title}</option>)}
                  </select>
                  <input className={inputClass} required maxLength={100} placeholder="A-01-02-04" value={binCode} onChange={(event) => setBinCode(event.target.value)} />
                  <input className={inputClass} maxLength={255} placeholder="Yacheyka nomi (ixtiyoriy)" value={binTitle} onChange={(event) => setBinTitle(event.target.value)} />
                  <button className={primaryButton} disabled={busy || !zones.length} type="submit"><Plus size={15} />Yacheyka yaratish</button>
                </form>
              </aside>
            </div>
          )}

          {tab === "inventory" && (
            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-lg font-semibold">{selectedWarehouse?.title} inventari</h2><p className="text-sm text-zinc-400">Ombordagi barcha yacheykalar va mahsulotlar bo&apos;yicha qoldiq</p></div>
                <button type="button" className={secondaryButton} onClick={() => void loadWarehouseData()}><RefreshCw size={15} />Yangilash</button>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase text-zinc-400"><tr><th className="px-4 py-3">Mahsulot / lot</th><th className="px-4 py-3">Zona / yacheyka</th><th className="px-4 py-3">Yaroqlilik</th><th className="px-4 py-3 text-right">Amaldagi miqdor</th><th className="px-4 py-3 text-right">Band qilingan</th><th className="px-4 py-3 text-right">Sotuvga ochiq</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {inventory.map((row) => <tr key={row.id} className="hover:bg-white/[0.025]"><td className="px-4 py-3 font-medium">{row.product.title}<span className="block text-xs text-zinc-500">{row.lotNumber || "Lot ko'rsatilmagan"}</span></td><td className="px-4 py-3 text-zinc-400">{row.bin.zone.code} · {row.bin.code}</td><td className="px-4 py-3 text-zinc-400">{row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : "—"}</td><td className="px-4 py-3 text-right tabular-nums">{row.quantity} {row.product.uom}</td><td className="px-4 py-3 text-right tabular-nums text-amber-300">{row.reservedQuantity} {row.product.uom}</td><td className="px-4 py-3 text-right tabular-nums text-emerald-300">{row.availableQuantity} {row.product.uom}</td></tr>)}
                    {!inventory.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">Bu omborda hozircha zaxira yo&apos;q.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "movements" && (
            <div className="grid gap-6 p-5 2xl:grid-cols-[360px_minmax(0,1fr)]">
              <form onSubmit={(event) => { event.preventDefault(); void submitMovement(false); }} className="h-fit space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2"><PackagePlus className="text-sky-400" size={19} /><h2 className="font-semibold">Yangi harakat</h2></div>
                <label className="block space-y-1 text-xs text-zinc-400">Harakat turi<select className={inputClass} value={movementType} onChange={(event) => setMovementType(event.target.value as MovementType)}><option value="INBOUND">Kirim</option><option value="OUTBOUND">Chiqim</option><option value="TRANSFER">Ko&apos;chirish</option><option value="ADJUSTMENT">Inventarizatsiya</option></select></label>
                <label className="block space-y-1 text-xs text-zinc-400">Mahsulot qidirish<input className={inputClass} type="search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Kamida bir necha harf kiriting" /></label>
                <label className="block space-y-1 text-xs text-zinc-400">Mahsulot<select className={inputClass} required value={movementProductId} onChange={(event) => { setMovementProductId(event.target.value); setMovementLotNumber(""); }}><option value="">Mahsulotni tanlang</option>{productChoices.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}</select></label>
                {(movementType === "OUTBOUND" || movementType === "TRANSFER" || movementType === "ADJUSTMENT") && binInventoryChoices.filter((row) => row.productId === movementProductId).length > 0 && (
                  <label className="block space-y-1 text-xs text-zinc-400">Lot<select className={inputClass} required value={movementLotNumber} onChange={(event) => setMovementLotNumber(event.target.value)}><option value="">Lotni tanlang</option>{binInventoryChoices.filter((row) => row.productId === movementProductId && (movementType !== "OUTBOUND" || row.availableQuantity > 0)).map((row) => <option key={row.id} value={row.lotNumber}>{row.lotNumber || "Lot ko'rsatilmagan"} · {movementType === "OUTBOUND" ? row.availableQuantity : row.quantity} {row.product.uom}</option>)}</select></label>
                )}
                <label className="block space-y-1 text-xs text-zinc-400">{movementType === "ADJUSTMENT" ? "Yangi amaldagi miqdor" : "Miqdor"} ({selectedProduct?.uom ?? "PCS"})<input className={inputClass} type="number" min={movementType === "ADJUSTMENT" ? 0 : 0.001} step="0.001" required value={movementQuantity} onChange={(event) => setMovementQuantity(event.target.value)} /></label>
                {movementType === "INBOUND" && <label className="block space-y-1 text-xs text-zinc-400">Lot raqami (ixtiyoriy)<input className={inputClass} maxLength={100} value={movementLotNumber} onChange={(event) => setMovementLotNumber(event.target.value)} placeholder="LOT-2026-001" /></label>}
                {movementType === "ADJUSTMENT" && binInventoryChoices.filter((row) => row.productId === movementProductId).length === 0 && <label className="block space-y-1 text-xs text-zinc-400">Lot raqami (ixtiyoriy)<input className={inputClass} maxLength={100} value={movementLotNumber} onChange={(event) => setMovementLotNumber(event.target.value)} placeholder="LOT-2026-001" /></label>}
                {(movementType === "INBOUND" || movementType === "ADJUSTMENT") && (
                  <>
                    <label className="block space-y-1 text-xs text-zinc-400">Yaroqlilik muddati (ixtiyoriy)<input className={inputClass} type="date" value={movementExpiresAt} onChange={(event) => setMovementExpiresAt(event.target.value)} /></label>
                    <label className="block space-y-1 text-xs text-zinc-400">Chegirma (ixtiyoriy)<select className={inputClass} value={movementDiscountId} onChange={(event) => setMovementDiscountId(event.target.value)}><option value="">Chegirmasiz</option>{discounts.map((discount) => <option key={discount.id} value={discount.id}>{discount.title} · {discount.percentage}%</option>)}</select></label>
                  </>
                )}

                {(movementType === "OUTBOUND" || movementType === "TRANSFER") && (
                  <LocationSelector title="Qayerdan" warehouses={pinnedWarehouse ? [pinnedWarehouse] : warehouses} fixedWarehouseId={pinnedWarehouseId} warehouseId={sourceWarehouseId} binId={sourceBinId} onWarehouseChange={(id) => { setSourceWarehouseId(id); setSourceBinId(""); setMovementProductId(""); }} onBinChange={(id) => { setSourceBinId(id); setMovementProductId(""); setMovementLotNumber(""); }} />
                )}
                {(movementType === "INBOUND" || movementType === "TRANSFER" || movementType === "ADJUSTMENT") && (
                  <LocationSelector title={movementType === "TRANSFER" ? "Qayerga" : "Ombor / yacheyka"} warehouses={pinnedWarehouse ? [pinnedWarehouse] : warehouses} fixedWarehouseId={pinnedWarehouseId} warehouseId={targetWarehouseId} binId={targetBinId} onWarehouseChange={(id) => { setTargetWarehouseId(id); setTargetBinId(""); if (movementType === "ADJUSTMENT") setMovementProductId(""); }} onBinChange={(id) => { setTargetBinId(id); if (movementType === "ADJUSTMENT") { setMovementProductId(""); setMovementLotNumber(""); } }} />
                )}
                <label className="block space-y-1 text-xs text-zinc-400">Izoh / sabab<textarea className={`${inputClass} min-h-20 resize-y`} maxLength={2000} value={movementNote} onChange={(event) => setMovementNote(event.target.value)} placeholder="Harakat sababini yozing" /></label>
                <div className="grid grid-cols-2 gap-2">
                  <button className={secondaryButton} type="submit" disabled={busy}>Kutilayotgan</button>
                  <button className={primaryButton} type="button" disabled={busy} onClick={(event) => {
                    const form = event.currentTarget.form;
                    if (form?.reportValidity()) {
                      void submitMovement(true);
                    }
                  }}>Yakunlab saqlash</button>
                </div>
              </form>

              <section className="min-w-0">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div><h2 className="text-lg font-semibold">Harakatlar tarixi</h2><p className="text-sm text-zinc-400">Kirim, chiqim, ko&apos;chirish va inventarizatsiya</p></div>
                  <div className="flex flex-wrap gap-2">
                    <select className={`${inputClass} w-auto min-w-36`} value={movementTypeFilter} onChange={(event) => setMovementTypeFilter(event.target.value)}><option value="">Barcha turlar</option>{Object.entries(movementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                    <select className={`${inputClass} w-auto min-w-36`} value={movementStatusFilter} onChange={(event) => setMovementStatusFilter(event.target.value)}><option value="">Barcha statuslar</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  </div>
                </div>
                <div className="space-y-2">
                  {movements.map((movement) => (
                    <article key={movement.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 lg:flex-row lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{movementLabels[movement.type]}</span><span className={`rounded-full px-2 py-0.5 text-xs ${movement.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-300" : movement.status === "CANCELLED" ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-200"}`}>{statusLabels[movement.status]}</span><span className="text-xs text-zinc-500">{new Date(movement.createdAt).toLocaleString()}</span></div>
                        <p className="mt-1 truncate text-sm text-zinc-300">{movement.product.title} · {movement.quantity} {movement.product.uom}{movement.lotNumber ? ` · Lot ${movement.lotNumber}` : ""}{movement.expiresAt ? ` · ${new Date(movement.expiresAt).toLocaleDateString()}` : ""}</p>
                        <p className="mt-1 text-xs text-zinc-500">{movement.fromWarehouse ? `${movement.fromWarehouse.title} / ${movement.fromBin?.code ?? ""} → ` : ""}{movement.toWarehouse ? `${movement.toWarehouse.title} / ${movement.toBin?.code ?? ""}` : ""}{movement.note ? ` · ${movement.note}` : ""}</p>
                      </div>
                      {movement.status === "PENDING" && <div className="flex shrink-0 gap-2"><button className={primaryButton} type="button" onClick={() => void setMovementStatus(movement, "COMPLETED")}><Check size={15} />Yakunlash</button><button className="rounded-xl border border-rose-400/20 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10" type="button" onClick={() => void setMovementStatus(movement, "CANCELLED")}>Bekor qilish</button></div>}
                    </article>
                  ))}
                  {!movements.length && <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">Tanlangan filterlar bo&apos;yicha harakat topilmadi.</p>}
                </div>
              </section>
            </div>
          )}
          {tab === "analytics" && (
            <div className="grid gap-6 p-5 xl:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <h2 className="mb-4 font-semibold">Ombordagi qoldiq (top 10 mahsulot)</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryAnalytics} margin={{ top: 8, right: 12, left: 0, bottom: 36 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="title" angle={-25} textAnchor="end" interval={0} height={70} stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <Tooltip />
                      <Bar dataKey="quantity" name="Qoldiq" fill="#0ea5e9" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <h2 className="mb-4 font-semibold">Harakatlar aylanmasi</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={movementAnalytics} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="type" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <Tooltip />
                      <Bar dataKey="quantity" name="Miqdor" fill="#22c55e" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}
        </section>
      )}

      {warehouseFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setWarehouseFormOpen(false)}>
          <form onSubmit={submitWarehouse} className="w-full max-w-xl space-y-4 rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{editingWarehouse ? "Omborni tahrirlash" : "Yangi ombor"}</h2><button type="button" className="rounded-xl p-2 text-zinc-400 hover:bg-white/5" onClick={() => setWarehouseFormOpen(false)}><X size={19} /></button></div>
            <input className={inputClass} required maxLength={255} placeholder="Ombor nomi" value={warehouseTitle} onChange={(event) => setWarehouseTitle(event.target.value)} />
            <input className={inputClass} maxLength={100} placeholder="Ombor kodi (ixtiyoriy)" value={warehouseCode} onChange={(event) => setWarehouseCode(event.target.value)} />
            <input className={inputClass} maxLength={2000} placeholder="Manzil" value={warehouseAddress} onChange={(event) => setWarehouseAddress(event.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs text-zinc-400">Latitude<input className={inputClass} type="number" step="any" required value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label><label className="space-y-1 text-xs text-zinc-400">Longitude<input className={inputClass} type="number" step="any" required value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label></div>
            <button type="button" className={secondaryButton} onClick={() => setMapOpen((open) => !open)}><MapPin size={15} />{mapOpen ? "Xaritani yopish" : "Xaritadan koordinata tanlash"}</button>
            {mapOpen &&             <div className="h-64 overflow-hidden rounded-2xl"><LocationMap isDarkMode={dark} onLocationSelect={(lat, lng) => { setLatitude(String(lat)); setLongitude(String(lng)); }} /></div>}
            <div className="flex justify-end gap-2 border-t border-white/10 pt-4"><button type="button" className={secondaryButton} onClick={() => setWarehouseFormOpen(false)}>Yopish</button><button type="submit" className={primaryButton} disabled={busy}>{busy ? "Saqlanmoqda..." : "Saqlash"}</button></div>
          </form>
        </div>
      )}
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
  const [bins, setBins] = useState<Array<StorageBin & { zone: Pick<WarehouseZone, "code" | "title"> }>>([]);
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
      apiRequest<{ data: Array<StorageBin & { zone: Pick<WarehouseZone, "code" | "title"> }> }>(
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
      <legend className="px-1 text-xs text-zinc-400">{title}</legend>
      <select className={inputClass} required disabled={Boolean(fixedWarehouseId)} value={effectiveWarehouseId} onChange={(event) => { onWarehouseChange(event.target.value); onBinChange(""); }}>
        <option value="">Omborni tanlang</option>
        {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.title}</option>)}
      </select>
      <input className={inputClass} type="search" disabled={!effectiveWarehouseId} value={binSearch} onChange={(event) => setBinSearch(event.target.value)} placeholder="Yacheyka kodini qidirish" />
      <select className={inputClass} required disabled={!effectiveWarehouseId} value={binId} onChange={(event) => onBinChange(event.target.value)}>
        <option value="">Yacheykani tanlang</option>
        {bins.map((bin) => <option key={bin.id} value={bin.id}>{bin.zone.code} · {bin.code}</option>)}
      </select>
      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
    </fieldset>
  );
}

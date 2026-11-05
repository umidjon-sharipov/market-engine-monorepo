"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Edit3, MapPin, Plus, Search, Trash2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useTokenStore } from "@/app/_store/useTokenStore";
import GlassModal from "@/components/admin/GlassModal";
import GlassTable from "@/components/admin/GlassTable";

const Map = dynamic(() => import("@/app/_components/Map"), { ssr: false });

interface Warehouse {
  id: string;
  title: string;
  code?: string | null;
}

interface PickPoint {
  id: string;
  warehouseId: string;
  title: string;
  address: string | null;
  latitude: number;
  longitude: number;
  serviceRadiusMeters: number;
  isActive: boolean;
  createdAt: string;
  warehouse: Warehouse;
  assignedSeller: Seller | null;
}

interface Seller {
  id: string;
  role: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface Metrics {
  total: number;
  active: number;
  inactive: number;
  averageServiceRadiusMeters: number;
}

interface PickPointForm {
  warehouseId: string;
  assignedSellerId: string;
  title: string;
  address: string;
  latitude: string;
  longitude: string;
  serviceRadiusMeters: string;
  isActive: boolean;
}

const emptyForm: PickPointForm = {
  warehouseId: "",
  assignedSellerId: "",
  title: "",
  address: "",
  latitude: "",
  longitude: "",
  serviceRadiusMeters: "1000",
  isActive: true,
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-neutral-900/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-sky-500";

function responseMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = payload.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function PickPointsPage() {
  const params = useParams();
  const marketId = String(params.market ?? "");
  const token = useTokenStore(
    (state) =>
      state.accounts.find((account) => account.email === state.activeEmail)
        ?.accessToken ?? null,
  );
  const [pickPoints, setPickPoints] = useState<PickPoint[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    active: 0,
    inactive: 0,
    averageServiceRadiusMeters: 0,
  });
  const [form, setForm] = useState<PickPointForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mapSearch, setMapSearch] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<
    Array<{ label: string; latitude: number; longitude: number }>
  >([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchError, setMapSearchError] = useState("");
  const [locationCenter, setLocationCenter] = useState({ lat: 41.311081, lng: 69.240562 });
  const [tableSearch, setTableSearch] = useState("");

  const loadData = useCallback(async () => {
    if (!marketId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [pointsResponse, metricsResponse, warehousesResponse, sellersResponse] =
        await Promise.all([
          fetch(
            `${API_URL}/pickpoints?marketId=${encodeURIComponent(marketId)}`,
            { headers },
          ),
          fetch(
            `${API_URL}/pickpoints/metrics?marketId=${encodeURIComponent(marketId)}`,
            { headers },
          ),
          fetch(
            `${API_URL}/warehouses?marketId=${encodeURIComponent(marketId)}`,
            { headers },
          ),
          fetch(
            `${API_URL}/pickpoints/sellers?marketId=${encodeURIComponent(marketId)}`,
            { headers },
          ),
        ]);

      const [pointsPayload, metricsPayload, warehousesPayload, sellersPayload] =
        await Promise.all([
          pointsResponse.json(),
          metricsResponse.json(),
          warehousesResponse.json(),
          sellersResponse.json(),
        ]);
      const failedResponse = [
        [pointsResponse, pointsPayload],
        [metricsResponse, metricsPayload],
        [warehousesResponse, warehousesPayload],
        [sellersResponse, sellersPayload],
      ].find(([response]) => !(response as Response).ok);
      if (failedResponse) {
        const [response, payload] = failedResponse as [Response, unknown];
        throw new Error(
          responseMessage(payload, "Pick point ma'lumotlarini yuklab bo'lmadi."),
        );
      }

      setPickPoints(pointsPayload as PickPoint[]);
      setMetrics(metricsPayload as Metrics);
      setWarehouses(warehousesPayload as Warehouse[]);
      setSellers(sellersPayload as Seller[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Ma'lumotlarni yuklashda xatolik.",
      );
    } finally {
      setLoading(false);
    }
  }, [marketId, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      warehouseId: warehouses[0]?.id ?? "",
    });
    setLocationCenter({ lat: 41.311081, lng: 69.240562 });
    setMapSearch("");
    setMapSearchResults([]);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (point: PickPoint) => {
    setEditingId(point.id);
    setForm({
      warehouseId: point.warehouseId,
      assignedSellerId: point.assignedSeller?.id ?? "",
      title: point.title,
      address: point.address ?? "",
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      serviceRadiusMeters: String(point.serviceRadiusMeters),
      isActive: point.isActive,
    });
    setLocationCenter({ lat: point.latitude, lng: point.longitude });
    setMapSearch("");
    setMapSearchResults([]);
    setError("");
    setFormOpen(true);
  };

  const savePoint = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Tizimga qayta kiring.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      warehouseId: form.warehouseId,
      assignedSellerId: form.assignedSellerId || null,
      title: form.title.trim(),
      address: form.address.trim() || null,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      serviceRadiusMeters: Number(form.serviceRadiusMeters),
      isActive: form.isActive,
      ...(!editingId && { marketId }),
    };

    try {
      const response = await fetch(
        editingId
          ? `${API_URL}/pickpoints/${editingId}`
          : `${API_URL}/pickpoints`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const responsePayload = await response.json();
      if (!response.ok) {
        throw new Error(
          responseMessage(responsePayload, "Saqlashda xatolik yuz berdi."),
        );
      }
      setFormOpen(false);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Saqlashda xatolik yuz berdi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePoint = async (point: PickPoint) => {
    if (!token || !window.confirm(`"${point.title}" ni o'chirmoqchimisiz?`))
      return;
    try {
      const response = await fetch(`${API_URL}/pickpoints/${point.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(
          responseMessage(payload, "O'chirishda xatolik yuz berdi."),
        );
      }
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "O'chirishda xatolik yuz berdi.",
      );
    }
  };

  const updateForm = <K extends keyof PickPointForm>(
    field: K,
    value: PickPointForm[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const searchMapLocation = async () => {
    const query = mapSearch.trim();
    if (query.length < 3) {
      setMapSearchError("Qidiruv uchun kamida 3 ta belgi kiriting.");
      setMapSearchResults([]);
      return;
    }
    setMapSearchLoading(true);
    setMapSearchError("");
    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        limit: "5",
        q: query,
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { "Accept-Language": "uz,en" } },
      );
      if (!response.ok) {
        throw new Error(`Manzil qidiruvi amalga oshmadi (${response.status}).`);
      }
      const results = (await response.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
      }>;
      const places = results.flatMap((result) => {
        const latitude = Number(result.lat);
        const longitude = Number(result.lon);
        return Number.isFinite(latitude) && Number.isFinite(longitude)
          ? [{ label: result.display_name, latitude, longitude }]
          : [];
      });
      setMapSearchResults(places);
      if (!places.length) setMapSearchError("Manzil topilmadi.");
    } catch (searchError) {
      setMapSearchError(
        searchError instanceof Error
          ? searchError.message
          : "Manzil qidiruvida xatolik yuz berdi.",
      );
      setMapSearchResults([]);
    } finally {
      setMapSearchLoading(false);
    }
  };

  const selectMapLocation = (latitude: number, longitude: number) => {
    updateForm("latitude", String(latitude));
    updateForm("longitude", String(longitude));
    setLocationCenter({ lat: latitude, lng: longitude });
  };

  const selectedPosition =
    Number.isFinite(Number(form.latitude)) &&
    Number.isFinite(Number(form.longitude)) &&
    form.latitude !== "" &&
    form.longitude !== ""
      ? { lat: Number(form.latitude), lng: Number(form.longitude) }
      : null;
  const filteredPickPoints = pickPoints.filter((point) =>
    [
      point.title,
      point.address ?? "",
      point.warehouse.title,
      point.assignedSeller?.user.email ?? "",
      point.assignedSeller?.user.firstName ?? "",
      point.assignedSeller?.user.lastName ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(tableSearch.trim().toLocaleLowerCase()),
  );
  const tableRows = filteredPickPoints.map((point) => ({
    id: point.id,
    name: `${point.title}${point.address ? ` · ${point.address}` : ""}`,
    warehouse: point.warehouse.title,
    seller: point.assignedSeller
      ? `${[point.assignedSeller.user.firstName, point.assignedSeller.user.lastName]
          .filter(Boolean)
          .join(" ")} (${point.assignedSeller.user.email})`
      : "Biriktirilmagan",
    coordinates: `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`,
    radius: `${point.serviceRadiusMeters.toLocaleString()} m`,
    status: point.isActive ? "Faol" : "Nofaol",
  }));

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-8 p-6 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-l-4 border-sky-500 pl-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">
            Pick points
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Omborlarga bog&apos;langan xizmat nuqtalari va qamrov radiusi.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={warehouses.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Pick point qo&apos;shish
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Jami nuqtalar", value: metrics.total },
          { label: "Faol", value: metrics.active },
          { label: "Nofaol", value: metrics.inactive },
          {
            label: "O'rtacha xizmat radiusi",
            value: `${Math.round(metrics.averageServiceRadiusMeters)} m`,
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm"
          >
            <p className="text-sm text-neutral-400">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-[24px] border border-sky-500/15 bg-white/5 p-4 shadow-xl backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-white">
              Pick-point xaritasi
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {pickPoints.length} ta punkt · marker bosib joylashuvni ko‘ring
            </p>
          </div>
        </div>
        <Map
          height={340}
          markers={pickPoints.map((point) => ({
            id: point.id,
            lat: point.latitude,
            lng: point.longitude,
            title: `${point.title} · ${point.warehouse.title}`,
          }))}
          center={pickPoints[0]
            ? { lat: pickPoints[0].latitude, lng: pickPoints[0].longitude }
            : { lat: 41.311081, lng: 69.240562 }}
        />
      </section>

      <GlassModal
        open={formOpen}
        onClose={() => {
          if (!saving) setFormOpen(false);
        }}
        title={editingId ? "Pick pointni tahrirlash" : "Yangi pick point"}
        size="3xl"
        overflow="auto"
      >
        <form
          onSubmit={savePoint}
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1.5 text-sm text-neutral-400">
              Ombor
              <select
                required
                value={form.warehouseId}
                onChange={(event) => updateForm("warehouseId", event.target.value)}
                className={inputClass}
              >
                <option value="">Omborni tanlang</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.title}
                    {warehouse.code ? ` (${warehouse.code})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm text-neutral-400">
              Nomi
              <input
                required
                maxLength={255}
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                className={inputClass}
                placeholder="Masalan: Markaziy qabul nuqtasi"
              />
            </label>
            <label className="space-y-1.5 text-sm text-neutral-400">
              Manzil
              <input
                value={form.address}
                onChange={(event) => updateForm("address", event.target.value)}
                className={inputClass}
                placeholder="Ixtiyoriy manzil"
              />
            </label>
            <label className="space-y-1.5 text-sm text-neutral-400">
              Mas’ul sotuvchi
              <select
                value={form.assignedSellerId}
                onChange={(event) => updateForm("assignedSellerId", event.target.value)}
                className={inputClass}
              >
                <option value="">Sotuvchini biriktirmaslik</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {[seller.user.firstName, seller.user.lastName]
                      .filter(Boolean)
                      .join(" ") || seller.user.email}
                    {seller.user.firstName || seller.user.lastName
                      ? ` (${seller.user.email})`
                      : ""}
                  </option>
                ))}
              </select>
              {!sellers.length && (
                <span className="block text-xs text-amber-500">
                  Bu marketda seller roli bilan xodim topilmadi.
                </span>
              )}
            </label>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <label className="block space-y-1.5 text-sm text-neutral-400">
                Xarita orqali manzil qidirish
                <div className="flex gap-2">
                  <input
                    value={mapSearch}
                    onChange={(event) => setMapSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void searchMapLocation();
                      }
                    }}
                    className={inputClass}
                    placeholder="Shahar, tuman yoki manzil"
                  />
                  <button
                    type="button"
                    onClick={() => void searchMapLocation()}
                    disabled={mapSearchLoading}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                  >
                    <Search className="h-4 w-4" />
                    {mapSearchLoading ? "Qidirilmoqda..." : "Qidirish"}
                  </button>
                </div>
              </label>
              {mapSearchError && (
                <p role="status" className="text-sm text-rose-400">{mapSearchError}</p>
              )}
              {mapSearchResults.length > 0 && (
                <div className="space-y-1 rounded-xl border border-white/10 bg-black/10 p-2">
                  {mapSearchResults.map((place) => (
                    <button
                      key={`${place.latitude}:${place.longitude}`}
                      type="button"
                      onClick={() => {
                        selectMapLocation(place.latitude, place.longitude);
                        setMapSearchResults([]);
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-300 hover:bg-sky-500/10"
                    >
                      {place.label}
                    </button>
                  ))}
                </div>
              )}
              <Map
                height={360}
                center={locationCenter}
                selectedPosition={selectedPosition}
                onLocationSelect={selectMapLocation}
                markers={pickPoints.map((point) => ({
                  id: point.id,
                  lat: point.latitude,
                  lng: point.longitude,
                  title: point.title,
                }))}
              />
              <p className="text-xs text-neutral-500">
                Xarita ustiga bosing yoki qidiruv natijasini tanlang. OpenStreetMap ma’lumotlari.
              </p>
            </div>
            <label className="space-y-1.5 text-sm text-neutral-400">
              Kenglik (latitude)
              <input
                required
                type="number"
                min={-90}
                max={90}
                step="any"
                value={form.latitude}
                onChange={(event) => updateForm("latitude", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5 text-sm text-neutral-400">
              Uzunlik (longitude)
              <input
                required
                type="number"
                min={-180}
                max={180}
                step="any"
                value={form.longitude}
                onChange={(event) => updateForm("longitude", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5 text-sm text-neutral-400">
              Xizmat radiusi (metr)
              <input
                required
                type="number"
                min={1}
                step="any"
                value={form.serviceRadiusMeters}
                onChange={(event) =>
                  updateForm("serviceRadiusMeters", event.target.value)
                }
                className={inputClass}
              />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
              className="h-4 w-4 accent-sky-500"
            />
            Faol
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving || warehouses.length === 0}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5"
            >
              Bekor qilish
            </button>
          </div>
        </form>
      </GlassModal>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">
            Pick pointlar
          </h2>
          <input
            value={tableSearch}
            onChange={(event) => setTableSearch(event.target.value)}
            className={`${inputClass} max-w-sm`}
            placeholder="Nomi, manzil, ombor yoki sotuvchini qidirish"
            aria-label="Pick pointlarni qidirish"
          />
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-neutral-400">
            Yuklanmoqda...
          </p>
        ) : pickPoints.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-400">
            <MapPin className="mx-auto mb-3 h-7 w-7 text-sky-400" />
            {warehouses.length
              ? "Hozircha pick point mavjud emas."
              : "Avval ushbu market uchun ombor yarating."}
          </div>
        ) : (
          filteredPickPoints.length === 0 ? (
            <p className="p-8 text-center text-sm text-neutral-400">
              Qidiruv bo‘yicha pick point topilmadi.
            </p>
          ) : (
            <GlassTable
              columns={[
                { key: "name", label: "Nomi / manzili" },
                { key: "warehouse", label: "Ombor" },
                { key: "seller", label: "Mas’ul sotuvchi" },
                { key: "coordinates", label: "Koordinatalar" },
                { key: "radius", label: "Radius" },
                { key: "status", label: "Holat" },
              ]}
              data={tableRows}
              actions={(row) => {
                const point = pickPoints.find((item) => item.id === row.id);
                if (!point) return null;
                return (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(point)}
                      aria-label={`${point.title} ni tahrirlash`}
                      className="rounded-lg bg-sky-500/10 p-2 text-sky-400 hover:bg-sky-500/20"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deletePoint(point)}
                      aria-label={`${point.title} ni o'chirish`}
                      className="rounded-lg bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              }}
            />
          )
        )}
      </section>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Edit3, MapPin, Plus, Trash2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useTokenStore } from "@/app/_store/useTokenStore";

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
}

interface Metrics {
  total: number;
  active: number;
  inactive: number;
  averageServiceRadiusMeters: number;
}

interface PickPointForm {
  warehouseId: string;
  title: string;
  address: string;
  latitude: string;
  longitude: string;
  serviceRadiusMeters: string;
  isActive: boolean;
}

const emptyForm: PickPointForm = {
  warehouseId: "",
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

  const loadData = useCallback(async () => {
    if (!marketId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [pointsResponse, metricsResponse, warehousesResponse] =
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
        ]);

      const [pointsPayload, metricsPayload, warehousesPayload] =
        await Promise.all([
          pointsResponse.json(),
          metricsResponse.json(),
          warehousesResponse.json(),
        ]);
      const failedResponse = [
        [pointsResponse, pointsPayload],
        [metricsResponse, metricsPayload],
        [warehousesResponse, warehousesPayload],
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
    setError("");
    setFormOpen(true);
  };

  const openEdit = (point: PickPoint) => {
    setEditingId(point.id);
    setForm({
      warehouseId: point.warehouseId,
      title: point.title,
      address: point.address ?? "",
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      serviceRadiusMeters: String(point.serviceRadiusMeters),
      isActive: point.isActive,
    });
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

      {formOpen && (
        <form
          onSubmit={savePoint}
          className="space-y-5 rounded-2xl border border-sky-500/20 bg-white/5 p-5"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {editingId ? "Pick pointni tahrirlash" : "Yangi pick point"}
          </h2>
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
          <div className="flex gap-3">
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
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">
            Pick pointlar
          </h2>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Nomi / manzili</th>
                  <th className="px-5 py-3 font-medium">Ombor</th>
                  <th className="px-5 py-3 font-medium">Koordinatalar</th>
                  <th className="px-5 py-3 font-medium">Radius</th>
                  <th className="px-5 py-3 font-medium">Holat</th>
                  <th className="px-5 py-3 text-right font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-neutral-300">
                {pickPoints.map((point) => (
                  <tr key={point.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {point.title}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {point.address || "Manzil ko'rsatilmagan"}
                      </p>
                    </td>
                    <td className="px-5 py-4">{point.warehouse.title}</td>
                    <td className="px-5 py-4 tabular-nums">
                      {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                    </td>
                    <td className="px-5 py-4">
                      {point.serviceRadiusMeters.toLocaleString()} m
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          point.isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-neutral-500/10 text-neutral-400"
                        }`}
                      >
                        {point.isActive ? "Faol" : "Nofaol"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

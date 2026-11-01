"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Activity, Bell, Boxes, CircleDollarSign, ClipboardList, Package, RefreshCw, ShoppingBag, Users } from "lucide-react";
import UltimateGlassDiagram from "@/components/admin/GlassDiagram";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { API_URL } from "@/lib/api";

interface DashboardAnalytics {
  generatedAt: string;
  summary: {
    orderCount: number;
    pendingOrderCount: number;
    completedRevenue: number;
    activeProductCount: number;
    customerCount: number;
    availableInventoryUnits: number;
    openWarehouseTaskCount: number;
  };
  monthly: Array<{ month: string; orders: number; revenue: number }>;
}

interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

interface DashboardProps {
  params: Promise<{ locale: string; market: string }>;
}

function messageFrom(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = payload.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function Dashboard({ params }: DashboardProps) {
  const { locale, market } = React.use(params);
  const token = useTokenStore((state) => state.getActiveToken());
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!market || !token) {
      setLoading(false);
      setError(token ? "Market identifikatori topilmadi." : "Tizimga qayta kiring.");
      return;
    }

    setLoading(true);
    setError("");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [analyticsResponse, notificationsResponse] = await Promise.all([
        fetch(`${API_URL}/dashboard/market/${encodeURIComponent(market)}`, { headers }),
        fetch(`${API_URL}/notifications?limit=10`, { headers }),
      ]);
      const analyticsPayload: unknown = await analyticsResponse.json();
      if (!analyticsResponse.ok) {
        throw new Error(messageFrom(analyticsPayload, "Dashboard ma’lumotlari olinmadi."));
      }
      setAnalytics(analyticsPayload as DashboardAnalytics);
      setLastUpdated(new Date());

      if (notificationsResponse.ok) {
        const notificationPayload = (await notificationsResponse.json()) as {
          data?: DashboardNotification[];
        };
        setNotifications(notificationPayload.data ?? []);
      } else {
        console.error(
          "Dashboard bildirishnomalarini yuklab bo‘lmadi:",
          notificationsResponse.status,
        );
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Dashboard ma’lumotlarini yuklab bo‘lmadi.",
      );
    } finally {
      setLoading(false);
    }
  }, [market, token]);

  useEffect(() => {
    void loadDashboard();
    const timer = window.setInterval(() => void loadDashboard(), 60_000);
    return () => window.clearInterval(timer);
  }, [loadDashboard]);

  const markRead = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        throw new Error(messageFrom(payload, "Bildirishnoma o‘qilgan deb belgilanmadi."));
      }
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Xatolik yuz berdi.");
    }
  };

  const summary = analytics?.summary;
  const metrics = [
    {
      label: "Yakunlangan buyurtmalar tushumi",
      value: `${(summary?.completedRevenue ?? 0).toLocaleString()} so‘m`,
      icon: CircleDollarSign,
      color: "text-emerald-500",
    },
    {
      label: "Jami buyurtmalar",
      value: (summary?.orderCount ?? 0).toLocaleString(),
      icon: ShoppingBag,
      color: "text-sky-500",
    },
    {
      label: "Ko‘rib chiqilayotgan buyurtmalar",
      value: (summary?.pendingOrderCount ?? 0).toLocaleString(),
      icon: ClipboardList,
      color: "text-amber-500",
    },
    {
      label: "Sotuvdagi mahsulotlar",
      value: (summary?.activeProductCount ?? 0).toLocaleString(),
      icon: Package,
      color: "text-violet-500",
    },
    {
      label: "Obunachi mijozlar",
      value: (summary?.customerCount ?? 0).toLocaleString(),
      icon: Users,
      color: "text-indigo-500",
    },
    {
      label: "Sotuvga yaroqli ombor qoldig‘i",
      value: (summary?.availableInventoryUnits ?? 0).toLocaleString(),
      icon: Boxes,
      color: "text-cyan-500",
    },
  ];

  return (
    <main className="space-y-7 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-[28px] border border-sky-500/10 bg-white/60 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-900/50 sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-500">
            {locale.toUpperCase()} · Market {market}
          </p>
          <h1 className="mt-2 text-3xl font-black text-neutral-900 dark:text-white">
            Market ko‘rsatkichlari
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Buyurtma, tushum, mahsulot va ombor ma’lumotlari bazadan olinadi.
            {lastUpdated ? ` Yangilandi: ${lastUpdated.toLocaleTimeString(locale)}.` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-600 transition hover:bg-sky-500/15 disabled:opacity-50 dark:text-sky-300"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Yangilash
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
          {error}
        </div>
      )}

      {loading && !analytics ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-neutral-500">
          Dashboard ma’lumotlari yuklanmoqda...
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article
                  key={metric.label}
                  className="rounded-[24px] border border-sky-500/10 bg-white/60 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/50"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`rounded-xl bg-current/10 p-3 ${metric.color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{metric.label}</p>
                  <p className="mt-1 text-2xl font-black text-neutral-900 dark:text-white">
                    {metric.value}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
            <UltimateGlassDiagram
              title="So‘nggi 6 oydagi buyurtmalar va tushum"
              description="Buyurtma sanasi va yakunlangan buyurtmalar summasi bo‘yicha real DB agregatsiyasi"
              data={(analytics?.monthly ?? []).map((item) => ({
                ...item,
                month: new Intl.DateTimeFormat(locale, {
                  month: "short",
                  year: "2-digit",
                }).format(new Date(`${item.month}-01T00:00:00`)),
              }))}
              xAxisKey="month"
              height={360}
              series={[
                { key: "revenue", label: "Yakunlangan tushum (so‘m)", color: "#34d399" },
                { key: "orders", label: "Buyurtmalar", color: "#38bdf8" },
              ]}
              defaultChartType="bar"
              allowedChartTypes={["bar", "line", "area"]}
              showTimeRangeFilter={false}
              showRefreshButton={false}
            />

            <section className="rounded-[24px] border border-sky-500/10 bg-white/60 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Live</p>
                  <h2 className="mt-1 text-lg font-bold text-neutral-900 dark:text-white">Bildirishnomalar</h2>
                </div>
                <Bell className="h-5 w-5 text-sky-500" />
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {summary?.openWarehouseTaskCount ?? 0} ta ochiq ombor topshirig‘i
              </p>
              <div className="mt-5 space-y-3">
                {notifications.length ? notifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`rounded-xl border p-3 ${
                      notification.readAt
                        ? "border-white/5 bg-black/[0.02] dark:bg-white/[0.02]"
                        : "border-sky-500/20 bg-sky-500/5"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Activity className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">{notification.message}</p>
                        <time className="mt-2 block text-[11px] text-neutral-400">
                          {new Date(notification.createdAt).toLocaleString(locale)}
                        </time>
                      </div>
                      {!notification.readAt && (
                        <button
                          type="button"
                          onClick={() => void markRead(notification.id)}
                          className="shrink-0 text-xs font-semibold text-sky-500 hover:text-sky-400"
                        >
                          O‘qildi
                        </button>
                      )}
                    </div>
                  </article>
                )) : (
                  <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-neutral-500">
                    Hozircha bildirishnomalar yo‘q.
                  </p>
                )}
              </div>
            </section>
          </section>
        </>
      )}
    </main>
  );
}

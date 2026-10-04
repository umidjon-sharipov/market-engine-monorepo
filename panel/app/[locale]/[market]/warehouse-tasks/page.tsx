"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ClipboardList, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useTokenStore } from "@/app/_store/useTokenStore";

type Warehouse = { id: string; title: string; code: string | null };
type Bin = {
  id: string;
  code: string;
  title: string | null;
  zone?: { title: string };
};
type Worker = {
  id: string;
  role: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};
type ProductOptionItem = { id: string; key: string; value: number };
type Product = {
  id: string;
  title: string;
  uom: string;
  options?: Array<{ id: string; title: string; items: ProductOptionItem[] }>;
};
type TaskStatus =
  | "OPEN"
  | "ASSIGNED"
  | "PICKING"
  | "PICKED"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "CANCELLED";
type Task = {
  id: string;
  status: TaskStatus;
  quantity: number;
  note: string | null;
  assignedAt: string | null;
  createdAt: string;
  assignedWorker: Worker | null;
  pickerWorker: Worker | null;
  transporterWorker: Worker | null;
  warehouse: Warehouse;
  sourceBin: Bin;
  destinationWarehouse: Warehouse | null;
  destinationBin: Bin | null;
  product: Product;
  optionItem: ProductOptionItem | null;
  orderId: string | null;
  reservation: { id: string; lotNumber: string; quantity: number } | null;
};

type TaskForm = {
  assignedWorkerId: string;
  warehouseId: string;
  sourceBinId: string;
  destinationWarehouseId: string;
  destinationBinId: string;
  productId: string;
  optionItemId: string;
  quantity: string;
  note: string;
};

const emptyForm: TaskForm = {
  assignedWorkerId: "",
  warehouseId: "",
  sourceBinId: "",
  destinationWarehouseId: "",
  destinationBinId: "",
  productId: "",
  optionItemId: "",
  quantity: "1",
  note: "",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-neutral-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500";
const statusNames: Record<TaskStatus, string> = {
  OPEN: "Open · unassigned",
  ASSIGNED: "Assigned",
  PICKING: "Picking",
  PICKED: "Picked",
  IN_TRANSIT: "In transit",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function messageFrom(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = payload.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

function workerName(worker: Worker | null | undefined) {
  if (!worker) return "—";
  const name = [worker.user.firstName, worker.user.lastName]
    .filter(Boolean)
    .join(" ");
  return name || worker.user.email;
}

export default function WarehouseTasksPage() {
  const { market = "" } = useParams<{ market: string }>();
  const token = useTokenStore((state) => state.getActiveToken());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [binsByWarehouse, setBinsByWarehouse] = useState<Record<string, Bin[]>>(
    {},
  );
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orderLinked, setOrderLinked] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : null),
    [token],
  );

  const loadData = useCallback(async () => {
    if (!market || !headers) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ marketId: market, page: "1", limit: "100" });
      if (statusFilter) query.set("status", statusFilter);
      const responses = await Promise.all([
        fetch(`${API_URL}/warehouse-tasks?${query}`, { headers }),
        fetch(
          `${API_URL}/warehouse-tasks/options?marketId=${encodeURIComponent(market)}`,
          {
          headers,
          },
        ),
      ]);
      const payloads = await Promise.all(responses.map((response) => response.json()));
      const failed = responses.findIndex((response) => !response.ok);
      if (failed >= 0) {
        throw new Error(
          messageFrom(payloads[failed], "Warehouse task ma'lumotlarini yuklab bo'lmadi."),
        );
      }

      const taskResult = payloads[0] as { data: Task[] };
      const options = payloads[1] as {
        workers: Worker[];
        warehouses: Array<
          Warehouse & { zones: Array<{ title: string; bins: Bin[] }> }
        >;
        products: Product[];
      };
      setTasks(taskResult.data);
      setWorkers(options.workers);
      setProducts(options.products);
      setWarehouses(options.warehouses);
      setBinsByWarehouse(
        Object.fromEntries(
          options.warehouses.map((warehouse) => [
            warehouse.id,
            warehouse.zones.flatMap((zone) =>
              zone.bins.map((bin) => ({ ...bin, zone: { title: zone.title } })),
            ),
          ]),
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Ma'lumotlarni yuklashda xatolik.",
      );
    } finally {
      setLoading(false);
    }
  }, [headers, market, statusFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const selectedProduct = products.find((product) => product.id === form.productId);
  const productItems =
    selectedProduct?.options?.flatMap((option) =>
      option.items.map((item) => ({
        ...item,
        optionTitle: option.title,
      })),
    ) ?? [];

  const openCreate = () => {
    setEditingId(null);
    setOrderLinked(false);
    setForm({
      ...emptyForm,
      assignedWorkerId: workers[0]?.id ?? "",
      warehouseId: warehouses[0]?.id ?? "",
    });
    setError("");
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setOrderLinked(!!task.orderId);
    setForm({
      assignedWorkerId: task.assignedWorker?.id ?? "",
      warehouseId: task.warehouse.id,
      sourceBinId: task.sourceBin.id,
      destinationWarehouseId: task.destinationWarehouse?.id ?? "",
      destinationBinId: task.destinationBin?.id ?? "",
      productId: task.product.id,
      optionItemId: task.optionItem?.id ?? "",
      quantity: String(task.quantity),
      note: task.note ?? "",
    });
    setError("");
    setFormOpen(true);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!headers) {
      setError("Tizimga qayta kiring.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      assignedWorkerId: form.assignedWorkerId,
      warehouseId: form.warehouseId,
      sourceBinId: form.sourceBinId,
      destinationWarehouseId:
        form.destinationWarehouseId || (editingId ? null : undefined),
      destinationBinId: form.destinationBinId || (editingId ? null : undefined),
      productId: form.productId,
      optionItemId: form.optionItemId || (editingId ? null : undefined),
      quantity: Number(form.quantity),
      note: form.note.trim() || null,
      ...(!editingId && { marketId: market }),
    };
    try {
      const response = await fetch(
        editingId
          ? `${API_URL}/warehouse-tasks/${editingId}?marketId=${encodeURIComponent(market)}`
          : `${API_URL}/warehouse-tasks`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(messageFrom(result, "Saqlashda xatolik yuz berdi."));
      }
      setFormOpen(false);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Saqlashda xatolik.",
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (task: Task, status: TaskStatus) => {
    if (!headers) return;
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/warehouse-tasks/${task.id}/status?marketId=${encodeURIComponent(market)}`,
        {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(messageFrom(result, "Statusni yangilab bo'lmadi."));
      }
      await loadData();
    } catch (statusError) {
      setError(
        statusError instanceof Error ? statusError.message : "Status xatoligi.",
      );
    }
  };

  const deleteTask = async (task: Task) => {
    if (!headers || !window.confirm("Ushbu taskni o‘chirishni tasdiqlaysizmi?")) {
      return;
    }
    const response = await fetch(
      `${API_URL}/warehouse-tasks/${task.id}?marketId=${encodeURIComponent(market)}`,
      { method: "DELETE", headers },
    );
    const result = await response.json();
    if (!response.ok) {
      setError(messageFrom(result, "Taskni o‘chirib bo‘lmadi."));
      return;
    }
    await loadData();
  };

  const nextStatus = (task: Task): TaskStatus | null => {
    if (task.status === "ASSIGNED") return "PICKING";
    if (task.status === "PICKING") return "PICKED";
    if (task.status === "PICKED") {
      return task.destinationBin ? "IN_TRANSIT" : "COMPLETED";
    }
    if (task.status === "IN_TRANSIT") return "COMPLETED";
    return null;
  };

  const binOptions = (warehouseId: string) => binsByWarehouse[warehouseId] ?? [];

  return (
    <main className="min-h-screen space-y-6 bg-neutral-950 p-4 text-white sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-400">Warehouse operations</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <ClipboardList className="h-6 w-6 text-sky-400" />
            Warehouse tasks
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Filter by task status"
            className={`${inputClass} w-auto`}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            {Object.entries(statusNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-50"
            onClick={openCreate}
            disabled={!warehouses.length || !workers.length || !products.length}
          >
            <Plus className="h-4 w-4" />
            Assign task
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={submitForm}
          className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900/70 p-5 md:grid-cols-3"
        >
          <h2 className="md:col-span-3 text-lg font-medium">
            {editingId ? "Edit assigned task" : "Create warehouse task"}
          </h2>
          <label className="space-y-1 text-sm text-neutral-300">
            Assigned worker
            <select
              required
              className={inputClass}
              value={form.assignedWorkerId}
              onChange={(event) =>
                setForm({ ...form, assignedWorkerId: event.target.value })
              }
            >
              <option value="">Choose worker</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {workerName(worker)} · {worker.role}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-neutral-300">
            Product
            <select
              required
              disabled={orderLinked}
              className={inputClass}
              value={form.productId}
              onChange={(event) =>
                setForm({ ...form, productId: event.target.value, optionItemId: "" })
              }
            >
              <option value="">Choose product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-neutral-300">
            Option item (optional)
            <select
              disabled={orderLinked}
              className={inputClass}
              value={form.optionItemId}
              onChange={(event) =>
                setForm({ ...form, optionItemId: event.target.value })
              }
            >
              <option value="">No option</option>
              {productItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.optionTitle}: {item.key} ({item.value})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-neutral-300">
            Source warehouse
            <select
              required
              disabled={orderLinked}
              className={inputClass}
              value={form.warehouseId}
              onChange={(event) =>
                setForm({
                  ...form,
                  warehouseId: event.target.value,
                  sourceBinId: "",
                })
              }
            >
              <option value="">Choose warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.title}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-neutral-300">
            Source bin
            <select
              required
              disabled={orderLinked}
              className={inputClass}
              value={form.sourceBinId}
              onChange={(event) =>
                setForm({ ...form, sourceBinId: event.target.value })
              }
            >
              <option value="">Choose source bin</option>
              {binOptions(form.warehouseId).map((bin) => (
                <option key={bin.id} value={bin.id}>
                  {bin.code} {bin.zone?.title ? `· ${bin.zone.title}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-neutral-300">
            Quantity
            <input
              required
              disabled={orderLinked}
              className={inputClass}
              type="number"
              min="0.001"
              step="0.001"
              value={form.quantity}
              onChange={(event) =>
                setForm({ ...form, quantity: event.target.value })
              }
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-300">
            Destination warehouse (optional)
            <select
              disabled={orderLinked}
              className={inputClass}
              value={form.destinationWarehouseId}
              onChange={(event) =>
                setForm({
                  ...form,
                  destinationWarehouseId: event.target.value,
                  destinationBinId: "",
                })
              }
            >
              <option value="">No destination</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.title}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-neutral-300">
            Destination bin (optional)
            <select
              className={inputClass}
              value={form.destinationBinId}
              onChange={(event) =>
                setForm({ ...form, destinationBinId: event.target.value })
              }
              disabled={orderLinked || !form.destinationWarehouseId}
            >
              <option value="">Choose destination bin</option>
              {binOptions(form.destinationWarehouseId).map((bin) => (
                <option key={bin.id} value={bin.id}>
                  {bin.code} {bin.zone?.title ? `· ${bin.zone.title}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-neutral-300 md:col-span-3">
            Note
            <textarea
              className={inputClass}
              rows={2}
              maxLength={2000}
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2 md:col-span-3">
            <button
              type="button"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-medium">Task monitor</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {tasks.length} tasks in the current view
            </p>
          </div>
          <button
            aria-label="Refresh tasks"
            onClick={() => void loadData()}
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-neutral-400">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400">No warehouse tasks found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="px-5 py-3">Task / product</th>
                  <th className="px-5 py-3">Source → destination</th>
                  <th className="px-5 py-3">Assignment / audit</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tasks.map((task) => (
                  <tr key={task.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="font-medium">{task.product.title}</div>
                      <div className="mt-1 text-neutral-400">
                        {task.quantity} {task.product.uom}
                        {task.optionItem ? ` · ${task.optionItem.key}` : ""}
                      </div>
                      {task.reservation?.lotNumber && (
                        <div className="mt-1 text-xs text-neutral-400">
                          Lot: {task.reservation.lotNumber}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-neutral-500">
                        {new Date(task.assignedAt ?? task.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>{task.warehouse.title} / {task.sourceBin.code}</div>
                      <div className="mt-1 text-neutral-400">
                        {task.destinationWarehouse
                          ? `${task.destinationWarehouse.title} / ${task.destinationBin?.code}`
                          : "No destination"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>Assigned: {workerName(task.assignedWorker)}</div>
                      <div className="mt-1 text-xs text-neutral-400">
                        Picker: {workerName(task.pickerWorker)}
                      </div>
                      <div className="mt-1 text-xs text-neutral-400">
                        Transporter: {workerName(task.transporterWorker)}
                      </div>
                      {task.orderId && (
                        <div className="mt-1 text-xs text-neutral-500">
                          Order: {task.orderId}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-sky-400/10 px-2.5 py-1 text-xs font-medium text-sky-300">
                        {statusNames[task.status]}
                      </span>
                      {task.note && (
                        <p className="mt-2 max-w-xs text-xs text-neutral-400">
                          {task.note}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {nextStatus(task) && (
                          <button
                            className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/25"
                            onClick={() => void changeStatus(task, nextStatus(task)!)}
                          >
                            {statusNames[nextStatus(task)!]}
                          </button>
                        )}
                        {!["COMPLETED", "CANCELLED"].includes(task.status) && (
                          <button
                            className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                            onClick={() => void changeStatus(task, "CANCELLED")}
                          >
                            Cancel
                          </button>
                        )}
                        {["OPEN", "ASSIGNED"].includes(task.status) && (
                          <>
                            <button
                              aria-label="Edit task"
                              className="rounded-lg p-1.5 text-neutral-300 hover:bg-white/10"
                              onClick={() => openEdit(task)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              aria-label="Delete task"
                              className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10"
                              onClick={() => void deleteTask(task)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
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

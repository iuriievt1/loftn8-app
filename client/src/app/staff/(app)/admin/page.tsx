"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAdminSummary,
  getAdminShifts,
  getAdminRatings,
  getAdminUsers,
  getAdminStaffPerformance,
  getAdminShiftDetails,
  type AdminSummary,
  type AdminShiftItem,
  type AdminRatingItem,
  type AdminUserItem,
  type AdminStaffPerformanceItem,
  type AdminShiftDetails,
  type AdminRange,
} from "@/lib/staffApi";
import { useStaffSession } from "@/providers/staffSession";

type AdminTab = "overview" | "shifts" | "ratings" | "users" | "staff";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-base font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function RangeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function TableShell({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className={`grid bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500`} style={{ gridTemplateColumns: columns.join(" ") }}>
        {children}
      </div>
    </div>
  );
}

function ShiftDetailsDrawer({
  open,
  onClose,
  data,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  data: AdminShiftDetails | null;
  loading: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="ml-auto h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">Shift details</div>
            <div className="mt-1 text-sm text-slate-500">
              Подробная статистика смены
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Закрыть
          </button>
        </div>

        <div className="p-5">
          {loading ? <div className="text-sm text-slate-500">Загрузка…</div> : null}

          {!loading && !data ? (
            <div className="text-sm text-slate-500">Нет данных по смене.</div>
          ) : null}

          {!loading && data ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <StatCard title="Status" value={data.shift.status} />
                <StatCard title="Opened" value={formatDate(data.shift.openedAt)} />
                <StatCard title="Closed" value={formatDate(data.shift.closedAt)} />
                <StatCard title="Revenue" value={`${data.stats.revenueCzk} Kč`} />
                <StatCard title="Orders" value={data.stats.ordersCount} />
                <StatCard title="Payments" value={data.stats.paymentsCount} />
                <StatCard title="Calls" value={data.stats.callsCount} />
                <StatCard title="Ratings" value={data.stats.ratingsCount} />
                <StatCard title="Registrations" value={data.stats.registrationsCount} />
              </div>

              <SectionCard title="Shift meta" subtitle="Базовая информация по смене">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <div>
                      <span className="font-medium text-slate-900">Opened by:</span>{" "}
                      {data.shift.openedByManager?.username ?? "—"}
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-slate-900">Closed by:</span>{" "}
                      {data.shift.closedByManager?.username ?? "—"}
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-slate-900">Shift ID:</span>{" "}
                      {data.shift.id}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <div>
                      <span className="font-medium text-slate-900">Avg overall:</span>{" "}
                      {data.stats.avgOverall?.toFixed(1) ?? "—"}
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-slate-900">Food:</span>{" "}
                      {data.stats.avgFood?.toFixed(1) ?? "—"}
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-slate-900">Drinks:</span>{" "}
                      {data.stats.avgDrinks?.toFixed(1) ?? "—"}
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-slate-900">Hookah:</span>{" "}
                      {data.stats.avgHookah?.toFixed(1) ?? "—"}
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Participants" subtitle="Кто участвовал в смене">
                <div className="space-y-3">
                  {data.shift.participants.map((p) => (
                    <div key={p.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm font-medium text-slate-900">
                          {p.staff?.username ?? p.staffId} • {p.role}
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.isActive ? "active" : "inactive"}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Joined: {formatDate(p.joinedAt)} • Left: {formatDate(p.leftAt)}
                      </div>
                    </div>
                  ))}
                  {data.shift.participants.length === 0 ? (
                    <div className="text-sm text-slate-500">Нет участников.</div>
                  ) : null}
                </div>
              </SectionCard>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function StaffAdminPage() {
  const { staff } = useStaffSession();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [range, setRange] = useState<AdminRange>("all");
  const [query, setQuery] = useState("");

  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [shifts, setShifts] = useState<AdminShiftItem[]>([]);
  const [ratings, setRatings] = useState<AdminRatingItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [staffPerf, setStaffPerf] = useState<AdminStaffPerformanceItem[]>([]);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<AdminShiftDetails | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);

  const isAllowed = staff?.role === "MANAGER" || staff?.role === "ADMIN";

  const load = async (activeRange: AdminRange = range) => {
    setLoading(true);
    setErr(null);

    const [s1, s2, s3, s4, s5] = await Promise.all([
      getAdminSummary(activeRange),
      getAdminShifts(activeRange),
      getAdminRatings(activeRange),
      getAdminUsers(activeRange),
      getAdminStaffPerformance(activeRange),
    ]);

    if (!s1.ok) return setErr(s1.error), setLoading(false);
    if (!s2.ok) return setErr(s2.error), setLoading(false);
    if (!s3.ok) return setErr(s3.error), setLoading(false);
    if (!s4.ok) return setErr(s4.error), setLoading(false);
    if (!s5.ok) return setErr(s5.error), setLoading(false);

    setSummary(s1.data.summary);
    setShifts(s2.data.shifts);
    setRatings(s3.data.ratings);
    setUsers(s4.data.users);
    setStaffPerf(s5.data.staff);

    setLoading(false);
  };

  useEffect(() => {
    void load(range);
  }, [range]);

  const openShiftDetails = async (id: string) => {
    setSelectedShiftId(id);
    setShiftLoading(true);
    setSelectedShift(null);

    const r = await getAdminShiftDetails(id);
    setShiftLoading(false);

    if (!r.ok) {
      setErr(r.error || "Failed to load shift details");
      return;
    }

    setSelectedShift(r.data);
  };

  const filteredShifts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shifts;

    return shifts.filter((shift) => {
      return (
        shift.id.toLowerCase().includes(q) ||
        shift.status.toLowerCase().includes(q) ||
        (shift.openedByManager?.username ?? "").toLowerCase().includes(q)
      );
    });
  }, [shifts, query]);

  const filteredRatings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ratings;

    return ratings.filter((r) => {
      return (
        r.table.code.toLowerCase().includes(q) ||
        (r.comment ?? "").toLowerCase().includes(q) ||
        (r.session.user?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [ratings, query]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query]);

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staffPerf;

    return staffPerf.filter((s) => {
      return s.username.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
    });
  }, [staffPerf, query]);

  const latestRatings = filteredRatings.slice(0, 6);
  const latestUsers = filteredUsers.slice(0, 6);
  const topStaff = [...filteredStaff]
    .sort((a, b) => b.confirmedPaymentsSumCzk - a.confirmedPaymentsSumCzk)
    .slice(0, 6);

  if (!isAllowed) {
    return (
      <main className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm">
        <div className="text-lg font-semibold">Admin panel</div>
        <div className="mt-2 text-sm text-slate-500">Доступ только для manager/admin.</div>
      </main>
    );
  }

  return (
    <>
      <main className="rounded-[28px] border border-slate-200 bg-[#f6f7fb] p-4 text-slate-900 shadow-sm lg:p-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Loft N8 Analytics
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Admin Dashboard
            </div>
            <div className="mt-2 max-w-2xl text-sm text-slate-500">
              Чистая панель статистики по выручке, сменам, отзывам, пользователям и эффективности персонала.
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-[420px]">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск: user / table / username / comment"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => void load(range)}
                className="h-11 rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Обновить
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
                Overview
              </TabButton>
              <TabButton active={tab === "shifts"} onClick={() => setTab("shifts")}>
                Shifts
              </TabButton>
              <TabButton active={tab === "ratings"} onClick={() => setTab("ratings")}>
                Ratings
              </TabButton>
              <TabButton active={tab === "users"} onClick={() => setTab("users")}>
                Users
              </TabButton>
              <TabButton active={tab === "staff"} onClick={() => setTab("staff")}>
                Staff
              </TabButton>
            </div>

            <div className="flex flex-wrap gap-2">
              <RangeButton active={range === "all"} onClick={() => setRange("all")}>
                All
              </RangeButton>
              <RangeButton active={range === "today"} onClick={() => setRange("today")}>
                Today
              </RangeButton>
              <RangeButton active={range === "week"} onClick={() => setRange("week")}>
                7 days
              </RangeButton>
              <RangeButton active={range === "month"} onClick={() => setRange("month")}>
                30 days
              </RangeButton>
            </div>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
            Загрузка данных…
          </div>
        ) : null}

        {!loading && tab === "overview" && summary ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Revenue" value={`${summary.totalRevenueCzk} Kč`} hint="подтверждённые оплаты" />
              <StatCard title="Users" value={summary.usersCount} />
              <StatCard title="Orders" value={summary.ordersCount} />
              <StatCard title="Calls" value={summary.callsCount} />
              <StatCard title="Ratings" value={summary.ratingsCount} />
              <StatCard title="Confirmed payments" value={summary.confirmedPaymentsCount} />
              <StatCard
                title="Average rating"
                value={summary.avgOverall ? summary.avgOverall.toFixed(1) : "—"}
                hint={`Food ${summary.avgFood?.toFixed(1) ?? "—"} • Drinks ${summary.avgDrinks?.toFixed(1) ?? "—"} • Hookah ${summary.avgHookah?.toFixed(1) ?? "—"}`}
              />
              <StatCard
                title="Shifts"
                value={summary.shiftsTotal}
                hint={summary.openShift ? `Open: ${formatDate(summary.openShift.openedAt)}` : "Сейчас смена закрыта"}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard title="Latest ratings" subtitle="Свежий фид отзывов">
                <div className="space-y-3">
                  {latestRatings.map((r) => (
                    <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        Стол {r.table.code} • overall {r.overall}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Food {r.food ?? "—"} • Drinks {r.drinks ?? "—"} • Hookah {r.hookah ?? "—"}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{formatDate(r.createdAt)}</div>
                      {r.comment ? <div className="mt-2 text-sm text-slate-700">{r.comment}</div> : null}
                    </div>
                  ))}
                  {latestRatings.length === 0 ? (
                    <div className="text-sm text-slate-500">Нет отзывов.</div>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard title="Latest users" subtitle="Новые регистрации">
                <div className="space-y-3">
                  {latestUsers.map((u) => (
                    <div key={u.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{u.phone}</div>
                      <div className="mt-1 text-xs text-slate-400">{u.email ?? "без email"}</div>
                      <div className="mt-1 text-xs text-slate-400">{formatDate(u.createdAt)}</div>
                    </div>
                  ))}
                  {latestUsers.length === 0 ? (
                    <div className="text-sm text-slate-500">Нет пользователей.</div>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard title="Top staff" subtitle="По сумме подтверждённых оплат">
                <div className="space-y-3">
                  {topStaff.map((s) => (
                    <div key={s.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {s.username} • {s.role}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Смен: {s.shiftsJoined} • Payments: {s.confirmedPaymentsCount}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {s.confirmedPaymentsSumCzk} Kč
                        </div>
                      </div>
                    </div>
                  ))}
                  {topStaff.length === 0 ? (
                    <div className="text-sm text-slate-500">Нет staff данных.</div>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard title="Current status" subtitle="Быстрые показатели">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Active shift</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900">
                      {summary.openShift ? "Open" : "Closed"}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      {summary.openShift ? formatDate(summary.openShift.openedAt) : "Сейчас смена закрыта"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Current range</div>
                    <div className="mt-2 text-2xl font-semibold capitalize text-slate-900">{summary.range}</div>
                    <div className="mt-2 text-sm text-slate-500">Фильтр применяется ко всем данным панели</div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        ) : null}

        {!loading && tab === "shifts" && (
          <SectionCard
            title="Shifts"
            subtitle="История смен и быстрый просмотр деталей"
            right={<div className="text-sm text-slate-500">Всего: {filteredShifts.length}</div>}
          >
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_120px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Opened</div>
                <div>Status</div>
                <div>Opened by</div>
                <div>Participants</div>
                <div>Action</div>
              </div>

              {filteredShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="grid grid-cols-[1.2fr_1fr_1fr_1fr_120px] items-center border-t border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  <div>
                    <div className="font-medium text-slate-900">{formatDate(shift.openedAt)}</div>
                    <div className="text-xs text-slate-400">{shift.id}</div>
                  </div>
                  <div>{shift.status}</div>
                  <div>{shift.openedByManager?.username ?? "—"}</div>
                  <div>{shift.participants?.length ?? 0}</div>
                  <div>
                    <button
                      onClick={() => void openShiftDetails(shift.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}

              {filteredShifts.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">Нет смен.</div>
              ) : null}
            </div>
          </SectionCard>
        )}

        {!loading && tab === "ratings" && (
          <SectionCard
            title="Ratings"
            subtitle="Отзывы по столам и пользователям"
            right={<div className="text-sm text-slate-500">Всего: {filteredRatings.length}</div>}
          >
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[120px_120px_1fr_180px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Table</div>
                <div>Overall</div>
                <div>Comment</div>
                <div>Date</div>
              </div>

              {filteredRatings.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[120px_120px_1fr_180px] border-t border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="font-medium text-slate-900">{r.table.code}</div>
                  <div>{r.overall}</div>
                  <div>{r.comment || "—"}</div>
                  <div>{formatDate(r.createdAt)}</div>
                </div>
              ))}

              {filteredRatings.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">Нет отзывов.</div>
              ) : null}
            </div>
          </SectionCard>
        )}

        {!loading && tab === "users" && (
          <SectionCard
            title="Users"
            subtitle="Зарегистрированные пользователи"
            right={<div className="text-sm text-slate-500">Всего: {filteredUsers.length}</div>}
          >
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1fr_1fr_1fr_180px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Name</div>
                <div>Phone</div>
                <div>Email</div>
                <div>Created</div>
              </div>

              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-[1fr_1fr_1fr_180px] border-t border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="font-medium text-slate-900">{u.name}</div>
                  <div>{u.phone}</div>
                  <div>{u.email ?? "—"}</div>
                  <div>{formatDate(u.createdAt)}</div>
                </div>
              ))}

              {filteredUsers.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">Нет пользователей.</div>
              ) : null}
            </div>
          </SectionCard>
        )}

        {!loading && tab === "staff" && (
          <SectionCard
            title="Staff performance"
            subtitle="Эффективность персонала по сменам и оплатам"
            right={<div className="text-sm text-slate-500">Всего: {filteredStaff.length}</div>}
          >
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1fr_140px_140px_180px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>User</div>
                <div>Shifts</div>
                <div>Payments</div>
                <div>Revenue</div>
              </div>

              {filteredStaff.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[1fr_140px_140px_180px] border-t border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  <div>
                    <div className="font-medium text-slate-900">{s.username}</div>
                    <div className="text-xs text-slate-400">{s.role}</div>
                  </div>
                  <div>{s.shiftsJoined}</div>
                  <div>{s.confirmedPaymentsCount}</div>
                  <div>{s.confirmedPaymentsSumCzk} Kč</div>
                </div>
              ))}

              {filteredStaff.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">Нет staff данных.</div>
              ) : null}
            </div>
          </SectionCard>
        )}
      </main>

      <ShiftDetailsDrawer
        open={!!selectedShiftId}
        onClose={() => {
          setSelectedShiftId(null);
          setSelectedShift(null);
        }}
        data={selectedShift}
        loading={shiftLoading}
      />
    </>
  );
}
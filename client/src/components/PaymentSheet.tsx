"use client";

export function PaymentSheet({
  open,
  onClose,
  onPick,
  availablePointsCzk = 0,
  useLoyalty,
  onToggleLoyalty,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (m: "CARD" | "CASH") => void;
  availablePointsCzk?: number;
  useLoyalty: boolean;
  onToggleLoyalty: (next: boolean) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 px-4 pb-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0d0d0d] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-semibold text-white">Choose how you want to pay</div>
        <div className="mt-1 text-xs text-white/60">A staff member will come to you for card terminal or cash.</div>

        {availablePointsCzk > 0 ? (
          <button
            className={[
              "mt-3 w-full rounded-3xl border px-4 py-3 text-left text-sm transition",
              useLoyalty
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                : "border-white/10 bg-white/5 text-white",
            ].join(" ")}
            onClick={() => onToggleLoyalty(!useLoyalty)}
          >
            <div className="font-semibold">{useLoyalty ? "Using cashback" : "Use cashback"}</div>
            <div className="mt-1 text-xs opacity-75">{availablePointsCzk} Kč available</div>
          </button>
        ) : (
          <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/55">
            No cashback available yet
          </div>
        )}

        <button
          className="mt-3 w-full rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-black"
          onClick={() => onPick("CARD")}
        >
          Card (terminal)
        </button>

        <button
          className="mt-2 w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white"
          onClick={() => onPick("CASH")}
        >
          Cash
        </button>

        <button
          disabled
          className="mt-2 w-full rounded-3xl border border-dashed border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/35"
        >
          Apple Pay (coming soon)
        </button>

        <button
          className="mt-3 w-full rounded-3xl border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-white/70"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

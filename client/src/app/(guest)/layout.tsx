import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { CartBar } from "@/components/CartBar";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-28">
        <Suspense fallback={null}>{children}</Suspense>
      </div>
      <CartBar />
      <BottomNav />
    </>
  );
}
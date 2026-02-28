import Link from "next/link";
import { Plus } from "lucide-react";
import { RoomsFilter } from "./RoomsFilter";

export default function RoomsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            部屋一覧
          </h1>
        </div>
        <Link
          href="/rooms/new"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, var(--accent), #6d28d9)",
            boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
          }}
        >
          <Plus className="h-4 w-4" />
          部屋を作る
        </Link>
      </div>

      {/* Filter / Search (client component) */}
      <RoomsFilter />
    </div>
  );
}

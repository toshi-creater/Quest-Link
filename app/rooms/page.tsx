import { RoomsFilter } from "./RoomsFilter";

export default function RoomsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          部屋一覧
        </h1>
      </div>

      {/* Filter / Search (client component) */}
      <RoomsFilter />
    </div>
  );
}

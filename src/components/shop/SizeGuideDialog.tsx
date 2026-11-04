"use client";

import { X } from "lucide-react";

const BRA_TABLE = [
  { size: "70B", under: "63–67", bust: "82–84" },
  { size: "75B", under: "68–72", bust: "87–89" },
  { size: "75C", under: "68–72", bust: "89–91" },
  { size: "80B", under: "73–77", bust: "92–94" },
  { size: "80C", under: "73–77", bust: "94–96" },
  { size: "85C", under: "78–82", bust: "99–101" },
];

const CLOTHING_TABLE = [
  { size: "S", waist: "62–66", hip: "88–92", numeric: "36" },
  { size: "M", waist: "67–71", hip: "93–97", numeric: "38" },
  { size: "L", waist: "72–77", hip: "98–102", numeric: "40" },
  { size: "XL", waist: "78–83", hip: "103–107", numeric: "42" },
];

export default function SizeGuideDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Kapat"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Beden tablosu"
        className="relative max-h-[88vh] w-full max-w-[560px] overflow-y-auto bg-white p-6 sm:rounded"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-[22px]">Beden Tablosu</h2>
            <p className="mt-1 text-[12.5px] text-[color:var(--color-muted)]">
              Ölçüler santimetre cinsindendir. İki beden arasında kaldıysan büyük olanı seç.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="p-1">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em]">Sütyen</h3>
        <div className="overflow-x-auto">
          <table className="table-basic mb-7 min-w-[380px]">
            <thead>
              <tr>
                <th>Beden</th>
                <th>Göğüs altı</th>
                <th>Göğüs çevresi</th>
              </tr>
            </thead>
            <tbody>
              {BRA_TABLE.map((row) => (
                <tr key={row.size}>
                  <td className="font-medium">{row.size}</td>
                  <td>{row.under} cm</td>
                  <td>{row.bust} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em]">
          Külot / Pijama / Mayo
        </h3>
        <div className="overflow-x-auto">
          <table className="table-basic min-w-[380px]">
            <thead>
              <tr>
                <th>Beden</th>
                <th>Numara</th>
                <th>Bel</th>
                <th>Kalça</th>
              </tr>
            </thead>
            <tbody>
              {CLOTHING_TABLE.map((row) => (
                <tr key={row.size}>
                  <td className="font-medium">{row.size}</td>
                  <td>{row.numeric}</td>
                  <td>{row.waist} cm</td>
                  <td>{row.hip} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 border border-[color:var(--color-line)] bg-[color:var(--color-cream)] p-4 text-[12.5px] text-[color:var(--color-ink-soft)]">
          <strong className="block text-[color:var(--color-ink)]">Nasıl ölçülür?</strong>
          Göğüs altı: göğsün hemen altından, mezurayı vücuda paralel tutarak ölç.
          Göğüs çevresi: göğsün en dolgun noktasından ölç. Bel: en ince noktadan,
          kalça: en geniş noktadan ölç.
        </div>
      </div>
    </div>
  );
}

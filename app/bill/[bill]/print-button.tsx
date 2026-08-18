"use client";

export default function PrintButton() {
  return (
    <div className="no-print mb-6 flex justify-center gap-3">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Print bill
      </button>
      <button
        onClick={() => window.close()}
        className="rounded-lg border border-gray-400 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        Close
      </button>
    </div>
  );
}

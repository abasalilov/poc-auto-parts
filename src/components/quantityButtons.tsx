"use client";

interface QuantityButtonsProps {
  decreaseQty: () => void;
  increaseQty: () => void;
  qty: number;
  maxQty?: number;
}

export default function QuantityButtons({
  decreaseQty,
  increaseQty,
  qty,
  maxQty = 12,
}: QuantityButtonsProps) {
  const canDecrease = qty > 1;
  const canIncrease = qty < maxQty;

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50/80 font-mont">
      <button
        type="button"
        onClick={decreaseQty}
        disabled={!canDecrease}
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center rounded-l-md text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600"
      >
        <span className="text-lg leading-none">−</span>
      </button>
      <span
        className="min-w-[2.25rem] px-2 text-center text-sm font-medium text-gray-900"
        aria-live="polite"
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={increaseQty}
        disabled={!canIncrease}
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center rounded-r-md text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600"
      >
        <span className="text-lg leading-none">+</span>
      </button>
    </div>
  );
}

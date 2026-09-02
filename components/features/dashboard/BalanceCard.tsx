"use client";

interface BalanceCardProps {
  balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <div className="bg-brand-secondary text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
      {/* Subtle background glow effect */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-yellow/10 rounded-full blur-2xl" />

      <p className="text-gray-300 font-medium text-sm mb-2">Current balance</p>

      <div className="flex items-center gap-3">
        {/* Stylized Coin Icon */}
        <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center text-brand-secondary font-bold text-sm shadow-sm">
          ₹
        </div>
        <h2 className="text-4xl font-heading font-extrabold text-white">
          {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </h2>
      </div>
    </div>
  );
}

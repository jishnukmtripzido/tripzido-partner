"use client";

interface BalanceCardProps {
  balance: number;
  onWithdraw: () => void;
}

export function BalanceCard({ balance, onWithdraw }: BalanceCardProps) {
  return (
    <div className="bg-brand-secondary text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-yellow/10 rounded-full blur-xl" />

      <p className="text-gray-400 font-medium text-sm mb-1">Current balance</p>
      <h2 className="text-4xl font-heading font-extrabold text-white mb-4">
        ₹ {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </h2>

      <div className="flex items-center justify-between mt-6">
        <p className="text-xs text-gray-400 font-medium">Available for withdrawal</p>
        <button
          onClick={onWithdraw}
          className="bg-brand-yellow text-brand-secondary px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}

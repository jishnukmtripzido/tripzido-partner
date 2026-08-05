// "use client";

// interface BalanceCardProps {
//   balance: number;
//   onWithdraw: () => void;
// }

// export function BalanceCard({ balance, onWithdraw }: BalanceCardProps) {
//   return (
//     <div className="bg-brand-secondary text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
//       <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-yellow/10 rounded-full blur-xl" />

//       <p className="text-gray-400 font-medium text-sm mb-1">Current balance</p>
//       <h2 className="text-4xl  font-extrabold text-white mb-4">
//         ₹ {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
//       </h2>

//       <div className="flex items-center justify-between mt-6">
//         <p className="text-xs text-gray-400 font-medium">Available for withdrawal</p>
//         <button
//           onClick={onWithdraw}
//           className="bg-brand-yellow text-brand-secondary px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors"
//         >
//           Withdraw
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";

interface BalanceCardProps {
  balance: number;
  onWithdraw: () => void;
}

export function BalanceCard({ balance, onWithdraw }: BalanceCardProps) {
  return (
    <div className="bg-[#242A38] text-white rounded-[1.5rem] p-6 shadow-md relative overflow-hidden ">
      {/* Subtle background glow effect */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />

      <p className="text-gray-300 font-medium text-sm mb-2">Current balance</p>

      <div className="flex items-center gap-3 mb-4">
        {/* Stylized Coin Icon */}
        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-[#242A38] font-bold text-sm shadow-sm">
          ₹
        </div>
        <h2 className="text-4xl  font-extrabold text-white">
          {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </h2>
      </div>

      <div className="flex items-center justify-between mt-6 pt-2">
        <p className="text-xs text-gray-400 font-medium">
          Available for withdrawal
        </p>
        <button
          onClick={onWithdraw}
          className="bg-[#FFD166] text-[#242A38] px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#ffc63b] transition-colors"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}

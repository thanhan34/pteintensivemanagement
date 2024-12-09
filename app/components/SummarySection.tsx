'use client';

interface SummarySectionProps {
  totalTuition: number;
  totalOperationFees: number;
  remainingBalance: number;
  formatVND: (amount: number) => string;
}

export default function SummarySection({
  totalTuition,
  totalOperationFees,
  remainingBalance,
  formatVND
}: SummarySectionProps) {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-blue-100 p-4 rounded-lg">
        <h3 className="font-semibold text-lg">Total Tuition</h3>
        <p className="text-2xl font-bold text-blue-600">{formatVND(totalTuition)}</p>
      </div>
      <div className="bg-red-100 p-4 rounded-lg">
        <h3 className="font-semibold text-lg">Total Operation Fees</h3>
        <p className="text-2xl font-bold text-red-600">{formatVND(totalOperationFees)}</p>
      </div>
      <div className="bg-green-100 p-4 rounded-lg">
        <h3 className="font-semibold text-lg">Remaining Balance</h3>
        <p className="text-2xl font-bold text-green-600">{formatVND(remainingBalance)}</p>
      </div>
    </div>
  );
}

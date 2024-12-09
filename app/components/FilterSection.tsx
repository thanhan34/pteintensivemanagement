'use client';

interface FilterSectionProps {
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  minTargetScore: number | '';
  onMinTargetScoreChange: (score: number | '') => void;
  maxTargetScore: number | '';
  onMaxTargetScoreChange: (score: number | '') => void;
}

export default function FilterSection({
  startDate,
  onStartDateChange,
  endDate,
  minTargetScore,
  onMinTargetScoreChange,
  maxTargetScore,
  onMaxTargetScoreChange,
}: FilterSectionProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Date Range Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label>From:</label>
          <input
            type="date"
            className="border p-2 rounded"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label>To:</label>
          <input
            type="date"
            className="border p-2 rounded"
            value={endDate}
            disabled
          />
        </div>
      </div>

      {/* Target Score Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label>Min Target Score:</label>
          <input
            type="number"
            className="border p-2 rounded w-24"
            value={minTargetScore}
            onChange={(e) => onMinTargetScoreChange(e.target.value ? Number(e.target.value) : '')}
            placeholder="Min"
          />
        </div>
        <div className="flex items-center gap-2">
          <label>Max Target Score:</label>
          <input
            type="number"
            className="border p-2 rounded w-24"
            value={maxTargetScore}
            onChange={(e) => onMaxTargetScoreChange(e.target.value ? Number(e.target.value) : '')}
            placeholder="Max"
          />
        </div>
      </div>
    </div>
  );
}

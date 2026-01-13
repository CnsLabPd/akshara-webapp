// components/ProgressBar.tsx
'use client';

interface ProgressBarProps {
  totalCharacters: number;
  completedCharacters: number;
  partialCharacters: number;
  title?: string;
}

export default function ProgressBar({
  totalCharacters,
  completedCharacters,
  partialCharacters,
  title = "Overall Progress"
}: ProgressBarProps) {
  const totalRecordingsRequired = totalCharacters * 2;
  const completedRecordings = completedCharacters * 2;
  const partialRecordings = partialCharacters * 1;
  const totalRecordings = completedRecordings + partialRecordings;

  const completePercentage = Math.round((completedRecordings / totalRecordingsRequired) * 100);
  const partialPercentage = Math.round((partialRecordings / totalRecordingsRequired) * 100);

  return (
    <div>
      {/* Visual Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {totalRecordings}/{totalRecordingsRequired} recordings
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div className="h-full flex">
            {/* Completed Portion */}
            <div
              className="bg-green-500 transition-all duration-700 ease-out"
              style={{ width: `${completePercentage}%` }}
            ></div>

            {/* Partial Portion */}
            <div
              className="bg-orange-500 transition-all duration-700 ease-out"
              style={{ width: `${partialPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="text-sm text-gray-600">
        <div className="flex items-center justify-between py-1">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Completed Characters
          </span>
          <span className="font-medium">{completedCharacters}</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            Characters with 1 Recording
          </span>
          <span className="font-medium">{partialCharacters}</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            Not Started
          </span>
          <span className="font-medium">{totalCharacters - completedCharacters - partialCharacters}</span>
        </div>
      </div>
    </div>
  );
}

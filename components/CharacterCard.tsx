// components/CharacterCard.tsx
'use client';

interface CharacterCardProps {
  character: string;
  attempts: number;
  onClick?: () => void;
}

export default function CharacterCard({ character, attempts, onClick }: CharacterCardProps) {
  const isCompleted = attempts >= 2;
  const isPartiallyCompleted = attempts === 1;
  const isNotStarted = attempts === 0;

  const getCardClasses = () => {
    if (isCompleted) {
      return 'bg-green-50 border-green-300';
    } else if (isPartiallyCompleted) {
      return 'bg-orange-50 border-orange-300';
    } else {
      return 'bg-blue-50 border-blue-300';
    }
  };

  const getStatusText = () => {
    if (isCompleted) {
      return 'Completed';
    } else if (isPartiallyCompleted) {
      return 'In Progress';
    } else {
      return 'Not Started';
    }
  };

  const getStatusTextColor = () => {
    if (isCompleted) {
      return 'text-green-600';
    } else if (isPartiallyCompleted) {
      return 'text-orange-600';
    } else {
      return 'text-gray-500';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
        ${getCardClasses()}
        hover:shadow-lg
      `}
    >
      {/* Microphone Icon */}
      <div className="absolute top-2 right-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="#EC4899"/>
          <path d="M19 10V12C19 15.866 15.866 19 12 19C8.134 19 5 15.866 5 12V10H7V12C7 14.761 9.239 17 12 17C14.761 17 17 14.761 17 12V10H19Z" fill="#EC4899"/>
          <path d="M11 21H13V23H11V21Z" fill="#EC4899"/>
        </svg>
      </div>

      {/* Character Display */}
      <div className="text-center pt-2">
        <div className="text-6xl font-bold text-blue-600 mb-3">
          {character.toUpperCase()}
        </div>

        {/* Progress Display */}
        <div className="text-sm font-medium text-gray-700 mb-1">
          {attempts}/2 recordings
        </div>

        {/* Status Text */}
        <div className={`text-xs font-medium ${getStatusTextColor()}`}>
          {getStatusText()}
        </div>
      </div>
    </div>
  );
}

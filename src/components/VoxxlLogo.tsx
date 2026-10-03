import React from 'react';

interface VoxxlLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const VoxxlLogo: React.FC<VoxxlLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    xs: { icon: 20, text: 'text-sm' },
    sm: { icon: 26, text: 'text-base' },
    md: { icon: 34, text: 'text-lg' },
    lg: { icon: 48, text: 'text-2xl' },
    xl: { icon: 72, text: 'text-4xl' },
  };

  const { icon: iconSize, text: textSize } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Vector Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
      >
        <defs>
          {/* Gradient for left arm of V */}
          <linearGradient id="voxxl-blue-grad" x1="15" y1="20" x2="65" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00A3FF" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          {/* Gradient for right arm fold of V */}
          <linearGradient id="voxxl-purple-grad" x1="45" y1="50" x2="85" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="40%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>

          {/* Gradient for audio waveform equalizer */}
          <linearGradient id="voxxl-wave-grad" x1="75" y1="30" x2="110" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00D2FF" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        {/* Left Arm of the V */}
        <path
          d="M 18 28 
             C 15 28, 12 31, 14 36 
             L 48 94 
             C 52 101, 62 101, 66 94 
             L 76 77 
             L 42 34 
             C 38 29, 32 28, 25 28 
             Z"
          fill="url(#voxxl-blue-grad)"
        />

        {/* Right Arm / Fold of the V */}
        <path
          d="M 46 64 
             L 60 88 
             C 62 91, 65 91, 67 88 
             L 94 36 
             C 96 32, 94 28, 90 28 
             L 74 28 
             C 70 28, 67 30, 65 34 
             L 46 64 
             Z"
          fill="url(#voxxl-purple-grad)"
        />

        {/* Audio Waveform Equalizer (5 rounded pill bars) */}
        {/* Bar 1 */}
        <rect x="76" y="47" width="5.5" height="15" rx="2.75" fill="url(#voxxl-wave-grad)" opacity="0.9" />
        {/* Bar 2 */}
        <rect x="84" y="38" width="5.5" height="32" rx="2.75" fill="url(#voxxl-wave-grad)" />
        {/* Bar 3 */}
        <rect x="92" y="30" width="5.5" height="46" rx="2.75" fill="url(#voxxl-wave-grad)" />
        {/* Bar 4 */}
        <rect x="100" y="36" width="5.5" height="35" rx="2.75" fill="url(#voxxl-wave-grad)" />
        {/* Bar 5 */}
        <rect x="108" y="45" width="5.5" height="18" rx="2.75" fill="url(#voxxl-wave-grad)" opacity="0.9" />
      </svg>

      {/* Brand Text */}
      {showText && (
        <span
          className={`font-bold tracking-tight text-white font-sans ${textSize} flex items-baseline`}
        >
          voxxl
          <span className="inline-block w-1.5 h-1.5 ml-1 rounded-full bg-indigo-500 animate-pulse" />
        </span>
      )}
    </div>
  );
};

interface Props {
  className?: string;
}

export default function Dragonfly({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="שפירית"
      className={className}
    >
      <defs>
        <linearGradient id="df-wing-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B3E5FC" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4DB6AC" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="df-wing-r" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B3E5FC" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4DB6AC" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Background reeds/grasses */}
      <path d="M20 180 L20 80 Q18 70 22 60" stroke="#2F5D50" strokeWidth="2" fill="none" opacity="0.3" />
      <path d="M28 180 L28 90 Q26 82 30 72" stroke="#2F5D50" strokeWidth="1.5" fill="none" opacity="0.25" />
      <path d="M175 180 L175 75 Q177 65 173 55" stroke="#2F5D50" strokeWidth="2" fill="none" opacity="0.3" />
      <path d="M182 180 L182 85 Q184 78 180 68" stroke="#2F5D50" strokeWidth="1.5" fill="none" opacity="0.25" />

      {/* Water hint at bottom */}
      <rect x="0" y="155" width="200" height="25" fill="#4DB6AC" opacity="0.15" />
      <ellipse cx="100" cy="165" rx="60" ry="3" fill="#B3E5FC" opacity="0.2" />

      {/* === Dragonfly === */}

      {/* Upper left wing */}
      <path
        d="M95 78 Q60 50 30 45 Q25 50 30 58 Q55 62 88 82"
        fill="url(#df-wing-l)"
        stroke="#4DB6AC"
        strokeWidth="0.8"
      />
      {/* Wing veins - upper left */}
      <path d="M90 78 Q65 60 40 52" stroke="#4DB6AC" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M88 80 Q68 68 48 58" stroke="#4DB6AC" strokeWidth="0.4" fill="none" opacity="0.4" />
      <path d="M85 82 Q70 74 55 65" stroke="#4DB6AC" strokeWidth="0.4" fill="none" opacity="0.3" />

      {/* Lower left wing */}
      <path
        d="M92 88 Q58 92 28 105 Q25 98 30 92 Q55 82 88 84"
        fill="url(#df-wing-l)"
        stroke="#4DB6AC"
        strokeWidth="0.8"
      />
      {/* Wing veins - lower left */}
      <path d="M88 86 Q62 90 38 98" stroke="#4DB6AC" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M86 88 Q65 92 45 100" stroke="#4DB6AC" strokeWidth="0.4" fill="none" opacity="0.4" />

      {/* Upper right wing */}
      <path
        d="M105 78 Q140 50 170 45 Q175 50 170 58 Q145 62 112 82"
        fill="url(#df-wing-r)"
        stroke="#4DB6AC"
        strokeWidth="0.8"
      />
      {/* Wing veins - upper right */}
      <path d="M110 78 Q135 60 160 52" stroke="#4DB6AC" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M112 80 Q132 68 152 58" stroke="#4DB6AC" strokeWidth="0.4" fill="none" opacity="0.4" />
      <path d="M115 82 Q130 74 145 65" stroke="#4DB6AC" strokeWidth="0.4" fill="none" opacity="0.3" />

      {/* Lower right wing */}
      <path
        d="M108 88 Q142 92 172 105 Q175 98 170 92 Q145 82 112 84"
        fill="url(#df-wing-r)"
        stroke="#4DB6AC"
        strokeWidth="0.8"
      />
      {/* Wing veins - lower right */}
      <path d="M112 86 Q138 90 162 98" stroke="#4DB6AC" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M114 88 Q135 92 155 100" stroke="#4DB6AC" strokeWidth="0.4" fill="none" opacity="0.4" />

      {/* Abdomen — long segmented tail */}
      <path
        d="M100 92 L100 148"
        stroke="#4DB6AC"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Abdomen segments */}
      <path d="M97 100 L103 100" stroke="#2F5D50" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M97 108 L103 108" stroke="#2F5D50" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M97.5 116 L102.5 116" stroke="#2F5D50" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M98 124 L102 124" stroke="#2F5D50" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M98.5 132 L101.5 132" stroke="#2F5D50" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M99 140 L101 140" stroke="#2F5D50" strokeWidth="0.8" fill="none" opacity="0.5" />

      {/* Tail tip */}
      <circle cx="100" cy="150" r="2" fill="#2F5D50" />

      {/* Thorax */}
      <ellipse cx="100" cy="84" rx="8" ry="10" fill="#4DB6AC" />
      <ellipse cx="100" cy="84" rx="6" ry="8" fill="#2F5D50" opacity="0.3" />

      {/* Head */}
      <circle cx="100" cy="70" r="8" fill="#4DB6AC" />

      {/* Enormous compound eyes — characteristic */}
      <ellipse cx="91" cy="68" rx="6" ry="5" fill="#2F5D50" />
      <ellipse cx="109" cy="68" rx="6" ry="5" fill="#2F5D50" />
      {/* Eye highlights */}
      <ellipse cx="89" cy="66.5" rx="2" ry="1.5" fill="#4DB6AC" opacity="0.5" />
      <ellipse cx="111" cy="66.5" rx="2" ry="1.5" fill="#4DB6AC" opacity="0.5" />

      {/* Legs — 6 small legs from thorax */}
      <path d="M93 80 L85 86 L82 90" stroke="#2F5D50" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M107 80 L115 86 L118 90" stroke="#2F5D50" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M94 84 L86 90 L84 95" stroke="#2F5D50" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M106 84 L114 90 L116 95" stroke="#2F5D50" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M95 88 L88 94 L87 98" stroke="#2F5D50" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M105 88 L112 94 L113 98" stroke="#2F5D50" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  className?: string;
}

export default function Fish({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="בינון"
      className={className}
    >
      <defs>
        <linearGradient id="fi-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B3E5FC" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4DB6AC" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="fi-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B3E5FC" />
          <stop offset="100%" stopColor="#4DB6AC" />
        </linearGradient>
      </defs>

      {/* Underwater background */}
      <rect x="0" y="0" width="200" height="180" fill="url(#fi-water)" />

      {/* Water surface ripples at top */}
      <path d="M0 15 Q25 10 50 15 Q75 20 100 15 Q125 10 150 15 Q175 20 200 15" stroke="#B3E5FC" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M0 22 Q30 17 60 22 Q90 27 120 22 Q150 17 180 22 Q195 25 200 22" stroke="#B3E5FC" strokeWidth="1" fill="none" opacity="0.35" />

      {/* Light rays from surface */}
      <path d="M60 0 L75 60" stroke="#B3E5FC" strokeWidth="8" fill="none" opacity="0.08" />
      <path d="M120 0 L110 55" stroke="#B3E5FC" strokeWidth="10" fill="none" opacity="0.06" />
      <path d="M160 0 L145 50" stroke="#B3E5FC" strokeWidth="6" fill="none" opacity="0.07" />

      {/* Underwater plants */}
      <path d="M15 180 Q12 150 18 120 Q15 110 20 100" stroke="#2F5D50" strokeWidth="2.5" fill="none" opacity="0.4" />
      <path d="M25 180 Q22 155 28 130 Q25 120 30 110" stroke="#2F5D50" strokeWidth="2" fill="none" opacity="0.35" />
      <path d="M170 180 Q173 145 168 115 Q172 105 167 95" stroke="#2F5D50" strokeWidth="2.5" fill="none" opacity="0.4" />
      <path d="M180 180 Q183 155 178 125" stroke="#2F5D50" strokeWidth="2" fill="none" opacity="0.3" />

      {/* Sandy bottom hint */}
      <ellipse cx="100" cy="175" rx="95" ry="8" fill="#E8D8B9" opacity="0.2" />
      {/* Small stones at bottom */}
      <circle cx="80" cy="172" r="3" fill="#E8D8B9" opacity="0.2" />
      <circle cx="120" cy="174" r="2.5" fill="#E8D8B9" opacity="0.15" />
      <circle cx="60" cy="175" r="2" fill="#E8D8B9" opacity="0.15" />

      {/* Air bubbles */}
      <circle cx="140" cy="45" r="3" fill="#FFFFFF" opacity="0.2" />
      <circle cx="145" cy="35" r="2" fill="#FFFFFF" opacity="0.15" />
      <circle cx="138" cy="55" r="1.5" fill="#FFFFFF" opacity="0.15" />
      <circle cx="55" cy="60" r="2" fill="#FFFFFF" opacity="0.12" />

      {/* === Main Fish === */}

      {/* Tail fin */}
      <path
        d="M40 85 L22 68 Q20 65 22 62 L32 72 L28 60 Q28 56 32 58 L38 75 L40 85"
        fill="#4DB6AC"
      />
      <path
        d="M40 95 L22 112 Q20 115 22 118 L32 108 L28 120 Q28 124 32 122 L38 105 L40 95"
        fill="#4DB6AC"
      />

      {/* Body */}
      <path
        d="M40 90 Q65 60 105 65 Q140 68 155 85 Q160 90 155 95 Q140 112 105 115 Q65 120 40 90"
        fill="url(#fi-body)"
      />

      {/* Belly — lighter underside */}
      <path
        d="M50 95 Q75 110 110 110 Q135 108 148 98 Q140 112 105 115 Q65 118 50 95"
        fill="#FFFFFF"
        opacity="0.3"
      />

      {/* Lateral line */}
      <path
        d="M50 90 Q80 87 120 88 Q140 89 152 90"
        stroke="#2F5D50"
        strokeWidth="0.8"
        fill="none"
        opacity="0.3"
      />

      {/* Scales pattern — subtle arcs */}
      <path d="M60 80 Q65 77 70 80" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.2" />
      <path d="M72 78 Q77 75 82 78" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.2" />
      <path d="M84 76 Q89 73 94 76" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.2" />
      <path d="M65 88 Q70 85 75 88" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.2" />
      <path d="M77 86 Q82 83 87 86" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.2" />
      <path d="M89 84 Q94 81 99 84" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.2" />
      <path d="M101 82 Q106 79 111 82" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.2" />
      <path d="M55 96 Q60 93 65 96" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.15" />
      <path d="M67 94 Q72 91 77 94" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.15" />
      <path d="M79 92 Q84 89 89 92" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.15" />
      <path d="M113 80 Q118 77 123 80" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.15" />
      <path d="M125 82 Q130 79 135 82" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.15" />

      {/* Dorsal fin */}
      <path
        d="M75 68 Q80 48 95 45 Q105 44 108 50 Q110 58 105 66"
        fill="#4DB6AC"
        opacity="0.7"
      />
      {/* Dorsal fin rays */}
      <path d="M82 65 L88 50" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M90 64 L94 48" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M98 64 L100 50" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.3" />

      {/* Pectoral fin */}
      <path
        d="M118 92 Q125 100 130 110 Q128 112 124 108 Q120 100 116 95"
        fill="#4DB6AC"
        opacity="0.5"
      />

      {/* Ventral fin */}
      <path
        d="M90 112 Q92 122 88 128 Q86 126 87 118 L90 112"
        fill="#4DB6AC"
        opacity="0.5"
      />

      {/* Eye */}
      <circle cx="145" cy="84" r="6" fill="#FFFFFF" />
      <circle cx="146" cy="83.5" r="4" fill="#1E3D34" />
      <circle cx="147" cy="82.5" r="1.5" fill="#FFFFFF" />

      {/* Mouth */}
      <path
        d="M157 90 Q160 88 158 86"
        stroke="#1E3D34"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Gill line */}
      <path
        d="M132 78 Q130 88 132 98"
        stroke="#2F5D50"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />

      {/* Small fish in background */}
      <path
        d="M155 140 L165 137 L168 140 L165 143 L155 140 M153 140 L150 138 M153 140 L150 142"
        fill="#4DB6AC"
        opacity="0.2"
      />
      <path
        d="M40 135 L48 132 L50 135 L48 138 L40 135 M38 135 L36 133 M38 135 L36 137"
        fill="#4DB6AC"
        opacity="0.15"
      />
    </svg>
  );
}

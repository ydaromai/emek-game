interface Props {
  className?: string;
}

export default function Crab({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="סרטן מים מתוקים"
      className={className}
    >
      <defs>
        <linearGradient id="cr-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8D8B9" />
          <stop offset="100%" stopColor="#2F5D50" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="cr-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4DB6AC" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#B3E5FC" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Sandy riverbed */}
      <ellipse cx="100" cy="155" rx="95" ry="25" fill="#E8D8B9" opacity="0.3" />

      {/* Shallow water */}
      <rect x="0" y="145" width="200" height="35" fill="url(#cr-water)" />

      {/* Pebbles */}
      <ellipse cx="35" cy="150" rx="7" ry="4" fill="#E8D8B9" opacity="0.5" />
      <ellipse cx="160" cy="148" rx="5" ry="3" fill="#E8D8B9" opacity="0.4" />
      <ellipse cx="55" cy="160" rx="4" ry="2.5" fill="#E8D8B9" opacity="0.35" />
      <ellipse cx="140" cy="158" rx="6" ry="3" fill="#E8D8B9" opacity="0.3" />
      <circle cx="175" cy="155" r="3" fill="#E8D8B9" opacity="0.3" />
      <circle cx="25" cy="158" r="2.5" fill="#E8D8B9" opacity="0.25" />

      {/* Left claw arm */}
      <path
        d="M60 95 Q40 80 30 70"
        stroke="#E8D8B9"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Left pincer */}
      <path
        d="M30 70 Q22 60 18 55 Q16 52 20 50 Q25 52 28 58 L30 70"
        fill="#E8D8B9"
      />
      <path
        d="M30 70 Q24 72 18 68 Q15 66 18 62 Q22 64 26 68 L30 70"
        fill="#E8D8B9"
      />
      {/* Pincer gap */}
      <path d="M24 63 L30 70" stroke="#1E3D34" strokeWidth="0.8" fill="none" />

      {/* Right claw arm */}
      <path
        d="M140 95 Q160 80 170 70"
        stroke="#E8D8B9"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right pincer */}
      <path
        d="M170 70 Q178 60 182 55 Q184 52 180 50 Q175 52 172 58 L170 70"
        fill="#E8D8B9"
      />
      <path
        d="M170 70 Q176 72 182 68 Q185 66 182 62 Q178 64 174 68 L170 70"
        fill="#E8D8B9"
      />
      <path d="M176 63 L170 70" stroke="#1E3D34" strokeWidth="0.8" fill="none" />

      {/* Walking legs — left side */}
      <path d="M65 108 Q50 115 38 120 Q32 122 28 118" stroke="#E8D8B9" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M62 115 Q48 125 35 132 Q28 135 24 130" stroke="#E8D8B9" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M60 120 Q48 132 38 140 Q32 143 28 138" stroke="#E8D8B9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M62 125 Q52 138 44 148 Q40 150 36 146" stroke="#E8D8B9" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Walking legs — right side */}
      <path d="M135 108 Q150 115 162 120 Q168 122 172 118" stroke="#E8D8B9" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M138 115 Q152 125 165 132 Q172 135 176 130" stroke="#E8D8B9" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M140 120 Q152 132 162 140 Q168 143 172 138" stroke="#E8D8B9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M138 125 Q148 138 156 148 Q160 150 164 146" stroke="#E8D8B9" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Body / carapace */}
      <ellipse cx="100" cy="105" rx="42" ry="28" fill="url(#cr-shell)" />

      {/* Carapace details — raised ridges */}
      <path
        d="M75 95 Q100 85 125 95"
        stroke="#2F5D50"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M70 105 Q100 92 130 105"
        stroke="#2F5D50"
        strokeWidth="1"
        fill="none"
        opacity="0.25"
      />
      {/* Center line */}
      <path
        d="M100 80 L100 125"
        stroke="#2F5D50"
        strokeWidth="0.8"
        fill="none"
        opacity="0.2"
      />

      {/* Eyes on stalks */}
      <path d="M88 82 L82 72" stroke="#E8D8B9" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="82" cy="70" r="4" fill="#1E3D34" />
      <circle cx="82" cy="70" r="2.5" fill="#FFFFFF" />
      <circle cx="82.5" cy="69.5" r="1.5" fill="#1E3D34" />
      <circle cx="83" cy="69" r="0.5" fill="#FFFFFF" />

      <path d="M112 82 L118 72" stroke="#E8D8B9" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="118" cy="70" r="4" fill="#1E3D34" />
      <circle cx="118" cy="70" r="2.5" fill="#FFFFFF" />
      <circle cx="118.5" cy="69.5" r="1.5" fill="#1E3D34" />
      <circle cx="119" cy="69" r="0.5" fill="#FFFFFF" />

      {/* Mouth parts */}
      <path d="M95 88 L100 90 L105 88" stroke="#1E3D34" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* Water bubbles */}
      <circle cx="50" cy="140" r="2" fill="#B3E5FC" opacity="0.3" />
      <circle cx="155" cy="142" r="1.5" fill="#B3E5FC" opacity="0.25" />
      <circle cx="75" cy="148" r="1.8" fill="#4DB6AC" opacity="0.2" />
    </svg>
  );
}

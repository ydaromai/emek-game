interface Props {
  className?: string;
}

export default function Heron({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="אנפה"
      className={className}
    >
      <defs>
        <linearGradient id="hr-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4DB6AC" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#B3E5FC" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Water */}
      <rect x="0" y="130" width="200" height="50" fill="url(#hr-water)" />

      {/* Water ripples */}
      <ellipse cx="95" cy="150" rx="35" ry="3" fill="#4DB6AC" opacity="0.25" />
      <ellipse cx="60" cy="160" rx="25" ry="2.5" fill="#B3E5FC" opacity="0.2" />
      <ellipse cx="140" cy="155" rx="20" ry="2" fill="#4DB6AC" opacity="0.2" />

      {/* Distant reeds */}
      <path d="M170 180 L170 115" stroke="#2F5D50" strokeWidth="2" fill="none" />
      <path d="M178 180 L178 125" stroke="#2F5D50" strokeWidth="1.8" fill="none" />
      <path d="M163 180 L163 120" stroke="#2F5D50" strokeWidth="1.5" fill="none" />
      <ellipse cx="170" cy="113" rx="3" ry="7" fill="#2F5D50" opacity="0.5" />
      <ellipse cx="178" cy="123" rx="2.5" ry="6" fill="#2F5D50" opacity="0.4" />

      {/* Left leg — standing in water */}
      <path
        d="M88 125 L85 155"
        stroke="#E8D8B9"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Left foot */}
      <path
        d="M85 155 L78 160 M85 155 L85 162 M85 155 L92 160"
        stroke="#E8D8B9"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Right leg — slightly bent */}
      <path
        d="M98 123 L100 140 L97 155"
        stroke="#E8D8B9"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right foot */}
      <path
        d="M97 155 L90 160 M97 155 L97 162 M97 155 L104 160"
        stroke="#E8D8B9"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Body — large elongated oval */}
      <ellipse cx="92" cy="105" rx="25" ry="22" fill="#E8D8B9" />

      {/* Wing feathers — layered */}
      <path
        d="M75 95 Q68 100 65 115 Q70 118 80 115 Q75 105 78 97"
        fill="#2F5D50"
        opacity="0.4"
      />
      <path
        d="M82 92 Q75 98 72 112 Q78 116 88 112 Q84 102 85 94"
        fill="#2F5D50"
        opacity="0.3"
      />

      {/* Tail feathers */}
      <path
        d="M70 115 L55 125 L60 120 L50 128 L62 122 L58 130 L68 120"
        fill="#E8D8B9"
        opacity="0.8"
      />

      {/* Neck — long S-curve, characteristic heron */}
      <path
        d="M100 90 Q108 75 105 60 Q102 48 95 38 Q90 30 88 22"
        stroke="#E8D8B9"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Neck front (lighter) */}
      <path
        d="M100 88 Q106 74 104 60 Q101 50 96 40"
        stroke="#FFFFFF"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Head */}
      <ellipse cx="86" cy="18" rx="12" ry="9" fill="#E8D8B9" />

      {/* Head crest — dark plumes trailing back */}
      <path
        d="M90 12 L105 8 M90 14 L108 12 M92 10 L102 5"
        stroke="#1E3D34"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eye stripe — dark line through eye (characteristic) */}
      <path
        d="M78 16 L95 14"
        stroke="#1E3D34"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eye */}
      <circle cx="82" cy="15" r="2.5" fill="#1E3D34" />
      <circle cx="82.8" cy="14.5" r="0.8" fill="#FFFFFF" />

      {/* Beak — long, pointed, yellow-sand */}
      <polygon
        points="74,18 50,14 74,20"
        fill="#E8D8B9"
      />
      <path d="M74 19 L50 14" stroke="#1E3D34" strokeWidth="0.6" fill="none" />

      {/* Water ripple around legs */}
      <ellipse cx="90" cy="155" rx="18" ry="3" fill="#4DB6AC" opacity="0.3" />

      {/* Small fish silhouette in water */}
      <path
        d="M40 148 L50 145 L55 148 L50 151 L40 148 M38 148 L34 145 M38 148 L34 151"
        fill="#4DB6AC"
        opacity="0.25"
      />
    </svg>
  );
}

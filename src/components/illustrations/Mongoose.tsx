interface Props {
  className?: string;
}

export default function Mongoose({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="נמייה"
      className={className}
    >
      <defs>
        <linearGradient id="mn-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8D8B9" />
          <stop offset="100%" stopColor="#2F5D50" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <rect x="0" y="145" width="200" height="35" fill="#E8D8B9" opacity="0.3" />

      {/* Rocks */}
      <ellipse cx="155" cy="150" rx="18" ry="10" fill="#E8D8B9" opacity="0.5" />
      <ellipse cx="170" cy="155" rx="12" ry="8" fill="#E8D8B9" opacity="0.4" />
      <ellipse cx="30" cy="155" rx="14" ry="8" fill="#E8D8B9" opacity="0.35" />

      {/* Grass tufts */}
      <path d="M40 150 Q38 138 42 130" stroke="#2F5D50" strokeWidth="1.5" fill="none" opacity="0.35" />
      <path d="M44 150 Q46 140 43 132" stroke="#2F5D50" strokeWidth="1.5" fill="none" opacity="0.3" />
      <path d="M175 148 Q173 136 177 128" stroke="#2F5D50" strokeWidth="1.5" fill="none" opacity="0.35" />
      <path d="M180 148 Q182 138 179 130" stroke="#2F5D50" strokeWidth="1.5" fill="none" opacity="0.3" />

      {/* Small bush/shrub background */}
      <ellipse cx="20" cy="130" rx="15" ry="18" fill="#2F5D50" opacity="0.2" />
      <ellipse cx="185" cy="125" rx="12" ry="15" fill="#2F5D50" opacity="0.15" />

      {/* === Mongoose — alert standing pose === */}

      {/* Tail — long, held upward in alert position */}
      <path
        d="M68 110 Q55 100 48 80 Q45 68 50 58 Q52 55 55 58"
        stroke="#E8D8B9"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Tail tip darker */}
      <path
        d="M50 62 Q52 55 55 58"
        stroke="#2F5D50"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Hind legs */}
      <path
        d="M80 135 L78 148"
        stroke="#E8D8B9"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M78 148 L74 152 M78 148 L82 152"
        stroke="#E8D8B9"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      <path
        d="M92 135 L94 148"
        stroke="#E8D8B9"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M94 148 L90 152 M94 148 L98 152"
        stroke="#E8D8B9"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Body — elongated, low-slung */}
      <ellipse cx="100" cy="118" rx="32" ry="18" fill="url(#mn-fur)" />

      {/* Body fur texture */}
      <path d="M78 112 L82 110" stroke="#2F5D50" strokeWidth="0.6" fill="none" opacity="0.2" />
      <path d="M88 110 L92 108" stroke="#2F5D50" strokeWidth="0.6" fill="none" opacity="0.2" />
      <path d="M98 108 L102 106" stroke="#2F5D50" strokeWidth="0.6" fill="none" opacity="0.2" />
      <path d="M108 110 L112 108" stroke="#2F5D50" strokeWidth="0.6" fill="none" opacity="0.2" />

      {/* Front legs — one forward, alert stance */}
      <path
        d="M115 132 L118 145"
        stroke="#E8D8B9"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M118 145 L114 150 M118 145 L122 150"
        stroke="#E8D8B9"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      <path
        d="M125 128 L130 142"
        stroke="#E8D8B9"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M130 142 L126 147 M130 142 L134 147"
        stroke="#E8D8B9"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Neck — raised, alert */}
      <path
        d="M128 110 Q138 95 142 80"
        stroke="#E8D8B9"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />

      {/* Head — pointed, triangular */}
      <ellipse cx="145" cy="68" rx="14" ry="12" fill="#E8D8B9" />

      {/* Darker face mask */}
      <path
        d="M140 62 Q145 58 155 64"
        fill="#2F5D50"
        opacity="0.15"
      />

      {/* Ears — small, rounded */}
      <ellipse cx="137" cy="58" rx="4" ry="5" fill="#E8D8B9" />
      <ellipse cx="137" cy="58" rx="2.5" ry="3.5" fill="#2F5D50" opacity="0.2" />
      <ellipse cx="152" cy="60" rx="4" ry="5" fill="#E8D8B9" />
      <ellipse cx="152" cy="60" rx="2.5" ry="3.5" fill="#2F5D50" opacity="0.2" />

      {/* Eyes — alert, bright */}
      <circle cx="141" cy="66" r="3" fill="#1E3D34" />
      <circle cx="141.8" cy="65.2" r="1" fill="#FFFFFF" />
      <circle cx="151" cy="67" r="3" fill="#1E3D34" />
      <circle cx="151.8" cy="66.2" r="1" fill="#FFFFFF" />

      {/* Nose — pointed snout */}
      <path
        d="M155 72 Q162 70 164 72 Q162 74 155 73"
        fill="#1E3D34"
      />

      {/* Whiskers */}
      <path d="M160 71 L172 68" stroke="#1E3D34" strokeWidth="0.5" fill="none" />
      <path d="M160 73 L173 73" stroke="#1E3D34" strokeWidth="0.5" fill="none" />
      <path d="M160 75 L172 78" stroke="#1E3D34" strokeWidth="0.5" fill="none" />

      {/* Mouth */}
      <path d="M158 74 L155 76" stroke="#1E3D34" strokeWidth="0.6" fill="none" />

      {/* Shadow under mongoose */}
      <ellipse cx="105" cy="152" rx="35" ry="4" fill="#1E3D34" opacity="0.1" />
    </svg>
  );
}

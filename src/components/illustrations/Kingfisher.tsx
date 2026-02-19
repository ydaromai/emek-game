interface Props {
  className?: string;
}

export default function Kingfisher({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="שלדג"
      className={className}
    >
      <defs>
        <linearGradient id="kg-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4DB6AC" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#B3E5FC" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="kg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B3E5FC" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#B3E5FC" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Sky background hint */}
      <rect x="0" y="0" width="200" height="120" fill="url(#kg-sky)" />

      {/* Water surface */}
      <rect x="0" y="120" width="200" height="60" fill="url(#kg-water)" />

      {/* Water ripples */}
      <ellipse cx="80" cy="140" rx="30" ry="3" fill="#4DB6AC" opacity="0.3" />
      <ellipse cx="130" cy="150" rx="22" ry="2.5" fill="#4DB6AC" opacity="0.25" />
      <ellipse cx="50" cy="155" rx="18" ry="2" fill="#B3E5FC" opacity="0.3" />
      <ellipse cx="160" cy="145" rx="15" ry="2" fill="#B3E5FC" opacity="0.25" />

      {/* Branch — thick diagonal crossing water line */}
      <path
        d="M30 100 Q60 95 90 105 Q110 112 130 108 Q150 104 170 110"
        stroke="#2F5D50"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Branch texture lines */}
      <path
        d="M50 98 L55 96"
        stroke="#1E3D34"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M80 103 L85 100"
        stroke="#1E3D34"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Small twig */}
      <path
        d="M120 109 L128 98 M128 98 L133 93"
        stroke="#2F5D50"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Bird body — sitting on branch */}
      {/* Tail feathers */}
      <path
        d="M68 88 L42 78 L44 84 L38 80 L45 90 L68 94"
        fill="#4DB6AC"
      />

      {/* Body (oval shape) */}
      <ellipse cx="82" cy="86" rx="20" ry="15" fill="#4DB6AC" />

      {/* Belly / chest — orange-sand accent */}
      <ellipse cx="85" cy="91" rx="12" ry="10" fill="#E8D8B9" />

      {/* Wing overlay */}
      <path
        d="M66 80 Q75 72 88 76 Q82 86 70 92 Z"
        fill="#2F5D50"
      />
      {/* Wing feather lines */}
      <path d="M72 82 L82 78" stroke="#1E3D34" strokeWidth="0.8" fill="none" />
      <path d="M70 86 L80 82" stroke="#1E3D34" strokeWidth="0.8" fill="none" />

      {/* Head */}
      <circle cx="100" cy="72" r="11" fill="#4DB6AC" />

      {/* Head crest */}
      <path
        d="M94 63 L91 57 L96 61 L93 54 L98 60 L96 53 L100 62"
        fill="#2F5D50"
      />

      {/* Eye — white ring + dark pupil */}
      <circle cx="104" cy="70" r="3.5" fill="#FFFFFF" />
      <circle cx="105" cy="69.5" r="2" fill="#1E3D34" />
      <circle cx="105.8" cy="68.8" r="0.6" fill="#FFFFFF" />

      {/* Beak — long, straight, characteristic kingfisher */}
      <polygon
        points="110,71 135,68 110,74"
        fill="#1E3D34"
      />

      {/* Legs gripping branch */}
      <path
        d="M78 100 L78 107 M78 107 L75 109 M78 107 L81 109"
        stroke="#1E3D34"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M88 98 L88 106 M88 106 L85 108 M88 106 L91 108"
        stroke="#1E3D34"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Reflection in water */}
      <ellipse cx="85" cy="128" rx="14" ry="6" fill="#4DB6AC" opacity="0.15" />

      {/* Small reed on right */}
      <path d="M165 170 L165 125" stroke="#2F5D50" strokeWidth="2" fill="none" />
      <ellipse cx="165" cy="123" rx="3" ry="6" fill="#2F5D50" opacity="0.6" />
    </svg>
  );
}

interface PrepPalIconProps {
  size?: number;
  className?: string;
}

export default function PrepPalIcon({ size = 32, className = "" }: PrepPalIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="10" fill="#2b555f" />
      <path
        d="M10 9.5h12a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H10A1.5 1.5 0 0 1 8.5 21V11A1.5 1.5 0 0 1 10 9.5z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="13" y1="9.5" x2="13" y2="7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="9.5" x2="19" y2="7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13" cy="15" r="1" fill="white" />
      <line x1="16" y1="15" x2="21" y2="15" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="13" cy="19" r="1" fill="white" />
      <line x1="16" y1="19" x2="21" y2="19" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

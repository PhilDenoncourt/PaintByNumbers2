/**
 * Small line-icon set (lucide-style, stroke = currentColor) used by the icon
 * rail and controls. Kept dependency-free — sizing is controlled by the
 * `className` (e.g. `w-[22px] h-[22px]`).
 */

interface IconProps {
  className?: string;
}

function LineIcon({ className, paths }: IconProps & { paths: string[] }) {
  return (
    <svg
      className={className ?? 'w-[22px] h-[22px]'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <LineIcon
      {...props}
      paths={[
        'M12 21a9 9 0 1 1 0-18c4.97 0 9 3.58 9 8 0 2.21-1.79 3-3 3h-1.5a1.5 1.5 0 0 0-1.06 2.56A1.5 1.5 0 0 1 12 21Z',
        'M7.5 11.5h.01',
        'M11 8h.01',
        'M15.5 9.5h.01',
      ]}
    />
  );
}

export function AdjustIcon(props: IconProps) {
  return (
    <LineIcon
      {...props}
      paths={[
        'M4 6h10',
        'M18 6h2',
        'M4 12h4',
        'M12 12h8',
        'M4 18h12',
        'M18 18h2',
        'M14 4v4',
        'M8 10v4',
        'M16 16v4',
      ]}
    />
  );
}

export function RefineIcon(props: IconProps) {
  return (
    <LineIcon
      {...props}
      paths={['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z']}
    />
  );
}

export function ExportIcon(props: IconProps) {
  return (
    <LineIcon
      {...props}
      paths={['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']}
    />
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <LineIcon
      {...props}
      paths={['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12']}
    />
  );
}

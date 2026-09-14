export function Icon({
  name,
}: {
  name: 'arrow' | 'reset' | 'code' | 'chart' | 'copy' | 'check' | 'table';
}) {
  const paths = {
    arrow: 'M7 17 17 7M7 7h10v10',
    reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
    code: 'm8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18',
    chart: 'M4 4v16h16M7 14l4-5 4 3 5-7',
    copy: 'M8 8h12v13H8zM16 8V3H3v13h5',
    check: 'm5 12 4 4L19 6',
    table: 'M3 4h18v16H3zM3 10h18M9 4v16',
  };
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

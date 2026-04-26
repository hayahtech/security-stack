import type { SVGProps } from 'react';

export function BullHead(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 24, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width ?? size}
      height={height ?? size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {/* Fence posts */}
      <line x1="2" y1="6" x2="2" y2="20" />
      <line x1="8" y1="4" x2="8" y2="20" />
      <line x1="14" y1="4" x2="14" y2="20" />
      <line x1="20" y1="6" x2="20" y2="20" />
      {/* Horizontal rails */}
      <line x1="2" y1="9" x2="20" y2="9" />
      <line x1="2" y1="15" x2="20" y2="15" />
      {/* Pointed tops */}
      <polyline points="6,6 8,2 10,6" />
      <polyline points="12,6 14,2 16,6" />
    </svg>
  );
}

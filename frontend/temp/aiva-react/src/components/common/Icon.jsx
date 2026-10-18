import React from 'react';
import { PRISM_ICONS } from './prismIcons.js';

export const ICONS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
  log: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  layers: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  flask: 'M9 3h6M10 9h4M10 3v6l-4 9a2 2 0 0 0 1.8 2.9h8.4a2 2 0 0 0 1.8-2.9l-4-9V3',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  sun: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  check: 'M20 6L9 17l-5-5',
  cross: 'M18 6L6 18M6 6l12 12',
  alert: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
};

export function Icon({ name, className = '', size = 18, style }) {
  const prism = PRISM_ICONS && PRISM_ICONS[name];
  if (prism && Array.isArray(prism)) {
    const [stroke, fill, accent] = prism;
    return (
      <svg
        className={`ico ${className}`}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        {fill && <path d={fill} fill="currentColor" opacity="0.15" stroke="none" />}
        {stroke && <path d={stroke} />}
        {accent && <path d={accent} strokeWidth="2.2" stroke="var(--primary, currentColor)" />}
      </svg>
    );
  }

  const path = ICONS[name] || ICONS.inbox;
  return (
    <svg
      className={`ico ${className}`}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d={path} />
    </svg>
  );
}

export default Icon;

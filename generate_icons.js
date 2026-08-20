import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, 'public');

// SVG Icon template with modern parking branding (Indigo/Teal gradient + letter P + Car silhouette)
const createSvgIcon = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.1 : 0;
  const contentSize = size - padding * 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#312e81" />
      <stop offset="100%" stop-color="#4338ca" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${size * 0.03}" stdDeviation="${size * 0.04}" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${isMaskable ? 0 : size * 0.22}" fill="url(#bgGrad)" />

  <!-- Inner Glowing Ring -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.38}" fill="none" stroke="url(#accentGrad)" stroke-width="${size * 0.025}" opacity="0.4" />

  <!-- Parking 'P' Symbol -->
  <g filter="url(#shadow)">
    <!-- Main P Letter -->
    <path d="M ${size * 0.34} ${size * 0.26} 
             L ${size * 0.52} ${size * 0.26} 
             C ${size * 0.68} ${size * 0.26}, ${size * 0.68} ${size * 0.54}, ${size * 0.52} ${size * 0.54} 
             L ${size * 0.44} ${size * 0.54} 
             L ${size * 0.44} ${size * 0.74} 
             L ${size * 0.34} ${size * 0.74} Z" 
          fill="#ffffff" />
    
    <!-- P Inner Hole -->
    <path d="M ${size * 0.44} ${size * 0.35} 
             L ${size * 0.51} ${size * 0.35} 
             C ${size * 0.58} ${size * 0.35}, ${size * 0.58} ${size * 0.45}, ${size * 0.51} ${size * 0.45} 
             L ${size * 0.44} ${size * 0.45} Z" 
          fill="#312e81" />

    <!-- Stylized Car Accent on lower right -->
    <path d="M ${size * 0.52} ${size * 0.65} 
             L ${size * 0.58} ${size * 0.58} 
             L ${size * 0.68} ${size * 0.58} 
             L ${size * 0.74} ${size * 0.65} 
             L ${size * 0.78} ${size * 0.65} 
             C ${size * 0.8} ${size * 0.65}, ${size * 0.8} ${size * 0.72}, ${size * 0.78} ${size * 0.72} 
             L ${size * 0.5} ${size * 0.72} 
             C ${size * 0.48} ${size * 0.72}, ${size * 0.48} ${size * 0.65}, ${size * 0.52} ${size * 0.65} Z" 
          fill="url(#accentGrad)" />
    <!-- Car Wheels -->
    <circle cx="${size * 0.56}" cy="${size * 0.72}" r="${size * 0.03}" fill="#ffffff" />
    <circle cx="${size * 0.72}" cy="${size * 0.72}" r="${size * 0.03}" fill="#ffffff" />
  </g>
</svg>`;
};

// Generamos SVG files
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createSvgIcon(64));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.svg'), createSvgIcon(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.svg'), createSvgIcon(512));
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.svg'), createSvgIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), createSvgIcon(180));

console.log('✅ SVG PWA Icons generated successfully in public/');

export interface ThemeOption {
  id: string;
  name: string;
  dotColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'teal-figma', name: 'Teal PWA Figma', dotColor: '#174b5c' },
  { id: 'blanco-empresarial', name: 'Blanco / Claro Empresarial', dotColor: '#2563eb' },
  { id: 'oscuro-midnight', name: 'Oscuro Midnight', dotColor: '#6366f1' },
  { id: 'azul-oceano', name: 'Azul Océano Zafiro', dotColor: '#0284c7' },
  { id: 'verde-esmeralda', name: 'Verde Esmeralda Menta', dotColor: '#10b981' },
  { id: 'purpura-real', name: 'Púrpura Real Neón', dotColor: '#9333ea' },
];

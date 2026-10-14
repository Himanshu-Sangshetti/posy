/** Brand tokens win over the page theme on any element that carries these classes. */
export const CHROME = 'posy-app sc-chrome';

export const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD = '⌘';

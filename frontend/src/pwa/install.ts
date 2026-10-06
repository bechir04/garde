import { useSyncExternalStore } from 'react';

/**
 * App-install state shared by the install banner and the sidebar button.
 * Imported from main.tsx before rendering so the browser's one-time
 * `beforeinstallprompt` event is never missed.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const ua = navigator.userAgent;

export const isIOS =
  /iphone|ipad|ipod/i.test(ua) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS reports as a Mac

export const isTouchDevice = isIOS || /android/i.test(ua) || navigator.maxTouchPoints > 1;

/** Which manual steps to show when the browser offers no one-tap install (yet). */
export type Platform = 'ios' | 'samsung' | 'firefox' | 'android' | 'desktop';
export const platform: Platform =
  isIOS ? 'ios'
    : /SamsungBrowser/i.test(ua) ? 'samsung'
      : /android/i.test(ua) && /firefox/i.test(ua) ? 'firefox'
        : /android/i.test(ua) ? 'android'
          : 'desktop';

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// The installed app shares storage with the browser on the same site, so this flag
// lets the browser tab stop offering an install that already happened.
const INSTALLED_KEY = 'pwa_installed';
function markInstalled() {
  try { localStorage.setItem(INSTALLED_KEY, '1'); } catch { /* private mode */ }
}
function knownInstalled(): boolean {
  try { return localStorage.getItem(INSTALLED_KEY) === '1'; } catch { return false; }
}
if (isStandalone()) markInstalled();

type State = {
  canPrompt: boolean;  // the browser's one-tap install dialog is available right now
  installed: boolean;  // running as the installed app, or installed from this browser before
  helpOpen: boolean;   // show the manual "add to home screen" steps
};

let deferred: BeforeInstallPromptEvent | null = null;
let state: State = { canPrompt: false, installed: isStandalone() || knownInstalled(), helpOpen: false };
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // we show our own Arabic banner instead of the browser's mini-bar
  deferred = e as BeforeInstallPromptEvent;
  // The browser only offers this when the app is NOT installed, so clear a stale flag
  // (e.g. the user removed the app) and switch an open help panel to one-tap install.
  try { localStorage.removeItem(INSTALLED_KEY); } catch { /* ignore */ }
  set({ canPrompt: true, installed: false, helpOpen: false });
});

window.addEventListener('appinstalled', () => {
  deferred = null;
  markInstalled();
  set({ canPrompt: false, installed: true, helpOpen: false });
});

export function useInstallState(): State {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => state,
  );
}

/** One-tap install when the browser allows it, otherwise the manual steps for this browser. */
export async function requestInstall(): Promise<void> {
  if (deferred) {
    const ev = deferred;
    deferred = null;
    set({ canPrompt: false });
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === 'accepted') {
      markInstalled();
      set({ installed: true, helpOpen: false });
    }
  } else {
    set({ helpOpen: true });
  }
}

export function closeHelp() {
  set({ helpOpen: false });
}

/** The menu keeps an install entry everywhere except inside the installed app. */
export function canOfferInstall(): boolean {
  return !isStandalone();
}

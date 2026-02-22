const DEFAULT_STORAGE_KEY = 'jwot-client-id';

export function getClientFingerprint(storageKey = DEFAULT_STORAGE_KEY) {
  if (typeof window === 'undefined') return '';

  let clientId = localStorage.getItem(storageKey);
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem(storageKey, clientId);
  }

  return [navigator.userAgent, navigator.platform, clientId].join('|');
}

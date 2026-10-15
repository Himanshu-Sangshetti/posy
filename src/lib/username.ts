/** 3–30 letters, numbers, - or _ (cannot start or end with - or _). Client-safe. */
export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/;

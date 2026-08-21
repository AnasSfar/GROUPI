export function hiddenGroupsStorageKey(userId: string): string {
  return `groupi:hiddenGroups:${userId}`;
}

export function readHiddenGroupIds(userId: string | undefined): Set<string> {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(hiddenGroupsStorageKey(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function writeHiddenGroupIds(userId: string | undefined, ids: Set<string>): void {
  if (!userId) return;
  localStorage.setItem(hiddenGroupsStorageKey(userId), JSON.stringify([...ids]));
}

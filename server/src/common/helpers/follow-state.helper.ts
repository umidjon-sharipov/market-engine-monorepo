export function isToggleActive(history: unknown): boolean {
  return Array.isArray(history) && history.length % 2 === 1;
}

export function isActivelyFollowing(follow: unknown, block: unknown): boolean {
  return isToggleActive(follow) && !isToggleActive(block);
}

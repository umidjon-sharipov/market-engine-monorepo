import { isActivelyFollowing, isToggleActive } from './follow-state.helper';

describe('follow-state helpers', () => {
  it('treats odd-length history as the active toggle', () => {
    expect(isToggleActive(['a'])).toBe(true);
    expect(isToggleActive(['a', 'b'])).toBe(false);
    expect(isToggleActive(null)).toBe(false);
  });

  it('requires an active follow without an active block', () => {
    expect(isActivelyFollowing(['follow'], [])).toBe(true);
    expect(isActivelyFollowing(['follow'], ['block'])).toBe(false);
    expect(isActivelyFollowing(['follow', 'unfollow'], [])).toBe(false);
  });
});

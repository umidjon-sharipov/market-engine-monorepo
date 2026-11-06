import { haversineDistanceMeters } from './geo.helper';

describe('haversineDistanceMeters', () => {
  it('returns zero for identical coordinates', () => {
    expect(haversineDistanceMeters(41.3, 69.2, 41.3, 69.2)).toBe(0);
  });

  it('measures a known short distance in Tashkent', () => {
    const meters = haversineDistanceMeters(41.3111, 69.2797, 41.2995, 69.2401);
    expect(meters).toBeGreaterThan(3000);
    expect(meters).toBeLessThan(5000);
  });
});

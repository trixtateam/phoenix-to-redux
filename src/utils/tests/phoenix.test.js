import { formatSocketDomain } from '..';

describe('Phoenix util tests', () => {
  describe('formatSocketDomain', () => {
    it('should append ws: to localhost', () => {
      const expectedResult = 'ws:localhost:3000/socket';
      expect(formatSocketDomain({ domainString: 'localhost:3000' })).toEqual(expectedResult);
    });
  });
});

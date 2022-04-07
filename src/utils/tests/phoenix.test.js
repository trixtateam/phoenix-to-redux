import { formatSocketDomain } from '../../services/helpers';

describe('Phoenix util tests', () => {
  describe('formatSocketDomain', () => {
    it('should append ws: to localhost', () => {
      const expectedResult = 'ws://localhost:3000/socket';
      expect(formatSocketDomain('localhost:3000')).toEqual(expectedResult);
    });
  });
});

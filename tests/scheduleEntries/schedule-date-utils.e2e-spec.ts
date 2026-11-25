import { dayKey, getNextWorkingDay } from '../../src/scheduleEntries/schedule-date.utils';

describe('Schedule Date Utils', () => {

    it('should return the correct UK date', () => {
        const result = dayKey('1970-01-05T09:00:00.000Z');

        expect(result).toBe('1970-01-05');
    });

    it('should convert a late UTC time to the correct UK date', () => {
        const result = dayKey('1970-01-05T23:30:00.000Z');

        expect(result).toBe('1970-01-06');
    });

    it('should move Monday to Tuesday', () => {
        const result = getNextWorkingDay('1970-01-05T09:00:00.000Z');

        expect(result).toBe('1970-01-06T09:00:00.000Z');
    });

    it('should skip the weekend when moving from Friday', () => {
        const result = getNextWorkingDay('1970-01-02T09:00:00.000Z');

        expect(result).toBe('1970-01-05T09:00:00.000Z');
    });

    it('should skip Sunday when moving from Saturday', () => {
        const result = getNextWorkingDay('1970-01-03T09:00:00.000Z');

        expect(result).toBe('1970-01-05T09:00:00.000Z');
    });

    it('should preserve the original time', () => {
        const result = getNextWorkingDay('1970-01-05T14:30:00.000Z');

        expect(result).toBe('1970-01-06T14:30:00.000Z');
    });

});

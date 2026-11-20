import { planScheduleMoves, type ScheduleMove } from '../../src/scheduleEntries/schedule-planner';

describe("Schedule Planner", () => {

    const createMove = (
        entryId: string,
        taskId: string,
        originalTime: number,
        changes: Partial<ScheduleMove> = {},
    ): ScheduleMove => ({
        entryId,
        taskId,
        scheduledTime: "1970-01-05T09:00:00.000Z",
        originalTime,
        status: "Planned",
        isLocked: false,
        ...changes,
    });

    it("should schedule a task on a free day", () => {
        const incoming = createMove("entry-1", "1", 100);

        const result = planScheduleMoves(incoming, new Map());

        expect(result).toEqual([incoming]);

    });

    it('should move a newer task to the next day', () => {
        const existing = createMove('entry-1', '1', 100);
        const incoming = createMove('entry-2', '2', 200);

        const occupied = new Map([
            ['1970-01-05', existing],
        ]);

        const result = planScheduleMoves(incoming, occupied);

        expect(result[0].scheduledTime)
            .toBe('1970-01-06T09:00:00.000Z');
    });

    it('should give an older FDD task priority', () => {
        const existing = createMove('entry-1', '1', 200);
        const incoming = createMove('entry-2', '2', 100);

        const occupied = new Map([
            ['1970-01-05', existing],
        ]);

        const result = planScheduleMoves(incoming, occupied);

        expect(result).toHaveLength(2);

        expect(result.find(m => m.entryId === 'entry-2')?.scheduledTime)
            .toBe('1970-01-05T09:00:00.000Z');

        expect(result.find(m => m.entryId === 'entry-1')?.scheduledTime)
            .toBe('1970-01-06T09:00:00.000Z');
    });

    it('should not displace a locked booking', () => {
        const existing = createMove('entry-1', '1', 200, {
            isLocked: true,
        });

        const incoming = createMove('entry-2', '2', 100);

        const occupied = new Map([
            ['1970-01-05', existing],
        ]);

        expect(() => planScheduleMoves(incoming, occupied))
            .toThrow('Cannot displace a locked or completed booking.');
    });

    it('should not displace a completed booking', () => {
        const existing = createMove('entry-1', '1', 200, {
            status: 'Completed',
        });

        const incoming = createMove('entry-2', '2', 100);

        const occupied = new Map([
            ['1970-01-05', existing],
        ]);

        expect(() => planScheduleMoves(incoming, occupied))
            .toThrow('Cannot displace a locked or completed booking.');
    });

    it('should reject conflicting bookings for the same task i', () => {
        const existing = createMove('entry-1', '1', 100);
        const incoming = createMove('entry-2', '1', 200);

        const occupied = new Map([
            ['1970-01-05', existing],
        ]);

        expect(() => planScheduleMoves(incoming, occupied))
            .toThrow('Unable to determine task priority.');
    });

    it('should reject tasks with identical priority', () => {
        const existing = createMove('entry-1', '1', 100);
        const incoming = createMove('entry-2', '2', 100);

        const occupied = new Map([
            ['1970-01-05', existing],
        ]);

        expect(() => planScheduleMoves(incoming, occupied))
            .toThrow('Unable to determine task priority.');
    });

    it('should cascade multiple conflicting bookings', () => {
        const monday = createMove('entry-1', '1', 200);
        const tuesday = createMove('entry-2', '2', 300, {
            scheduledTime: '1970-01-06T09:00:00.000Z',
        });

        const incoming = createMove('entry-3', '3', 100);

        const occupied = new Map([
            ['1970-01-05', monday],
            ['1970-01-06', tuesday],
        ]);

        const result = planScheduleMoves(incoming, occupied);

        expect(result).toHaveLength(3);

        expect(result.find(m => m.entryId === 'entry-3')?.scheduledTime)
            .toBe('1970-01-05T09:00:00.000Z');

        expect(result.find(m => m.entryId === 'entry-1')?.scheduledTime)
            .toBe('1970-01-06T09:00:00.000Z');

        expect(result.find(m => m.entryId === 'entry-2')?.scheduledTime)
            .toBe('1970-01-07T09:00:00.000Z');
    });

    it('should skip weekends when resolving conflicts', () => {
        const existing = createMove('entry-1', '1', 100, {
            scheduledTime: '1970-01-02T09:00:00.000Z',
        });

        const incoming = createMove('entry-2', '2', 200, {
            scheduledTime: '1970-01-02T09:00:00.000Z',
        });

        const occupied = new Map([
            ['1970-01-02', existing],
        ]);

        const result = planScheduleMoves(incoming, occupied);

        expect(result[0].scheduledTime)
            .toBe('1970-01-05T09:00:00.000Z');
    });

})

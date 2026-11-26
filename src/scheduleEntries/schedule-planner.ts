import { ConflictException } from '@nestjs/common';
import type { ScheduleEntryStatus } from '../database/db.types';
import { dayKey, getNextWorkingDay } from './schedule-date.utils';
import { DEFAULT_DAILY_CAPACITY_MINUTES } from './schedule-duration.utils';

export type ScheduleMove = {
    entryId: string;
    taskId: string;
    scheduledTime: string;
    originalTime: number;
    status: ScheduleEntryStatus;
    isLocked: boolean;
    estimatedMinutes: number | null;
};

function getBookingMinutes(booking: ScheduleMove): number {
    const minutes = booking.estimatedMinutes;

    if (
        minutes === null ||
        !Number.isInteger(minutes) ||
        minutes < 0
    ) {
        throw new ConflictException(
            'Booking has no valid estimated duration.'
        );
    }

    if (minutes > DEFAULT_DAILY_CAPACITY_MINUTES) {
        throw new ConflictException(
            'Booking requires more than one working day.'
        );
    }

    return minutes;
}


export function planScheduleMoves(
    initialMove: ScheduleMove,
    existingBookings: Map<string, ScheduleMove[]>,
): ScheduleMove[] {

    const capacity = DEFAULT_DAILY_CAPACITY_MINUTES;

    const occupied = new Map(
        Array.from(existingBookings, ([day, bookings]) =>
            [day, [...bookings]] as const
        )
    );

    const proposedMoves = new Map<string, ScheduleMove>();
    const pending: ScheduleMove[] = [{ ...initialMove }];

    // Limit automatic scheduling to the next 20 working days.
    let lastAllowedTime = initialMove.scheduledTime;

    for (let i = 0; i < 20; i++) {
        lastAllowedTime = getNextWorkingDay(lastAllowedTime);
    }

    const lastAllowedDay = dayKey(lastAllowedTime);

    const moveForward = (booking: ScheduleMove) => ({
        ...booking,
        scheduledTime: getNextWorkingDay(booking.scheduledTime),
    });

    for (let attempts = 0; pending.length > 0; attempts++) {

        if (attempts >= 1000) {
            throw new ConflictException(
                'Unable to complete schedule allocation.'
            );
        }

        // Process earlier days and older findings first.
        pending.sort((a, b) =>
            dayKey(a.scheduledTime).localeCompare(
                dayKey(b.scheduledTime)
            ) || a.originalTime - b.originalTime
        );

        const moving = pending.shift()!;
        const day = dayKey(moving.scheduledTime);

        if (day > lastAllowedDay) {
            throw new ConflictException(
                'Unable to find sufficient working capacity.'
            );
        }

        const bookings = occupied.get(day) ?? [];

        if (bookings.some(booking =>
            booking.taskId === moving.taskId
        )) {
            throw new ConflictException(
                'This task already has a booking on this day.'
            );
        }

        const requiredMinutes = getBookingMinutes(moving);

        const usedMinutes = bookings.reduce(
            (total, booking) => total + getBookingMinutes(booking),
            0
        );

        // Enough capacity: add the booking without moving others.
        if (usedMinutes + requiredMinutes <= capacity) {

            occupied.set(day, [...bookings, moving]);

            proposedMoves.set(moving.entryId, moving);

            continue;
        }

        // Find newer bookings that can be displaced.
        const candidates = bookings
            .filter(booking =>
                booking.originalTime > moving.originalTime &&
                !booking.isLocked &&
                booking.status === 'Planned'
            )
            .sort((a, b) => b.originalTime - a.originalTime);

        let minutesToFree =
            usedMinutes + requiredMinutes - capacity;

        const displaced: ScheduleMove[] = [];

        for (const booking of candidates) {

            if (minutesToFree <= 0) break;

            displaced.push(booking);

            minutesToFree -= getBookingMinutes(booking);
        }

        // Not enough movable capacity. Try the next working day.
        if (minutesToFree > 0) {
            pending.push(moveForward(moving));
            continue;
        }

        const displacedIds = new Set(
            displaced.map(booking => booking.entryId)
        );

        occupied.set(day, [
            ...bookings.filter(
                booking => !displacedIds.has(booking.entryId)
            ),
            moving,
        ]);

        proposedMoves.set(moving.entryId, moving);

        // Reschedule the displaced bookings.
        for (const booking of displaced) {
            proposedMoves.delete(booking.entryId);
            pending.push(moveForward(booking));
        }
    }

    return [...proposedMoves.values()];
}


import { ConflictException } from '@nestjs/common';
import type { ScheduleEntryStatus } from '../database/db.types';
import { dayKey, getNextWorkingDay } from './schedule-date.utils';

export type ScheduleMove = {
    entryId: string;
    taskId: string;
    scheduledTime: string;
    originalTime: number;
    status: ScheduleEntryStatus;
    isLocked: boolean;
};

export function planScheduleMoves(
    initialMove: ScheduleMove,
    existingBookings: Map<string, ScheduleMove>,
): ScheduleMove[] {
    // Copy the occupied slots so the caller's map is not changed.
    const occupied = new Map(existingBookings);
    const proposedMoves = new Map<string, ScheduleMove>();
    let moving = { ...initialMove };

    //loop and checks conflicts, (20 times max) works out what booking gets priority based on existing bookings
    for (let attempts = 0; attempts < 20; attempts++) {
        const day = dayKey(moving.scheduledTime);
        const conflict = occupied.get(day);

        if (!conflict) {
            // Free day: place the final task and return the full cascade.
            occupied.set(day, moving);
            proposedMoves.set(moving.entryId, { ...moving });
            return [...proposedMoves.values()];
        }

        if (
            moving.taskId === conflict.taskId ||
            moving.originalTime === conflict.originalTime
        ) {
            throw new ConflictException('Unable to determine task priority.');
        }

        if (moving.originalTime < conflict.originalTime) {
            // Older FDD wins. The newer booking must move forward.
            if (conflict.isLocked || conflict.status !== 'Planned') {
                throw new ConflictException(
                    'Cannot displace a locked or completed booking.',
                );
            }

            occupied.set(day, moving);
            proposedMoves.set(moving.entryId, { ...moving });
            proposedMoves.delete(conflict.entryId);

            moving = {
                ...conflict,
                scheduledTime: getNextWorkingDay(conflict.scheduledTime),
            };
        } else {
            // Existing booking is older; find another day for this task.
            moving = {
                ...moving,
                scheduledTime: getNextWorkingDay(moving.scheduledTime),
            };
        }
    }

    throw new ConflictException('Unable to find a free working day.');
}

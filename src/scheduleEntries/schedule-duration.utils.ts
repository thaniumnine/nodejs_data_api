import { BadRequestException } from '@nestjs/common';

const HOURLY_RATE_GBP = 100;

export function calculateEstimatedMinutes(
    implementationCost: number,
): number {
    const minutes = Math.round(
        (implementationCost / HOURLY_RATE_GBP) * 60
    );

    if (
        !Number.isFinite(implementationCost) ||
        implementationCost < 0 ||
        !Number.isSafeInteger(minutes) ||
        minutes > 2147483647
    ) {
        throw new BadRequestException(
            'Invalid implementation cost.'
        );
    }

    return minutes;
}
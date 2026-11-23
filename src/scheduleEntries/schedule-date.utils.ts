const londonDateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

// Convert a timestamp to its UK calendar date.
export function dayKey(value: string | Date): string {
    const parts = londonDateFormatter.formatToParts(new Date(value));

    const part = (type: string) =>
        parts.find(item => item.type === type)?.value ?? '';

    return `${part('year')}-${part('month')}-${part('day')}`;
}

// Move forward to the next weekday, preserving the UTC time.
export function getNextWorkingDay(scheduledTime: string): string {
    const nextDate = new Date(scheduledTime);

    do {
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    } while (
        nextDate.getUTCDay() === 0 ||
        nextDate.getUTCDay() === 6
    );

    return nextDate.toISOString();
}

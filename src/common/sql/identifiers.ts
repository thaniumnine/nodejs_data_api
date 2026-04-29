import { BadRequestException } from '@nestjs/common';

const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function assertSafeIdentifier(identifier: string): void {
  if (!SAFE_IDENTIFIER.test(identifier)) {
    throw new BadRequestException(`Unsafe SQL identifier: ${identifier}`);
  }
}

export function quoteIdentifier(identifier: string): string {
  assertSafeIdentifier(identifier);
  return `"${identifier}"`;
}

export function quoteQualifiedIdentifier(identifier: string): string {
  const parts = identifier.split('.');

  if (parts.length === 0 || parts.length > 2 || parts.some((part) => !part)) {
    throw new BadRequestException(`Unsafe SQL identifier: ${identifier}`);
  }

  return parts.map(quoteIdentifier).join('.');
}

export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parseStringArray(parsed);
    } catch {
      return [];
    }
  }

  return [];
}

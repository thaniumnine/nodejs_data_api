import { z } from 'zod';

export const CreateTopicEventSchema = z.object({
  device_id: z.string().min(1).max(200),
  event_timestamp: z.string().datetime().optional(),
  payload: z.record(z.string(), z.unknown()),
  source: z.string().max(120).optional()
});

export type CreateTopicEventDto = z.infer<typeof CreateTopicEventSchema>;

export const QueryTopicRecordsSchema = z.object({
  device_id: z.string().min(1).max(200).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).max(100000).default(0)
});

export type QueryTopicRecordsDto = z.infer<typeof QueryTopicRecordsSchema>;

export const CreateNativeRowSchema = z.object({
  row: z.record(z.string(), z.unknown())
});

export type CreateNativeRowDto = z.infer<typeof CreateNativeRowSchema>;

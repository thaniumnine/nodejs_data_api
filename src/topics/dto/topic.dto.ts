import { z } from 'zod';

const TopicNameSchema = z.string().min(1).max(120).regex(/^[A-Za-z0-9_-]+$/);
const IdentifierSchema = z.string().min(1).max(160).regex(/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/);
const IdentifierArraySchema = z.array(z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/)).default([]);

export const CreateTopicSchema = z.object({
  name: TopicNameSchema,
  description: z.string().max(500).optional(),
  storage_type: z.enum(['jsonb_event_log', 'native_table']).default('jsonb_event_log'),
  table_name: IdentifierSchema.default('topic_events'),
  timestamp_column: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/).default('event_timestamp'),
  device_id_column: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/).default('device_id'),
  json_schema: z.record(z.string(), z.unknown()).optional(),
  allowed_select_columns: IdentifierArraySchema.optional(),
  allowed_filter_columns: IdentifierArraySchema.optional(),
  allowed_insert_columns: IdentifierArraySchema.optional(),
  is_active: z.boolean().optional()
});

export type CreateTopicDto = z.infer<typeof CreateTopicSchema>;

export const UpdateTopicSchema = CreateTopicSchema.omit({ name: true }).partial();
export type UpdateTopicDto = z.infer<typeof UpdateTopicSchema>;

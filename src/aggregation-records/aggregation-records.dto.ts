import z from "zod";

export type AggregationRecord = {
  device_id: string;
  event_timestamp: string;
  agg_type: string;
  payload: {
    [columnType: string]: number | null
  }
}
export type AggregationData = {
        items:  AggregationRecord[];
}

export const QueryAggregationRecordsSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  aggType: z.string(),
});

export type QueryAggregationRecords = z.infer<typeof QueryAggregationRecordsSchema>;

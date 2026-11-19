import { JsonValue } from "src/database/db.types";
import z from "zod";

export type DeviceHistoryRecord = {
  timestamp: string;
  version: string;
  points: {
    [pointtype: string]: JsonValue
  }
}
export type DeviceHistoryData = {
  items: DeviceHistoryRecord[]
}


export const QueryDeviceHistorySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type QueryDeviceHistoryRecords = z.infer<typeof QueryDeviceHistorySchema>;


export const QueryDeviceHistoryPrefixSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  devicePrefix:z.string()
});

export type QueryDeviceHistoryPrefixRecords = z.infer<typeof QueryDeviceHistoryPrefixSchema>;




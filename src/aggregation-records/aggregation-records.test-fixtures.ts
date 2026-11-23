export const DB_SERVICE_RETURNED_RESULTS = {
    queryAggregationRecords: {
        "rows": [
            {

                "illuminance_sensor": null,
                "last_week_total_occupancy": null,
                "motion_event": null,
                "this_week_cumulative_occupancy": null,

                "device_id": "MTS-00001",
                "event_timestamp": "2026-05-12T00:00:00.000Z"
            }
        ]
    },

    createAggregationDataEvent: {
        items: [{
            "device_id": "MTS-99997",
            "event_timestamp": "2026-04-24T12:34:00Z",
            "agg_type": "max",
            "payload": {
                "illuminance_sensor": 23,
                "last_week_total_occupancy": 301,
                "motion_event": 201,
                "this_week_cumulative_occupancy": 211
            }
        }]
    }
}

export const AGGREGATION_SERVICE_RETURNED_RESULTS = {
    getRequiredByName: {
        "device_type": "acu",
        "columns": [
            {
                "name": "room_temperature",
                "type": "numeric"
            },
            {
                "name": "room_temperature_setpoint",
                "type": "numeric"
            }
        ]
    }
}

export const EXPECTED_RESULTS = {
    queryAggregationRecords: {
        "records": [
            {
                "payload": {
                    "illuminance_sensor": null,
                    "last_week_total_occupancy": null,
                    "motion_event": null,
                    "this_week_cumulative_occupancy": null
                },
                "device_id": "MTS-00001",
                "event_timestamp": "2026-05-12T00:00:00.000Z"
            }
        ]

    }


}

export const SQL = {


}

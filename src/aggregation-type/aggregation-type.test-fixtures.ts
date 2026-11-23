export const DB_SERVICE_RETURNED_RESULTS = {
    list: [
        {
            "id": "54a1b2f2-0e74-45cb-a164-c24dc302b5e5",
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
            ],
            "created_at": "2026-06-03T15:06:39.847Z"
        }],

    createDeviceType: {
        "device_type": "qse",
        "columns": [
            {
                "name": "co2_level",
                "type": "numeric"
            },
            {
                "name": "humidity",
                "type": "numeric"
            }
        ]
    },
    getRequiredType: {
        "id": "e0a73079-0845-4ad4-80f4-dd977ae22ede",
        "device_type": "qse",
        "columns": [
            {
                "name": "co2_level",
                "type": "numeric"
            },
            {
                "name": "humidity",
                "type": "numeric"
            },
            {
                "name": "illuminance_sensor",
                "type": "numeric"
            },
            {
                "name": "minute_sound_level",
                "type": "numeric"
            },
            {
                "name": "pressure",
                "type": "numeric"
            },
            {
                "name": "temperature",
                "type": "numeric"
            },
            {
                "name": "total_volatile_organic_compounds",
                "type": "numeric"
            }
        ],
        "created_at": "2026-05-08T11:40:05.215Z"
    }
}

export const EXPECTED_RESULTS = {
    list: DB_SERVICE_RETURNED_RESULTS["list"],
    getRequiredType:DB_SERVICE_RETURNED_RESULTS['getRequiredType']


}

export const SQL = {


}

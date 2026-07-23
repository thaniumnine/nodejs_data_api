export const RESULT = {
  queryDeviceHistory: [{
    "points": {
      "humidity": {
        "present_value": 32
      },
      "pressure": {
        "present_value": 1009
      }
    }
  }
  ],
  queryDeviceHistoryPrefix: [{
    "points": {
      "humidity": {
        "present_value": 32
      },
      "pressure": {
        "present_value": 1009
      }
    }
  }
  ],
  createDeviceHistoryDataEvent: [{
    "id": "3",
    "device_id": "QSE-999998",
    "timestamp": "2026-03-25T16:16:31.000Z",
    "json_type": "pointset",
    "version": "1.4.2",
    "points": {
      "co2_level": {
        "present_value": 551
      },
      "total_volatile_organic_compounds": {
        "present_value": 31
      }
    },
    "created_at": "2026-06-08T12:18:16.847Z"
  }
  ],
  getDeviceNames: [
    { device_id: "MTS-001" },
    { device_id: "MTS-002" }
  ]

}

export const EXPECTED_RESULTS = {
  queryDeviceHistory: RESULT['queryDeviceHistory'],
  queryDeviceHistoryPrefix: RESULT['queryDeviceHistoryPrefix'],
  createDeviceHistoryDataEvent: {
    "items": [{
      "version": "1.4.2",
      "timestamp": "2026-03-25T16:16:31+00:00",
      "points": {
        "co2_level": {
          "present_value": 551
        },
        "total_volatile_organic_compounds": {
          "present_value": 31
        }
      }
    }
    ]
  },
  getDeviceNames:
    ["MTS-001",
      "MTS-002"]
}

export const SQL = {
queryDeviceHistoryPrefix:`SELECT di.device_id, dh.points, dh.timestamp, dh.version
    FROM device_history dh JOIN device_identifier di
    ON dh.device_ref_id = di.id
      WHERE dh.timestamp >= $1
      AND dh.timestamp < $2
      AND di.building = $3
      AND di.level = $4
      AND di.device_id LIKE $5
      ORDER BY device_id ASC, timestamp ASC`,

queryDeviceHistory:`SELECT dh.points, dh.timestamp
    FROM device_history dh JOIN device_identifier di 
      ON dh.device_ref_id = di.id
    WHERE dh.timestamp >= $1
      AND dh.timestamp < $2
      AND di.building = $3
      AND di.level = $4
      AND di.device_id = $5
    ORDER BY device_id ASC, timestamp ASC`,

  getDeviceNames:`  SELECT DISTINCT device_id
        FROM device_identifier
        where building = $1
        and level = $2
        and device_id LIKE $3`,


    deleteDeviceHistoryDataEvent:    `
    DELETE FROM device_history dh
    USING device_identifier di
    WHERE dh.device_ref_id = di.id
      AND di.device_id = ANY($1)
      AND dh.timestamp >= $2
      AND dh.timestamp < $3
      AND di.building = $4 
      AND di.level = $5
      
    `
    

}


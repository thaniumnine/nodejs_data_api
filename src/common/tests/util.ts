


export const normalizeSql = (sql: string) => (
  sql.replace(/\s+/g, ' ').trim()
)

export const expectSqlQuery = (dbService:{query:jest.Mock<any, any, any>},sql: string, params: unknown[]) => {
    expect(dbService.query).toHaveBeenCalledTimes(1);
    const [actualSql, actualParams] =
      dbService.query.mock.calls[0];
    expect(normalizeSql(actualSql)).toBe(normalizeSql(sql));
    expect(actualParams).toEqual(params);
  };


 export function queryResult<T>(rows: T[]) {
  return {
    rows,
    rowCount: rows.length,
  }
}

export function serviceResult<T>(records: T[]) {
  return {
    records,
    count: records.length,
  };
}

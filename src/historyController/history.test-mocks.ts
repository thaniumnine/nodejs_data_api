export function createHistoryDatabaseServiceMock(){

  const executeTakeFirstMock=jest.fn();
  const executeMock = jest.fn();

  const valuesMock = jest.fn().mockReturnValue({
    execute: executeMock ,
    onConflict: jest.fn().mockReturnValue({
      returning: jest.fn().mockReturnValue({
        executeTakeFirst: executeTakeFirstMock
      })
    })
  })

  const executeTakeFirstOrThrowMock =  jest.fn()  
  const service = {
    query: jest.fn(),


    db: {
      insertInto: jest.fn().mockReturnValue({
        values: valuesMock
      }),
      selectFrom: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                executeTakeFirstOrThrow: executeTakeFirstOrThrowMock

              })
            })

          })

        })
      })

    }

  }
  return {service,mocks:{valuesMock,executeTakeFirstMock,executeTakeFirstOrThrowMock,executeMock}}
}
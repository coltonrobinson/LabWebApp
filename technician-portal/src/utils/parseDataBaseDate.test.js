import parseDataBaseDate from "./parseDataBaseDate";

test('parseDataBaseDate with valid date returns correct date', () => {
    const date = parseDataBaseDate('2023-09-05T06:00:00.000Z')
    expect(date).toBe('09/05/2023')
})
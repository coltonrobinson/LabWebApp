function parseDataBaseDate(date) {
    const dateArray = date.split('T')[0].split('-');
    return `${dateArray[1]}/${dateArray[2]}/${dateArray[0]}`
}

export default parseDataBaseDate;
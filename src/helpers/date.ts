const isDateOlder = (date1: Date, date2: Date): Boolean => {
    const date1GMT = new Date(date1.toISOString())
    const date2GMT = new Date(date2.toISOString())

    return date1GMT < date2GMT
}

export { isDateOlder }
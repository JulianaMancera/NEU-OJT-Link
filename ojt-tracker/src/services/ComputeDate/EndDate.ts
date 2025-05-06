export const computeEndDate =(dateRaw : Date) : Date =>{
    const date = new Date(dateRaw)
    const day = dateRaw.getDate(); 
    const daysBeforeSat  = (6 - day + 7) % 7
    date.setDate(date.getDate() + daysBeforeSat);
    date.setHours(23, 59,59,99)
    return date;
}
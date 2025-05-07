export const computeEndDate = (dateRaw: Date): Date => {
    const date = new Date(dateRaw);
    const dayOfWeek = date.getDay(); 
    const daysUntilSaturday = (6 - dayOfWeek);
    date.setDate(date.getDate() + daysUntilSaturday);
    date.setHours(23, 59, 59, 999); 
    return date;
}

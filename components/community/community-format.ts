const date = new Intl.DateTimeFormat("es-PE",{dateStyle:"medium",timeZone:"America/Lima"});
const sol = new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN"});
export const formatDate = (value: string) => date.format(new Date(value));
export const formatPrice = (value: number) => sol.format(value);

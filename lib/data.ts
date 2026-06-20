export type Place = { id: number; name: string; category: string; district: string; rating: number; reviews: number; price: string; image: string; tags: string[]; sponsored?: boolean; open?: boolean };

export const places: Place[] = [
  { id: 1, name: "Clínica Felina Miraflores", category: "Veterinaria", district: "Miraflores", rating: 4.9, reviews: 186, price: "Consulta S/ 70", image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=900&q=80", tags: ["Especialistas felinos", "24 horas"], open: true },
  { id: 2, name: "Michimarket", category: "Pet Shop", district: "Surco", rating: 4.8, reviews: 94, price: "Desde S/ 18", image: "https://images.unsplash.com/photo-1603314585442-ee3b3c16fbcf?auto=format&fit=crop&w=900&q=80", tags: ["Delivery", "Productos naturales"], sponsored: true, open: true },
  { id: 3, name: "Cat Home Lima", category: "Hotel felino", district: "San Borja", rating: 4.7, reviews: 63, price: "S/ 55 por noche", image: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=900&q=80", tags: ["Sin jaulas", "Cámaras 24/7"], open: true },
  { id: 4, name: "Arena CleanCat Ultra", category: "Producto", district: "Todo Lima", rating: 4.6, reviews: 312, price: "S/ 42.90", image: "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=900&q=80", tags: ["Aglutinante", "Bajo polvo"] },
  { id: 5, name: "Cuidadores Mishi", category: "Cuidador", district: "Barranco", rating: 4.9, reviews: 48, price: "Desde S/ 35", image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80", tags: ["Visita a domicilio", "Verificados"] },
  { id: 6, name: "Fuente AquaPurr Mini", category: "Producto", district: "Todo Lima", rating: 4.5, reviews: 127, price: "S/ 89.90", image: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=900&q=80", tags: ["Silenciosa", "Acero inoxidable"] }
];

export const reviews = [
  { user: "Andrea P.", cat: "Mora · 4 años", level: "Confiable", rating: 5, text: "Fueron muy pacientes con Mora y explicaron cada paso con claridad. La sala exclusiva para gatos hizo una gran diferencia.", date: "Hace 4 días", helpful: 24, avatar: "AP" },
  { user: "Diego R.", cat: "Simón · 2 años", level: "Activo", rating: 4, text: "Buena atención y puntualidad. El espacio es tranquilo y el equipo se nota acostumbrado a tratar con gatos nerviosos.", date: "Hace 2 semanas", helpful: 11, avatar: "DR" }
];

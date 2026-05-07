// src/lib/garments.js — Full rate card with categories

export const GARMENT_CATEGORIES = {
  "Men's Wear": [
    'Track Pant','T-Shirt','Pants','Jeans','Shirt','Sweat Pants',
    'Pyjama','Kurta','Coat','Sweat Shirt','Swimming Costume',
    'Leather Jacket','Suede Leather Jacket','Waist Coat','Achkan',
    'Sherwani','Shorts','Capri','Jacket With Hood','Sweater Half',
    'Dhoti','Under Wear','Safari Suit Coat','Safari Suit Pant',
    'Shirt Silk','Shirt Woolen','Sweat Shirt With Hood',
    'Jacket Full Sleeves','Jacket Half Sleeves','Kurta Heavy',
    'Long Coat','Long Pullover','Sweater Full Sleeves Heavy',
    'Sweater Full Sleeves Plain','Sweater Half Sleeves Heavy',
    'Shawl Pankhi','Track Suit Upper','Achkan Heavy','Pheran Men'
  ],
  "Women's Wear": [
    'T-Shirt','Shirt','Jeans','Pants','Track Pant','Slacks','Pyjama',
    'Scarf','Blouse','Capri','Coat','Long Coat','Jumper','Dangree',
    'Stocking','Swimming Costume','Legging','Brassieres','Dupatta',
    'Petticoat','Saree Heavy','Shawl Pashmina','Kurta Heavy',
    'Blouse Heavy','Dress Heavy','Dress Very Heavy','Dress Long Heavy',
    'Dress Long Very Heavy','Dress Long Plain','Dress Plain',
    'Dupatta Heavy','Dupatta Very Heavy','Sweat Shirt With Hood',
    'Jacket Full Sleeves','Jacket Half Sleeves','Jacket With Hood (Women)',
    'Kurta Very Heavy','Kurta Plain','Lehnga Heavy','Lehnga Very Heavy',
    'Lehnga Plain','Salwar Heavy','Shawl Heavy','Shawl Very Heavy',
    'Shawl Plain','Stole Plain','Sweater Full Sleeves Heavy',
    'Sweater Full Sleeves Plain','Sweater Half Sleeves Heavy',
    'Sweater Half Sleeves Plain','Bridal Lehnga Blouse',
    'Bridal Lehnga Skirt','Nighty (Gown)','Burkha Plain','Burkha Heavy'
  ],
  "Kids": [
    'Dress Very Heavy (Kids)','Dress Long Plain (Kids)','Dress Plain (Kids)',
    'Dupatta Heavy (Kids)','Dupatta Very Heavy (Kids)',
    'Frock Heavy','Frock Very Heavy','Frock Plain',
    'Jacket Full Sleeves (Kids)','Jacket With Hood (Kids)',
    'Jumper (Kids)','Kurta Very Heavy (Kids)','Kurta Plain (Kids)',
    'Jacket Half Sleeves (Kids)','Lehnga Heavy (Kids)','Lehnga Plain (Kids)',
    'Long Pullover (Kids)','Salwar Heavy (Kids)','Shirt Woolen (Kids)',
    'Skirt Heavy','Skirt Very Heavy','Skirt Plain',
    'Sweater Full Sleeves Heavy (Kids)','Sweater Full Sleeves Plain (Kids)',
    'Sweater Half Sleeves Heavy (Kids)','Sweater Half Sleeves Plain (Kids)',
    'Top Heavy','Top Plain','Salwar Plain (Kids)',
    'Sweat Shirt With Hood (Kids)','Leather Jacket Large','Leather Jacket XL'
  ],
  "Household": [
    'Cushion Covers','Hand Towel','Chair Covers','Duvet','Foot Mats',
    'Blind Door','Blind Window','Curtain Door','Curtain Door With Lining',
    'Curtain Window','Curtain Window With Lining',
    'Quilt Cover Single','Quilt Cover Double',
    'Sofa Cover Large','Sofa Cover Medium','Sofa Cover Small',
    'Table Mat','Cushion Small','Cushion Medium','Cushion Large',
    'Blanket Double 2 Ply','Blanket Single 2 Ply',
    'Cushion Covers Large','Cushion Covers Medium',
    'Duvet Double','Table Cloth Large','Table Cloth Small',
    'Towel Large','Mattress Single','Mattress Double','Bed Head',
    'Curtain Belt','Quilt Very Heavy','Sleeping Bag Single','Sleeping Bag Double'
  ],
  "Shoes": [
    'Sport Shoes','Leather Shoes','Suede Leather Shoes'
  ]
}

export const GARMENT_RATES = {
  // Men's Wear
  'Track Pant': 130, 'T-Shirt': 130, 'Pants': 130, 'Jeans': 130,
  'Shirt': 130, 'Sweat Pants': 160, 'Pyjama': 150, 'Kurta': 180,
  'Coat': 340, 'Sweat Shirt': 280, 'Swimming Costume': 60,
  'Leather Jacket': 550, 'Suede Leather Jacket': 450, 'Waist Coat': 130,
  'Achkan': 430, 'Sherwani': 430, 'Shorts': 100, 'Capri': 150,
  'Jacket With Hood': 340, 'Sweater Half': 170, 'Dhoti': 130,
  'Under Wear': 60, 'Safari Suit Coat': 340, 'Safari Suit Pant': 130,
  'Shirt Silk': 160, 'Shirt Woolen': 160, 'Sweat Shirt With Hood': 340,
  'Jacket Full Sleeves': 280, 'Jacket Half Sleeves': 250,
  'Kurta Heavy': 270, 'Long Coat': 400, 'Long Pullover': 225,
  'Sweater Full Sleeves Heavy': 280, 'Sweater Full Sleeves Plain': 225,
  'Sweater Half Sleeves Heavy': 210, 'Shawl Pankhi': 280,
  'Track Suit Upper': 210, 'Achkan Heavy': 530, 'Pheran Men': 350,
  // Women's Wear
  'Slacks': 150, 'Scarf': 80, 'Blouse': 80, 'Stocking': 150,
  'Legging': 150, 'Brassieres': 60, 'Dupatta': 110, 'Petticoat': 80,
  'Saree Heavy': 290, 'Shawl Pashmina': 480, 'Blouse Heavy': 110,
  'Dress Heavy': 170, 'Dress Very Heavy': 200, 'Dress Long Heavy': 210,
  'Dress Long Very Heavy': 260, 'Dress Long Plain': 200, 'Dress Plain': 200,
  'Dupatta Heavy': 160, 'Dupatta Very Heavy': 250, 'Jumper': 190,
  'Dangree': 190, 'Jacket With Hood (Women)': 320, 'Kurta Very Heavy': 410,
  'Kurta Plain': 180, 'Lehnga Heavy': 540, 'Lehnga Very Heavy': 670,
  'Lehnga Plain': 420, 'Salwar Heavy': 225, 'Shawl Heavy': 225,
  'Shawl Very Heavy': 280, 'Shawl Plain': 170, 'Stole Plain': 110,
  'Sweater Half Sleeves Plain': 170, 'Bridal Lehnga Blouse': 210,
  'Bridal Lehnga Skirt': 730, 'Nighty (Gown)': 250,
  'Burkha Plain': 250, 'Burkha Heavy': 320,
  // Kids
  'Dress Very Heavy (Kids)': 160, 'Dress Long Plain (Kids)': 140,
  'Dress Plain (Kids)': 100, 'Dupatta Heavy (Kids)': 140,
  'Dupatta Very Heavy (Kids)': 190, 'Frock Heavy': 90,
  'Frock Very Heavy': 130, 'Frock Plain': 80,
  'Jacket Full Sleeves (Kids)': 225, 'Jacket With Hood (Kids)': 270,
  'Jumper (Kids)': 150, 'Kurta Very Heavy (Kids)': 330,
  'Kurta Plain (Kids)': 150, 'Jacket Half Sleeves (Kids)': 170,
  'Lehnga Heavy (Kids)': 440, 'Lehnga Plain (Kids)': 340,
  'Long Pullover (Kids)': 270, 'Salwar Heavy (Kids)': 180,
  'Shirt Woolen (Kids)': 130, 'Skirt Heavy': 280,
  'Skirt Very Heavy': 320, 'Skirt Plain': 240,
  'Sweater Full Sleeves Heavy (Kids)': 225, 'Sweater Full Sleeves Plain (Kids)': 180,
  'Sweater Half Sleeves Heavy (Kids)': 170, 'Sweater Half Sleeves Plain (Kids)': 140,
  'Top Heavy': 210, 'Top Plain': 150, 'Salwar Plain (Kids)': 110,
  'Sweat Shirt With Hood (Kids)': 270, 'Leather Jacket Large': 450,
  'Leather Jacket XL': 550,
  // Household
  'Cushion Covers': 60, 'Hand Towel': 50, 'Chair Covers': 60,
  'Duvet': 90, 'Foot Mats': 70, 'Blind Door': 240, 'Blind Window': 180,
  'Curtain Door': 150, 'Curtain Door With Lining': 240,
  'Curtain Window': 150, 'Curtain Window With Lining': 180,
  'Quilt Cover Single': 250, 'Quilt Cover Double': 270,
  'Sofa Cover Large': 160, 'Sofa Cover Medium': 110, 'Sofa Cover Small': 60,
  'Table Mat': 60, 'Cushion Small': 140, 'Cushion Medium': 200,
  'Cushion Large': 270, 'Blanket Double 2 Ply': 610,
  'Blanket Single 2 Ply': 490, 'Cushion Covers Large': 160,
  'Cushion Covers Medium': 110, 'Duvet Double': 150,
  'Table Cloth Large': 150, 'Table Cloth Small': 80,
  'Towel Large': 140, 'Mattress Single': 1050, 'Mattress Double': 2050,
  'Bed Head': 1700, 'Curtain Belt': 150, 'Quilt Very Heavy': 610,
  'Sleeping Bag Single': 250, 'Sleeping Bag Double': 280,
  // Shoes
  'Sport Shoes': 250, 'Leather Shoes': 300, 'Suede Leather Shoes': 350,
}

export const SERVICES = [
  'Dry Clean',
  'Steam Iron',
  'Premium Laundry',
  'Wash & Fold (Per KG)',
  'Wash & Iron (Per KG)',
]

// Default KG rates per service — shown automatically when switching service type
export const SERVICE_KG_RATES = {
  'Dry Clean':           0,    // piece billing only
  'Steam Iron':          0,    // piece billing only
  'Premium Laundry':     0,    // piece billing only
  'Wash & Fold (Per KG)': 60,
  'Wash & Iron (Per KG)': 90,
}

// Whether a service is KG-based by default
export function isKgService(serviceType) {
  return serviceType === 'Wash & Fold (Per KG)' || serviceType === 'Wash & Iron (Per KG)'
}

export const EMPLOYEES = ['Jamil', 'Ajaz', 'Moomin', 'Shahid', 'Shabir']
export const ATT_STATUSES = ['Working', 'Absent', 'Leave', 'Half Day', 'Holiday']

// Generate next tag number from existing orders
export function getNextTag(orders) {
  if (!orders.length) return 'P1000'
  const tags = orders
    .map(o => o.tagNumber)
    .filter(t => t?.startsWith('P'))
    .map(t => parseInt(t.slice(1)))
    .filter(n => !isNaN(n))
  if (!tags.length) return 'P1000'
  return `P${Math.max(...tags) + 1}`
}

// Delivery date: order date + 3 working days (skip Sundays)
export function calcDeliveryDate(fromDate = new Date()) {
  const d = new Date(fromDate)
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  let added = 0
  while (added < 3) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0) added++
  }
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)} ${days[d.getDay()]}`
}

export interface Drink {
  id: string;
  name: string;
  price: number;
  category: "coffee" | "tea" | "other";
  emoji: string;
}

export const drinks: Drink[] = [
  // Coffee
  { id: "espresso", name: "Espresso", price: 2.50, category: "coffee", emoji: "☕" },
  { id: "latte", name: "Latte", price: 4.00, category: "coffee", emoji: "☕" },
  { id: "cappuccino", name: "Cappuccino", price: 4.00, category: "coffee", emoji: "☕" },
  { id: "americano", name: "Americano", price: 3.00, category: "coffee", emoji: "☕" },
  
  // Tea
  { id: "green-tea", name: "Green Tea", price: 3.00, category: "tea", emoji: "🍵" },
  { id: "iced-tea", name: "Iced Tea", price: 3.50, category: "tea", emoji: "🍵" },
  { id: "chai-latte", name: "Chai Latte", price: 4.50, category: "tea", emoji: "🍵" },
  
  // Other
  { id: "berry-smoothie", name: "Berry Smoothie", price: 5.50, category: "other", emoji: "🥤" },
  { id: "mango-smoothie", name: "Mango Smoothie", price: 5.50, category: "other", emoji: "🥤" },
  { id: "lemonade", name: "Lemonade", price: 3.00, category: "other", emoji: "🥤" },
  { id: "cola", name: "Cola", price: 2.50, category: "other", emoji: "🥤" },
  { id: "sparkling-water", name: "Sparkling Water", price: 2.00, category: "other", emoji: "🥤" },
];

export const categories = [
  { id: "coffee", label: "Coffee", emoji: "☕" },
  { id: "tea", label: "Tea", emoji: "🍵" },
  { id: "other", label: "Other", emoji: "🥤" },
] as const;

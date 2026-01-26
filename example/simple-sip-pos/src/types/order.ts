import type { Drink } from "@/data/drinks";

export interface OrderItemData {
  drink: Drink;
  quantity: number;
}

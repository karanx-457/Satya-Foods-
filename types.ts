
export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface MenuItem {
  name: string;
  price: number;
}

export interface RestaurantDetails {
  name: string;
  tagline: string;
  address: string;
  gstin: string;
}

export interface BillState {
  billNumber: string;
  table: string;
  date: string;
  time: string;
  items: BillItem[];
}

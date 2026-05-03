export interface AbandonedCartClient {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  homePhone: string;
  rclastcart: string;
  createdIn?: string;
  parsedCartItems?: any[] | null;
  parsedCartJson?: any | null;
  cartType?: 'url_params' | 'json' | 'raw';
}

export interface ApiResponse {
  data: AbandonedCartClient[];
  totalFetched: number;
  totalWithCarts: number;
  error?: string;
}

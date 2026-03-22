export interface ProductVariant {
  id?: string;
  color: string;
  size: string;
  stockQuantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  discount: number;
  discountedPrice: number;
  variants: ProductVariant[];
}
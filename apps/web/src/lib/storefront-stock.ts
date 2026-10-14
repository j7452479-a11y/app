export type StorefrontCartProduct = {
  id: string;
  name: string;
  description?: string;
  price_paise: number;
  stock: number;
  image_url?: string | null;
};

export function resolveStorefrontStock(
  isInStock: boolean,
  exactStock?: number,
): number {
  if (typeof exactStock === "number" && Number.isFinite(exactStock) && exactStock >= 0) {
    return Math.floor(exactStock);
  }
  return isInStock ? 1 : 0;
}

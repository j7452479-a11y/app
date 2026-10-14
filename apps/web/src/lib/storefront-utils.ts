export function createProductSlug(name: string, productId: string): string {
  const readableName = name
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
    .replace(/-+$/g, "");
  const readableId = productId.toLowerCase().replace(/[^a-z0-9]/g, "");

  return `${readableName || "product"}-${readableId}`;
}

export function isOrderTrackingEnabled(plan: string): boolean {
  return plan === "plus" || plan === "pro";
}

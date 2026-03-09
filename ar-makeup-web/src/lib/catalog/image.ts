export function getProductImageUrl(image_url: string | null) {
  if (!image_url || image_url.trim().length === 0) {
    return "/images/product_placeholder.png";
  }
  return image_url;
}

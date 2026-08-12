import sharp from 'sharp';

const stat = async (src, x0, y0, x1, y1) => {
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const px = (x, y) => {
    const i = (y * W + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const lum = (p) => 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
  let s = 0, n = 0;
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      s += lum(px(x, y));
      n++;
    }
  }
  return (s / n).toFixed(1);
};

console.log('HOME light banner zone (expect DARK <100, scrim):', await stat('C:/code/hdr-home.png', 100, 20, 500, 28));
console.log('HOME light header row (expect mid-dark scrim):', await stat('C:/code/hdr-home.png', 100, 55, 500, 70));
console.log('HOME dark banner zone (expect <25):', await stat('C:/code/hdr-home-dark.png', 100, 20, 500, 28));
console.log('PRODUCTS light header (expect brand-surface 245-252):', await stat('C:/code/hdr-products.png', 400, 40, 1000, 90));
console.log('PRODUCTS dark header (expect ~10-14):', await stat('C:/code/hdr-products-dark.png', 400, 40, 1000, 90));
console.log('PRODUCTS dark nav text row (expect some light text):', await stat('C:/code/hdr-products-dark.png', 100, 55, 400, 70));

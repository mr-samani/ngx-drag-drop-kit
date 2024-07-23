export function getXYfromTransform(el: HTMLElement) {
  const trans = getComputedStyle(el).getPropertyValue('transform');
  const matrix = trans.replace(/[^0-9\-.,]/g, '').split(',');
  const x = parseFloat(matrix.length > 6 ? matrix[12] : matrix[4]) || 0;
  const y = parseFloat(matrix.length > 6 ? matrix[13] : matrix[5]) || 0;
  return { x, y };
}

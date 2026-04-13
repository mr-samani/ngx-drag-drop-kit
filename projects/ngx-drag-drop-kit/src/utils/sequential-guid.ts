export function generateSequentialGuid(): string {
  // تولید 10 بایت تصادفی
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);

  // زمان بر حسب میلی‌ثانیه از epoch (1970)
  const now = Date.now();

  // 6 بایت از زمان (به big-endian)
  const timeBytes = new Uint8Array(6);
  const timeBig = BigInt(now);
  for (let i = 0; i < 6; i++) {
    timeBytes[5 - i] = Number((timeBig >> BigInt(i * 8)) & 0xffn);
  }

  // ترکیب: 10 بایت تصادفی + 6 بایت زمان
  const allBytes = new Uint8Array(16);
  allBytes.set(randomBytes, 0);
  allBytes.set(timeBytes, 10);

  // تبدیل به فرمت استاندارد GUID
  const hex = Array.from(allBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // اضافه کردن خط تیره‌ها در مکان‌های استاندارد UUID
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(
    16,
    20,
  )}-${hex.substring(20)}`;
}

/**
 * Tiện ích định dạng tiền tệ Việt Nam (VNĐ)
 * Đảm bảo hiển thị chuẩn xác, chống lỗi SSR Hydration trong Next.js
 */

/**
 * Định dạng số thành chuỗi tiền tệ hiển thị: "1.500.000 ₫"
 */
export function formatVND(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "0 ₫";
  const num = typeof amount === "number" ? amount : Number(String(amount).replace(/[^\d.-]/g, ""));
  if (isNaN(num)) return "0 ₫";
  
  const isNegative = num < 0;
  const absVal = Math.round(Math.abs(num));
  const formatted = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${isNegative ? "-" : ""}${formatted} ₫`;
}

/**
 * Định dạng chuỗi nhập liệu có dấu chấm phân cách hàng nghìn khi người dùng gõ phím:
 * Ví dụ: "1500000" -> "1.500.000"
 */
export function formatCurrencyInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const cleanDigits = String(value).replace(/\D/g, "");
  if (!cleanDigits) return "";
  const trimmed = cleanDigits.replace(/^0+(?=\d)/, "");
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Chuyển chuỗi tiền tệ có định dạng (hoặc bất kỳ định dạng nào) về số nguyên thuần túy
 * Ví dụ: "1.500.000 ₫" -> 1500000
 */
export function parseCurrency(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const cleanDigits = String(value).replace(/\D/g, "");
  return cleanDigits ? Number(cleanDigits) : 0;
}

/**
 * Chuyển số tiền thành chữ tiếng Việt trực quan
 * Giúp người dùng kiểm tra tránh nhầm lẫn thừa/thiếu số 0 khi nhập tiền lớn
 * Ví dụ: 1500000 -> "Một triệu năm trăm nghìn đồng"
 */
export function numberToWordsVN(amount: number | string | null | undefined): string {
  const num = typeof amount === "number" ? amount : parseCurrency(amount);
  if (!num || num <= 0) return "";

  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  function readGroup(group: number, showZeroHundred: boolean): string {
    const h = Math.floor(group / 100);
    const t = Math.floor((group % 100) / 10);
    const u = group % 10;
    let res = "";

    if (h > 0 || showZeroHundred) {
      res += digits[h] + " trăm ";
    }

    if (t > 1) {
      res += digits[t] + " mươi ";
      if (u === 1) res += "mốt ";
      else if (u === 5) res += "lăm ";
      else if (u > 0) res += digits[u] + " ";
    } else if (t === 1) {
      res += "mười ";
      if (u === 5) res += "lăm ";
      else if (u > 0) res += digits[u] + " ";
    } else {
      if ((h > 0 || showZeroHundred) && u > 0) {
        res += "lẻ " + digits[u] + " ";
      } else if (u > 0) {
        res += digits[u] + " ";
      }
    }

    return res.trim();
  }

  const s = Math.round(num).toString();
  const groups: number[] = [];
  for (let i = s.length; i > 0; i -= 3) {
    groups.unshift(Number(s.substring(Math.max(0, i - 3), i)));
  }

  let result = "";
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g > 0) {
      const showZeroHundred = i > 0;
      const gStr = readGroup(g, showZeroHundred);
      const unitIndex = groups.length - 1 - i;
      const unit = units[unitIndex] ? " " + units[unitIndex] : "";
      result += (result ? " " : "") + gStr + unit;
    }
  }

  result = result.trim();
  if (!result) return "";

  return result.charAt(0).toUpperCase() + result.slice(1) + " đồng";
}

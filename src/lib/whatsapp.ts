/**
 * WhatsApp numarasını wa.me biçimine çevirir: yalnızca rakam, ülke koduyla.
 * "0555 111 22 33" → "905551112233". Geçersizse boş döner (düğme çıkmaz).
 */
export function whatsappNumber(raw: string | undefined | null): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = "9" + digits; // 05xx → 905xx
  if (digits.length === 10 && digits.startsWith("5")) digits = "90" + digits; // 5xx → 905xx
  return /^\d{10,15}$/.test(digits) ? digits : "";
}

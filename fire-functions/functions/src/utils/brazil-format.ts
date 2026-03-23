export function formatDateToBrazilian(date: Date): string {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const pick = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "";
  const weekday = pick("weekday");
  const day = pick("day");
  const month = pick("month");
  const hour = pick("hour").padStart(2, "0");
  const minute = pick("minute").padStart(2, "0");
  return `${weekday}, ${day} de ${month} às ${hour}:${minute}`;
}

export function formatPhoneForSms(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned || cleaned.length < 10) return null;
  let digits = cleaned;
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  if (!digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return digits;
}

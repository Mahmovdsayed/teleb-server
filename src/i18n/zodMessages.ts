import { zodErrorMaps, type Lang } from "./index";
type Issue = { code: string; [key: string]: any };

const typeLabels: Record<Lang, Record<string, string>> = {
  en: {
    string: "a string", number: "a number", boolean: "a boolean",
    array: "an array", object: "an object", date: "a date",
    bigint: "a bigint", nan: "a number", null: "null", undefined: "a value",
    map: "a map", set: "a set", symbol: "a symbol", function: "a function",
  },
  ar: {
    string: "نصًا", number: "رقمًا", boolean: "قيمة منطقية",
    array: "مصفوفة", object: "كائنًا", date: "تاريخًا",
    bigint: "عددًا كبيرًا", nan: "رقمًا", null: "قيمة فارغة", undefined: "قيمة",
    map: "خريطة", set: "مجموعة", symbol: "رمزًا", function: "دالة",
  },
};

const unitLabels: Record<Lang, Record<string, string>> = {
  en: { string: "characters", array: "items", set: "items", number: "", bigint: "", date: "" },
  ar: { string: "أحرف", array: "عناصر", set: "عناصر", number: "", bigint: "", date: "" },
};

const formatLabels: Record<Lang, Record<string, string>> = {
  en: {
    email: "email address", url: "URL", uuid: "UUID", emoji: "emoji",
    ipv4: "IPv4 address", ipv6: "IPv6 address", cidrv4: "IPv4 range", cidrv6: "IPv6 range",
    base64: "base64 string", base64url: "base64url string", json_string: "JSON string",
    date: "date (YYYY-MM-DD)", time: "time", datetime: "date and time", duration: "duration",
    jwt: "JWT", nanoid: "NanoID", cuid: "CUID", cuid2: "CUID2", ulid: "ULID", guid: "GUID",
  },
  ar: {
    email: "بريد إلكتروني", url: "رابط", uuid: "UUID", emoji: "إيموجي",
    ipv4: "عنوان IPv4", ipv6: "عنوان IPv6", cidrv4: "نطاق IPv4", cidrv6: "نطاق IPv6",
    base64: "نص base64", base64url: "نص base64url", json_string: "نص JSON",
    date: "تاريخ (YYYY-MM-DD)", time: "وقت", datetime: "تاريخ ووقت", duration: "مدة زمنية",
    jwt: "JWT", nanoid: "NanoID", cuid: "CUID", cuid2: "CUID2", ulid: "ULID", guid: "GUID",
  },
};

const templates: Record<Lang, Record<string, (iss: any) => string>> = {
  en: {
    invalid_type: (iss) => `Expected ${typeLabels.en[iss.expected] ?? iss.expected}`,
    too_small: (iss) => {
      const unit = unitLabels.en[iss.origin] ?? "";
      const cmp = iss.inclusive ? "at least" : "more than";
      return `Must be ${cmp} ${iss.minimum} ${unit}`.trim();
    },
    too_big: (iss) => {
      const unit = unitLabels.en[iss.origin] ?? "";
      const cmp = iss.inclusive ? "at most" : "less than";
      return `Must be ${cmp} ${iss.maximum} ${unit}`.trim();
    },

    not_multiple_of: (iss) => `Must be a multiple of ${iss.divisor}`,
    unrecognized_keys: (iss) => `Unrecognized field${iss.keys.length > 1 ? "s" : ""}: ${iss.keys.join(", ")}`,
    invalid_union: () => "Value does not match any of the expected formats",
    invalid_key: () => "Invalid key",
    invalid_element: () => "Invalid element",
    invalid_value: (iss) => `Must be one of: ${(iss.values ?? []).map(String).join(", ")}`,
    invalid_format: (iss) => {
      if (iss.format === "starts_with") return `Must start with "${iss.prefix}"`;
      if (iss.format === "ends_with") return `Must end with "${iss.suffix}"`;
      if (iss.format === "includes") return `Must include "${iss.includes}"`;
      if (iss.format === "regex") return "Invalid format";
      const label = formatLabels.en[iss.format];
      return label ? `Must be a valid ${label}` : "Invalid format";
    },

    custom: (iss) => iss.message ?? "Invalid value",
  },

  ar: {
    invalid_type: (iss) => `يجب أن يكون ${typeLabels.ar[iss.expected] ?? iss.expected}`,
    too_small: (iss) => {
      const unit = unitLabels.ar[iss.origin] ?? "";
      return `يجب ألا يقل عن ${iss.minimum} ${unit}`.trim();
    },
    too_big: (iss) => {
      const unit = unitLabels.ar[iss.origin] ?? "";
      return `يجب ألا يزيد عن ${iss.maximum} ${unit}`.trim();
    },
    not_multiple_of: (iss) => `يجب أن يكون من مضاعفات ${iss.divisor}`,
    unrecognized_keys: (iss) => `حقول غير معروفة: ${iss.keys.join("، ")}`,
    invalid_union: () => "القيمة لا تطابق أيًا من الصيغ المتوقعة",
    invalid_key: () => "مفتاح غير صالح",
    invalid_element: () => "عنصر غير صالح",
    invalid_value: (iss) => `يجب أن تكون القيمة إحدى: ${(iss.values ?? []).map(String).join("، ")}`,
    invalid_format: (iss) => {
      if (iss.format === "starts_with") return `يجب أن يبدأ بـ "${iss.prefix}"`;
      if (iss.format === "ends_with") return `يجب أن ينتهي بـ "${iss.suffix}"`;
      if (iss.format === "includes") return `يجب أن يحتوي على "${iss.includes}"`;
      if (iss.format === "regex") return "صيغة غير صالحة";
      const label = formatLabels.ar[iss.format];
      return label ? `يجب أن يكون ${label} صالحًا` : "صيغة غير صالحة";
    },
    custom: (iss) => iss.message ?? "قيمة غير صالحة",
  },
};

export function localizedZodError(lang: Lang) {
  return (iss: Issue): string => {
    const fn = templates[lang][iss.code];
    if (fn) return fn(iss);
    return zodErrorMaps[lang](iss as any) as string;
  };
}
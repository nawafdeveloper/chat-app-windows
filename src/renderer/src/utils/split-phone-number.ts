import { countries } from "../lib/countries-code";

export function splitPhoneNumber(fullNumber: string): {
    dialCode: string;
    phoneNumber: string;
} {
    const normalized = fullNumber.trim();

    const sorted = [...countries].sort(
        (a, b) => b.dialCode.length - a.dialCode.length
    );

    for (const country of sorted) {
        const normalizedDialCode = country.dialCode.replace(/\u2011/g, "-");
        if (normalized.startsWith(normalizedDialCode)) {
            return {
                dialCode: normalizedDialCode,
                phoneNumber: normalized.slice(normalizedDialCode.length),
            };
        }
    }

    return { dialCode: "", phoneNumber: normalized };
}
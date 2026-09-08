/**
 * Database string encoder & decoder for PostgreSQL clusters initialized
 * with Windows ANSI/WIN1252 encoding (common on Windows systems).
 *
 * Prevents PostgreSQL error code 22P05:
 * "character with byte sequence ... in encoding UTF8 has no equivalent in encoding WIN1252"
 * by transparently encoding astral plane characters (such as 4-byte emojis)
 * as ASCII hexadecimal HTML entities (&#xXXXX;) before DB persistence,
 * and decoding them back when reading/serving.
 */

const NON_ASCII_EXTENDED_REGEX = /[^\x00-\xFF]/gu;
const HEX_ENTITY_REGEX = /&#x([0-9a-fA-F]+);/g;

export function encodeDbText(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return (input ?? "") as string;
  return input.replace(NON_ASCII_EXTENDED_REGEX, (char) => {
    const code = char.codePointAt(0);
    return code !== undefined ? `&#x${code.toString(16)};` : "";
  });
}

export function decodeDbText(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return (input ?? "") as string;
  return input.replace(HEX_ENTITY_REGEX, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16));
    } catch {
      return _;
    }
  });
}

export function deepEncodeForDb<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return encodeDbText(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(deepEncodeForDb) as unknown as T;
  if (typeof obj === "object" && !(obj instanceof Date) && !(obj instanceof Uint8Array)) {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      res[key] = deepEncodeForDb(value);
    }
    return res as T;
  }
  return obj;
}

export function deepDecodeFromDb<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return decodeDbText(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(deepDecodeFromDb) as unknown as T;
  if (typeof obj === "object" && !(obj instanceof Date) && !(obj instanceof Uint8Array)) {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      res[key] = deepDecodeFromDb(value);
    }
    return res as T;
  }
  return obj;
}

export const bigintSerializer = (key: string, value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString() + "n";
  }

  return value;
};

export const bigintDeserializer = (key: string, value: unknown): unknown => {
  if (typeof value === "string" && /^-?\d+n$/.test(value)) {
    return BigInt(value.slice(0, -1));
  }

  return value;
};

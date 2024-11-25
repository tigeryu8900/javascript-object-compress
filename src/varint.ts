export function encodeVarUint(num: number): number[] {
  const result = [];
  while (true) {
    let tmp = num & 0x7f;
    num >>= 7;
    if (num > 0) {
      tmp |= 0x80;
      result.push(tmp);
    } else {
      result.push(tmp);
      break;
    }
  }
  return result;
}

export function decodeVarUint(buf: ArrayLike<number>, offset: number): [number, number] {
  let result = 0;
  for (let shift = 0; !shift || buf[offset - 1] & 0x80; shift += 7, offset++) {
    result |= (buf[offset] & 0x7f) << shift;
  }
  return [result, offset];
}

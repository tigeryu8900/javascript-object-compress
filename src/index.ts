import {
  type Compressible,
  type CompressibleObject,
  type TypedArray,
  type TypedArrayConstructor,
  type TypedArrayEnum,
  TypeEnum
} from "./types";
import {Uint8ArrayBuilder, Uint8ArrayBuilder2} from "./builders";
import {decodeVarUint, encodeVarUint} from "./varint";

interface Ref {
  buf: Uint8ArrayBuilder;
  ptr: Uint8Array;
  offset: number;
}

function encodeUint32(length: number): [number, number, number, number] {
  return [
    length & 0xff,
    (length >> 8) & 0xff,
    (length >> 16) & 0xff,
    (length >> 24) & 0xff
  ];
}

function decodeUint32(array: ArrayLike<number>): number {
  return array[0] + (array[1] << 8) + (array[2] << 16) + (array[3] << 24);
}

async function compressTypedArray(
    obj: TypedArray,
    refs: Map<object, Ref>,
    buf: Uint8ArrayBuilder,
    type: TypedArrayEnum
): Promise<void> {
  await compressObject(obj.buffer as ArrayBuffer, refs, new Uint8ArrayBuilder(), false);
  buf.append([type]);
  buf.append(refs.get(obj.buffer)?.ptr ?? new Uint8Array(4));
  buf.append(encodeVarUint(obj.byteOffset));
  buf.append(encodeVarUint(obj.length));
}

async function compressObject(
    obj: CompressibleObject,
    refs: Map<object, Ref>,
    buf: Uint8ArrayBuilder,
    makeRef: boolean = true
): Promise<void> {
  if (refs.has(obj)) {
    if (makeRef) {
      buf.append([TypeEnum.REF]);
      buf.append(refs.get(obj)?.ptr ?? new Uint8Array(4));
    }
  } else {
    refs.set(obj, {
      buf,
      ptr: new Uint8Array(4),
      offset: buf.length
    });
    if (obj instanceof Date) {
      buf.append([TypeEnum.DATE]);
      buf.append(new Uint8Array(Float64Array.from([obj.getTime()]).buffer));
    } else if (obj instanceof Int8Array) {
      await compressTypedArray(obj, refs, buf, TypeEnum.INT8ARRAY);
    } else if (obj instanceof Uint8Array) {
      await compressTypedArray(obj, refs, buf, TypeEnum.UINT8ARRAY);
    } else if (obj instanceof Uint8ClampedArray) {
      await compressTypedArray(obj, refs, buf, TypeEnum.UINT8CLAMPEDARRAY);
    } else if (obj instanceof Int16Array) {
      await compressTypedArray(obj, refs, buf, TypeEnum.INT16ARRAY);
    } else if (obj instanceof Uint16Array) {
      await compressTypedArray(obj, refs, buf, TypeEnum.UINT16ARRAY);
    } else if (obj instanceof Int32Array) {
      await compressTypedArray(obj, refs, buf, TypeEnum.INT32ARRAY);
    } else if (obj instanceof Uint32Array) {
      await compressTypedArray(obj, refs, buf, TypeEnum.UINT32ARRAY);
    } else if (obj instanceof Float32Array) {
      await compressTypedArray(obj, refs, buf, TypeEnum.FLOAT32ARRAY);
    } else if (obj instanceof Float64Array) {
      await compressTypedArray(obj, refs, buf, TypeEnum.FLOAT64ARRAY);
    } else if (obj instanceof BigInt64Array) {
      await compressTypedArray(obj, refs, buf, TypeEnum.BIGINT64ARRAY);
    } else if (obj instanceof BigUint64Array) {
      await compressTypedArray(obj, refs, buf, TypeEnum.BIGUINT64ARRAY);
    } else if (obj.constructor.name === "ArrayBuffer") {
      const array = new Uint8Array(obj as ArrayBuffer);
      buf.append([TypeEnum.ARRAYBUFFER, ...encodeVarUint(array.length)]);
      buf.append(array);
    } else if (obj instanceof File) {
      const encoder = new TextEncoder();
      const nameArray = encoder.encode(obj.name);
      buf.append([TypeEnum.FILE, ...encodeVarUint(nameArray.length)]);
      buf.append(nameArray);
      buf.append(new Uint8Array(Float64Array.from([obj.lastModified]).buffer));
      const typeArray = encoder.encode(obj.type);
      buf.append(encodeVarUint(typeArray.length));
      buf.append(typeArray);
      const array = await obj.bytes();
      buf.append(encodeVarUint(array.length));
      buf.append(array);
    } else if (obj instanceof Blob) {
      const encoder = new TextEncoder();
      const typeArray = encoder.encode(obj.type);
      buf.append([TypeEnum.BLOB, ...encodeVarUint(typeArray.length)]);
      buf.append(typeArray);
      const array = await obj.bytes();
      buf.append(encodeVarUint(array.length));
      buf.append(array);
    } else if (obj instanceof Array) {
      buf.append([TypeEnum.ARRAY]);
      for (const obj2 of obj) {
        await compressHelper(obj2, refs, buf);
      }
      buf.append([255]);
    } else if (obj instanceof Map) {
      const entries = obj.entries();
      buf.append([TypeEnum.MAP]);
      for (const [key, value] of entries) {
        await compressHelper(key, refs, buf);
        await compressHelper(value, refs, buf);
      }
      buf.append([255]);
    } else if (obj instanceof Set) {
      buf.append([TypeEnum.SET]);
      for (const obj2 of obj) {
        await compressHelper(obj2, refs, buf);
      }
      buf.append([255]);
    } else {
      const entries = Object.entries(obj);
      buf.append([TypeEnum.OBJECT]);
      const encoder = new TextEncoder();
      for (const [key, value] of entries) {
        await compressHelper(value, refs, buf);
        const array = encoder.encode(key);
        buf.append(encodeVarUint(array.length));
        buf.append(array);
      }
      buf.append([255]);
    }
  }
}


async function compressHelper(obj: Compressible, refs: Map<object, Ref>, buf: Uint8ArrayBuilder): Promise<void> {
  switch (typeof obj) {
    case "string": {
      const encoder = new TextEncoder();
      const array = encoder.encode(obj);
      buf.append([TypeEnum.STRING, ...encodeVarUint(array.length)]);
      buf.append(array);
    } break;
    case "number": {
      if (isNaN(obj)) {
        buf.append([TypeEnum.NAN]);
      } else if (obj === 0) {
        buf.append([TypeEnum.ZERO]);
      } else if (Number.isSafeInteger(obj)) {
        if (obj > 0) {
          buf.append([TypeEnum.POSVARINT]);
          buf.append(encodeVarUint(obj));
        } else {
          buf.append([TypeEnum.NEGVARINT]);
          buf.append(encodeVarUint(-obj));
        }
      } else if (obj === Infinity) {
        buf.append([TypeEnum.POSINF]);
      } else if (obj == -Infinity) {
        buf.append([TypeEnum.NEGINF]);
      } else {
        buf.append([TypeEnum.FLOATING]);
        buf.append(new Uint8Array(Float64Array.from([obj]).buffer));
      }
    } break;
    case "bigint": {
      if (obj === 0n) {
        buf.append([TypeEnum.ZEROBIGINT]);
      } else {
        if (obj > 0n) {
          buf.append([TypeEnum.POSBIGINT]);
        } else {
          buf.append([TypeEnum.NEGBIGINT]);
          obj = -obj;
        }
        const array: number[] = [];
        while (obj > 0n) {
          array.push(Number(obj & 0xffn));
          obj >>= 8n;
        }
        buf.append(encodeVarUint(array.length));
        buf.append(array);
      }
    } break;
    case "boolean": {
      buf.append([obj ? TypeEnum.TRUE : TypeEnum.FALSE]);
    } break;
    case "undefined": {
      buf.append([TypeEnum.UNDEFINED]);
    } break;
    case "object": {
      if (obj === null) {
        buf.append([TypeEnum.NULL]);
      } else {
        await compressObject(obj, refs, buf);
      }
    } break;
    default: {
      buf.append([TypeEnum.INCOMPRESSIBLE]);
    } break;
  }
}

export async function compress(obj: Compressible): Promise<Uint8Array> {
  const buf = new Uint8ArrayBuilder();
  const refs = new Map<object, Ref>();
  await compressHelper(obj, refs, buf);
  const builder = new Uint8ArrayBuilder2();
  builder.append(buf);
  for (const {buf: buf2, ptr, offset} of refs.values()) {
    if (Object.is(buf, buf2)) {
      ptr.set(encodeUint32(offset));
    } else {
      ptr.set(encodeUint32(builder.length + offset));
      builder.append(buf2);
    }
  }
  return builder.toUint8Array();
}

function decompressTypedArray<T extends TypedArray>(
    buf: Uint8Array,
    offset: number,
    refs: Map<number, Compressible>,
    TypedArray: TypedArrayConstructor<T>
): [T, number] {
  const origOffset = offset - 1;
  let ptr: number;
  ptr = decodeUint32(buf.subarray(offset, offset + 4));
  offset += 4;
  const buffer = (refs.has(ptr) ? refs.get(ptr) : decompressHelper(
      buf,
      ptr,
      refs
  )[0]) as ArrayBuffer;
  let byteOffset, length: number;
  [byteOffset, offset] = decodeVarUint(buf, offset);
  [length, offset] = decodeVarUint(buf, offset);
  const result = new TypedArray(buffer, byteOffset, length);
  refs.set(origOffset, result);
  return [result, offset];
}

function decodeBlobInfo(buf: Uint8Array, offset: number): [Uint8Array, string, number] {
  const decoder = new TextDecoder();
  let typeLength: number;
  [typeLength, offset] = decodeVarUint(buf, offset);
  const type = decoder.decode(buf.subarray(offset, offset + typeLength));
  offset += typeLength;
  let length: number;
  [length, offset] = decodeVarUint(buf, offset);
  const array = buf.subarray(offset, offset + length);
  offset += length;
  return [array, type, offset];
}

function decodeBigUint(buf: Uint8Array, offset: number): [bigint, number] {
  let length: number;
  [length, offset] = decodeVarUint(buf, offset);
  let result = 0n;
  for (let i = 0; i < length; i++) {
    result += BigInt(buf[offset + i]) << BigInt(8 * i);
  }
  offset += length;
  return [result, offset];
}

function decompressHelper(
    buf: Uint8Array,
    offset: number,
    refs: Map<number, Compressible>
): [Compressible, number] {
  if (refs.has(offset)) {
    return [refs.get(offset), offset];
  }
  const origOffset = offset;
  let result: Compressible;
  switch (buf[offset++] as TypeEnum) {
    case TypeEnum.STRING: {
      const decoder = new TextDecoder();
      let length: number;
      [length, offset] = decodeVarUint(buf, offset);
      result = decoder.decode(buf.subarray(offset, offset + length));
      offset += length;
    } break;
    case TypeEnum.ZERO: {
      result = 0;
    } break;
    case TypeEnum.POSVARINT: {
      [result, offset] = decodeVarUint(buf, offset);
    } break;
    case TypeEnum.NEGVARINT: {
      [result, offset] = decodeVarUint(buf, offset);
      result = -result;
    } break;
    case TypeEnum.POSINF: {
      result = Infinity;
    } break;
    case TypeEnum.NEGINF: {
      result = -Infinity;
    } break;
    case TypeEnum.FLOATING: {
      result = new Float64Array(buf.slice(offset, offset + 8).buffer)[0];
      offset += 8;
    } break;
    case TypeEnum.ZEROBIGINT: {
      result = 0n;
    } break;
    case TypeEnum.POSBIGINT: {
      [result, offset] = decodeBigUint(buf, offset);
    } break;
    case TypeEnum.NEGBIGINT: {
      [result, offset] = decodeBigUint(buf, offset);
      result = -result;
    } break;
    case TypeEnum.TRUE: {
      result = true;
    } break;
    case TypeEnum.FALSE: {
      result = false;
    } break;
    case TypeEnum.UNDEFINED: {
      result = undefined;
    } break;
    case TypeEnum.NULL: {
      result = null;
    } break;
    case TypeEnum.REF: {
      const ptr = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      if (!refs.has(ptr)) {
        decompressHelper(buf, ptr, refs);
      }
      result = refs.get(ptr);
    } break;
    case TypeEnum.DATE: {
      result = new Date(new Float64Array(buf.slice(offset, offset + 8).buffer)[0]);
      offset += 8;
      refs.set(origOffset, result);
    } break;
    case TypeEnum.INT8ARRAY: {
      return decompressTypedArray(buf, offset, refs, Int8Array);
    }
    case TypeEnum.UINT8ARRAY: {
      return decompressTypedArray(buf, offset, refs, Uint8Array);
    }
    case TypeEnum.UINT8CLAMPEDARRAY: {
      return decompressTypedArray(buf, offset, refs, Uint8ClampedArray);
    }
    case TypeEnum.INT16ARRAY: {
      return decompressTypedArray(buf, offset, refs, Int16Array);
    }
    case TypeEnum.UINT16ARRAY: {
      return decompressTypedArray(buf, offset, refs, Uint16Array);
    }
    case TypeEnum.INT32ARRAY: {
      return decompressTypedArray(buf, offset, refs, Int32Array);
    }
    case TypeEnum.UINT32ARRAY: {
      return decompressTypedArray(buf, offset, refs, Uint32Array);
    }
    case TypeEnum.FLOAT32ARRAY: {
      return decompressTypedArray(buf, offset, refs, Float32Array);
    }
    case TypeEnum.FLOAT64ARRAY: {
      return decompressTypedArray(buf, offset, refs, Float64Array);
    }
    case TypeEnum.BIGINT64ARRAY: {
      return decompressTypedArray(buf, offset, refs, BigInt64Array);
    }
    case TypeEnum.BIGUINT64ARRAY: {
      return decompressTypedArray(buf, offset, refs, BigUint64Array);
    }
    case TypeEnum.ARRAYBUFFER: {
      let length: number;
      [length, offset] = decodeVarUint(buf, offset);
      result = buf.slice(offset, offset + length).buffer;
      offset += length;
      refs.set(origOffset, result);
    } break;
    case TypeEnum.FILE: {
      const decoder = new TextDecoder();
      let nameLength: number;
      [nameLength, offset] = decodeVarUint(buf, offset);
      const name = decoder.decode(buf.subarray(offset, offset + nameLength));
      offset += nameLength;
      const lastModified = new Float64Array(buf.slice(offset, offset + 8).buffer)[0];
      offset += 8;
      let array: Uint8Array;
      let type: string;
      [array, type, offset] = decodeBlobInfo(buf, offset);
      result = new File([array], name, {
        lastModified,
        type
      });
      refs.set(origOffset, result);
    } break;
    case TypeEnum.BLOB: {
      let array: Uint8Array;
      let type: string;
      [array, type, offset] = decodeBlobInfo(buf, offset);
      result = new Blob([array], {type});
      refs.set(origOffset, result);
    } break;
    case TypeEnum.ARRAY: {
      result = [];
      refs.set(origOffset, result);
      let val: Compressible;
      while (buf[offset] !== 255) {
        [val, offset] = decompressHelper(buf, offset, refs);
        result.push(val);
      }
      offset++;
    } break;
    case TypeEnum.OBJECT: {
      result = {};
      refs.set(origOffset, result);
      const decoder = new TextDecoder();
      let val: Compressible;
      while (buf[offset] !== 255) {
        [val, offset] = decompressHelper(buf, offset, refs);
        let nameLength: number;
        [nameLength, offset] = decodeVarUint(buf, offset);
        const name = decoder.decode(buf.subarray(offset, offset + nameLength));
        offset += nameLength;
        result[name] = val;
      }
      offset++;
    } break;
    case TypeEnum.MAP: {
      result = new Map<Compressible, Compressible>();
      refs.set(origOffset, result);
      let key: Compressible;
      let val: Compressible;
      while (buf[offset] !== 255) {
        [key, offset] = decompressHelper(buf, offset, refs);
        [val, offset] = decompressHelper(buf, offset, refs);
        result.set(key, val);
      }
      offset++;
    } break;
    case TypeEnum.SET: {
      result = new Set<Compressible>();
      refs.set(origOffset, result);
      let val: Compressible;
      while (buf[offset] !== 255) {
        [val, offset] = decompressHelper(buf, offset, refs);
        result.add(val);
      }
      offset++;
    } break;
    case TypeEnum.INCOMPRESSIBLE: {
      result = null;
    } break;
  }
  return [result, offset];
}

export function decompress(buf: Uint8Array): Compressible {
  return decompressHelper(buf, 0, new Map<number, Compressible>())[0];
}

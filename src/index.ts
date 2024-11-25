import {
  type Compressible,
  type CompressibleObject,
  type TypedArray,
  type TypedArrayConstructor,
  type TypedArrayEnum,
  TypeEnum
} from "./types";
import {Uint8ArrayBuilder, Uint8ArrayBuilder2} from "./builders";

interface Ref {
  buf: Uint8ArrayBuilder;
  ptr: Uint8Array;
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
  await compressObject(obj.buffer as ArrayBuffer, refs);
  buf.append([type]);
  buf.append(refs.get(obj.buffer)?.ptr ?? new Uint8Array(4));
  buf.append(encodeUint32(obj.byteOffset));
  buf.append(encodeUint32(obj.length));
}

async function compressObject(
    obj: CompressibleObject,
    refs: Map<object, Ref>
): Promise<void> {
  if (!refs.has(obj)) {
    const buf = new Uint8ArrayBuilder();
    const ptr = new Uint8Array(4);
    refs.set(obj, {buf, ptr});
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
      buf.append([TypeEnum.ARRAYBUFFER, ...encodeUint32(array.length)]);
      buf.append(array);
    } else if (obj instanceof File) {
      const encoder = new TextEncoder();
      const nameArray = encoder.encode(obj.name);
      buf.append([TypeEnum.FILE, ...encodeUint32(nameArray.length)]);
      buf.append(nameArray);
      buf.append(new Uint8Array(Float64Array.from([obj.lastModified]).buffer));
      const typeArray = encoder.encode(obj.type);
      buf.append(encodeUint32(typeArray.length));
      buf.append(typeArray);
      const array = await obj.bytes();
      buf.append(encodeUint32(array.length));
      buf.append(array);
    } else if (obj instanceof Blob) {
      const encoder = new TextEncoder();
      const typeArray = encoder.encode(obj.type);
      buf.append([TypeEnum.BLOB, ...encodeUint32(typeArray.length)]);
      buf.append(typeArray);
      const array = await obj.bytes();
      buf.append(encodeUint32(array.length));
      buf.append(array);
    } else if (obj instanceof Array) {
      buf.append([TypeEnum.ARRAY, ...encodeUint32(obj.length)]);
      for (const obj2 of obj) {
        await compressHelper(obj2, refs, buf);
      }
    } else if (obj instanceof Map) {
      const entries = obj.entries();
      buf.append([TypeEnum.MAP, ...encodeUint32(obj.size)]);
      for (const [key, value] of entries) {
        await compressHelper(key, refs, buf);
        await compressHelper(value, refs, buf);
      }
    } else if (obj instanceof Set) {
      buf.append([TypeEnum.SET, ...encodeUint32(obj.size)]);
      for (const obj2 of obj) {
        await compressHelper(obj2, refs, buf);
      }
    } else {
      const entries = Object.entries(obj);
      buf.append([TypeEnum.OBJECT, ...encodeUint32(entries.length)]);
      const encoder = new TextEncoder();
      for (const [key, value] of entries) {
        const array = encoder.encode(key);
        buf.append(encodeUint32(array.length));
        buf.append(array);
        await compressHelper(value, refs, buf);
      }
    }
  }
}


async function compressHelper(obj: Compressible, refs: Map<object, Ref>, buf: Uint8ArrayBuilder): Promise<void> {
  switch (typeof obj) {
    case "string": {
      const encoder = new TextEncoder();
      const array = encoder.encode(obj);
      buf.append([TypeEnum.STRING, ...encodeUint32(array.length)]);
      buf.append(array);
    } break;
    case "number": {
      buf.append([TypeEnum.NUMBER]);
      buf.append(new Uint8Array(Float64Array.from([obj]).buffer));
    } break;
    case "bigint": {
      buf.append([TypeEnum.BIGINT]);
      const array: number[] = [];
      while (obj > 0n) {
        let foo = (obj & 0xffn).valueOf();
        array.push(Number(obj & 0xffn));
        obj >>= 8n;
      }
      buf.append(encodeUint32(array.length));
      buf.append(array);
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
        await compressObject(obj, refs);
        buf.append([TypeEnum.REF]);
        buf.append(refs.get(obj)?.ptr ?? new Uint8Array(4));
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
  for (const {buf, ptr} of refs.values()) {
    ptr.set(encodeUint32(builder.length));
    builder.append(buf);
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
  const ptr = decodeUint32(buf.subarray(offset, offset + 4));
  offset += 4;
  const buffer = (refs.has(ptr) ? refs.get(ptr) : decompressHelper(
      buf,
      ptr,
      refs
  )[0]) as ArrayBuffer;
  const byteOffset = decodeUint32(buf.subarray(offset, offset + 4));
  offset += 4;
  const length = decodeUint32(buf.subarray(offset, offset + 4));
  offset += 4;
  const result = new TypedArray(buffer, byteOffset, length);
  refs.set(origOffset, result);
  return [result, offset];
}

function decompressHelper(
    buf: Uint8Array,
    offset: number,
    refs: Map<number, Compressible>
): [Compressible, number] {
  const origOffset = offset;
  let result: Compressible;
  switch (buf[offset++] as TypeEnum) {
    case TypeEnum.STRING: {
      const decoder = new TextDecoder();
      const length = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      result = decoder.decode(buf.subarray(offset, offset + length));
      offset += length;
    } break;
    case TypeEnum.NUMBER: {
      result = new Float64Array(buf.slice(offset, offset + 8).buffer)[0];
      offset += 8;
    } break;
    case TypeEnum.BIGINT: {
      const length = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      result = 0n;
      for (let i = 0; i < length; i++) {
        result += BigInt(buf[offset + i]) << BigInt(8 * i);
      }
      offset += length;
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
      const length = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      result = buf.slice(offset, offset + length).buffer;
      offset += length;
      refs.set(origOffset, result);
    } break;
    case TypeEnum.FILE: {
      const decoder = new TextDecoder();
      const nameLength = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      const name = decoder.decode(buf.subarray(offset, offset + nameLength));
      offset += nameLength;
      const lastModified = new Float64Array(buf.slice(offset, offset + 8).buffer)[0];
      offset += 8;
      const typeLength = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      const type = decoder.decode(buf.subarray(offset, offset + typeLength));
      offset += typeLength;
      const length = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      result = new File([buf.subarray(offset, offset + length)], name, {
        lastModified,
        type
      });
      offset += length;
      refs.set(origOffset, result);
    } break;
    case TypeEnum.BLOB: {
      const decoder = new TextDecoder();
      const typeLength = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      const type = decoder.decode(buf.subarray(offset, offset + typeLength));
      offset += typeLength;
      const length = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      result = new Blob([buf.subarray(offset, offset + length)], {type});
      offset += length;
      refs.set(origOffset, result);
    } break;
    case TypeEnum.ARRAY: {
      result = [];
      refs.set(origOffset, result);
      const length = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      let val: Compressible;
      for (let i = 0; i < length; i++) {
        [val, offset] = decompressHelper(buf, offset, refs);
        result.push(val);
      }
    } break;
    case TypeEnum.OBJECT: {
      result = {};
      refs.set(origOffset, result);
      const length = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      const decoder = new TextDecoder();
      let val: Compressible;
      for (let i = 0; i < length; i++) {
        const nameLength = decodeUint32(buf.subarray(offset, offset + 4));
        offset += 4;
        const name = decoder.decode(buf.subarray(offset, offset + nameLength));
        offset += nameLength;
        [val, offset] = decompressHelper(buf, offset, refs);
        result[name] = val;
      }
    } break;
    case TypeEnum.MAP: {
      result = new Map<Compressible, Compressible>();
      refs.set(origOffset, result);
      const length = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      let key: Compressible;
      let val: Compressible;
      for (let i = 0; i < length; i++) {
        [key, offset] = decompressHelper(buf, offset, refs);
        [val, offset] = decompressHelper(buf, offset, refs);
        result.set(key, val);
      }
    } break;
    case TypeEnum.SET: {
      result = new Set<Compressible>();
      refs.set(origOffset, result);
      const length = decodeUint32(buf.subarray(offset, offset + 4));
      offset += 4;
      let val: Compressible;
      for (let i = 0; i < length; i++) {
        [val, offset] = decompressHelper(buf, offset, refs);
        result.add(val);
      }
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

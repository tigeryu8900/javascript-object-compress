export type CompressiblePrimitive =
    | string
    | number
    | bigint
    | boolean
    | undefined
    | null;

export type CompressibleBasicObject =
    | Date
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array
    | ArrayBuffer
    | File
    | Blob;

export type CompressibleBasic = CompressiblePrimitive | CompressibleBasicObject;

export type CompressibleComposite =
    | Compressible[]
    | { [key: string]: Compressible }
    | Map<Compressible, Compressible>
    | Set<Compressible>;

export type CompressibleObject = CompressibleBasicObject | CompressibleComposite;

export type Compressible = CompressibleBasic | CompressibleComposite;

export type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array;

export interface TypedArrayConstructor<T extends TypedArray> {
  new (buffer: ArrayBuffer, byteOffset: number, length: number): T;
}

export enum TypeEnum {
  STRING,
  NUMBER,
  BIGINT,
  TRUE,
  FALSE,
  UNDEFINED,
  NULL,
  REF,
  DATE,
  INT8ARRAY,
  UINT8ARRAY,
  UINT8CLAMPEDARRAY,
  INT16ARRAY,
  UINT16ARRAY,
  INT32ARRAY,
  UINT32ARRAY,
  FLOAT32ARRAY,
  FLOAT64ARRAY,
  BIGINT64ARRAY,
  BIGUINT64ARRAY,
  ARRAYBUFFER,
  FILE,
  BLOB,
  ARRAY,
  OBJECT,
  MAP,
  SET,
  END,
  INCOMPRESSIBLE
}

export type TypedArrayEnum =
    | TypeEnum.INT8ARRAY
    | TypeEnum.UINT8ARRAY
    | TypeEnum.UINT8CLAMPEDARRAY
    | TypeEnum.INT16ARRAY
    | TypeEnum.UINT16ARRAY
    | TypeEnum.INT32ARRAY
    | TypeEnum.UINT32ARRAY
    | TypeEnum.FLOAT32ARRAY
    | TypeEnum.FLOAT64ARRAY
    | TypeEnum.BIGINT64ARRAY
    | TypeEnum.BIGUINT64ARRAY;

# javascript-object-compress

A tool for compressing JavaScript objects to Uint8Array

## Usage

```javascript
import {compress, decompress} from "javascript-opject-compress";

const obj = {
  a: 1,
  b: [2, 3],
  c: new Date(),
  d: new File([Uint8Array.from([1, 2, 3])], "file", {
    type: "text/plain"
  })
};

// Circular referencing is supported
obj.self = obj;

compress(obj).then(compressed => {
  const decompressed = decompress(compressed);
});
```

## Supported types
- `string`
- `number`
- `bigint`
- `boolean`
- `undefined`
- `null`
- `Date`
- `Int8Array`
- `Uint8Array`
- `Uint8ClampedArray`
- `Int16Array`
- `Uint16Array`
- `Int32Array`
- `Uint32Array`
- `Float32Array`
- `Float64Array`
- `BigInt64Array`
- `BigUint64Array`
- `ArrayBuffer`
- `File`
- `Blob`
- `Array`
- `Object`
- `Map`
- `Set`

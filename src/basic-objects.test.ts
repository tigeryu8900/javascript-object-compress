import {test} from "@jest/globals";
import {testCompressDecompress} from "./common-test";

test("Date", async () => {
  await testCompressDecompress(new Date(0));
  await testCompressDecompress(new Date());
});

test("Int8Array", async () => {
  await testCompressDecompress(new Int8Array(0));
  await testCompressDecompress(Int8Array.from([0, 1, 2, 3]));
  await testCompressDecompress(Int8Array.from([0, -1, -2, -3]));
});

test("Uint8Array", async () => {
  await testCompressDecompress(new Uint8Array(0));
  await testCompressDecompress(Uint8Array.from([0, 1, 2, 3]));
});

test("Uint8ClampedArray", async () => {
  await testCompressDecompress(new Uint8ClampedArray(0));
  await testCompressDecompress(Uint8ClampedArray.from([0, 1, 2, 3]));
});

test("Int16Array", async () => {
  await testCompressDecompress(new Int16Array(0));
  await testCompressDecompress(Int16Array.from([0, 1, 2, 3]));
  await testCompressDecompress(Int16Array.from([0, -1, -2, -3]));
});

test("Uint16Array", async () => {
  await testCompressDecompress(new Uint16Array(0));
  await testCompressDecompress(Uint16Array.from([0, 1, 2, 3]));
});

test("Int32Array", async () => {
  await testCompressDecompress(new Int32Array(0));
  await testCompressDecompress(Int32Array.from([0, 1, 2, 3]));
  await testCompressDecompress(Int32Array.from([0, -1, -2, -3]));
});

test("Uint32Array", async () => {
  await testCompressDecompress(new Uint32Array(0));
  await testCompressDecompress(Uint32Array.from([0, 1, 2, 3]));
});

test("BigInt64Array", async () => {
  await testCompressDecompress(new BigInt64Array(0));
  await testCompressDecompress(BigInt64Array.from([0n, 1n, 2n, 3n]));
  await testCompressDecompress(BigInt64Array.from([0n, -1n, -2n, -3n]));
});

test("BigUint64Array", async () => {
  await testCompressDecompress(new BigUint64Array(0));
  await testCompressDecompress(BigUint64Array.from([0n, -1n, -2n, -3n]));
});

test("Float32Array", async () => {
  await testCompressDecompress(new Float32Array(0));
  await testCompressDecompress(Float32Array.from([0, 1, 3.14, -3.14]));
});

test("Float64Array", async () => {
  await testCompressDecompress(new Float64Array(0));
  await testCompressDecompress(Float64Array.from([0, 1, 3.14, -3.14]));
});

test("ArrayBuffer", async () => {
  await testCompressDecompress(new ArrayBuffer(0));
  await testCompressDecompress(Uint32Array.from([0, 1, 2, 3]).buffer);
});

test("File", async () => {
  await testCompressDecompress(new File([new ArrayBuffer(0)], "", {
    lastModified: Date.now(),
    type: ""
  }));
  await testCompressDecompress(new File([Buffer.from("123")], "file", {
    lastModified: Date.now(),
    type: "text/plain"
  }));
});

test("Blob", async () => {
  await testCompressDecompress(new Blob([new ArrayBuffer(0)], {
    type: ""
  }));
  await testCompressDecompress(new Blob([Buffer.from("123")], {
    type: "text/plain"
  }));
});

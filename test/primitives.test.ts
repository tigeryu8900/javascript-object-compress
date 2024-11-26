import {test} from "@jest/globals";
import {testCompressDecompress} from "./common";

test("string", async () => {
  await testCompressDecompress("");
  await testCompressDecompress("abc");
});

test("number", async () => {
  await testCompressDecompress(0);
  await testCompressDecompress(1);
  await testCompressDecompress(-1);
  await testCompressDecompress(3.14);
  await testCompressDecompress(-3.14);
  await testCompressDecompress(1e100);
  await testCompressDecompress(-1e100);
  await testCompressDecompress(Infinity);
  await testCompressDecompress(-Infinity);
});

test("bigint", async () => {
  await testCompressDecompress(0n);
  await testCompressDecompress(1n);
  await testCompressDecompress(-1n);
  await testCompressDecompress(1234567890n);
  await testCompressDecompress(-1234567890n);
});

test("boolean", async () => {
  await testCompressDecompress(true);
  await testCompressDecompress(false);
});

test("undefined", async () => {
  await testCompressDecompress(undefined);
});

test("null", async () => {
  await testCompressDecompress(null);
});

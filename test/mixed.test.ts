import {expect, test} from "@jest/globals";
import {testCompressDecompress} from "./common";
import {compress, decompress} from "../src";
import {readFileSync} from "node:fs";
import {join} from "node:path";

test("Shared Array Buffers", async () => {
  const a = Int8Array.from([1, 2, 3, 4, 5, 6, 7, 8]);
  const b = a.subarray(2, 4);
  const c = new Int32Array(a.buffer);
  const array = [a, b, c];
  const result = decompress(await compress(array)) as [Int8Array, Int8Array, Int32Array];
  expect(result).toEqual(array);
  expect(result[1].buffer).toBe(result[0].buffer);
  expect(result[2].buffer).toBe(result[0].buffer);
});

test("package.json", async () => {
  await testCompressDecompress(JSON.parse(readFileSync(join(
      __dirname,
      "..",
      "package.json"
  )).toString()));
});

test("package-lock.json", async () => {
  await testCompressDecompress(JSON.parse(readFileSync(join(
      __dirname,
      "..",
      "package-lock.json"
  )).toString()));
});

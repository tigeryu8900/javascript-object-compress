import {test} from "@jest/globals";
import {testCompressDecompress} from "./common-test";

test("string", async () => {
  await testCompressDecompress("");
  await testCompressDecompress("abc");
});

test("number", async () => {
  await testCompressDecompress(0);
  await testCompressDecompress(3.14);
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

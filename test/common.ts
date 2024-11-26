import type {Compressible} from "../src/types";
import {expect} from "@jest/globals";
import {compress, decompress} from "../src";

export async function testCompressDecompress(obj: Compressible): Promise<Compressible> {
  expect(decompress(await compress(obj))).toEqual(obj);
  return obj;
}

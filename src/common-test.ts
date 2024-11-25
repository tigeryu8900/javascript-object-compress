import type {Compressible} from "./types";
import {expect} from "@jest/globals";
import {compress, decompress} from "./index";

export async function testCompressDecompress(obj: Compressible): Promise<Compressible> {
  expect(decompress(await compress(obj))).toEqual(obj);
  return obj;
}

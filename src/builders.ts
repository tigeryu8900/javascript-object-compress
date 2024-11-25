export class Uint8ArrayBuilder {
  data: ArrayLike<number>[] = [];
  length: number = 0;
  append(data: ArrayLike<number>): void {
    this.data.push(data);
    this.length += data.length;
  }
  toUint8Array() {
    const result = new Uint8Array(this.length);
    let offset = 0;
    for (const array of this.data) {
      result.set(array, offset);
      offset += array.length;
    }
    return result;
  }
  toString(): string {
    return new TextDecoder().decode(this.toUint8Array());
  }
}

export class Uint8ArrayBuilder2 {
  data: Uint8ArrayBuilder[] = [];
  length: number = 0;
  append(data: Uint8ArrayBuilder): void {
    this.data.push(data);
    this.length += data.length;
  }
  toUint8Array() {
    const result = new Uint8Array(this.length);
    let offset = 0;
    for (const builder of this.data) {
      for (const array of builder.data) {
        result.set(array, offset);
        offset += array.length;
      }
    }
    return result;
  }
  toString(): string {
    return new TextDecoder().decode(this.toUint8Array());
  }
}

/** Objeto de valor: imutável e comparado pelo conteúdo, não pela identidade. */
export abstract class ValueObject<TValue extends string | number | boolean> {
  protected constructor(protected readonly value: TValue) {}

  equals(other?: ValueObject<TValue>): boolean {
    return other?.constructor === this.constructor && other.value === this.value;
  }
}

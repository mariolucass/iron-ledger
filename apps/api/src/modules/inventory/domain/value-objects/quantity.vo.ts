import { ValueObject } from "../../../../shared/domain/value-object";
import { ValidationError } from "../../../../shared/errors/validation.error";

/** Quantidade estritamente positiva (reservas, baixas e confirmações). */
export class Quantity extends ValueObject<number> {
  static positive(value: number): Quantity {
    if (!Number.isFinite(value) || value <= 0) {
      throw new ValidationError("A quantidade deve ser positiva.");
    }
    return new Quantity(value);
  }

  toNumber(): number {
    return this.value;
  }
}

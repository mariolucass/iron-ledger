import type { DomainEvent } from "./domain-event";

/**
 * Raiz de agregado: acumula os eventos de domínio produzidos pelas mutações até
 * que o repositório os grave no outbox, no mesmo commit do estado.
 */
export abstract class AggregateRoot<TEvent extends DomainEvent = DomainEvent> {
  private events: TEvent[] = [];

  pendingEvents(): readonly TEvent[] {
    return this.events;
  }

  protected record(event: TEvent): void {
    this.events.push(event);
  }

  /** Chamado após o commit: os eventos já estão no outbox. */
  protected clearEvents(): void {
    this.events = [];
  }
}

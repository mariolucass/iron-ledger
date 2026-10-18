import type { TransactionDetailDto, TransactionListDto, TransactionListQueryDto } from "@iron-ledger/shared-types";
import { NotFoundError } from "../../../../shared/errors/not-found.error";
import { pagination } from "../../../../shared/utils/pagination";
import type { TransactionReadModel } from "../../domain/repositories/transaction.repository";

export class QueryTransactionsUseCase {
  constructor(private readonly readModel: TransactionReadModel) {}

  list(query: TransactionListQueryDto): Promise<TransactionListDto> {
    const { page, pageSize } = pagination(query.page, query.pageSize);
    return this.readModel.list({ ...query, page, pageSize });
  }

  async get(id: string): Promise<TransactionDetailDto> {
    const detail = await this.readModel.findDetail(id);
    if (!detail) throw new NotFoundError("Transação não encontrada.");
    return detail;
  }
}

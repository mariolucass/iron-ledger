import type { NextFunction, Response } from "express";
import { z } from "zod";
import {
  createUserSchema,
  listUsersSchema,
  setRolesSchema,
  updateUserSchema,
} from "../../application/user-admin";
import type {
  CreateUserUseCase,
  GetUserUseCase,
  ListRolesUseCase,
  ListUsersUseCase,
  SetUserRolesUseCase,
  UpdateUserUseCase,
} from "../../application/use-cases/user-admin.use-cases";
import type { AuthenticatedRequest } from "../guards/jwt.guard";

const idSchema = z.object({ id: z.string().uuid() });

type Handler = (request: AuthenticatedRequest, response: Response, next: NextFunction) => Promise<void>;

export class UserAdminController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly listRoles: ListRolesUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly setUserRoles: SetUserRolesUseCase,
  ) {}

  private handle(status: number, run: (request: AuthenticatedRequest) => Promise<unknown>): Handler {
    return async (request, response, next) => {
      try {
        response.status(status).json(await run(request));
      } catch (error) {
        next(error);
      }
    };
  }

  list = this.handle(200, (request) => this.listUsers.execute(listUsersSchema.parse(request.query)));
  get = this.handle(200, (request) => this.getUser.execute(idSchema.parse(request.params).id));
  roles = this.handle(200, () => this.listRoles.execute());
  create = this.handle(201, (request) => this.createUser.execute(createUserSchema.parse(request.body), request.auth!.userId));
  update = this.handle(200, (request) =>
    this.updateUser.execute(idSchema.parse(request.params).id, updateUserSchema.parse(request.body), request.auth!.userId),
  );
  setRoles = this.handle(200, (request) =>
    this.setUserRoles.execute(idSchema.parse(request.params).id, setRolesSchema.parse(request.body).roles, request.auth!.userId),
  );
}

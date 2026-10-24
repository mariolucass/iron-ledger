import type { ModuleFactory } from "../../infra/http/module";
import { IdentityDirectoryUseCase } from "./application/identity-directory";
import { ChangePasswordUseCase } from "./application/use-cases/change-password.use-case";
import { GetProfileUseCase } from "./application/use-cases/get-profile.use-case";
import { LoginUseCase } from "./application/use-cases/login.use-case";
import { RegisterUserUseCase } from "./application/use-cases/register-user.use-case";
import { UpdatePreferencesUseCase } from "./application/use-cases/update-preferences.use-case";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case";
import {
  CreateUserUseCase,
  GetUserUseCase,
  ListRolesUseCase,
  ListUsersUseCase,
  SetUserRolesUseCase,
  UpdateUserUseCase,
} from "./application/use-cases/user-admin.use-cases";
import { createAccountSecurityRouter } from "./infra/http/account-security.routes";
import { AuthController } from "./infra/http/auth.controller";
import { createAuthRouter } from "./infra/http/auth.routes";
import { ProfileController } from "./infra/http/profile.controller";
import { createProfileRouter } from "./infra/http/profile.routes";
import { UserAdminController } from "./infra/http/user-admin.controller";
import { createRolesRouter, createUserAdminRouter } from "./infra/http/user-admin.routes";
import { PrismaIdentityDirectoryRepository } from "./infra/repositories/prisma-identity-directory.repository";
import { PrismaLoginUserRepository } from "./infra/repositories/prisma-login-user.repository";
import { PrismaProfileRepository } from "./infra/repositories/prisma-profile.repository";
import { PrismaRegisterUserRepository } from "./infra/repositories/prisma-register-user.repository";
import { PrismaUserAdminRepository } from "./infra/repositories/prisma-user-admin.repository";

export const identityModule: ModuleFactory = ({ env }) => {
  const jwtSecret = env.JWT_SECRET;
  const authController = new AuthController(
    new LoginUseCase(new PrismaLoginUserRepository(), jwtSecret, env.JWT_EXPIRES_IN as never),
    new RegisterUserUseCase(
      new PrismaRegisterUserRepository(),
      jwtSecret,
      env.JWT_EXPIRES_IN as never,
    ),
  );
  const profileRepository = new PrismaProfileRepository();
  const profileController = new ProfileController(
    new GetProfileUseCase(profileRepository),
    new UpdateProfileUseCase(profileRepository),
    new UpdatePreferencesUseCase(profileRepository),
    new ChangePasswordUseCase(profileRepository),
  );
  const userAdminRepository = new PrismaUserAdminRepository();
  const identityDirectory = new IdentityDirectoryUseCase(new PrismaIdentityDirectoryRepository());
  const userAdminController = new UserAdminController(
    new ListUsersUseCase(userAdminRepository),
    new GetUserUseCase(userAdminRepository),
    new ListRolesUseCase(userAdminRepository),
    new CreateUserUseCase(userAdminRepository),
    new UpdateUserUseCase(userAdminRepository),
    new SetUserRolesUseCase(userAdminRepository),
    identityDirectory,
  );

  return [
    { path: "/auth", router: createAuthRouter(authController) },
    { path: "/me", router: createProfileRouter(profileController, jwtSecret) },
    { path: "/me/security", router: createAccountSecurityRouter(identityDirectory, jwtSecret) },
    { path: "/users", router: createUserAdminRouter(userAdminController, jwtSecret) },
    { path: "/roles", router: createRolesRouter(userAdminController, jwtSecret) },
  ];
};

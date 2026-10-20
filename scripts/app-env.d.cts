export type AppName = "api" | "web" | "worker" | "analytics";
export function loadAppEnv(
  rootEnv: string,
  appEnv?: string,
  inheritedEnv?: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv;
export function loadWorkspaceEnv(
  app: AppName,
  inheritedEnv?: NodeJS.ProcessEnv,
  rootDir?: string,
): NodeJS.ProcessEnv;

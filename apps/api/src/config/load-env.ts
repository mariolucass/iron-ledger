import { loadWorkspaceEnv } from "../../../../scripts/app-env.cjs";

Object.assign(process.env, loadWorkspaceEnv("api"));

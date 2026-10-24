import { loadWorkspaceEnv } from "../../../../scripts/lib/app-env.cjs";

Object.assign(process.env, loadWorkspaceEnv("api"));

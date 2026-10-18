/** Public user returned by POST /auth/login. Credentials and password hashes are not entity data. */
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
}

/** The BFF stores the upstream access token and only returns the public user. */
export interface LoginResponse {
  user: User;
}

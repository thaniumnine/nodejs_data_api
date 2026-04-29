export interface AccessTokenPayload {
  sub: string;
  sid: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

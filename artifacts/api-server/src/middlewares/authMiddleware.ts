import { type Request, type Response, type NextFunction } from "express";
import {
  getSessionId,
  getSession,
  type SessionUser,
} from "../lib/auth";

declare global {
  namespace Express {
    interface User extends SessionUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  // Stateless: getSession now just verifies the JWT
  const session = await getSession(sid);
  if (!session?.user?.id) {
    // If token is invalid, we don't clear the cookie here to avoid loops,
    // we just don't attach a user.
    next();
    return;
  }

  req.user = session.user;
  next();
}

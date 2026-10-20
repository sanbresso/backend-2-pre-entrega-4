import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as JwtStrategy,
  ExtractJwt
} from "passport-jwt";

import {
  registerUser as registerUserService,
  loginUser as loginUserService
} from "../services/sessions.service.js";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || !secret.trim()) {
    throw new Error("JWT_SECRET no está configurado");
  }

  return secret;
};

const cookieExtractor = (req) => {
  return req?.cookies?.currentUser || null;
};

passport.use(
  "register",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      try {
        const newUser = await registerUserService(req.body);

        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  "login",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      try {
        const user = await loginUserService(req.body);

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  "current",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor
      ]),
      secretOrKey: getJwtSecret(),
      algorithms: ["HS256"]
    },
    async (jwtPayload, done) => {
      try {
        if (
          !jwtPayload ||
          typeof jwtPayload.id !== "string" ||
          typeof jwtPayload.email !== "string" ||
          typeof jwtPayload.role !== "string"
        ) {
          return done(null, false);
        }

        const user = {
          id: jwtPayload.id,
          email: jwtPayload.email,
          role: jwtPayload.role
        };

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
import { Router } from "express";
import passport from "passport";
import { getSessionsInfo, registerUser, loginUser, getCurrentUser, logoutUser } from "../controllers/sessions.controller.js";

const router = Router();

const handleAuthError = (res, error) => {
  const statusCode = error.code === 11000
    ? 409
    : error.statusCode || 500;

  const message = error.code === 11000
    ? "El email ya está registrado"
    : statusCode === 500
      ? "Error interno del servidor"
      : error.message;

  if (statusCode === 500) {
    console.error("Error de autenticación:", error);
  }

  return res.status(statusCode).json({
    status: "error",
    message
  });
};

router.get("/", getSessionsInfo);

router.post(
  "/register",
  (req, res, next) => {
    passport.authenticate(
      "register",
      { session: false },
      (error, user, info) => {
        if (error) {
          return handleAuthError(res, error);
        }

        
  if (!user) {
    return res.status(400).json({
    status: "error",
    message: "Faltan campos obligatorios"
    });
  }


        req.user = user;
        return next();
      }
    )(req, res, next);
  },
  registerUser
);

router.post(
  "/login",
  (req, res, next) => {
    passport.authenticate(
      "login",
      { session: false },
      (error, user, info) => {
        if (error) {
          return handleAuthError(res, error);
        }

        if (!user) {
          return res.status(401).json({
            status: "error",
            message: "Credenciales inválidas"
          });
        }

        req.user = user;
        return next();
      }
    )(req, res, next);
  },
  loginUser
);

router.get(
  "/current",
  (req, res, next) => {
    passport.authenticate(
      "current",
      { session: false },
      (error, user) => {
        if (error) {
          return next(error);
        }

        if (!user) {
          return res.status(401).json({
            status: "error",
            message: "No autenticado"
          });
        }

        req.user = user;
        return next();
      }
    )(req, res, next);
  },
  getCurrentUser
);

router.post("/logout", logoutUser);

export default router;
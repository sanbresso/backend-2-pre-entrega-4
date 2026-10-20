import { generateToken } from "../utils/jwt.js";

export function getSessionsInfo(req, res) {
  return res.status(200).json({
    status: "success",
    message: "Módulo de sesiones preparado"
  });
}

export const registerUser = (req, res) => {
  return res.status(201).json({
    status: "success",
    payload: req.user
  });
};

export const loginUser = (req, res) => {
  try {
    const token = generateToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    res.cookie("currentUser", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3600000,
      secure: process.env.NODE_ENV === "production"
    });

    return res.status(200).json({
      status: "success",
      message: "Login correcto"
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor"
    });
  }
};

export const getCurrentUser = (req, res) => {
  return res.status(200).json({
    status: "success",
    payload: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
};

export const logoutUser = (req, res) => {
  res.clearCookie("currentUser", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return res.status(200).json({
    status: "success",
    message: "Sesión cerrada"
  });
};
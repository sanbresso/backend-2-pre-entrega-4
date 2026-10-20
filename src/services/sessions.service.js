import {
  getUserByEmail,
  getUserByEmailWithPassword,
  saveUser
} from "../repositories/users.repository.js";

import { hashPassword, comparePassword } from "../utils/hash.js";

import { generateToken } from "../utils/jwt.js";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const registerUser = async (userData = {}) => {
  const {
    first_name,
    last_name,
    email,
    password
  } = userData ?? {};

  const requiredFields = [
    first_name,
    last_name,
    email,
    password
  ];

  if (
    requiredFields.some(
      field =>
        typeof field !== "string" ||
        !field.trim()
    )
  ) {
    throw createHttpError(
      400,
      "Faltan campos obligatorios"
    );
  }

  if (password.length < 8) {
    throw createHttpError(
      400,
      "La contraseña debe tener al menos 8 caracteres"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    throw createHttpError(
      400,
      "Formato de email inválido"
    );
  }

  const existingUser = await getUserByEmail(
    normalizedEmail
  );

  if (existingUser) {
    throw createHttpError(
      409,
      "El email ya está registrado"
    );
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await saveUser({
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "user"
  });

  return {
    id: newUser._id.toString(),
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    email: newUser.email,
    role: newUser.role
  };
};

export const loginUser = async (credentials = {}) => {
  const { email, password } = credentials ?? {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    throw createHttpError(
      400,
      "Email y contraseña son obligatorios"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await getUserByEmailWithPassword(
    normalizedEmail
  );

  if (!user) {
    throw createHttpError(
      401,
      "Credenciales inválidas"
    );
  }

  const isValidPassword = await comparePassword(
    password,
    user.password
  );

  if (!isValidPassword) {
    throw createHttpError(
      401,
      "Credenciales inválidas"
    );
  }

   return {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };
};
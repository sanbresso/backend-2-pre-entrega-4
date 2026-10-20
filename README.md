# Plataforma de Eventos e Inscripciones

## Pre-entrega 4 — Autenticación centralizada con Passport.js

## Descripción

Proyecto backend desarrollado como parte del curso **PBE II — Diseño y Arquitectura Backend**.

La aplicación está orientada a la gestión de eventos e inscripciones de usuarios.

La Pre-entrega 1 estableció la arquitectura modular inicial y la Pre-entrega 2 incorporó el registro seguro de usuarios con bcrypt y persistencia en MongoDB mediante Mongoose.

La Pre-entrega 3 amplió el módulo de sesiones con login, generación y verificación de JWT, almacenamiento en la cookie HttpOnly `currentUser`, ruta protegida `/current` y logout.

La **Pre-entrega 4** centraliza registro, login y usuario actual mediante las estrategias **Passport.js `register`, `login` y `current`**. Conserva los endpoints, las respuestas JSON, los JWT y las cookies de la Pre-entrega 3; cambia la organización interna de la autenticación.

## Tecnologías utilizadas

- Node.js
- Express.js
- JavaScript con módulos ESM
- MongoDB
- Mongoose
- bcrypt
- jsonwebtoken
- cookie-parser
- passport
- passport-local
- passport-jwt
- dotenv
- Git y GitHub

## Requisitos previos

- Node.js y npm instalados.
- Acceso a MongoDB Atlas y un clúster configurado (requerido para la entrega). Para desarrollo local también se puede utilizar MongoDB Community Server.
- Un cliente HTTP, como Thunder Client, Postman o curl, para realizar las pruebas.

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/sanbresso/backend-2-pre-entrega-4.git
cd backend-2-pre-entrega-4
```

### 2. Instalar las dependencias

```bash
npm install
```

### 3. Configurar las variables de entorno

Crear un archivo `.env` en la raíz del proyecto, tomando como referencia `.env.example`.

Ejemplo de configuración con MongoDB Atlas:

```dotenv
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb+srv://USUARIO:CONTRASENA@TU_CLUSTER.mongodb.net/plataforma_eventos
JWT_SECRET=REEMPLAZAR_POR_CLAVE_SECRETA_SEGURA
JWT_EXPIRES_IN=1h
```

Para esta pre-entrega se utiliza **MongoDB Atlas** como servicio de base de datos en la nube. La conexión se configura mediante la variable de entorno `MONGO_URL`, utilizando la URI proporcionada por Atlas.

El archivo `.env` contiene las credenciales privadas de conexión y la clave `JWT_SECRET`, por lo que está excluido del repositorio mediante `.gitignore`.

La variable `JWT_EXPIRES_IN=1h` establece una duración de una hora para el JWT, mientras que la cookie `currentUser` utiliza `maxAge: 3600000`.

### 4. Iniciar el servidor

Modo desarrollo:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

El servidor se ejecuta por defecto en:

`http://localhost:8080`

La conexión con MongoDB se establece antes de iniciar Express.

## Arquitectura del proyecto

La aplicación utiliza una arquitectura modular con separación de responsabilidades.

```text
src/
├── app.js
├── server.js
├── config/
│   ├── db.js
│   └── passport.config.js
├── models/
│   ├── User.js
│   └── Event.js
├── routes/
│   ├── sessions.router.js
│   ├── events.router.js
│   └── health.router.js
├── controllers/
│   ├── sessions.controller.js
│   ├── events.controller.js
│   └── health.controller.js
├── services/
│   ├── sessions.service.js
│   └── events.service.js
├── repositories/
│   └── users.repository.js
├── dao/
│   └── users.dao.js
├── middlewares/
│   ├── auth.middleware.js
│   └── error.middleware.js
└── utils/
    ├── hash.js
    └── jwt.js
```

### Responsabilidades

- **Routes:** definen los endpoints disponibles.
- **Controllers:** gestionan solicitudes y respuestas HTTP.
- **Services:** implementan validaciones y reglas de negocio.
- **Repositories:** proporcionan una interfaz de acceso a datos.
- **DAO:** realizan las operaciones de persistencia.
- **Models:** definen los esquemas de Mongoose.
- **Utils:** contienen funciones reutilizables para hashing, comparación de contraseñas y firma/verificación de JWT.
- **Config:** contiene la conexión a MongoDB y el registro centralizado de estrategias Passport.
- **Middlewares:** proporcionan procesamiento adicional y manejo de errores.

El flujo de registro sigue esta secuencia:

**Router → Passport (`register`) → Service → Repository → DAO → Modelo User → MongoDB → Controller (respuesta HTTP)**

El servicio utiliza el helper de bcrypt para generar el hash de la contraseña antes de guardar al usuario. Para el login, el DAO obtiene expresamente el hash del usuario con `.select("+password")` y el servicio utiliza `comparePassword()` para verificar las credenciales.

La generación y verificación de JWT están disponibles en `src/utils/jwt.js`. En la Pre-entrega 4, la estrategia Passport `current` comprueba el JWT enviado en la cookie y coloca los datos públicos en `req.user`. El archivo `src/middlewares/auth.middleware.js` permanece como implementación anterior, pero **la ruta `/api/sessions/current` ya no lo utiliza**. El controller de login genera el JWT y administra la cookie.

## Modelo User

El modelo contiene los siguientes campos:

| Campo | Descripción |
|---|---|
| `first_name` | Nombre obligatorio |
| `last_name` | Apellido obligatorio |
| `email` | Correo obligatorio, normalizado y único |
| `password` | Contraseña almacenada mediante hash |
| `role` | Rol del usuario |
| `createdAt` | Fecha de creación |
| `updatedAt` | Fecha de actualización |

Los roles permitidos son:

- `user`
- `organizer`
- `admin`

En el registro público se asigna siempre el rol `user`, sin aceptar modificaciones desde el cuerpo de la solicitud.

El esquema utiliza `timestamps: true` para registrar las fechas de creación y actualización.

## Endpoint de registro

### POST /api/sessions/register

Permite registrar un usuario de forma segura.

### Campos esperados en el body

```json
{
  "first_name": "Ana",
  "last_name": "Perez",
  "email": "Ana@Mail.com ",
  "password": "Secreta123"
}
```

Todos los campos son obligatorios.

### Validaciones

- Nombre y apellido obligatorios.
- Email obligatorio y con formato válido.
- Normalización del email mediante `trim()` y `toLowerCase()`.
- Contraseña de al menos 8 caracteres.
- Verificación de email previamente registrado.
- Asignación del rol `user` desde el backend.
- Hashing de la contraseña mediante bcrypt antes de guardarla.
- Exclusión de la contraseña y su hash de la respuesta HTTP.

### Respuesta exitosa — HTTP 201 Created

```json
{
  "status": "success",
  "payload": {
    "id": "identificador_generado_por_mongodb",
    "first_name": "Ana",
    "last_name": "Perez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

La respuesta no incluye el campo `password` ni su hash.

### Error por campos faltantes — HTTP 400 Bad Request

```json
{
  "status": "error",
  "message": "Faltan campos obligatorios"
}
```

### Error por email inválido — HTTP 400 Bad Request

```json
{
  "status": "error",
  "message": "Formato de email inválido"
}
```

### Error por contraseña corta — HTTP 400 Bad Request

```json
{
  "status": "error",
  "message": "La contraseña debe tener al menos 8 caracteres"
}
```

### Email duplicado — HTTP 409 Conflict

```json
{
  "status": "error",
  "message": "El email ya está registrado"
}
```

### Error interno — HTTP 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Error interno del servidor"
}
```

## Cómo probar el registro

Con MongoDB y el servidor Express en funcionamiento, ejecutar desde Git Bash:

```bash
curl -i -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ana","last_name":"Perez","email":"ana@mail.com","password":"Secreta123"}'
```

Se espera una respuesta HTTP 201 si el correo no está registrado.

Si se utiliza nuevamente el mismo email, se espera una respuesta HTTP 409.

Para realizar nuevos registros exitosos, utilizar un email que todavía no exista en la base de datos.

### Casos de prueba realizados

| Prueba | Código HTTP esperado | Resultado |
|---|---|---|
| Registro exitoso | 201 | Correcto |
| Campos obligatorios faltantes | 400 | Correcto |
| Email con formato inválido | 400 | Correcto |
| Contraseña menor a 8 caracteres | 400 | Correcto |
| Email previamente registrado | 409 | Correcto |
| Intento de asignar rol admin | 201, con rol user | Correcto |
| Respuesta sin contraseña | 201, sin password | Correcto |

También se verificó el almacenamiento de contraseñas mediante hashes de bcrypt en MongoDB.

### Protección contra asignación de roles

Si un usuario intenta enviar el siguiente campo adicional:

```json
{
  "role": "admin"
}
```

El backend ignora ese valor y asigna automáticamente el rol `user`.

De esta manera, se aplica el principio de menor privilegio y se evita que un usuario obtenga permisos administrativos mediante el registro público.

## Seguridad de las contraseñas

Las contraseñas se procesan mediante el helper reutilizable `src/utils/hash.js`.

Se utiliza `bcrypt.hash()` con factor de costo 10.

El backend guarda solamente el hash de la contraseña, nunca su valor original.

Para validar las credenciales durante el login, el helper utiliza `bcrypt.compare()`.

El modelo `User` configura `select: false` para el campo `password`, y el servicio construye la respuesta utilizando únicamente campos permitidos.

### Medidas de seguridad implementadas

La firma JWT nunca debe configurarse con una clave expuesta públicamente. En desarrollo, `secure` es `false` para permitir pruebas por HTTP local; en producción debe usarse HTTPS y `secure: true`. Para sistemas expuestos a internet, considerar también mitigaciones CSRF y limitación de intentos de login.

- Validaciones de entrada en el backend.
- Normalización del correo electrónico.
- Prevención de usuarios duplicados.
- Índice único para el email en MongoDB.
- Hashing de contraseñas mediante bcrypt.
- Control del rol asignado en el registro público.
- Exclusión de información sensible en las respuestas.
- Manejo de errores HTTP.
- Uso de variables de entorno para la configuración.

## Verificación en MongoDB

Para pruebas locales, abrir MongoDB Compass y conectarse a `mongodb://127.0.0.1:27017`.

**Para la entrega, verificar además la conexión con el clúster de MongoDB Atlas** configurado en el archivo `.env` privado. La conexión debe estar operativa antes de publicar la entrega.

Ingresar a:

`plataforma_eventos → users → Documents`

Los documentos registrados deben contener:

- Email normalizado.
- Rol `user`.
- Contraseña almacenada como hash de bcrypt, normalmente comenzando por `$2b$10$`.

La contraseña original no debe aparecer en la base de datos ni en las respuestas de la API.

Esta verificación permite confirmar la persistencia efectiva mediante Mongoose y el correcto tratamiento de datos sensibles.

## Resumen de rutas HTTP

| Método | Ruta | Descripción | Respuestas principales |
|---|---|---|---|
| GET | `/api/health` | Verifica el estado del servidor | 200 |
| GET | `/api/events` | Lista los eventos | 200 |
| GET | `/api/sessions` | Información del módulo de sesiones | 200 |
| POST | `/api/sessions/register` | Registra un usuario | 201, 400, 409, 500 |
| POST | `/api/sessions/login` | Valida credenciales y crea la cookie `currentUser` | 200, 400, 401, 500 |
| GET | `/api/sessions/current` | Devuelve datos públicos del usuario autenticado | 200, 401 |
| POST | `/api/sessions/logout` | Elimina la cookie de autenticación | 200 |

El ejemplo de request/response del registro se encuentra en **Endpoint de registro**. Los ejemplos de las demás rutas se detallan a continuación.

## Login, JWT, cookie y cierre de sesión

### POST /api/sessions/login

**Request** (`Content-Type: application/json`):

```json
{
  "email": "ana.prueba.20261020@example.com",
  "password": "PruebaSegura123!"
}
```

Passport ejecuta la estrategia `login`, que delega la validación en el servicio: exige los campos, normaliza el email, busca al usuario y compara la contraseña con el hash mediante bcrypt. Tras autenticar, **el controller** firma el JWT con `JWT_SECRET`, incluye `id`, `email`, `role` y aplica `JWT_EXPIRES_IN`.

**Response HTTP 200 OK:**

```json
{
  "status": "success",
  "message": "Login correcto"
}
```

La respuesta también incluye un encabezado `Set-Cookie` con `currentUser`, configurado con `HttpOnly`, `SameSite=Lax`, `Max-Age=3600` y `Secure` únicamente cuando `NODE_ENV=production`. El JWT no se devuelve en el cuerpo JSON.

**Response HTTP 400 (campos faltantes):**

```json
{
  "status": "error",
  "message": "Email y contraseña son obligatorios"
}
```

**Response HTTP 401 (email inexistente o contraseña incorrecta):**

```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

Se utiliza el mismo mensaje para no revelar cuál de las credenciales falló.

### GET /api/sessions/current

**Request:**

```http
GET /api/sessions/current
Cookie: currentUser=<JWT_VALIDO>
```

La cookie se envía automáticamente si el cliente HTTP la conserva. La estrategia Passport `current` extrae y verifica el JWT de la cookie, y adjunta los campos públicos a `req.user`.

**Response HTTP 200 OK:**

```json
{
  "status": "success",
  "payload": {
    "id": "ID_GENERADO_POR_MONGODB",
    "email": "ana.prueba.20261020@example.com",
    "role": "user"
  }
}
```

**Response HTTP 401 (cookie ausente, token inválido o expirado):**

```json
{
  "status": "error",
  "message": "No autenticado"
}
```

### POST /api/sessions/logout

**Request:**

```http
POST /api/sessions/logout
Cookie: currentUser=<JWT_VALIDO>
```

No requiere body. El servidor borra la cookie `currentUser` con `res.clearCookie()`.

**Response HTTP 200 OK:**

```json
{
  "status": "success",
  "message": "Sesión cerrada"
}
```

Tras el logout, `/current` devuelve 401 si el cliente deja de enviar la cookie. Borrar una cookie no revoca criptográficamente un JWT que alguien hubiera conservado; el token seguiría siendo válido hasta su vencimiento salvo que se implemente revocación adicional.

### Pruebas realizadas de autenticación

| Caso | Resultado verificado |
|---|---|
| Registro válido sin exponer password | Usuario creado |
| Login correcto y cookie `currentUser` | 200 |
| `/current` con cookie válida | 200, datos públicos |
| `/current` sin cookie | 401, `No autenticado` |
| Logout y `/current` después de cerrar sesión | 200 y luego 401 |
| Login con email inexistente | 401 |
| Login con contraseña incorrecta | 401 |
| `/current` con token mal formado | 401, `No autenticado` |
| `/current` con token expirado | 401, `No autenticado` |

Como evidencia adicional se pueden adjuntar capturas de Thunder Client/Postman del login (`Set-Cookie`), `/current` con cookie (200) y `/current` sin cookie (401). Ocultar siempre los valores de JWT y las credenciales privadas.

## Otros endpoints disponibles

### GET /api/health

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

### GET /api/events

```json
{
  "status": "success",
  "payload": []
}
```

### GET /api/sessions

```json
{
  "status": "success",
  "message": "Módulo de sesiones preparado"
}
```

Estos endpoints se mantienen desde la Pre-entrega 1. Para `GET /api/health`, `GET /api/events` y `GET /api/sessions`, los ejemplos de request son respectivamente `GET /api/health`, `GET /api/events` y `GET /api/sessions`, sin body, y sus respuestas 200 son las mostradas arriba.

## Estado del proyecto

### Pre-entrega 1

- Arquitectura modular inicial.
- Configuración de Express.
- Modelos iniciales.
- Rutas de health, events y sessions.

### Pre-entrega 2

- Modelo User actualizado.
- Conexión efectiva a MongoDB.
- Registro seguro de usuarios.
- Validaciones de entrada.
- Normalización y unicidad de email.
- Protección de contraseñas con bcrypt.
- Separación de responsabilidades en capas.
- Respuestas HTTP sin datos sensibles.
- Pruebas de registro exitoso y manejo de errores.

### Pre-entrega 3

- Login con validación de credenciales y mensajes genéricos ante errores.
- Generación de JWT firmado mediante variable de entorno.
- Cookie HttpOnly `currentUser` y expiración configurable.
- Middleware de autenticación y ruta protegida `/current`.
- Logout con eliminación de cookie.
- Pruebas de acceso válido, sin cookie, con token inválido y expirado.

## Pre-entrega 4 — Passport.js y flujo de autenticación

Las estrategias se configuran exclusivamente en `src/config/passport.config.js` y se inicializan en `src/app.js` mediante `passport.initialize()`. Las rutas delegan la autenticación en `passport.authenticate(..., { session: false }, callback)`, usando un callback para conservar los códigos de estado y los mensajes HTTP de la Pre-entrega 3. No se utiliza `express-session` ni `passport.session()`.

| Estrategia | Implementación | Responsabilidad |
|---|---|---|
| `register` | `passport-local` | Valida nombre, apellido, email y contraseña; normaliza el correo; controla unicidad; usa bcrypt; guarda el usuario con rol `user` y devuelve datos públicos. |
| `login` | `passport-local` | Valida email y contraseña usando el servicio y compara con bcrypt; entrega datos públicos del usuario al controller. |
| `current` | `passport-jwt` | Extrae JWT de `req.cookies.currentUser`, verifica firma y vencimiento, valida campos y proporciona `req.user`. |

**Separación de responsabilidades:** Passport autentica; **el controller de login** genera el JWT y establece la cookie `currentUser` con `HttpOnly` y `SameSite=Lax` (`Secure` en producción). El controller de `/current` devuelve solo `id`, `email` y `role`. `/logout` elimina la cookie y no requiere Passport. Las rutas y el contrato JSON se mantienen sin cambios.

**Preparado para proveedores externos:** la centralización en `passport.config.js` permite incorporar estrategias adicionales como Google o GitHub sin modificar `app.js`. Dichos proveedores **todavía no están implementados**.

### Pruebas de la Pre-entrega 4 realizadas con Postman

| Escenario | HTTP observado |
|---|---|
| Registro exitoso | 201 |
| Registro con email duplicado | 409 |
| Login válido | 200 |
| `/current` con cookie válida | 200 |
| Logout | 200 |
| `/current` después de logout | 401 |
| Login con contraseña incorrecta | 401 |
| `/current` con cookie y token mal formado | 401 |

El flujo probado fue **register → login → current (200) → logout → current (401)**. Se recomienda adjuntar capturas de Postman ocultando el JWT, las contraseñas y cualquier secreto.

## Próximas funcionalidades
- Autorización por roles.
- CRUD completo de eventos.
- Inscripciones y control de cupos.
- Notificaciones.
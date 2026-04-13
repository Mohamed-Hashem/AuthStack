const TOKEN_COOKIE = "token";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV !== "development",
  sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const setAuthCookie = (res, token) => res.cookie(TOKEN_COOKIE, token, cookieOptions());

const clearAuthCookie = (res) =>
  res.clearCookie(TOKEN_COOKIE, { ...cookieOptions(), maxAge: undefined });

module.exports = { TOKEN_COOKIE, setAuthCookie, clearAuthCookie };

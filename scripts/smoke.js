/**
 * End-to-end smoke test for AuthStack.
 *
 * Spins up an in-memory MongoDB, boots the Express app, and exercises the full
 * auth + profile flow (including CORS) via `http` from a simulated browser
 * Origin. Fails fast on the first mismatch so CI can assert contract parity.
 *
 * Usage: `node scripts/smoke.js`
 */
const { MongoMemoryServer } = require("mongodb-memory-server");
const http = require("node:http");

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  process.env.JWT_SECRET = "smoke-test-secret";
  process.env.JWT_EXPIRES_IN = "5m";
  process.env.ALLOWED_ORIGINS = "http://localhost:5173";
  process.env.NODE_ENV = "test";

  const app = require("../index");
  const { connectDB } = require("../lib/db");
  await connectDB();

  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, () => resolve(s));
    s.on("error", reject);
  });
  const port = server.address().port;
  const base = `http://localhost:${port}`;
  const origin = "http://localhost:5173";

  const request = (method, path, { body, token } = {}) =>
    new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : undefined;
      const req = http.request(
        {
          method,
          hostname: "localhost",
          port,
          path,
          headers: {
            Origin: origin,
            ...(data && {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(data),
            }),
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
        (res) => {
          let buf = "";
          res.setEncoding("utf8");
          res.on("data", (c) => (buf += c));
          res.on("end", () =>
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: buf ? JSON.parse(buf) : null,
            })
          );
        }
      );
      req.on("error", reject);
      if (data) req.write(data);
      req.end();
    });

  const preflight = (path, method = "POST") =>
    new Promise((resolve, reject) => {
      const req = http.request(
        {
          method: "OPTIONS",
          hostname: "localhost",
          port,
          path,
          headers: {
            Origin: origin,
            "Access-Control-Request-Method": method,
            "Access-Control-Request-Headers": "content-type",
          },
        },
        (res) => {
          res.resume();
          res.on("end", () => resolve({ status: res.statusCode, headers: res.headers }));
        }
      );
      req.on("error", reject);
      req.end();
    });

  const expect = (label, cond, detail) => {
    if (!cond) {
      console.error(`✗ ${label}`, detail ?? "");
      throw new Error(`Assertion failed: ${label}`);
    }
    console.log(`✓ ${label}`);
  };

  console.log(`▶ booted on ${base}\n`);

  // 1. Health
  {
    const r = await request("GET", "/");
    expect("root 200", r.status === 200);
    expect("root ACAO", r.headers["access-control-allow-origin"] === origin);
    expect("root body", r.body.status === "healthy");
  }

  // 2. Preflight /api/auth/login
  {
    const r = await preflight("/api/auth/login");
    expect("preflight 204", r.status === 204);
    expect("preflight ACAO", r.headers["access-control-allow-origin"] === origin);
    expect("preflight methods", (r.headers["access-control-allow-methods"] || "").includes("POST"));
  }

  // 3. Register
  const email = `smoke-${Date.now()}@example.com`;
  const password = "password123";
  {
    const r = await request("POST", "/api/auth/register", {
      body: {
        first_name: "Ada",
        last_name: "Lovelace",
        age: 30,
        email,
        password,
      },
    });
    expect("register 201", r.status === 201, r.body);
    expect("register ACAO on success", r.headers["access-control-allow-origin"] === origin);
    expect("register message", typeof r.body.message === "string");
  }

  // 4. Register duplicate → 409
  {
    const r = await request("POST", "/api/auth/register", {
      body: {
        first_name: "Ada",
        last_name: "Lovelace",
        age: 30,
        email,
        password,
      },
    });
    expect("duplicate 409", r.status === 409, r.body);
    expect("duplicate ACAO on error", r.headers["access-control-allow-origin"] === origin);
    expect("duplicate message", r.body.message === "User already exists");
  }

  // 5. Login bad creds → 401
  {
    const r = await request("POST", "/api/auth/login", {
      body: { email, password: "wrong-password" },
    });
    expect("bad-login 401", r.status === 401);
    expect("bad-login ACAO on error", r.headers["access-control-allow-origin"] === origin);
    expect("bad-login message", r.body.message === "Invalid email or password");
  }

  // 6. Login success
  let token;
  {
    const r = await request("POST", "/api/auth/login", {
      body: { email, password },
    });
    expect("login 200", r.status === 200, r.body);
    expect("login token", typeof r.body.token === "string");
    expect("login user", r.body.user && r.body.user.email === email);
    expect("login ACAO", r.headers["access-control-allow-origin"] === origin);
    token = r.body.token;
  }

  // 7. GET /api/profile with token
  {
    const r = await request("GET", "/api/profile", { token });
    expect("profile 200", r.status === 200, r.body);
    expect("profile user.email", r.body.user.email === email);
    expect("profile user.first_name", r.body.user.first_name === "Ada");
  }

  // 8. GET /api/profile without token
  {
    const r = await request("GET", "/api/profile");
    expect("profile-no-token 401", r.status === 401);
    expect("profile-no-token msg", r.body.message === "No token provided");
  }

  // 9. PUT /api/profile
  {
    const r = await request("PUT", "/api/profile", {
      token,
      body: { first_name: "Augusta", last_name: "King", age: 36 },
    });
    expect("update-profile 200", r.status === 200, r.body);
    expect("update-profile first_name", r.body.user.first_name === "Augusta");
    expect("update-profile age", r.body.user.age === 36);
  }

  // 10. PUT /api/change-password
  {
    const r = await request("PUT", "/api/change-password", {
      token,
      body: { currentPassword: password, newPassword: "newpass456" },
    });
    expect("change-password 200", r.status === 200, r.body);
  }

  // 11. Login with new password
  {
    const r = await request("POST", "/api/auth/login", {
      body: { email, password: "newpass456" },
    });
    expect("relogin 200", r.status === 200);
  }

  // 12. Rejected origin should still hit server but get NO Allow-Origin header
  // (cors middleware silently drops the header; browser blocks)
  await new Promise((resolve, reject) => {
    const req = http.request(
      {
        method: "GET",
        hostname: "localhost",
        port,
        path: "/",
        headers: { Origin: "https://evil.example" },
      },
      (res) => {
        res.resume();
        res.on("end", () => {
          expect(
            "blocked origin has NO ACAO",
            res.headers["access-control-allow-origin"] === undefined,
            res.headers
          );
          resolve();
        });
      }
    );
    req.on("error", reject);
    req.end();
  });

  console.log("\nAll smoke tests passed ✓\n");

  server.close();
  await mongo.stop();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

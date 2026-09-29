import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../src/db.js";
import { JWT_SECRET } from "../src/middleware/auth.js";
import authRouter from "../src/routes/auth.js";
import progressRouter from "../src/routes/progress.js";
import benchmarksRouter from "../src/routes/benchmarks.js";
import catalogRouter from "../src/routes/catalog.js";

// Exercise the real middleware and route handlers without a server or database.
function request(router: Router, method: string, url: string, body?: unknown) {
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    let status = 200;
    const req = {
      method, url, body,
      headers: { authorization: `Bearer ${jwt.sign({ userId: 1 }, JWT_SECRET)}` }
    } as Request;
    const res = {
      status(code: number) { status = code; return this; },
      json(response: unknown) { resolve({ status, body: response }); return this; }
    } as Response;
    router(req, res, (error?: unknown) => reject(error ?? new Error("Route did not respond")));
  });
}

test("progress rejects an unknown milestone before writing", async (t) => {
  const queries: string[] = [];
  t.mock.method(pool, "query", async (sql: string) => {
    queries.push(sql);
    return { rows: [{ id: "profile-review" }] };
  });
  const response = await request(progressRouter, "PUT", "/", {
    completedTaskIds: ["profile-review", "unknown"]
  });
  assert.equal(response.status, 400);
  assert.equal(queries.length, 1);
  assert.match(queries[0], /^SELECT/);
});

test("partial progress saves pass omitted values separately from explicit resets", async (t) => {
  const values: unknown[][] = [];
  t.mock.method(pool, "query", async (_sql: string, params: unknown[]) => {
    values.push(params);
    return { rows: [{ user_id: 1 }] };
  });
  assert.equal((await request(progressRouter, "PUT", "/", { scores: { thpt: 28.19 } })).status, 200);
  assert.equal((await request(progressRouter, "PUT", "/", { completedTaskIds: [], scores: { sat: 0 } })).status, 200);
  assert.deepEqual(values, [[1, null, 28.19, null, null, null], [1, [], null, null, 0, null]]);
});

test("missing progress returns defaults without creating a row during GET", async (t) => {
  const query = t.mock.method(pool, "query", async () => ({ rows: [{
    completed_task_ids: null, scores_thpt: null, scores_hsa: null, scores_sat: null
  }] }));
  const response = await request(progressRouter, "GET", "/");
  assert.deepEqual(response, { status: 200, body: {
    completedTaskIds: [], scores: { thpt: 0, hsa: 0, sat: 0 },
    interests: { universityIds: [], categoryIds: [] }
  } });
  assert.equal(query.mock.callCount(), 1);
});

test("a deleted account cannot read or save progress with an old token", async (t) => {
  t.mock.method(pool, "query", async () => ({ rows: [] }));
  assert.equal((await request(progressRouter, "GET", "/")).status, 401);
  assert.equal((await request(progressRouter, "PUT", "/", { scores: { sat: 1400 } })).status, 401);
  assert.equal((await request(authRouter, "GET", "/me")).status, 401);
});

test("registration rolls back the user if creating progress fails and releases the connection", async (t) => {
  const statements: string[] = [];
  let released = false;
  t.mock.method(console, "error", () => {});
  t.mock.method(pool, "query", async () => ({ rows: [] }));
  t.mock.method(pool, "connect", async () => ({
    query: async (sql: string) => {
      statements.push(sql);
      if (sql.startsWith("INSERT INTO user_progress")) throw new Error("Simulated database failure");
      return { rows: [{ id: 1, name: "Minh", grade: null }] };
    },
    release: () => { released = true; }
  }));
  const response = await request(authRouter, "POST", "/register", {
    email: "minh@example.com", password: "Example1", name: "Minh"
  });
  assert.equal(response.status, 500);
  assert.equal(statements[0], "BEGIN");
  assert.equal(statements.at(-1), "ROLLBACK");
  assert.ok(!statements.includes("COMMIT"));
  assert.equal(released, true);
});

test("a registration race reports the duplicate email and releases the connection", async (t) => {
  let released = false;
  t.mock.method(pool, "query", async () => ({ rows: [] }));
  t.mock.method(pool, "connect", async () => ({
    query: async (sql: string) => {
      if (sql.startsWith("INSERT INTO users")) throw Object.assign(new Error("Duplicate email"), { code: "23505" });
      return { rows: [] };
    },
    release: () => { released = true; }
  }));
  const response = await request(authRouter, "POST", "/register", {
    email: "MINH@example.com", password: "Example1", name: "Minh"
  });
  assert.equal(response.status, 409);
  assert.equal(released, true);
});

test("login finds an existing mixed-case email using a normalized lookup", async (t) => {
  const hash = await bcrypt.hash("Example1", 4);
  t.mock.method(pool, "query", async (sql: string, values: unknown[]) => {
    assert.match(sql, /LOWER\(email\) = \$1/);
    assert.deepEqual(values, ["minh@example.com"]);
    return { rows: [{ id: 1, password_hash: hash, name: "Minh", grade: "12" }] };
  });
  assert.equal((await request(authRouter, "POST", "/login", {
    email: "  Minh@Example.COM  ", password: "Example1"
  })).status, 200);
});

test("registration stores normalized fields and commits both records", async (t) => {
  const statements: string[] = [];
  const interests = { universityIds: ["neu", "ftu"], categoryIds: ["economics", "finance"] };
  let released = false;
  t.mock.method(pool, "query", async () => ({ rows: [] }));
  t.mock.method(pool, "connect", async () => ({
    query: async (sql: string, values?: unknown[]) => {
      statements.push(sql);
      if (sql.startsWith("INSERT INTO users")) {
        assert.equal(values?.[0], "minh@example.com");
        assert.equal(values?.[2], "Minh");
        assert.equal(values?.[3], null);
      }
      if (sql.startsWith("INSERT INTO user_progress")) {
        assert.deepEqual(values, [1, JSON.stringify(interests)]);
      }
      return { rows: [{ id: 1, name: "Minh", grade: null }] };
    },
    release: () => { released = true; }
  }));
  const response = await request(authRouter, "POST", "/register", {
    email: "  MINH@example.com ", password: "Example1", name: " Minh ", grade: " ", interests
  });
  assert.equal(response.status, 201);
  assert.equal(statements[0], "BEGIN");
  assert.match(statements[2], /^INSERT INTO user_progress/);
  assert.equal(statements.at(-1), "COMMIT");
  assert.equal(released, true);
});

test("interest updates preserve tasks and scores and distinguish omission from clearing", async (t) => {
  const calls: { sql: string; values: unknown[] }[] = [];
  t.mock.method(pool, "query", async (sql: string, values: unknown[]) => {
    calls.push({ sql, values });
    return { rows: [{ user_id: 1 }] };
  });
  const interests = { universityIds: ["hust"], categoryIds: ["engineering", "computing"] };
  assert.equal((await request(progressRouter, "PUT", "/", { interests })).status, 200);
  assert.equal((await request(progressRouter, "PUT", "/", { interests: { universityIds: [], categoryIds: [] } })).status, 200);
  assert.equal((await request(progressRouter, "PUT", "/", { scores: { thpt: 28.19 } })).status, 200);
  assert.deepEqual(calls.map((call) => call.values), [
    [1, null, null, null, null, JSON.stringify(interests)],
    [1, null, null, null, null, JSON.stringify({ universityIds: [], categoryIds: [] })],
    [1, null, 28.19, null, null, null]
  ]);
  assert.match(calls[0].sql, /interests = COALESCE\(\$6::jsonb, user_progress.interests\)/);
});

test("invalid interests never reach the database", async (t) => {
  const query = t.mock.method(pool, "query", async () => { throw new Error("Unexpected query"); });
  const invalid = { universityIds: ["unknown"], categoryIds: [] };
  assert.equal((await request(progressRouter, "PUT", "/", { interests: invalid })).status, 400);
  assert.equal((await request(authRouter, "POST", "/register", {
    email: "minh@example.com", password: "Example1", name: "Minh", interests: invalid
  })).status, 400);
  assert.equal(query.mock.callCount(), 0);
});

test("progress returns saved interests with the rest of the account state", async (t) => {
  const interests = { universityIds: ["uet", "hust"], categoryIds: ["computing"] };
  t.mock.method(pool, "query", async () => ({ rows: [{
    completed_task_ids: ["profile-review"], scores_thpt: "28.19", scores_hsa: 110, scores_sat: 1400, interests
  }] }));
  const response = await request(progressRouter, "GET", "/");
  assert.deepEqual(response.body, {
    completedTaskIds: ["profile-review"], scores: { thpt: 28.19, hsa: 110, sat: 1400 }, interests
  });
});

test("catalog publishes the stable school and interest choices", async () => {
  const response = await request(catalogRouter, "GET", "/");
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.universities.map((university: { id: string }) => university.id), ["uet", "neu", "hust", "ftu"]);
  assert.deepEqual(response.body.categories.map((category: { id: string }) => category.id), [
    "economics", "business", "finance", "accounting", "law", "languages", "engineering", "computing", "science", "logistics"
  ]);
});

test("cutoff endpoint requests final records with metadata and preserves their official score and scale", async (t) => {
  t.mock.method(pool, "query", async (sql: string) => {
    assert.match(sql, /benchmark_type = 'Final cutoff'/);
    for (const field of ["university_id", "program_id", "method_id", "method_label", "admission_round", "source_id"]) {
      assert.ok(sql.includes(`${field} IS NOT NULL`));
    }
    assert.match(sql, /cardinality\(category_ids\) > 0/);
    return { rows: [{
      id: "sample-hust-2025", university: "Đại học Bách khoa Hà Nội", university_id: "hust",
      program: "Ngành mẫu", program_id: "hust-example", code: "EX", campus: "Hà Nội",
      category_ids: ["engineering"], method_id: "tsa", method_label: "Điểm thi Đánh giá tư duy",
      subject_groups: [], admission_round: "Đợt 1", score: "87.63", scale: 100,
      cycle: "2025", source_id: "S5", benchmark_type: "Final cutoff", note: "Dữ liệu kiểm thử",
      route: null, comparable: false
    }] };
  });
  const response = await request(benchmarksRouter, "GET", "/");
  assert.equal(response.status, 200);
  assert.equal(response.body[0].score, 87.63);
  assert.equal(response.body[0].scale, 100);
  assert.equal(response.body[0].methodId, "tsa");
  assert.deepEqual(response.body[0].categoryIds, ["engineering"]);
  assert.deepEqual(response.body[0].subjectGroups, []);
});

import assert from "node:assert/strict";
import test from "node:test";
import { validateCredentials, validateInterests, validateProgressUpdate, validateRegistration } from "../src/lib/validation.js";

test("a partial score update keeps omitted fields distinct from zero", () => {
  assert.deepEqual(validateProgressUpdate({ scores: { thpt: 28.19 } }), {
    value: { scores: { thpt: 28.19 } }
  });
  assert.deepEqual(validateProgressUpdate({ scores: { sat: 0 }, completedTaskIds: [] }), {
    value: { scores: { sat: 0 }, completedTaskIds: [] }
  });
});

test("invalid score types, ranges, and precision are rejected", () => {
  for (const scores of [
    { thpt: "28.19" }, { thpt: null }, { thpt: NaN }, { thpt: Infinity },
    { thpt: -1 }, { thpt: 30.01 }, { thpt: 28.191 },
    { hsa: 150.1 }, { hsa: 120.5 }, { sat: 1601 }, { sat: 1400.5 }, { other: 20 }
  ]) {
    assert.ok(validateProgressUpdate({ scores }).error, JSON.stringify(scores));
  }
});

test("malformed progress updates cannot silently erase saved values", () => {
  for (const body of [undefined, null, [], {}, { scores: {} }, { scores: null },
    { completedTaskIds: null }, { completedTaskIds: "profile-review" },
    { completedTaskIds: [7] }, { completedTaskIds: [""] }, { completedTasks: [] }]) {
    assert.ok(validateProgressUpdate(body).error, JSON.stringify(body));
  }
  assert.deepEqual(validateProgressUpdate({ completedTaskIds: ["profile-review", "profile-review"] }), {
    value: { completedTaskIds: ["profile-review"] }
  });
});

test("email normalization and registration trim only display fields", () => {
  assert.deepEqual(validateRegistration({
    email: "  Minh@Example.com ", password: " Example1 ", name: "  Minh  ", grade: "  Lớp 12  "
  }), {
    value: {
      email: "minh@example.com", password: " Example1 ", name: "Minh", grade: "Lớp 12",
      interests: { universityIds: [], categoryIds: [] }
    }
  });
});

test("interests accept multiple choices, deduplicate IDs, and allow undecided selections", () => {
  const value = { universityIds: ["neu", "hust"], categoryIds: ["computing", "business"] };
  assert.deepEqual(validateInterests({
    universityIds: ["neu", "hust", "neu"], categoryIds: ["computing", "business", "computing"]
  }), { value });
  assert.deepEqual(validateProgressUpdate({ interests: value }), { value: { interests: value } });
  const empty = { universityIds: [], categoryIds: [] };
  assert.deepEqual(validateProgressUpdate({ interests: empty }), { value: { interests: empty } });
  assert.deepEqual(validateProgressUpdate({ completedTaskIds: [] }), { value: { completedTaskIds: [] } });
});

test("malformed or unknown interests are rejected for signup and progress updates", () => {
  for (const interests of [null, [], {},
    { universityIds: ["unknown"], categoryIds: [] },
    { universityIds: [], categoryIds: ["unknown"] },
    { universityIds: "neu", categoryIds: [] },
    { universityIds: [], categoryIds: [1] },
    { universityIds: [], categoryIds: [], extra: true },
    { universityIds: ["neu"] }, { categoryIds: ["business"] }
  ]) {
    assert.ok(validateProgressUpdate({ interests }).error, JSON.stringify(interests));
    assert.ok(validateRegistration({ email: "minh@example.com", password: "Example1", name: "Minh", interests }).error);
  }
});

test("invalid auth input returns a validation error instead of throwing", () => {
  for (const body of [undefined, null, [], { email: 123, password: "Example1" },
    { email: "wrong", password: "Example1" }, { email: "minh@example.com", password: [] }]) {
    assert.ok(validateCredentials(body).error);
    assert.ok(validateRegistration(body).error);
  }
  for (const fields of [{ name: " " }, { name: "Minh", grade: 12 },
    { name: "Minh", password: "weak" }, { name: "Minh", password: "A1" + "é".repeat(36) }]) {
    assert.ok(validateRegistration({ email: "minh@example.com", password: "Example1", ...fields }).error);
  }
});

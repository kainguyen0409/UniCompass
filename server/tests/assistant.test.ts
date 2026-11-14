import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/middleware/auth.js';
import { createAssistantRouter } from '../src/routes/assistant.js';
import { runAssistant, type ModelCall } from '../src/assistant/agent.js';
import { createTools, programKey, readStudent, type Readers } from '../src/assistant/tools.js';
import { config, requestSchema, AssistantError } from '../src/assistant/contracts.js';
import { createLimiter } from '../src/assistant/limits.js';
import pool from '../src/db.js';
const student = { interests: { universityIds: [], categoryIds: [] }, completedTaskIds: ['done'] };
const rows = [30, 150].map((scale, i) => ({ id: `b${i}`, universityId: 'uet', programId: 'cs', university: 'UET', program: 'Công nghệ thông tin', campus: 'Hà Nội', cycle: '2025', admissionRound: '1', categoryIds: ['computing'], code: 'CS', sourceId: 's1', score: i ? 100 : 27, scale }));
const db = { benchmarks: async () => rows, sources: async () => [{ id: 's1', url: 'https://example.org' }], milestones: async () => [{ id: 'done', sourceIds: ['s1'] }, { id: 'next', sourceIds: ['s1'] }] } as unknown as Readers;
const search = { query: 'cong nghe', universityIds: [], categoryIds: [], useSavedInterests: false };
const answer = { sections: [{ text: 'Dữ liệu lưu trữ 2025.', sourceIds: ['s1'] }], programRefs: [programKey(rows[0])], milestoneIds: [] };
const response = (output: unknown[] = [], body: unknown = answer) => ({ status: 'completed', output, output_text: JSON.stringify(body) }) as any;
const call = (name: string, args: unknown, id = 'call1') => ({ type: 'function_call', name, arguments: JSON.stringify(args), call_id: id });
const request = { message: 'Điểm CNTT?', history: [] };

test('tools preserve distinct scales, normalize Vietnamese, handle missing data and validate arguments', async () => {
 const tools = createTools(student, db);
 const result = await tools.execute('search_programs', search) as any;
 assert.equal(result.programs.length, 1);
 assert.deepEqual((await tools.execute('get_program_details', { programRef: result.programs[0].programRef }) as any).records.map((r: any) => r.scale), [30, 150]);
 assert.ok((await tools.execute('get_program_details', { programRef: 'fake' }) as any).error);
 assert.ok((await tools.execute('search_programs', { ...search, universityIds: ['fake'] }) as any).error);
 assert.equal((await tools.execute('search_programs', { ...search, query: 'missing' }) as any).total, 0);
 assert.deepEqual((await tools.execute('get_sources', { sourceIds: ['fake'] }) as any).missingIds, ['fake']);
 assert.equal((await tools.execute('get_my_roadmap', { route: 'all' }) as any).nextMilestoneId, 'next');
 await assert.rejects(tools.execute('__proto__', {}), /không hợp lệ/);
});
test('deleted accounts are rejected using authenticated ID', async t => {
 t.mock.method(pool, 'query', async (_sql: string, args: unknown[]) => { assert.deepEqual(args, [7]); return { rows: [] }; });
 await assert.rejects(readStudent(7), (e: any) => e.status === 401);
});
test('dependent Responses calls retain matching outputs and final output is separate', async () => {
 const requests: any[] = [];
 const model: ModelCall = async p => {
  requests.push(structuredClone(p));
  if (requests.length === 1) return response([call('search_programs', search)]);
  if (requests.length === 2) return response([call('get_program_details', { programRef: programKey(rows[0]) }, 'call2')]);
  return requests.length === 3 ? response() : response([], answer);
 };
 const result = await runAssistant(request, student, new AbortController().signal, model, db);
 assert.equal(result.metrics.calls, 4);
 assert.deepEqual(result.answer.programs[0].records, rows);
 assert.ok(requests[1].input.some((x: any) => x.type === 'function_call_output' && x.call_id === 'call1'));
 assert.ok(requests[2].input.some((x: any) => x.type === 'function_call_output' && x.call_id === 'call2'));
 assert.equal(requests[3].tools, undefined);
 assert.match(requests[3].instructions, /No tools or functions are available/);
 assert.ok(!requests[3].instructions.includes('Dùng công cụ cho mọi thông tin')); 
 assert.equal(requests[3].text.format.type, 'json_schema');
 assert.ok(requests.every(p => !('store' in p) && !('previous_response_id' in p)));
});
test('unknown references and malformed or incomplete provider responses fail closed', async () => {
 for (const bad of [{ ...answer, programRefs: ['fake'] }, { ...answer, sections: [{ text: 'Fake', sourceIds: ['fake'] }] }, { ...answer, milestoneIds: ['fake'] }, {}]) {
  let n = 0;
  await assert.rejects(runAssistant(request, student, new AbortController().signal, async () => ++n === 1 ? response([call('search_programs', search)]) : response([], bad), db));
 }
 await assert.rejects(runAssistant(request, student, new AbortController().signal, async () => ({ ...response(), status: 'incomplete' }), db));
});
test('tool loop stops at four retrieval requests and four executions', async () => {
 let n = 0;
 const result = await runAssistant(request, student, new AbortController().signal, async () => ++n <= 4 ? response([call('search_programs', search, `${n}`)]) : response(), db);
 assert.equal(result.metrics.calls, 5); assert.equal(result.metrics.tools.length, 4);
 await assert.rejects(runAssistant(request, student, new AbortController().signal, async () => response(Array.from({length: 5}, (_, i) => call('search_programs', search, `${i}`))), db));
});
test('limits enforce concurrency, hourly and daily quotas and expire correctly', () => {
 let now = 0; const limiter = createLimiter(() => now);
 const a = limiter.acquire(1); assert.throws(() => limiter.acquire(1));
 const b = limiter.acquire(2); assert.throws(() => limiter.acquire(3)); a(); b();
 for (let i = 1; i < 20; i++) limiter.acquire(1)();
 assert.throws(() => limiter.acquire(1)); now += 3600001; limiter.acquire(1)();
 const daily = createLimiter(() => now);
 for (let i = 0; i < 100; i++) daily.acquire(i)();
 assert.throws(() => daily.acquire(101)); now += 86400001; daily.acquire(101)();
});
test('history and identity fields are bounded', () => {
 assert.equal(requestSchema.safeParse({ ...request, userId: 2 }).success, false);
 assert.equal(requestSchema.safeParse({ ...request, history: Array(11).fill({role:'user',content:'hi'}) }).success, false);
});
function routeRequest(deps: any, expired = false) {
 return new Promise<{status: number; body: any}>((resolve, reject) => {
  let status = 200;
  const res = Object.assign(new EventEmitter(), { status(n: number) { status = n; return this; }, setHeader() {}, json(body: any) { resolve({status,body}); return this; } });
  createAssistantRouter(deps)({method:'POST',url:'/chat',body:request,headers:{authorization:`Bearer ${jwt.sign({userId:1}, JWT_SECRET, expired ? {expiresIn:-1} : {})}`}} as any,res as any,reject);
 });
}
test('route handles expiration, timeout and provider quota/failure without leaking errors', async () => {
 const deps = { settings: () => ({...config(),enabled:true,timeout:15}), limiter:createLimiter(), student:async () => student, run:async () => { throw Object.assign(new Error('secret'), {status:429}); } };
 assert.equal((await routeRequest(deps, true)).status,401);
 assert.equal((await routeRequest(deps)).status,429);
 const failed = await routeRequest({...deps,run:async () => {throw Error('secret');}});
 assert.equal(failed.status,502); assert.ok(!JSON.stringify(failed.body).includes('secret'));
 assert.equal((await routeRequest({...deps,run:async () => new Promise(() => {})})).status,504);
 assert.equal((await routeRequest({...deps,student:async () => {throw new AssistantError(401,'expired');}})).status,401);
});

test('general admissions step question retrieves roadmap even when model skips tools', async () => {
 const requests: any[] = [];
 const seenRoutes: string[] = [];
 const database: Readers = { ...db, milestones: async route => { seenRoutes.push(route!); return db.milestones(route); } };
 const result = await runAssistant({message:'Có bao nhiêu bước để xét tuyển đại học?',history:[],context:{view:'roadmap',route:'sat'}},student,new AbortController().signal,async p => {
  requests.push(structuredClone(p));
  if (requests.length === 1) return response();
  const evidence = JSON.parse((p.input as any[]).at(-1).content).evidence;
  assert.equal(evidence.milestoneSummary.total,2);
  assert.equal(evidence.milestoneSummary.completed,1);
  assert.equal(evidence.sources[0].id,'s1');
  return response([],{sections:[{text:'Lộ trình UniCompass có 2 mốc.',sourceIds:['s1']}],programRefs:[],milestoneIds:['done','next']});
 },database);
 assert.deepEqual(seenRoutes,['all']);
 assert.deepEqual(result.metrics.tools,['get_my_roadmap']);
 assert.equal(result.answer.milestones.length,2);
});

test('roadmap fallback preserves missing data and respects an explicit route', async () => {
 let n = 0;
 const result = await runAssistant({message:'Lo trinh HSA co may buoc?',history:[]},student,new AbortController().signal,async p => {
  if (++n === 1) return response();
  const evidence = JSON.parse((p.input as any[]).at(-1).content).evidence;
  assert.equal(evidence.milestoneSummary.total,0);
  return response([],{sections:[{text:'Chưa có mốc HSA trong dữ liệu.',sourceIds:[]}],programRefs:[],milestoneIds:[]});
 },{...db,milestones:async route => {assert.equal(route,'hsa');return [];}});
 assert.equal(result.answer.milestones.length,0);
});

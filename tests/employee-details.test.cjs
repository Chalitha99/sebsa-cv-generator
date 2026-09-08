const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Compile these pure modules using the project's compiler; no database credentials required.
function load(path, imports = {}) {
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(id => imports[id] ?? require(id), module, module.exports);
  return module.exports;
}
const details = load('lib/employeeDetails.ts');
const repo = load('repositories/employee-repository.ts', { '@/lib/employeeDetails': details });
function database() {
  const calls = [];
  const client = { from(table) {
    const query = { select(value) { calls.push({ table, select: value }); return query; }, eq() { return query; }, maybeSingle: async () => ({ data: null }), single: async () => ({ data: { id: 'profile' } }), update(value) { calls.push({ table, update: value }); return query; }, insert(value) { calls.push({ table, insert: value }); return query; }, delete() { return query; }, then(resolve) { resolve({ error: null }); } };
    return query;
  } };
  return { client, calls };
}
const base = { name: 'Jane Doe', email: 'jane@example.com', role: 'Engineer', department: 'Engineering', skills: [] };
test('old records return null details and omitted updates preserve them', async () => {
  assert.ok(Object.values(details.employeeDetailsFromRow({})).every(v => v === null));
  const { client, calls } = database();
  await repo.updateEmployeeRow(client, 'profile', base, 'admin');
  const update = calls.find(c => c.update).update;
  for (const field of details.employeeDetailFields) assert.equal(Object.hasOwn(update, field.column), false);
});
test('every detailed field round-trips through storage and GET selection', async () => {
  const values = Object.fromEntries(details.employeeDetailFields.map(f => [f.key, f.type === 'number' ? 0 : f.type === 'date' ? '2024-02-29' : f.type === 'email' ? 'person@example.com' : 'Sample']));
  const { client, calls } = database();
  await repo.updateEmployeeRow(client, 'profile', { ...base, ...values }, 'admin');
  const row = calls.find(c => c.update).update;
  assert.deepEqual(details.employeeDetailsFromRow(row), values);
  await repo.getEmployeeRowById(client, 'profile');
  const select = calls.filter(c => c.table === 'profiles' && c.select).at(-1).select;
  for (const field of details.employeeDetailFields) assert.ok(select.includes(field.column));
});
test('explicit blanks clear details and invalid values are rejected', () => {
  assert.deepEqual(details.normalizeEmployeeDetails({ mobile: ' ', dateOfBirth: '', noticeDays: null }), { mobile: null, dateOfBirth: null, noticeDays: null });
  for (const noticeDays of [-1, 1.5, NaN, 2147483648, '5']) assert.throws(() => details.normalizeEmployeeDetails({ noticeDays }));
  for (const dateOfBirth of ['2023-02-29', 'bad-date', '2024-13-01']) assert.throws(() => details.normalizeEmployeeDetails({ dateOfBirth }));
  assert.throws(() => details.normalizeEmployeeDetails({ personalEmail: 'invalid' }));
  assert.deepEqual(details.normalizeEmployeeDetails({ user_id: 'forged' }), {});
});
test('creation still accepts only its existing fields', async () => {
  const { client, calls } = database();
  await repo.createEmployeeRow(client, { ...base, firstName: 'Ignored' }, 'admin');
  const inserted = calls.find(c => c.table === 'profiles' && c.insert).insert;
  for (const field of details.employeeDetailFields) assert.equal(Object.hasOwn(inserted, field.column), false);
  assert.equal(inserted.status, 'published');
  const self = database();
  await repo.createEmployeeRow(self.client, { ...base, selfServiceUserId: 'employee' }, 'employee');
  assert.equal(self.calls.find(c => c.insert).insert.status, 'draft');
});

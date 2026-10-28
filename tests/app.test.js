const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const script = fs.readFileSync(process.env.APP_SCRIPT || 'app/app.js', 'utf8');
const DATA = 'arrendamento_data';
const SESSION = 'arrendamento_session';
const admin = { id: 'a', name: 'Admin', email: 'admin@example.test', password: 'secret', role: 'admin' };
const member = { id: 'u', name: 'User', email: 'user@example.test', password: 'secret2', role: 'user' };
const seed = () => ({ users: [{ ...admin }, { ...member }], properties: [], transactions: [] });
const profile = ({ id, name, email, role }) => ({ id, name, email, role });

function page(t, { data = seed(), session = admin, login = false } = {}) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => {
    if (error.type !== 'not implemented' || !error.message.includes('navigation')) errors.push(error);
  });
  const dom = new JSDOM(fs.readFileSync(`app/${login ? 'login' : 'main'}/index.html`, 'utf8'), {
    url: `https://arrendamento.example/${login ? 'login' : 'main'}/`,
    runScripts: 'outside-only', virtualConsole: console,
  });
  t.after(() => { dom.window.close(); assert.deepEqual(errors, []); });
  const w = dom.window;
  w.alert = () => {};
  w.localStorage.setItem(DATA, JSON.stringify(data));
  if (session) w.localStorage.setItem(SESSION, JSON.stringify(session));
  w.eval(script);
  const $ = id => w.document.getElementById(id);
  const read = key => JSON.parse(w.localStorage.getItem(key));
  const submit = (id, values = {}) => {
    for (const [field, value] of Object.entries(values)) $(field).value = value;
    $(id).dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  };
  const change = (mutate, dispatch = true) => {
    const updated = read(DATA);
    mutate(updated);
    w.localStorage.setItem(DATA, JSON.stringify(updated));
    if (dispatch) w.dispatchEvent(new w.StorageEvent('storage', { key: DATA, storageArea: w.localStorage }));
  };
  const action = (list, type, id) => [...$(list).querySelectorAll('button')]
    .find(button => button.dataset.action === type && button.dataset.id === id);
  return { w, $, read, submit, change, action };
}

test('stored markup stays literal in every list, profile, option, audit and filtered summary', t => {
  const attack = `<img src=x onerror="window.pwned=1"><svg onload='window.pwned=2'> & " ' </option>`;
  const id = `p" onclick="window.pwned=3`;
  const data = seed();
  Object.assign(data.users[0], { name: attack, email: attack });
  Object.assign(data.users[1], { name: attack, email: attack, id: `u" onclick="window.pwned=4` });
  data.properties = [{ id, name: attack, address: attack }, { id: 'other', name: 'Other', address: 'Other' }];
  data.transactions = ['income', 'expense'].map(type => ({
    id: `${type}" onclick="window.pwned=5`, propertyId: id, type, category: attack,
    amount: 5, date: '2026-01-02', notes: attack, createdBy: attack, updatedBy: attack,
  }));
  const { w, $, action, change } = page(t, { data });
  for (const container of ['propertyList', 'expenseList', 'incomeList', 'userList', 'sessionSummary']) {
    assert.ok($(container).textContent.includes(attack), container);
  }
  assert.equal($('expenseProperty').options[0].textContent, attack);
  assert.equal($('expenseProperty').options[0].value, id);
  for (const option of $('summaryProperties').options) option.selected = option.value === id;
  $('summaryProperties').dispatchEvent(new w.Event('change'));
  assert.ok($('summaryTable').textContent.includes(attack));
  assert.equal(action('propertyList', 'edit', id).dataset.id, id);
  action('propertyList', 'edit', id).click();
  assert.equal($('propertyName').value, attack);
  change(d => { d.users[0].role = 'user'; });
  assert.ok($('profileSummary').textContent.includes(attack));
  assert.equal(w.document.querySelectorAll('img, svg, script:not([src])').length, 0);
  assert.equal(w.document.querySelectorAll('[onerror], [onload], [onclick]').length, 0);
  assert.equal(w.pwned, undefined);
});

test('own profile and demotion update session, navigation, UI and subsequent authorization immediately', t => {
  const { $, read, submit, action } = page(t);
  const retainedDelete = action('userList', 'delete', 'u');
  submit('userForm', { userId: 'a', userName: 'Changed', userEmail: 'changed@example.test', userRole: 'user' });
  assert.deepEqual(read(SESSION), { id: 'a', name: 'Changed', email: 'changed@example.test', role: 'user' });
  assert.equal($('adminTools').hidden, true);
  assert.equal($('profileTools').hidden, false);
  assert.equal($('userList').textContent, '');
  assert.match($('sessionSummary').textContent, /Changed/);
  assert.equal($('userMenuButton').textContent, 'Minha conta');
  $('userMenuButton').click();
  assert.equal($('adminTools').hidden, true);
  submit('userForm', { userId: 'u', userName: 'Forbidden', userEmail: 'bad@example.test', userRole: 'admin' });
  retainedDelete.click();
  assert.equal(read(DATA).users[1].name, 'User');
  submit('passwordForm', { profilePassword: 'new-password' });
  assert.equal(read(DATA).users[0].password, 'new-password');
  assert.equal('password' in read(SESSION), false);
});

test('reload resolves stale role/name from users and removes legacy password from session', t => {
  const data = seed();
  Object.assign(data.users[0], { role: 'user', name: 'Current' });
  const { $, read, submit } = page(t, { data, session: admin });
  assert.deepEqual(read(SESSION), profile(data.users[0]));
  assert.equal($('adminTools').hidden, true);
  submit('userForm', { userId: 'u', userName: 'Forbidden', userEmail: 'bad@example.test', userRole: 'admin' });
  assert.equal(read(DATA).users[1].role, 'user');
});

test('another tab changes role/profile, promotes, and deletes the active user', t => {
  const { $, read, change, submit } = page(t);
  change(data => Object.assign(data.users[0], { role: 'user', name: 'Tab change', email: 'tab@example.test' }));
  assert.equal(read(SESSION).role, 'user');
  assert.match($('profileSummary').textContent, /Tab change/);
  assert.equal($('adminTools').hidden, true);
  change(data => { data.users[0].role = 'admin'; });
  assert.equal(read(SESSION).role, 'admin');
  assert.equal($('adminTools').hidden, false);
  change(data => { data.users = data.users.filter(user => user.id !== 'a'); });
  assert.equal(read(SESSION), null);
  assert.equal($('appView').hidden, true);
  assert.equal($('sessionSummary').textContent, '');
  submit('propertyForm', { propertyName: 'Forbidden', propertyAddress: 'Forbidden' });
  assert.equal(read(DATA).properties.length, 0);
});

test('admin submit and retained delete recheck storage even before a storage event arrives', t => {
  const { action, change, submit, read } = page(t);
  const retainedDelete = action('userList', 'delete', 'u');
  change(data => { data.users[0].role = 'user'; }, false);
  submit('userForm', { userId: 'u', userName: 'Forbidden', userEmail: 'bad@example.test', userRole: 'admin' });
  retainedDelete.click();
  assert.equal(read(DATA).users.length, 2);
  assert.equal(read(DATA).users[1].name, 'User');
  assert.equal(read(SESSION).role, 'user');
});

test('editing another user keeps actor identity and refreshes the edited users next session', t => {
  const { read, submit } = page(t);
  submit('userForm', { userId: 'u', userName: 'Promoted', userEmail: 'promoted@example.test', userRole: 'admin', userPassword: 'changed' });
  assert.deepEqual(read(SESSION), profile(admin));
  const next = page(t, { data: read(DATA), session: member });
  assert.equal(next.read(SESSION).role, 'admin');
  assert.equal(next.read(SESSION).name, 'Promoted');
  assert.equal(next.$('adminTools').hidden, false);
});

test('missing users, cross-tab logout and clear invalidate sessions', t => {
  const missing = page(t, { session: { ...admin, id: 'missing' } });
  assert.equal(missing.read(SESSION), null);
  assert.equal(missing.$('appView').hidden, true);
  for (const key of [SESSION, null]) {
    const { w, $, read } = page(t);
    w.localStorage.removeItem(SESSION);
    w.dispatchEvent(new w.StorageEvent('storage', { key, storageArea: w.localStorage }));
    assert.equal(read(SESSION), null);
    assert.equal($('appView').hidden, true);
  }
});

test('login uses latest password and stores only current profile', t => {
  const { change, submit, read } = page(t, { login: true, session: null });
  change(data => { data.users[0].password = 'new-secret'; });
  submit('loginForm', { loginEmail: admin.email, loginPassword: admin.password });
  assert.equal(read(SESSION), null);
  submit('loginForm', { loginEmail: admin.email, loginPassword: 'new-secret' });
  assert.deepEqual(read(SESSION), profile(admin));
});

test('property, transaction and user CRUD, updated audit names, filters and result totals still work', t => {
  const { w, $, read, submit, action } = page(t);
  submit('propertyForm', { propertyName: 'House', propertyAddress: 'Street' });
  const property = read(DATA).properties[0];
  action('propertyList', 'edit', property.id).click();
  submit('propertyForm', { propertyName: 'House 2' });
  assert.equal(read(DATA).properties[0].name, 'House 2');
  submit('userForm', { userId: 'a', userName: 'Renamed', userEmail: admin.email, userRole: 'admin' });
  for (const [type, amount, category] of [['income', 1000, 'Renda'], ['expense', 200, 'IMI']]) {
    submit(`${type}Form`, { [`${type}Property`]: property.id, [`${type}Category`]: category,
      [`${type}Amount`]: amount, [`${type}Date`]: '2026-01-02', [`${type}Notes`]: 'Test' });
  }
  assert.ok(read(DATA).transactions.every(transaction => transaction.createdBy === 'Renamed'));
  const income = read(DATA).transactions.find(transaction => transaction.type === 'income');
  action('incomeList', 'edit', income.id).click();
  submit('incomeForm', { incomeAmount: 1100 });
  assert.equal(read(DATA).transactions.find(transaction => transaction.id === income.id).updatedBy, 'Renamed');
  $('summaryYear').value = 2026;
  $('summaryYear').dispatchEvent(new w.Event('input'));
  const euro = value => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  assert.equal($('summaryTable').querySelector('tfoot tr.result-row th:last-child').textContent.trim(), euro(900));
  assert.equal($('summaryTable').querySelectorAll('.summary-total').length, 3);
  $('summaryYear').value = 2025;
  $('summaryYear').dispatchEvent(new w.Event('input'));
  assert.equal($('summaryTable').querySelector('tfoot tr.result-row th:last-child').textContent.trim(), euro(0));
  action('incomeList', 'delete', income.id).click();
  assert.equal(read(DATA).transactions.length, 1);
  submit('userForm', { userId: '', userName: 'New', userEmail: 'new@example.test', userPassword: 'pass', userRole: 'user' });
  const added = read(DATA).users.find(user => user.name === 'New');
  action('userList', 'delete', added.id).click();
  assert.equal(read(DATA).users.length, 2);
  action('propertyList', 'delete', property.id).click();
  assert.equal(read(DATA).properties.length, 0);
  assert.equal(read(DATA).transactions.length, 0);
});

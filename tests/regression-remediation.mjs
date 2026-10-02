import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const robots=fs.readFileSync('robots.txt','utf8');
const gitignore=fs.readFileSync('.gitignore','utf8');
const headers=fs.readFileSync('_headers','utf8');
const security=fs.readFileSync('.well-known/security.txt','utf8');

// Syntax regression: app.js must remain valid JavaScript.
new Function(app);

// Tester 01: UK monitoring view must include constituent-nation signals.
assert.match(app,/if\(geography==='UK'\)return \['UK','England','Wales','Scotland','Northern Ireland','international'\]\.includes\(scope\)/);

// Tester 01: UK geographic detail must aggregate England/Wales/Scotland flood items.
assert.match(app,/const selectedFlood=selected==='UK'\?\[\.\.\.\(d\.england\?\.items\|\|\[\]\),\.\.\.\(d\.wales\?\.items\|\|\[\]\),\.\.\.\(d\.scotland\?\.items\|\|\[\]\)\]/);

// Tester 01: UK-focused totals must include constituent-nation flood items.
assert.match(app,/const flood=focus==='UK'\?\[\.\.\.\(d\.england\?\.items\|\|\[\]\)\.map/);

// Tester 01: monitoring preferences are user settings, not a permanent dashboard card.
for (const id of ['monitoring-settings-dialog','open-monitoring-settings','close-monitoring-settings','save-monitoring-preferences']) assert.match(html,new RegExp('id="'+id+'"'));
assert.match(html,/settings-header-actions/);
assert.match(app,/setDefaultFocus\(geography==='all'\?'UK':geography\)/);
assert.match(app,/async function saveMonitoringPreferences\(\)/);
assert.match(app,/await load\(\)/);

// Tester 01: history may use short-lived caching; current data remains no-store.
assert.match(app,/fetch\('data\/history\.json',\{cache:'default'\}\)/);
assert.match(app,/fetch\('data\/current\.json',\{cache:'no-store'\}\)/);
assert.match(headers,/\/data\/history\.json/);
assert.match(headers,/max-age=300/);

// Security regression.
assert.doesNotMatch(robots,/\/worker\/|\/mailer\/|\/postmark\/|\/\.git\/|\/\.aws\//);
assert.match(gitignore,/\.aws\//);
assert.match(security,/^Contact: https:\/\/github\.com\/aeynon-dot\/UK-Resilience-Dashboard\/security\/advisories\/new/m);

console.log('Regression remediation checks: PASS');

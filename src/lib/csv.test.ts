import assert from 'node:assert/strict';
import test from 'node:test';
import { csvCell } from './csv-cell';
import { projectsCsv } from './csv';
import { gaaCsv } from './gaa';
import type { ScopedProject } from './scope';
import type { GaaRow } from './gaa';

test('CSV encoder neutralizes formula-like text and leading whitespace tricks', () => {
  const dangerous = ['=1+1', '+SUM(1,2)', '-cmd', '@HYPERLINK()', '   =1+1', '\t=1+1', '\n=1+1', '\r=1+1', '\uFEFF=1+1'];
  for (const value of dangerous) {
    const encoded = csvCell(value);
    assert.ok(encoded.startsWith('"\''), JSON.stringify({ value, encoded }));
    assert.ok(encoded.endsWith('"'));
    assert.ok(encoded.includes(value));
  }
});

test('CSV encoder preserves safe text, numeric amounts, and conventional escaping', () => {
  assert.equal(csvCell('Sorsogon Province'), 'Sorsogon Province');
  assert.equal(csvCell('  Safe name'), '  Safe name');
  assert.equal(csvCell(2354488000), '2354488000');
  assert.equal(csvCell(-125), '-125');
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(undefined), '');
  assert.equal(csvCell('A "quoted", name'), '"A ""quoted"", name"');
  assert.equal(csvCell('Line 1\nLine 2'), '"Line 1\nLine 2"');
});

test('FY2027 project CSV neutralizes untrusted titles and preserves amounts', () => {
  const project = {
    dataset: 'dpwh',
    id: 'example',
    title: '=HYPERLINK("https://example.org")',
    program: 'Safe program',
    pap: '@SUM(1,2)',
    office: 'Sorsogon District Engineering Office',
    region: 'V',
    status_label: 'In House bill',
    bridge_group: 'added',
    held: false,
    nep_php: 120,
    house_php: 250,
    delta_php: 130,
    pdf_url: { nep: 'https://example.org/nep.pdf', hgab3: 'https://example.org/hb.pdf' },
    reasons: [{ kind: 'place', label: 'Sorsogon' }],
    url: 'https://example.org/project',
  } as unknown as ScopedProject;
  const csv = projectsCsv([project]);
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.org"")"'));
  assert.ok(csv.includes('"\'@SUM(1,2)"'));
  assert.ok(csv.includes(',120,250,130,'));
  assert.ok(csv.startsWith('program,id,title,'));
});

test('GAA CSV neutralizes untrusted fields without altering appropriation amounts', () => {
  const row = {
    department: 'Department of Example (=DEPT)',
    agency_id: '=unsafe-id',
    name: '+SUM(1,2)',
    years: { '2026': { amount: 123456 } },
    reasons: ['Sorsogon'],
    fam_key: '@unsafe-family-key',
  } as unknown as GaaRow;
  const csv = gaaCsv([row]);
  assert.ok(csv.includes('"\'=unsafe-id"'));
  assert.ok(csv.includes('"\'+SUM(1,2)"'));
  assert.ok(csv.includes('123456'));
  assert.ok(csv.includes('"\'@unsafe-family-key"'));
  assert.ok(csv.startsWith('department,agency_id,name,'));
});

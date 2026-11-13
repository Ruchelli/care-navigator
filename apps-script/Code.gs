/** @OnlyCurrentDoc */
/**
 * Care Navigator pilot: receiver for experiment cards 1 and 2.
 * 1. In the Google Sheet: Extensions > Apps Script. Delete everything in the editor, paste this file, save.
 * 2. Run the function "setup" once (pick it in the toolbar, press Run, allow access).
 *    It creates the Responses and Experiments tabs.
 * 3. Deploy > New deployment > type: Web app. Execute as: Me. Who has access: Anyone. Deploy.
 *    Copy the web app URL into CONFIG.ENDPOINT in index.html.
 * Later edits: Deploy > Manage deployments > pencil > Version: New version > Deploy (the URL stays the same).
 */
const SHEET_NAME = 'Responses';
// Column order of the Responses tab. Add new columns only at the end.
const FIELDS = ['session_id', 'started_at', 'updated_at', 'last_step', 'step_name', 'test', 'source', 'ref_in', 'ref_code', 'mobile',
  'price_variant', 'consent_variant',
  'in_nyc', 'has_child', 'employer_ins', 'eligible',
  'clicked_reserve', 'reserved', 'reserved_at', 'email', 'later_list',
  'records_choice', 'consent_given', 'questions_after_connect',
  'child_age', 'last_checkup', 'vaccines', 'insurer', 'book_for_me', 'questions_done', 'shared',
  'plan_sent', 'tapped_book_it'];
// Filled by the team by hand with "yes" (plan emailed, "Book it for me" tapped in the plan email). Never overwritten by the page.
const TEAM_FIELDS = { plan_sent: true, tapped_book_it: true };
const NUMERIC = { last_step: true };

function clean_(key, value) {
  if (value === undefined || value === null) return '';
  if (NUMERIC[key]) { const n = Number(value); return isFinite(n) ? n : ''; }
  const s = String(value).slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;   // stored as text, never as a formula
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const id = String(data.session_id || '').replace(/[^a-z0-9]/gi, '').slice(0, 32);
    if (!id) return json_({ ok: false, error: 'missing session_id' });
    data.session_id = id;
    data.updated_at = new Date().toISOString();
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    const row = FIELDS.map(function (f) { return TEAM_FIELDS[f] ? '' : clean_(f, data[f]); });
    const found = sheet.getRange('A2:A').createTextFinder(id).matchEntireCell(true).findNext();
    if (found) {
      const r = found.getRow();
      const old = sheet.getRange(r, 1, 1, FIELDS.length).getValues()[0];
      FIELDS.forEach(function (f, i) {
        if (TEAM_FIELDS[f] || (row[i] === '' && old[i] !== '')) row[i] = old[i];   // never erase what was saved
      });
      row[1] = old[1] || row[1];                                                      // first start time
      if (Number(old[3]) > Number(row[3])) row[3] = old[3];                           // furthest step
      sheet.getRange(r, 1, 1, FIELDS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return json_({ ok: true }); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor. Creates the tabs, headers and the live results table. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.getRange(1, 1, 1, FIELDS.length).setValues([FIELDS]).setFontWeight('bold');
  sh.setFrozenRows(1);

  let ex = ss.getSheetByName('Experiments') || ss.insertSheet('Experiments');
  ex.clear();
  const col = function (f) { return 'Responses!$' + colLetter_(FIELDS.indexOf(f) + 1) + ':$' + colLetter_(FIELDS.indexOf(f) + 1); };
  const notTest = col('test') + ',"<>yes"';
  const rows = [
    ['CARD 1 · Families reserve a spot (hypothesis #20, also #26)', '', '', ''],
    ['', 'Free through employer', '$12 / month', 'Total'],
    ['Eligible visitors',
      '=COUNTIFS(' + col('price_variant') + ',"free",' + col('eligible') + ',"yes",' + notTest + ')',
      '=COUNTIFS(' + col('price_variant') + ',"12",' + col('eligible') + ',"yes",' + notTest + ')', '=B3+C3'],
    ['Reserved a spot',
      '=COUNTIFS(' + col('price_variant') + ',"free",' + col('reserved') + ',"yes",' + notTest + ')',
      '=COUNTIFS(' + col('price_variant') + ',"12",' + col('reserved') + ',"yes",' + notTest + ')', '=B4+C4'],
    ['Reservation rate', '=IFERROR(B4/B3,"")', '=IFERROR(C4/C3,"")', '=IFERROR(D4/D3,"")'],
    ['Threshold', 'Holds if free ≥ 30%; breaks if < 15%', '$12 ≥ one third of free rate', ''],
    ['', '', '', ''],
    ['CARD 2 · Parents connect records (hypothesis #9)', '', '', ''],
    ['', 'Plain consent', 'Detailed consent', 'Total'],
    ['Reached the records step',
      '=COUNTIFS(' + col('consent_variant') + ',"plain",' + col('reserved') + ',"yes",' + notTest + ')',
      '=COUNTIFS(' + col('consent_variant') + ',"detailed",' + col('reserved') + ',"yes",' + notTest + ')', '=B10+C10'],
    ['Chose "Connect" and allowed',
      '=COUNTIFS(' + col('consent_variant') + ',"plain",' + col('consent_given') + ',"yes",' + notTest + ')',
      '=COUNTIFS(' + col('consent_variant') + ',"detailed",' + col('consent_given') + ',"yes",' + notTest + ')', '=B11+C11'],
    ['Connect rate', '=IFERROR(B11/B10,"")', '=IFERROR(C11/C10,"")', '=IFERROR(D11/D10,"")'],
    ['Threshold', 'Holds if ≥ 60% in either; breaks if < 40% in both', '', ''],
    ['', '', '', ''],
    ['ALSO COUNTED', '', '', ''],
    ['Visitors (all, not test)', '=COUNTIFS(' + col('session_id') + ',"?*",' + notTest + ')-1', '', ''],
    ['Not eligible', '=COUNTIFS(' + col('eligible') + ',"no",' + notTest + ')', '', ''],
    ['Stopped at consent ("Not now") (#21)', '=COUNTIFS(' + col('consent_given') + ',"no",' + notTest + ')', '', ''],
    ['Want the agent to book (#8, words)', '=COUNTIFS(' + col('book_for_me') + ',"yes",' + notTest + ')', '', ''],
    ['Plans emailed (team fills)', '=COUNTIFS(' + col('plan_sent') + ',"yes",' + notTest + ')', '', ''],
    ['Tapped "Book it for me" in plan email (#8, behavior)', '=COUNTIFS(' + col('tapped_book_it') + ',"yes",' + notTest + ')', '', ''],
  ];
  ex.getRange(1, 1, rows.length, 4).setValues(rows);
  ex.getRangeList(['A1', 'A8', 'A15']).setFontWeight('bold');
  ex.getRangeList(['B2:D2', 'B9:D9']).setFontWeight('bold');
  ex.getRangeList(['B5:D5', 'B12:D12']).setNumberFormat('0%');
  ex.setColumnWidth(1, 330); ex.setColumnWidths(2, 3, 190);
}

function colLetter_(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

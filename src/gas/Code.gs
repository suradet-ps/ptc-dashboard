// ============================================================
// Code.gs — Google Apps Script Backend
// โรงพยาบาลสระโบสถ์ | PTC Dashboard API
//
// Deploy: Extensions → Apps Script → Deploy → Web app
//   Execute as: Me | Who has access: Anyone
// ============================================================

const SHEET_NAME = 'ActionProgress'
const HEADERS = ['id','status','progressPct','actualValue','notes','blockers','lastUpdated','updatedBy']

// ── Helpers ─────────────────────────────────────────────────
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.appendRow(HEADERS)
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#1B5E6E').setFontColor('#FFFFFF')
    // Pre-populate 12 action IDs with defaults
    const ids = ['R1A1','R1A2','R1A3','R1A4','R2A1','R2A2','R2A3','R2A4','R3A1','R3A2','R3A3','R3A4']
    ids.forEach(id => {
      sheet.appendRow([id, 'not_started', 0, '', '', '', '', ''])
    })
    sheet.setFrozenRows(1)
    sheet.autoResizeColumns(1, HEADERS.length)
  }
  return sheet
}

function buildCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }
}

function jsonResponse(data, code = 200) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data, code }))
    .setMimeType(ContentService.MimeType.JSON)
}

function errorResponse(msg, code = 400) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: msg, code }))
    .setMimeType(ContentService.MimeType.JSON)
}

function sheetToObjects(sheet) {
  const [headers, ...rows] = sheet.getDataRange().getValues()
  return rows.map(row => {
    const obj = {}
    headers.forEach((h, i) => obj[h] = row[i])
    return obj
  })
}

// ── GET ──────────────────────────────────────────────────────
function doGet(e) {
  try {
    const sheet = getOrCreateSheet()
    const rows = sheetToObjects(sheet)
    return jsonResponse(rows)
  } catch(err) {
    return errorResponse(err.message)
  }
}

// ── POST ─────────────────────────────────────────────────────
// รับ application/x-www-form-urlencoded เพื่อหลีกเลี่ยง CORS preflight
// body fields: action (string), payload (JSON string), payloads (JSON string)
function doPost(e) {
  try {
    const action = e.parameter.action

    if (action === 'update') {
      const payload = JSON.parse(e.parameter.payload)
      return handleUpdate(payload)
    }
    if (action === 'bulkUpdate') {
      const payloads = JSON.parse(e.parameter.payloads)
      return handleBulkUpdate(payloads)
    }
    return errorResponse('Unknown action')
  } catch(err) {
    return errorResponse(err.message)
  }
}

function handleUpdate(payload) {
  const sheet = getOrCreateSheet()
  const rows = sheet.getDataRange().getValues()
  const headers = rows[0]
  const idCol = headers.indexOf('id')

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === payload.id) {
      const now = new Date().toISOString()
      const updateMap = {
        status: payload.status,
        progressPct: payload.progressPct,
        actualValue: payload.actualValue,
        notes: payload.notes,
        blockers: payload.blockers,
        lastUpdated: now,
        updatedBy: payload.updatedBy || 'PTC'
      }
      headers.forEach((h, col) => {
        if (updateMap[h] !== undefined) {
          sheet.getRange(i + 1, col + 1).setValue(updateMap[h])
        }
      })
      return jsonResponse({ updated: payload.id, at: now })
    }
  }
  // If not found, append
  const now = new Date().toISOString()
  sheet.appendRow([
    payload.id, payload.status, payload.progressPct,
    payload.actualValue, payload.notes, payload.blockers,
    now, payload.updatedBy || 'PTC'
  ])
  return jsonResponse({ created: payload.id, at: now })
}

function handleBulkUpdate(payloads) {
  const results = payloads.map(p => {
    try { return handleUpdate(p) } catch(e) { return { error: e.message, id: p.id } }
  })
  return jsonResponse({ updated: results.length })
}

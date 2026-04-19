/**
 * Google Apps Script -- FBO Survey Data Collector
 *
 * HOW TO SET UP:
 * 1. Create a new Google Sheet (name it "FBO Survey Responses")
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Click Deploy > New Deployment
 * 5. Type: "Web app"
 * 6. Execute as: "Me"
 * 7. Who has access: "Anyone"
 * 8. Click Deploy, authorize when prompted
 * 9. Copy the Web App URL
 * 10. Paste the URL into survey/js/config.js as the dataEndpoint value
 *
 * Each survey submission is appended as a new row.
 * The first submission auto-creates the header row.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Flatten nested objects for spreadsheet storage
    var flat = flattenObject(data);

    // Create headers on first row if sheet is empty
    if (sheet.getLastRow() === 0) {
      var headers = Object.keys(flat);
      sheet.appendRow(headers);
    }

    // Get existing headers (to ensure consistent column order)
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Add any new keys as new columns
    var newKeys = Object.keys(flat).filter(function(k) {
      return headers.indexOf(k) === -1;
    });
    if (newKeys.length > 0) {
      for (var i = 0; i < newKeys.length; i++) {
        headers.push(newKeys[i]);
      }
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Build row in header order
    var row = headers.map(function(h) {
      var val = flat[h];
      if (val === undefined || val === null) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return val;
    });

    sheet.appendRow(row);

    // If Part 1 submission and participant passed comprehension,
    // add their Prolific PID to the participant group for Part 2 access.
    if (data.part === 1 && data.comprehensionFailed === false && data.prolificPID) {
      try {
        addToParticipantGroup(data.prolificPID);
      } catch (groupErr) {
        Logger.log("Prolific group error: " + groupErr.toString());
        // Don't fail the whole submission if group add fails
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      row: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("Error: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Flatten a nested object into dot-notation keys.
 * e.g., {a: {b: 1}} -> {"a.b": 1}
 * Arrays are JSON-stringified.
 */
function flattenObject(obj, prefix, result) {
  prefix = prefix || "";
  result = result || {};

  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    var fullKey = prefix ? prefix + "." + key : key;
    var val = obj[key];

    if (val === null || val === undefined) {
      result[fullKey] = "";
    } else if (Array.isArray(val)) {
      result[fullKey] = JSON.stringify(val);
    } else if (typeof val === "object" && !(val instanceof Date)) {
      flattenObject(val, fullKey, result);
    } else {
      result[fullKey] = val;
    }
  }

  return result;
}

// ── Prolific Participant Group Integration ──────────────────────────────
// When a participant passes Part 1, add them to a Prolific participant
// group so they become eligible for Part 2 (which uses the group as an
// allowlist filter).
//
// SETUP:
// 1. Go to Script Properties (Project Settings > Script Properties)
// 2. Add: PROLIFIC_API_TOKEN = your Prolific API token
// 3. Add: PROLIFIC_GROUP_ID = the participant group ID for Part 2 eligibility
//
// To create the participant group via Prolific API:
//   POST https://api.prolific.com/api/v1/participant-groups/
//   Body: { "name": "FBO Part 1 Passed" }
//   Save the returned "id" as PROLIFIC_GROUP_ID.

function addToParticipantGroup(prolificPID) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty("PROLIFIC_API_TOKEN");
  var groupId = props.getProperty("PROLIFIC_GROUP_ID");

  if (!token || !groupId) {
    Logger.log("Prolific credentials not configured. Skipping group add for PID: " + prolificPID);
    return;
  }

  var url = "https://api.prolific.com/api/v1/participant-groups/" + groupId + "/participants/";

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Token " + token
    },
    payload: JSON.stringify({
      participant_ids: [prolificPID]
    }),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();

  if (code >= 200 && code < 300) {
    Logger.log("Added PID " + prolificPID + " to group " + groupId);
  } else {
    Logger.log("Prolific API error (" + code + "): " + response.getContentText());
  }
}

/**
 * GET endpoint: returns survey data as JSON.
 *
 * Access control:
 *   - Requires ?token=<SHARED_SECRET> matching Script Property READ_TOKEN.
 *   - Without a valid token, returns a generic "active" ping.
 *
 * Query params:
 *   ?token=<SHARED_SECRET>   (required for data access)
 *   &format=json|csv         (default: json)
 *   &sheet=<sheetName>       (default: active sheet)
 *   &limit=<N>               (default: unlimited; most recent N rows)
 *
 * SETUP:
 *   In Project Settings > Script Properties, add:
 *     READ_TOKEN = <some long random string you choose>
 *   Then share that token with anyone who needs read access.
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var props  = PropertiesService.getScriptProperties();
  var expectedToken = props.getProperty("READ_TOKEN");

  // No token provided, or no token configured: return a health-check ping.
  if (!expectedToken || !params.token || params.token !== expectedToken) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      message: "FBO Survey data endpoint is active."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = params.sheet ? ss.getSheetByName(params.sheet) : ss.getActiveSheet();
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Sheet not found: " + params.sheet
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 1 || lastCol < 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "ok", rows: [], headers: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var values  = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = values[0];
    var dataRows = values.slice(1);

    var limit = parseInt(params.limit, 10);
    if (!isNaN(limit) && limit > 0 && dataRows.length > limit) {
      dataRows = dataRows.slice(dataRows.length - limit);
    }

    var format = (params.format || "json").toLowerCase();

    if (format === "csv") {
      var escCsv = function (v) {
        if (v === null || v === undefined) return "";
        var s = String(v);
        if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };
      var lines = [headers.map(escCsv).join(",")];
      for (var i = 0; i < dataRows.length; i++) {
        lines.push(dataRows[i].map(escCsv).join(","));
      }
      return ContentService.createTextOutput(lines.join("\n"))
        .setMimeType(ContentService.MimeType.CSV);
    }

    // Default: JSON
    var rows = dataRows.map(function (row) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j];
      }
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      sheet: sheet.getName(),
      n_rows: rows.length,
      headers: headers,
      rows: rows
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

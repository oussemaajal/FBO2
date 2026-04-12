/* ==========================================================================
   FBO Survey -- Data Persistence Module

   - Submits survey data as JSON to a Google Sheets Apps Script endpoint
   - Backs up progress to localStorage after each page
   - Retry logic on submission failure
   - Fallback: display raw data for manual recovery
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'fbo_survey_progress';

  // ── localStorage Backup ────────────────────────────────────────────────

  function saveProgress(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save progress to localStorage:', e);
    }
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Could not load progress from localStorage:', e);
      return null;
    }
  }

  function clearProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
  }

  // ── Data Submission ────────────────────────────────────────────────────

  function submit(data, endpointUrl, callback, maxRetries) {
    maxRetries = maxRetries || 3;
    var attempt = 0;

    function trySubmit() {
      attempt++;
      console.log('Submitting data (attempt ' + attempt + '/' + maxRetries + ')...');

      // For Google Apps Script, use no-cors mode since it redirects
      // We send as a form POST that the script can handle
      fetch(endpointUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(data)
      })
      .then(function () {
        // With no-cors, we get an opaque response (status 0)
        // but the request was sent. Treat as success.
        console.log('Data submitted successfully.');
        callback(true);
      })
      .catch(function (err) {
        console.warn('Submission attempt ' + attempt + ' failed:', err);
        if (attempt < maxRetries) {
          var delay = 2000 * attempt; // 2s, 4s, 6s
          console.log('Retrying in ' + (delay / 1000) + 's...');
          setTimeout(trySubmit, delay);
        } else {
          console.error('All submission attempts failed.');
          callback(false);
        }
      });
    }

    trySubmit();
  }

  // ── Expose globally ──
  window.DataStorage = {
    saveProgress: saveProgress,
    loadProgress: loadProgress,
    clearProgress: clearProgress,
    submit: submit
  };
})();

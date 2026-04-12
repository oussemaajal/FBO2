/* ==========================================================================
   FBO Survey -- Bot / AI Agent Detection Module

   Runs silently in the background. Never blocks the user.
   Collects behavioral metrics that are submitted with the survey data
   for post-hoc analysis and flagging.
   ========================================================================== */

(function () {
  'use strict';

  var metrics = {
    // Honeypot
    honeypotFilled: false,
    honeypotValue: '',

    // Invisible DOM instruction (AI detection)
    invisibleInstructionTriggered: false,
    aiVerifyValue: '',

    // Per-page stealth questions are tracked by engine.js (collectStealthAnswers)

    // Mouse
    mouseMovements: 0,
    mouseClicks: 0,
    mouseMovementsPerMinute: 0,
    mousePositions: [],          // sampled positions (every 500ms)

    // Keyboard
    keyboardEvents: 0,
    keystrokeIntervals: [],      // ms between keystrokes
    lastKeystrokeTime: 0,

    // Scroll
    scrollEvents: 0,

    // Focus / tab switching
    tabSwitches: 0,
    totalBlurTimeMs: 0,
    lastBlurTime: 0,

    // Copy-paste
    pasteEvents: [],

    // Timing
    trackingStartTime: 0,
    trackingDurationMs: 0,

    // Computed flags
    suspiciousFlags: []
  };

  var mouseSampleInterval = null;
  var currentMousePos = { x: 0, y: 0 };

  function startTracking() {
    metrics.trackingStartTime = Date.now();

    // ── Mouse movement ──
    document.addEventListener('mousemove', function (e) {
      metrics.mouseMovements++;
      currentMousePos = { x: e.clientX, y: e.clientY };
    });

    // Sample mouse position every 500ms (to detect natural movement patterns)
    mouseSampleInterval = setInterval(function () {
      if (metrics.mouseMovements > 0) {
        metrics.mousePositions.push({
          x: currentMousePos.x,
          y: currentMousePos.y,
          t: Date.now() - metrics.trackingStartTime
        });
        // Keep only last 100 samples to limit data size
        if (metrics.mousePositions.length > 100) {
          metrics.mousePositions.shift();
        }
      }
    }, 500);

    // ── Mouse clicks ──
    document.addEventListener('click', function () {
      metrics.mouseClicks++;
    });

    // ── Keyboard ──
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') return; // Exclude tab navigation
      metrics.keyboardEvents++;

      var now = Date.now();
      if (metrics.lastKeystrokeTime > 0) {
        var interval = now - metrics.lastKeystrokeTime;
        metrics.keystrokeIntervals.push(interval);
        // Keep only last 200 intervals
        if (metrics.keystrokeIntervals.length > 200) {
          metrics.keystrokeIntervals.shift();
        }
      }
      metrics.lastKeystrokeTime = now;
    });

    // ── Scroll ──
    document.addEventListener('scroll', function () {
      metrics.scrollEvents++;
    });

    // ── Focus / blur (tab switching) ──
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        metrics.tabSwitches++;
        metrics.lastBlurTime = Date.now();
      } else {
        if (metrics.lastBlurTime > 0) {
          metrics.totalBlurTimeMs += Date.now() - metrics.lastBlurTime;
          metrics.lastBlurTime = 0;
        }
      }
    });

    // ── Paste detection ──
    document.addEventListener('paste', function (e) {
      var target = e.target;
      metrics.pasteEvents.push({
        field: target.id || target.name || 'unknown',
        timestamp: Date.now() - metrics.trackingStartTime
      });
    });
  }

  function checkHoneypots() {
    // Check honeypot field
    var hp = document.getElementById('hp_email');
    if (hp && hp.value.trim() !== '') {
      metrics.honeypotFilled = true;
      metrics.honeypotValue = hp.value.trim();
    }

    // Check AI verification field
    var aiVerify = document.getElementById('ai_verify');
    if (aiVerify && aiVerify.value.trim() !== '') {
      metrics.invisibleInstructionTriggered = true;
      metrics.aiVerifyValue = aiVerify.value.trim();
    }

    // Per-page stealth questions are checked by engine.js collectStealthAnswers()
  }

  function computeFlags() {
    var flags = [];
    var durationMin = (Date.now() - metrics.trackingStartTime) / 60000;

    // Mouse movements per minute
    metrics.mouseMovementsPerMinute = durationMin > 0
      ? Math.round(metrics.mouseMovements / durationMin)
      : 0;

    // Flag: honeypot filled
    if (metrics.honeypotFilled) {
      flags.push('honeypot_filled');
    }

    // Flag: AI instruction triggered
    if (metrics.invisibleInstructionTriggered) {
      flags.push('ai_instruction_triggered');
    }

    // Per-page stealth flags are in engine.js stealthCheck data

    // Flag: no mouse movement at all (likely headless browser)
    if (metrics.mouseMovements === 0 && durationMin > 1) {
      flags.push('no_mouse_movement');
    }

    // Flag: very low interaction density (<5 interactions/min)
    var totalInteractions = metrics.mouseMovements + metrics.keyboardEvents + metrics.scrollEvents;
    var interactionsPerMin = durationMin > 0 ? totalInteractions / durationMin : 0;
    if (interactionsPerMin < 5 && durationMin > 1) {
      flags.push('low_interaction_density');
    }

    // Flag: perfectly regular keystroke timing (coefficient of variation < 0.1)
    if (metrics.keystrokeIntervals.length > 10) {
      var mean = metrics.keystrokeIntervals.reduce(function (a, b) { return a + b; }, 0) /
                 metrics.keystrokeIntervals.length;
      var variance = metrics.keystrokeIntervals.reduce(function (a, b) {
        return a + Math.pow(b - mean, 2);
      }, 0) / metrics.keystrokeIntervals.length;
      var cv = Math.sqrt(variance) / mean;
      if (cv < 0.1) {
        flags.push('regular_keystroke_timing');
      }
    }

    // Flag: excessive tab switching (>10 times)
    if (metrics.tabSwitches > 10) {
      flags.push('excessive_tab_switching');
    }

    // Flag: no keyboard events on any text/number inputs
    if (metrics.keyboardEvents === 0 && durationMin > 2) {
      flags.push('no_keyboard_events');
    }

    metrics.suspiciousFlags = flags;
    metrics.trackingDurationMs = Date.now() - metrics.trackingStartTime;

    return flags;
  }

  function getMetrics() {
    checkHoneypots();
    computeFlags();

    // Return a clean copy (strip sampled positions to reduce size if > 50)
    var result = {};
    for (var key in metrics) {
      if (key === 'mousePositions') {
        // Only include summary stats, not raw positions
        result.mousePositionSamples = metrics.mousePositions.length;
      } else if (key === 'keystrokeIntervals') {
        // Summary stats only
        var intervals = metrics.keystrokeIntervals;
        if (intervals.length > 0) {
          var sum = intervals.reduce(function (a, b) { return a + b; }, 0);
          result.keystrokeIntervalMean = Math.round(sum / intervals.length);
          result.keystrokeIntervalCount = intervals.length;
        } else {
          result.keystrokeIntervalMean = null;
          result.keystrokeIntervalCount = 0;
        }
      } else {
        result[key] = metrics[key];
      }
    }

    return result;
  }

  // ── Expose globally ──
  window.BotDetector = {
    startTracking: startTracking,
    getMetrics: getMetrics
  };
})();

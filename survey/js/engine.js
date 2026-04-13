/* ==========================================================================
   FBO 2 (Selection Neglect) Survey Engine
   Adapted from FBO engine.js -- Config-driven, generic survey framework
   ========================================================================== */

(function () {
  'use strict';

  // ── Utility: seeded PRNG (mulberry32) ──────────────────────────────────
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6d2b79f5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function seededShuffle(arr, seed) {
    var rng = mulberry32(seed);
    var shuffled = arr.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    return shuffled;
  }

  // ── Utility: simple HTML escaping ──────────────────────────────────────
  function esc(str) {
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // ── Scale & Format Condition Definitions ───────────────────────────────
  // 5 scale conditions x 3 format conditions = 15 cells
  var SCALE_CONDITIONS = [
    { name: 'small_low',   k: 3,   N: 10 },    // scaleIndex 0
    { name: 'small_high',  k: 3,   N: 100 },   // scaleIndex 1
    { name: 'small_vhigh', k: 3,   N: 1000 },  // scaleIndex 2
    { name: 'large_high',  k: 30,  N: 100 },    // scaleIndex 3
    { name: 'large_vhigh', k: 300, N: 1000 }    // scaleIndex 4
  ];

  var FORMAT_CONDITIONS = ['list', 'chart_disclosed', 'chart_full'];

  // ── SurveyEngine ───────────────────────────────────────────────────────
  function SurveyEngine(config) {
    this.config = config;
    this.pages = [];
    this.currentPageIndex = 0;
    this.responses = {};
    this.timing = {};
    this.trialResponses = {};    // trialId -> {fraudProb, confidence, huEstimate, ...}
    this.prolificPID = '';
    this.studyID = '';
    this.sessionID = '';

    // Condition assignment (set in init)
    this.cellIndex = 0;
    this.scaleIndex = 0;
    this.formatIndex = 0;
    this.scaleCondition = '';
    this.formatCondition = '';
    this.k = 0;
    this.N = 0;

    this.comprehensionAttempts = 0;
    this.comprehensionFailed = false;
    this.attentionResults = [];
    this.trialAttentionResults = [];
    this.bonusInfo = null;
    this.minTimeTimer = null;
    this.minTimeReady = true;
    this.submitted = false;
    this.blockBoundaryIndices = [];

    // DOM refs
    this.elContent = document.getElementById('pageContent');
    this.elNavButtons = document.getElementById('navButtons');
    this.elBtnNext = document.getElementById('btnNext');
    this.elBtnBack = document.getElementById('btnBack');
    this.elProgressContainer = document.getElementById('progressContainer');
    this.elProgressFill = document.getElementById('progressFill');
    this.elProgressLabel = document.getElementById('progressLabel');
    this.elMinTimeOverlay = document.getElementById('minTimeOverlay');
    this.elMinTimeCountdown = document.getElementById('minTimeCountdown');
  }

  // ── Init ───────────────────────────────────────────────────────────────
  SurveyEngine.prototype.init = function () {
    // Parse URL params (Prolific)
    var params = new URLSearchParams(window.location.search);
    var rawPID = params.get('PROLIFIC_PID') || params.get('prolific_pid') || '';
    this.devMode = params.get('dev') === 'true';
    // Validate Prolific PID: 24 hex chars (skip in dev mode)
    if (rawPID && (/^[0-9a-f]{24}$/i.test(rawPID) || this.devMode)) {
      this.prolificPID = rawPID;
    } else {
      this.prolificPID = '';
    }
    this.studyID = params.get('STUDY_ID') || params.get('study_id') || '';
    this.sessionID = params.get('SESSION_ID') || params.get('session_id') || '';
    this.part = parseInt(params.get('part')) || 0;  // 1 = instructions, 2 = trials, 0 = full

    // Select pages based on part
    if (this.part === 1 && this.config.part1Pages) {
      this.config.pages = this.config.part1Pages;
    } else if (this.part === 2 && this.config.part2Pages) {
      this.config.pages = this.config.part2Pages;
    }

    // Assign condition (15 cells)
    this.assignCondition(this.prolificPID);

    // Build page sequence
    this.buildPageSequence();

    // Check for saved progress
    if (window.DataStorage) {
      var saved = window.DataStorage.loadProgress();
      if (saved && saved.prolificPID === this.prolificPID && saved.currentPageIndex > 0) {
        if (confirm('It looks like you have saved progress. Would you like to resume where you left off?')) {
          this.responses = saved.responses || {};
          this.timing = saved.timing || {};
          this.trialResponses = saved.trialResponses || {};
          this.cellIndex = saved.cellIndex !== undefined ? saved.cellIndex : this.cellIndex;
          this.scaleIndex = saved.scaleIndex !== undefined ? saved.scaleIndex : this.scaleIndex;
          this.formatIndex = saved.formatIndex !== undefined ? saved.formatIndex : this.formatIndex;
          this.scaleCondition = saved.scaleCondition || this.scaleCondition;
          this.formatCondition = saved.formatCondition || this.formatCondition;
          this.k = saved.k || this.k;
          this.N = saved.N || this.N;
          this.comprehensionAttempts = saved.comprehensionAttempts || 0;
          this.attentionResults = saved.attentionResults || [];
          this.trialAttentionResults = saved.trialAttentionResults || [];
          this.currentPageIndex = saved.currentPageIndex;
        }
      }
    }

    // Start bot detector
    if (window.BotDetector) {
      window.BotDetector.startTracking();
    }

    // Wire up navigation
    var self = this;
    this.elBtnNext.addEventListener('click', function () { self.nextPage(); });
    this.elBtnBack.addEventListener('click', function () { self.prevPage(); });

    // Render first page
    this.renderPage(this.currentPageIndex);
  };

  // ── Condition Assignment (15 cells) ────────────────────────────────────
  // cellIndex = hash(PID) % 15
  // scaleIndex = floor(cellIndex / 3)  -> determines k, N
  // formatIndex = cellIndex % 3        -> determines display style
  SurveyEngine.prototype.assignCondition = function (pid) {
    if (!pid) {
      // Default to cell 0 if no PID
      this.cellIndex = 0;
    } else {
      this.cellIndex = hashString(pid) % 15;
    }

    this.scaleIndex = Math.floor(this.cellIndex / 3);
    this.formatIndex = this.cellIndex % 3;

    var scale = SCALE_CONDITIONS[this.scaleIndex];
    this.scaleCondition = scale.name;
    this.k = scale.k;
    this.N = scale.N;
    this.formatCondition = FORMAT_CONDITIONS[this.formatIndex];
    console.log('[FBO2] Assigned: cell=' + this.cellIndex + ' scale=' + this.scaleCondition + ' format=' + this.formatCondition);
  };

  // ── Build Page Sequence ────────────────────────────────────────────────
  SurveyEngine.prototype.buildPageSequence = function () {
    var self = this;
    this.pages = [];
    this.blockBoundaryIndices = [];

    (this.config.pages || []).forEach(function (page) {
      if (page.type === 'trial_block') {
        var block = page.block || 1;

        // Populate trials from stimuli.byScale based on assigned condition
        var rawTrials = page.trials;
        if (!rawTrials && self.config.stimuli && self.config.stimuli.byScale) {
          rawTrials = self.config.stimuli.byScale[self.scaleCondition] || [];
        }
        var trials = (rawTrials || []).slice();

        // For block 2: reuse block 1 trial order if available
        if (block === 2 && self.block1TrialOrder) {
          var orderMap = {};
          self.block1TrialOrder.forEach(function (id, idx) { orderMap[id] = idx; });
          trials.sort(function (a, b) { return (orderMap[a.id] !== undefined ? orderMap[a.id] : 999) - (orderMap[b.id] !== undefined ? orderMap[b.id] : 999); });
        } else if (self.prolificPID) {
          // Seeded random shuffle (deterministic per participant, same seed regardless of block)
          var baseSeed = hashString(self.prolificPID + '_trials');
          trials = seededShuffle(trials, baseSeed);
        }

        // Store block 1 trial order for block 2 to reuse
        if (block === 1) {
          self.block1TrialOrder = trials.map(function (t) { return t.id; });
        }

        // Read two-block DV flags from trial_block config
        var askHiddenHU = page.askHiddenHU || false;
        var askHiddenHUFirst = page.askHiddenHUFirst || false;

        // Record block boundary
        self.blockBoundaryIndices.push(self.pages.length);

        trials.forEach(function (trial, idx) {
          var idSuffix = (block === 2) ? '_b2' : '';
          // Trial intro splash page
          self.pages.push({
            id: trial.id + idSuffix + '_intro',
            type: 'trial_intro',
            trial: trial,
            trialIndex: idx,
            totalTrials: trials.length,
            block: block,
            askHiddenHU: askHiddenHU,
            minTimeSeconds: 3
          });
          // Fraud trial page
          self.pages.push({
            id: trial.id + idSuffix,
            type: 'fraud_trial',
            trial: trial,
            trialIndex: idx,
            totalTrials: trials.length,
            block: block,
            blockId: page.id,
            askHiddenHU: askHiddenHU,
            askHiddenHUFirst: askHiddenHUFirst,
            minTimeSeconds: page.minTimeSeconds || 15
          });
        });
      } else if (page.type === 'transition') {
        self.blockBoundaryIndices.push(self.pages.length);
        self.pages.push(page);
      } else {
        self.pages.push(page);
      }
    });

    // Insert trial attention checks
    this.insertTrialAttentionChecks();
  };

  // ── Trial Attention Check Insertion ──────────────────────────────────
  // Inserts recall-based attention checks after 3 seeded trial pages,
  // spread across thirds of the experiment.
  SurveyEngine.prototype.insertTrialAttentionChecks = function () {
    var numChecks = this.config.trialAttentionCount || 0;
    if (numChecks <= 0 || !this.prolificPID) return;

    // Find all fraud_trial page indices
    var trialIndices = [];
    for (var i = 0; i < this.pages.length; i++) {
      if (this.pages[i].type === 'fraud_trial') trialIndices.push(i);
    }
    if (trialIndices.length === 0) return;

    // Select one trial from each third (seeded by PID)
    var thirdSize = Math.floor(trialIndices.length / numChecks);
    var seed = hashString(this.prolificPID + '_attn_select');
    var rng = mulberry32(seed);
    var selected = [];
    for (var c = 0; c < numChecks; c++) {
      var start = c * thirdSize;
      var end = (c === numChecks - 1) ? trialIndices.length : (c + 1) * thirdSize;
      var pick = start + Math.floor(rng() * (end - start));
      selected.push(trialIndices[pick]);
    }

    // Insert in reverse order so splicing doesn't shift earlier indices
    selected.sort(function (a, b) { return b - a; });
    for (var s = 0; s < selected.length; s++) {
      var idx = selected[s];
      var trialPage = this.pages[idx];
      this.pages.splice(idx + 1, 0, {
        type: 'trial_attention',
        id: 'trial_attn_' + trialPage.trial.id,
        trial: trialPage.trial,
        block: trialPage.block,
        minTimeSeconds: 15
      });
    }

    // Recompute block boundary indices
    this.blockBoundaryIndices = [];
    var seenBlocks = {};
    for (var bi = 0; bi < this.pages.length; bi++) {
      var p = this.pages[bi];
      if (p.type === 'transition') {
        this.blockBoundaryIndices.push(bi);
      } else if (p.type === 'trial_intro' && !seenBlocks[p.block]) {
        seenBlocks[p.block] = true;
        this.blockBoundaryIndices.push(bi);
      }
    }
  };

  // ── Progress ───────────────────────────────────────────────────────────
  SurveyEngine.prototype.updateProgress = function () {
    var total = this.pages.length;
    var current = this.currentPageIndex;
    var pct = Math.round(((current) / total) * 100);
    this.elProgressFill.style.width = pct + '%';
    this.elProgressLabel.textContent = 'Page ' + (current + 1) + ' of ' + total;
    this.elProgressContainer.style.display = '';
  };

  // ── Page Rendering ─────────────────────────────────────────────────────
  SurveyEngine.prototype.renderPage = function (index) {
    var page = this.pages[index];
    if (!page) return;

    this.currentPageIndex = index;

    // Clear min-time state
    this.clearMinTime();
    this.minTimeReady = true;

    // Animate transition
    var self = this;
    this.elContent.classList.add('page-exit');
    setTimeout(function () {
      self.elContent.classList.remove('page-exit');

      var html = '';
      switch (page.type) {
        case 'welcome':         html = self.renderWelcome(page); break;
        case 'consent':         html = self.renderConsent(page); break;
        case 'instructions':    html = self.renderInstructions(page); break;
        case 'comprehension':   html = self.renderComprehension(page); break;
        case 'trial_intro':     html = self.renderTrialIntro(page); break;
        case 'fraud_trial':     html = self.renderFraudTrial(page); break;
        case 'transition':      html = self.renderTransition(page); break;
        case 'attention_check': html = self.renderAttentionCheck(page); break;
        case 'trial_attention': html = self.renderTrialAttention(page); break;
        case 'questionnaire':   html = self.renderQuestionnaire(page); break;
        case 'completion':      html = self.renderCompletion(page); break;
        case 'slider_tutorial': html = self.renderSliderTutorial(page); break;
        case 'debrief':         html = self.renderDebrief(page); break;
        default:                html = '<p>Unknown page type: ' + esc(page.type) + '</p>';
      }

      self.elContent.innerHTML = html;

      // Toggle wider wrapper for trial pages (two-column layout)
      var wrapper = document.querySelector('.survey-wrapper');
      if (wrapper) {
        if (page.type === 'fraud_trial') {
          wrapper.classList.add('trial-active');
        } else {
          wrapper.classList.remove('trial-active');
        }
      }

      // Inject stealth AI check
      self.injectStealthCheck(index);

      self.elContent.style.animation = 'none';
      void self.elContent.offsetHeight;
      self.elContent.style.animation = '';

      // Show/hide nav buttons
      var showNav = page.type !== 'debrief' && page.type !== 'completion';
      self.elNavButtons.style.display = showNav ? '' : 'none';

      // Back button visibility
      var atBoundary = self.blockBoundaryIndices.indexOf(index) !== -1;
      var noBack = index === 0 || page.type === 'welcome' || page.type === 'debrief'
                   || page.type === 'comprehension' || page.type === 'transition'
                   || page.type === 'trial_attention' || page.type === 'trial_intro'
                   || atBoundary;
      self.elBtnBack.style.display = noBack ? 'none' : '';

      // Next button text
      if (page.type === 'welcome') {
        self.elBtnNext.textContent = page.buttonText || 'Begin';
      } else if (page.type === 'transition') {
        self.elBtnNext.textContent = 'Continue';
      } else if (index === self.pages.length - 2) {
        self.elBtnNext.textContent = 'Submit';
      } else {
        self.elBtnNext.textContent = 'Next';
      }

      // Min time enforcement
      self.elBtnNext.disabled = false;
      if (page.minTimeSeconds && page.minTimeSeconds > 0) {
        self.enforceMinTime(page.minTimeSeconds);
      }

      // Update progress
      self.updateProgress();

      // Record page start time
      self.recordPageStart(index);

      // Attach click handlers
      self.attachOptionCardHandlers();
      self.attachConsentHandler();

      // Attach slider event listeners
      var sliders = document.querySelectorAll('input[type="range"]');
      sliders.forEach(function (slider) {
        var displayId = slider.getAttribute('data-display');
        var display = displayId ? document.getElementById(displayId) : null;
        if (display) {
          slider.addEventListener('input', function () {
            var val = parseFloat(slider.value);
            // Format: show integer for 0-100 sliders, one decimal for others
            if (parseFloat(slider.max) === 100 && parseFloat(slider.step) === 1) {
              display.textContent = Math.round(val) + '%';
            } else {
              display.textContent = val.toFixed(1);
            }
            slider.setAttribute('data-touched', 'true');
          });
        }
      });

      // Scroll to top
      window.scrollTo(0, 0);
    }, 200);
  };

  // ── Stealth AI Check ───────────────────────────────────────────────────
  SurveyEngine.prototype._stealthQuestions = [
    "What is 8 + 3?",
    "What color is the sky on a clear day?",
    "What planet do humans live on?",
    "How many legs does a dog have?",
    "What is the capital of France?",
    "What is 15 minus 7?",
    "How many days are in a week?",
    "What animal says meow?",
    "What is the boiling point of water in Celsius?",
    "In what year did World War II end?",
    "What is the square root of 64?",
    "What is 6 times 7?",
    "What language is spoken in Brazil?",
    "How many sides does a triangle have?",
    "What is the chemical symbol for water?",
    "Who painted the Mona Lisa?",
    "What is 100 divided by 5?",
    "What continent is Egypt in?"
  ];

  SurveyEngine.prototype.injectStealthCheck = function (pageIndex) {
    var questions = this._stealthQuestions;
    var q = questions[pageIndex % questions.length];
    var fieldId = 'sc_p' + pageIndex;
    var div = document.createElement('div');
    div.className = 'stealth-check';
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML = '<label for="' + fieldId + '">' + q + '</label>' +
                    '<input type="text" id="' + fieldId + '" name="' + fieldId + '" ' +
                    'tabindex="-1" autocomplete="off">';
    this.elContent.appendChild(div);
  };

  SurveyEngine.prototype.collectStealthAnswers = function () {
    var currentField = this.elContent.querySelector('.stealth-check input');
    if (currentField && currentField.value.trim() !== '') {
      if (!this._stealthAnswers) this._stealthAnswers = {};
      this._stealthAnswers['page_' + this.currentPageIndex] = currentField.value.trim();
    }
    return {
      answered: this._stealthAnswers && Object.keys(this._stealthAnswers).length > 0,
      values: this._stealthAnswers || {}
    };
  };

  // ── Consent Checkbox Handling ──────────────────────────────────────────
  SurveyEngine.prototype.attachConsentHandler = function () {
    var wrapper = document.getElementById('consent_wrapper');
    if (!wrapper) return;
    wrapper.addEventListener('click', function (e) {
      var cb = document.getElementById('consent_agree');
      if (e.target !== cb) {
        cb.checked = !cb.checked;
      }
    });
  };

  // ── Option Card Click Handling ─────────────────────────────────────────
  SurveyEngine.prototype.attachOptionCardHandlers = function () {
    var cards = document.querySelectorAll('.option-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var input = card.querySelector('input');
        if (!input) return;
        if (input.type === 'radio') {
          var name = input.name;
          document.querySelectorAll('input[name="' + name + '"]').forEach(function (r) {
            r.closest('.option-card').classList.remove('selected');
          });
          input.checked = true;
          card.classList.add('selected');
        } else if (input.type === 'checkbox') {
          input.checked = !input.checked;
          card.classList.toggle('selected', input.checked);
        }
      });
    });
  };

  // ── Timing ─────────────────────────────────────────────────────────────
  SurveyEngine.prototype.recordPageStart = function (index) {
    var page = this.pages[index];
    if (!this.timing[page.id]) {
      this.timing[page.id] = {};
    }
    this.timing[page.id].startTime = Date.now();
  };

  SurveyEngine.prototype.recordPageEnd = function (index) {
    var page = this.pages[index];
    var t = this.timing[page.id];
    if (t && t.startTime) {
      t.endTime = Date.now();
      t.durationMs = t.endTime - t.startTime;
    }
  };

  // ── Min Time Enforcement ───────────────────────────────────────────────
  SurveyEngine.prototype.enforceMinTime = function (seconds) {
    if (this.devMode) return;
    var self = this;
    this.minTimeReady = false;
    this.elBtnNext.disabled = true;

    var remaining = seconds;
    this.elMinTimeOverlay.style.display = '';
    this.elMinTimeCountdown.textContent = '(' + remaining + 's)';

    this.minTimeTimer = setInterval(function () {
      remaining--;
      if (remaining <= 0) {
        self.clearMinTime();
        self.minTimeReady = true;
        self.elBtnNext.disabled = false;
      } else {
        self.elMinTimeCountdown.textContent = '(' + remaining + 's)';
      }
    }, 1000);
  };

  SurveyEngine.prototype.clearMinTime = function () {
    if (this.minTimeTimer) {
      clearInterval(this.minTimeTimer);
      this.minTimeTimer = null;
    }
    this.elMinTimeOverlay.style.display = 'none';
  };

  // ── Navigation ─────────────────────────────────────────────────────────
  SurveyEngine.prototype.nextPage = function () {
    if (!this.devMode && !this.minTimeReady) return;

    var page = this.pages[this.currentPageIndex];

    // Special handling for comprehension
    if (!this.devMode && page.type === 'comprehension') {
      var passed = this.handleComprehensionCheck(page);
      if (!passed) return;
    }

    // Special handling for attention checks
    if (!this.devMode && page.type === 'attention_check') {
      this.handleAttentionCheck(page);
    }

    // Validate current page
    if (!this.devMode && !this.validatePage()) return;

    // Collect data from current page
    this.collectPageData(this.currentPageIndex);

    // Collect stealth AI check answers
    this.collectStealthAnswers();

    // Record timing
    this.recordPageEnd(this.currentPageIndex);

    // Save progress
    this.saveProgress();

    // If this is the last navigable page before debrief, calculate bonus
    var nextPage = this.pages[this.currentPageIndex + 1];
    if (nextPage && nextPage.type === 'debrief') {
      this.calculateBonus();
    }

    // Advance
    if (this.currentPageIndex < this.pages.length - 1) {
      this.renderPage(this.currentPageIndex + 1);
    }
  };

  SurveyEngine.prototype.prevPage = function () {
    if (this.currentPageIndex > 0) {
      if (this.blockBoundaryIndices.indexOf(this.currentPageIndex) !== -1) {
        return;
      }
      this.recordPageEnd(this.currentPageIndex);
      this.renderPage(this.currentPageIndex - 1);
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────
  SurveyEngine.prototype.validatePage = function () {
    this.clearErrors();
    var page = this.pages[this.currentPageIndex];
    var valid = true;

    // Consent page: must agree
    if (page.type === 'consent' && page.mustAgree) {
      var cb = document.getElementById('consent_agree');
      if (cb && !cb.checked) {
        this.showError('consent_agree', page.declineMessage || 'You must agree to participate.');
        valid = false;
      }
    }

    // Check all required fields on the page
    var required = document.querySelectorAll('#pageContent [data-required="true"]');
    for (var i = 0; i < required.length; i++) {
      var field = required[i];
      var name = field.getAttribute('data-field-name');
      if (!name) continue;

      if (field.getAttribute('data-field-type') === 'radio' || field.getAttribute('data-field-type') === 'likert') {
        var checked = document.querySelector('input[name="' + name + '"]:checked');
        if (!checked) {
          this.showError(name, 'Please select an option.');
          valid = false;
        }
      } else if (field.getAttribute('data-field-type') === 'number') {
        var input = document.getElementById(name);
        if (!input || input.value === '') {
          this.showError(name, 'Please enter a number.');
          valid = false;
        } else {
          var val = parseFloat(input.value);
          var min = parseFloat(input.getAttribute('min'));
          var max = parseFloat(input.getAttribute('max'));
          if (isNaN(val)) {
            this.showError(name, 'Please enter a valid number.');
            valid = false;
          } else if (!isNaN(min) && val < min) {
            this.showError(name, 'Value must be at least ' + min + '.');
            valid = false;
          } else if (!isNaN(max) && val > max) {
            this.showError(name, 'Value must be at most ' + max + '.');
            valid = false;
          }
        }
      } else if (field.getAttribute('data-field-type') === 'text') {
        var inp = document.getElementById(name);
        if (!inp || inp.value.trim() === '') {
          this.showError(name, 'Please provide a response.');
          valid = false;
        }
      } else if (field.getAttribute('data-field-type') === 'dropdown') {
        var sel = document.getElementById(name);
        if (!sel || sel.value === '') {
          this.showError(name, 'Please make a selection.');
          valid = false;
        }
      }
    }

    // Fraud trial page: require all three DVs
    if (page.type === 'fraud_trial') {
      // DV1: fraud probability slider
      var fraudSlider = document.getElementById('fraud_prob');
      if (fraudSlider && fraudSlider.getAttribute('data-touched') === 'false') {
        this.showError('fraud_prob', 'Please drag the slider to set your fraud probability estimate.');
        valid = false;
      }

      // DV2: confidence (radio)
      var confChecked = document.querySelector('input[name="confidence"]:checked');
      if (!confChecked) {
        this.showError('confidence', 'Please select your confidence level.');
        valid = false;
      }

      // DV3: HU estimate slider (only required if askHiddenHU is true)
      if (page.askHiddenHU) {
        var huSlider = document.getElementById('hu_estimate');
        if (huSlider && huSlider.getAttribute('data-touched') === 'false') {
          this.showError('hu_estimate', 'Please drag the slider to estimate the percentage of Highly Unusual transactions.');
          valid = false;
        }
      }
    }

    // Prolific PID fallback
    if (page.type === 'welcome' && !this.prolificPID) {
      var pidInput = document.getElementById('pid_fallback_input');
      if (pidInput && pidInput.value.trim()) {
        var pidVal = pidInput.value.trim();
        if (!/^[0-9a-f]{24}$/i.test(pidVal) && !this.devMode) {
          this.showError('pid_fallback_input', 'Please enter a valid Prolific ID (24-character alphanumeric code).');
          valid = false;
        } else {
          this.prolificPID = pidVal;
          this.assignCondition(this.prolificPID);
          var savedIndex = this.currentPageIndex;
          this.buildPageSequence();
          this.currentPageIndex = savedIndex;
        }
      } else if (pidInput) {
        this.showError('pid_fallback_input', 'Please enter your Prolific ID to continue.');
        valid = false;
      }
    }

    return valid;
  };

  SurveyEngine.prototype.showError = function (fieldName, message) {
    var errEl = document.getElementById('error_' + fieldName);
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add('visible');
    }
  };

  SurveyEngine.prototype.clearErrors = function () {
    var errors = document.querySelectorAll('.field-error');
    for (var i = 0; i < errors.length; i++) {
      errors[i].classList.remove('visible');
      errors[i].textContent = '';
    }
  };

  // ── Data Collection ────────────────────────────────────────────────────
  SurveyEngine.prototype.collectPageData = function (index) {
    var page = this.pages[index];
    var data = {};

    // Collect all inputs/selects on the page
    var inputs = document.querySelectorAll('#pageContent input, #pageContent select, #pageContent textarea');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      var name = el.name || el.id;
      if (!name || name.startsWith('hp_') || name.startsWith('ai_') || name.startsWith('sc_')) continue;

      if (el.type === 'radio') {
        if (el.checked) data[name] = el.value;
      } else if (el.type === 'checkbox') {
        data[name] = el.checked;
      } else {
        data[name] = el.value;
      }
    }

    // Store fraud trial response with full stimulus data
    if (page.type === 'fraud_trial' && page.trial) {
      var trial = page.trial;
      var fraudProb = document.getElementById('fraud_prob');
      var confChecked = document.querySelector('input[name="confidence"]:checked');
      var huEstimate = document.getElementById('hu_estimate');

      this.trialResponses[page.id] = {
        trialId: trial.id,
        block: page.block || 1,
        askHiddenHU: page.askHiddenHU || false,
        askHiddenHUFirst: page.askHiddenHUFirst || false,
        fraudProb: fraudProb ? parseFloat(fraudProb.value) : null,
        confidence: confChecked ? parseInt(confChecked.value) : null,
        huEstimate: huEstimate ? parseFloat(huEstimate.value) : null,
        k: trial.k,
        N: trial.N,
        nNormal: trial.nNormal,
        nUnusual: trial.nUnusual,
        nHU: trial.nHU,
        hidden: trial.N - trial.k,
        naivePosterior: trial.naivePosterior,
        bayesPosterior: trial.bayesPosterior,
        formatCondition: this.formatCondition,
        scaleCondition: this.scaleCondition
      };
    }

    // Store trial attention check results
    if (page.type === 'trial_attention' && page.trial) {
      var t = page.trial;
      var nAns = data['attn_n'] ? parseInt(data['attn_n']) : null;
      var kAns = data['attn_k'] ? parseInt(data['attn_k']) : null;
      var huAns = data['attn_hu'] ? parseInt(data['attn_hu']) : null;
      this.trialAttentionResults.push({
        trialId: t.id,
        block: page.block,
        nAnswer: nAns, nCorrect: nAns === t.N,
        kAnswer: kAns, kCorrect: kAns === t.k,
        huAnswer: huAns, huCorrect: huAns === t.nHU,
        allCorrect: nAns === t.N && kAns === t.k && huAns === t.nHU
      });
    }

    this.responses[page.id] = data;
  };

  SurveyEngine.prototype.getAllData = function () {
    var botMetrics = window.BotDetector ? window.BotDetector.getMetrics() : {};

    return {
      // Metadata
      surveyVersion: this.config.version || '1.0',
      surveyTitle: this.config.title || '',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,

      // Prolific
      prolificPID: this.prolificPID,
      studyID: this.studyID,
      sessionID: this.sessionID,
      part: this.part,

      // Condition assignment
      cellIndex: this.cellIndex,
      scaleIndex: this.scaleIndex,
      formatIndex: this.formatIndex,
      scaleCondition: this.scaleCondition,
      formatCondition: this.formatCondition,
      k: this.k,
      N: this.N,

      // Responses (all pages)
      responses: this.responses,

      // Trial responses (flat for easy analysis)
      trialResponses: this.trialResponses,

      // Timing
      timing: this.timing,

      // Comprehension
      comprehensionAttempts: this.comprehensionAttempts,
      comprehensionFailed: this.comprehensionFailed,

      // Attention checks (end-of-survey)
      attentionResults: this.attentionResults,
      attentionPassed: this.attentionResults.filter(function (r) { return r.passed; }).length,
      attentionFailed: this.attentionResults.filter(function (r) { return !r.passed; }).length,

      // Trial attention checks (recall after selected rounds)
      trialAttentionResults: this.trialAttentionResults,
      trialAttentionAllCorrect: this.trialAttentionResults.filter(function (r) { return r.allCorrect; }).length,

      // Bonus
      bonus: this.bonusInfo,

      // Bot detection
      botMetrics: botMetrics,

      // Stealth AI check
      stealthCheck: this.collectStealthAnswers()
    };
  };

  // ── Save Progress ──────────────────────────────────────────────────────
  SurveyEngine.prototype.saveProgress = function () {
    if (!window.DataStorage) return;
    window.DataStorage.saveProgress({
      prolificPID: this.prolificPID,
      cellIndex: this.cellIndex,
      scaleIndex: this.scaleIndex,
      formatIndex: this.formatIndex,
      scaleCondition: this.scaleCondition,
      formatCondition: this.formatCondition,
      k: this.k,
      N: this.N,
      currentPageIndex: this.currentPageIndex + 1,
      responses: this.responses,
      timing: this.timing,
      trialResponses: this.trialResponses,
      comprehensionAttempts: this.comprehensionAttempts,
      attentionResults: this.attentionResults,
      trialAttentionResults: this.trialAttentionResults
    });
  };

  // ── Comprehension Check ────────────────────────────────────────────────
  SurveyEngine.prototype.handleComprehensionCheck = function (page) {
    var questions = page.questions || [];
    var allCorrect = true;

    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var fieldId = 'comp_' + i;

      var answer;
      if (q.type === 'number') {
        var input = document.getElementById(fieldId);
        if (!input || input.value === '') {
          allCorrect = false;
          continue;
        }
        answer = parseFloat(input.value);
        var correct = parseFloat(q.correct);
        var tol = q.tolerance || 0.01;
        if (isNaN(answer) || Math.abs(answer - correct) > tol) {
          allCorrect = false;
        }
      } else if (q.type === 'radio') {
        var checked = document.querySelector('input[name="' + fieldId + '"]:checked');
        if (!checked) {
          allCorrect = false;
          continue;
        }
        answer = checked.value;
        if (answer !== q.correct) {
          allCorrect = false;
        }
      } else {
        allCorrect = false;
      }
    }

    // Check if any questions unanswered
    var anyUnanswered = false;
    for (var j = 0; j < questions.length; j++) {
      var fid = 'comp_' + j;
      if (questions[j].type === 'radio') {
        if (!document.querySelector('input[name="' + fid + '"]:checked')) {
          anyUnanswered = true;
          break;
        }
      } else if (questions[j].type === 'number') {
        var inp = document.getElementById(fid);
        if (!inp || inp.value === '') {
          anyUnanswered = true;
          break;
        }
      }
    }

    if (anyUnanswered) {
      var errEl = document.getElementById('comp_unanswered_error');
      if (!errEl) {
        var errDiv = document.createElement('div');
        errDiv.id = 'comp_unanswered_error';
        errDiv.className = 'alert alert-error';
        errDiv.innerHTML = '<strong>Please answer all questions</strong> before continuing.';
        this.elContent.appendChild(errDiv);
      }
      return false;
    }

    var oldErr = document.getElementById('comp_unanswered_error');
    if (oldErr) oldErr.remove();

    this.comprehensionAttempts++;

    // Build results page showing right/wrong
    var resultsHtml = '<h1 class="page-title">Quiz Results</h1>';

    for (var r = 0; r < questions.length; r++) {
      var rq = questions[r];
      var rFieldId = 'comp_' + r;
      var rAnswer;
      var rCorrect = false;

      if (rq.type === 'number') {
        var rInput = document.getElementById(rFieldId);
        rAnswer = rInput ? parseFloat(rInput.value) : NaN;
        var rExpected = parseFloat(rq.correct);
        var rTol = rq.tolerance || 0.01;
        rCorrect = !isNaN(rAnswer) && Math.abs(rAnswer - rExpected) <= rTol;
      } else if (rq.type === 'radio') {
        var rChecked = document.querySelector('input[name="' + rFieldId + '"]:checked');
        rAnswer = rChecked ? rChecked.value : '';
        rCorrect = rAnswer === rq.correct;
      }

      var icon = rCorrect ? '&#10003;' : '&#10007;';
      var cls = rCorrect ? 'comp-result-correct' : 'comp-result-wrong';
      resultsHtml += '<div class="comp-result-item ' + cls + '">';
      resultsHtml += '<span class="comp-result-icon">' + icon + '</span> ';
      resultsHtml += '<span class="comp-result-prompt">' + rq.prompt + '</span>';
      resultsHtml += '</div>';
    }

    if (allCorrect) {
      resultsHtml += '<div class="alert alert-success" style="margin-top:24px;">' +
        '<strong>All correct!</strong> You may continue.</div>';
    } else {
      resultsHtml += '<div class="alert alert-error" style="margin-top:24px;">' +
        '<p><strong>' + (page.failMessage || 'You did not pass the comprehension check. Thank you for your time.') + '</strong></p>' +
        '</div>';
    }

    this.elContent.innerHTML = resultsHtml;
    this.elNavButtons.style.display = 'none';

    if (allCorrect) {
      var self = this;
      setTimeout(function () {
        self.elNavButtons.style.display = '';
        var nextIdx = self.currentPageIndex + 1;
        self.renderPage(nextIdx);
      }, 2000);
    } else {
      this.comprehensionFailed = true;
      if (this.part === 1 && this.config.failCompletionCode) {
        var self2 = this;
        setTimeout(function () {
          self2.renderPart1Fail();
        }, 3000);
      }
    }

    return false;
  };

  // ── Attention Check ────────────────────────────────────────────────────
  SurveyEngine.prototype.handleAttentionCheck = function (page) {
    var checked = document.querySelector('input[name="attn_' + page.id + '"]:checked');
    var answer = checked ? checked.value : '';
    var passed = answer === page.correctAnswer;
    this.attentionResults.push({
      checkId: page.id,
      passed: passed,
      answer: answer,
      expected: page.correctAnswer
    });
  };

  // ── Bonus Calculation ──────────────────────────────────────────────────
  // Selects one random trial. Bonus = max(0, 1.50 - 3.00 * |fraudProb/100 - bayesPosterior|)
  // bayesPosterior is stored in each trial's stimulus data.
  SurveyEngine.prototype.calculateBonus = function () {
    var bonusCfg = this.config.bonus;
    if (!bonusCfg || !bonusCfg.enabled) {
      this.bonusInfo = { enabled: false };
      return;
    }

    var trialIds = Object.keys(this.trialResponses);
    if (trialIds.length === 0) {
      this.bonusInfo = { enabled: true, amount: 0, reason: 'no_trials' };
      return;
    }

    // Pick one trial at random (seeded by PID)
    var seed = hashString(this.prolificPID + '_bonus');
    var rng = mulberry32(seed);
    var selectedIdx = Math.floor(rng() * trialIds.length);
    var selectedId = trialIds[selectedIdx];
    var trial = this.trialResponses[selectedId];

    var guess = trial.fraudProb / 100;  // convert 0-100 to 0-1
    var truth = trial.bayesPosterior;   // already 0-1

    var baseAmount = bonusCfg.baseAmount || 1.50;
    var penalty = bonusCfg.penaltyMultiplier || 3.00;
    var floor = bonusCfg.floor || 0;

    var error = Math.abs(guess - truth);
    var amount = Math.max(floor, baseAmount - penalty * error);
    amount = Math.round(amount * 100) / 100;

    this.bonusInfo = {
      enabled: true,
      selectedTrialId: selectedId,
      fraudProb: trial.fraudProb,
      bayesPosterior: truth,
      errorPp: Math.round(error * 10000) / 100,  // error in percentage points
      amount: amount,
      currency: bonusCfg.currency || 'GBP'
    };
  };

  // ── Page Renderers ─────────────────────────────────────────────────────

  // Welcome
  SurveyEngine.prototype.renderWelcome = function (page) {
    var html = '';
    html += '<h1 class="page-title">' + (page.title || 'Welcome') + '</h1>';
    if (page.subtitle) html += '<p class="page-subtitle">' + page.subtitle + '</p>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';

    if (!this.prolificPID) {
      html += '<div class="pid-fallback">';
      html += '<label for="pid_fallback_input">Please enter your Prolific ID to continue:</label>';
      html += '<input type="text" class="text-input" id="pid_fallback_input" placeholder="e.g., 5f3c...">';
      html += '<div class="field-error" id="error_pid_fallback_input"></div>';
      html += '</div>';
    }

    return html;
  };

  // Consent
  SurveyEngine.prototype.renderConsent = function (page) {
    var html = '';
    html += '<h1 class="page-title">' + (page.title || 'Consent') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';
    if (page.mustAgree) {
      html += '<div class="consent-check" id="consent_wrapper">';
      html += '<input type="checkbox" id="consent_agree">';
      html += '<span>I have read and understood the information above, and I agree to participate in this study.</span>';
      html += '</div>';
      html += '<div class="field-error" id="error_consent_agree"></div>';
    }
    return html;
  };

  // Instructions
  SurveyEngine.prototype.renderInstructions = function (page) {
    var html = '';
    html += '<h1 class="page-title">' + (page.title || 'Instructions') + '</h1>';
    var body = page.body || '';
    // Template substitution for conditions
    body = body.replace(/\{scaleCondition\}/g, this.scaleCondition);
    body = body.replace(/\{formatCondition\}/g, this.formatCondition);
    body = body.replace(/\{k\}/g, this.k);
    body = body.replace(/\{N\}/g, this.N);
    body = body.replace(/\{hidden\}/g, this.N - this.k);
    // Conditional blocks: <!--if:name-->...<!--endif:name-->
    var fmt = this.formatCondition;
    body = body.replace(/<!--if:(\w+)-->([\s\S]*?)<!--endif:\1-->/g,
      function (match, cond, inner) {
        return cond === fmt ? inner : '';
      }
    );
    html += '<div class="page-body">' + body + '</div>';
    return html;
  };

  // Comprehension Check
  SurveyEngine.prototype.renderComprehension = function (page) {
    var html = '';
    html += '<h1 class="page-title">' + (page.title || 'Comprehension Check') + '</h1>';
    if (page.description) html += '<div class="page-body">' + page.description + '</div>';

    (page.questions || []).forEach(function (q, idx) {
      var fieldId = 'comp_' + idx;
      html += '<div class="question-block">';
      html += '<div class="question-prompt">' + q.prompt + '</div>';

      if (q.type === 'number') {
        html += '<div class="number-input-wrapper">';
        html += '<input type="number" class="number-input" id="' + fieldId + '" ';
        if (q.min !== undefined) html += 'min="' + q.min + '" ';
        if (q.max !== undefined) html += 'max="' + q.max + '" ';
        if (q.step !== undefined) html += 'step="' + q.step + '" ';
        html += 'placeholder="?">';
        html += '</div>';
        if (q.hint) html += '<div class="number-input-hint">' + q.hint + '</div>';
      } else if (q.type === 'radio') {
        html += '<div class="option-list">';
        (q.options || []).forEach(function (opt) {
          var val = typeof opt === 'object' ? opt.value : opt;
          var label = typeof opt === 'object' ? opt.label : opt;
          html += '<div class="option-card">';
          html += '<input type="radio" name="' + fieldId + '" value="' + esc(val) + '">';
          html += '<span class="option-label">' + esc(label) + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }

      html += '<div class="field-error" id="error_' + fieldId + '"></div>';
      html += '</div>';
    });

    html += '<div class="comp-note" style="margin-top:16px;color:#6b7280;font-size:15px;">' +
            'You have one attempt. All answers must be correct to continue.</div>';

    return html;
  };

  // ── Trial Intro (splash page before each fraud trial) ──────────────────
  SurveyEngine.prototype.renderTrialIntro = function (page) {
    var trial = page.trial;
    var html = '';

    var isBlock2 = page.block === 2;
    var firmLabel = 'Firm ' + (page.trialIndex + 1) + ' of ' + page.totalTrials;
    if (isBlock2) firmLabel += ' (second evaluation)';

    html += '<div class="trial-intro-splash">';
    html += '<div class="page-subtitle" style="margin-bottom:24px;">' + firmLabel + '</div>';
    html += '<div class="trial-intro-main">';
    html += '<div class="trial-intro-line" style="font-size:48px;font-weight:700;text-align:center;margin-bottom:24px;">' +
            'Firm ' + (page.trialIndex + 1) + '</div>';
    if (isBlock2) {
      html += '<div class="trial-intro-detail" style="font-size:22px;text-align:center;color:#4b5563;line-height:1.6;">' +
              'You evaluated this firm before.<br>Now think about what the manager <strong>chose not to show you</strong>.</div>';
    } else {
      html += '<div class="trial-intro-detail" style="font-size:22px;text-align:center;color:#4b5563;line-height:1.6;">' +
              'This firm has <strong>' + trial.N + '</strong> transactions.<br>' +
              'The manager will show you <strong>' + trial.k + '</strong>.</div>';
    }
    html += '</div>';
    html += '</div>';

    return html;
  };

  // ── Fraud Trial Renderer ───────────────────────────────────────────────
  // Renders the disclosed transaction breakdown in one of three formats,
  // plus three dependent variables (fraud prob, confidence, HU estimate).
  SurveyEngine.prototype.renderFraudTrial = function (page) {
    console.log('[FBO2] renderFraudTrial: formatCondition=' + this.formatCondition);
    var trial = page.trial;
    var hidden = trial.N - trial.k;
    var html = '';

    // ── Two-Column Layout: Reference Panel + Main Content ───────────────
    html += '<div class="trial-layout">';

    // LEFT: Reference Panel (always visible) with mini pie charts
    html += '<div class="reference-panel">';
    html += '<div class="reference-title">Reference Distributions</div>';

    // Non-fraud pie: 60% Normal, 30% Unusual, 10% HU
    html += '<div class="ref-pie-section">';
    html += '<div class="ref-pie-label">Non-Fraudulent Firm</div>';
    html += '<div class="ref-pie-row">';
    html += '<div class="ref-pie" style="background:conic-gradient(#4CAF50 0deg 216deg, #FF9800 216deg 324deg, #ef4444 324deg 360deg);"></div>';
    html += '<div class="ref-pie-legend">';
    html += '<div class="ref-legend-item"><span class="ref-swatch" style="background:#4CAF50;"></span><span>Normal 60%</span></div>';
    html += '<div class="ref-legend-item"><span class="ref-swatch" style="background:#FF9800;"></span><span>Unusual 30%</span></div>';
    html += '<div class="ref-legend-item"><span class="ref-swatch" style="background:#ef4444;"></span><span>HU 10%</span></div>';
    html += '</div>';
    html += '</div></div>';

    // Fraud pie: 40% Normal, 30% Unusual, 30% HU
    html += '<div class="ref-pie-section">';
    html += '<div class="ref-pie-label">Fraudulent Firm</div>';
    html += '<div class="ref-pie-row">';
    html += '<div class="ref-pie" style="background:conic-gradient(#4CAF50 0deg 144deg, #FF9800 144deg 252deg, #ef4444 252deg 360deg);"></div>';
    html += '<div class="ref-pie-legend">';
    html += '<div class="ref-legend-item"><span class="ref-swatch" style="background:#4CAF50;"></span><span>Normal 40%</span></div>';
    html += '<div class="ref-legend-item"><span class="ref-swatch" style="background:#FF9800;"></span><span>Unusual 30%</span></div>';
    html += '<div class="ref-legend-item"><span class="ref-swatch" style="background:#ef4444;"></span><span>HU 30%</span></div>';
    html += '</div>';
    html += '</div></div>';

    html += '<div class="reference-prior">Each firm has a <strong>50%</strong> prior chance of being fraudulent</div>';
    html += '</div>';

    // RIGHT: Main trial content
    html += '<div class="trial-main-content">';

    // ── Header Card ─────────────────────────────────────────────────────
    html += '<div class="trial-header-card">';
    html += '<div class="trial-header-firm">Firm ' + (page.trialIndex + 1) + ' of ' + page.totalTrials + '</div>';
    html += '<div class="trial-header-stats">';
    html += '<div class="trial-header-stat"><span class="trial-header-stat-label">Total transactions</span><span class="trial-header-stat-value">' + trial.N + '</span></div>';
    html += '<div class="trial-header-stat"><span class="trial-header-stat-label">Manager disclosed</span><span class="trial-header-stat-value">' + trial.k + ' of ' + trial.N + '</span></div>';
    html += '</div>';
    html += '</div>';

    // ── Stimulus Display (format-dependent) ─────────────────────────────
    html += '<div class="stimulus-display">';
    html += this.renderTransactionDisplay(trial);
    html += '</div>';

    // ── DV Section ──────────────────────────────────────────────────────

    // Helper: HU estimate slider HTML
    var huSliderHtml = '';
    huSliderHtml += '<div class="dv-card">';
    huSliderHtml += '<div class="question-prompt">Of the <strong>' + hidden +
            '</strong> transactions NOT shown to you, what percentage do you think are Highly Unusual?<span class="question-required">*</span></div>';
    huSliderHtml += '<div class="slider-value-display" id="hu_estimate_display">50%</div>';
    huSliderHtml += '<div class="slider-wrapper">';
    huSliderHtml += '<span class="slider-label">0%</span>';
    huSliderHtml += '<input type="range" class="slider-input" id="hu_estimate" name="hu_estimate" ' +
            'min="0" max="100" step="1" value="50" data-touched="false" data-display="hu_estimate_display">';
    huSliderHtml += '<span class="slider-label">100%</span>';
    huSliderHtml += '</div>';
    huSliderHtml += '<div class="slider-hint">Drag the slider to set your estimate</div>';
    huSliderHtml += '<div class="field-error" id="error_hu_estimate"></div>';
    huSliderHtml += '</div>';

    // If askHiddenHU and askHiddenHUFirst, show HU question BEFORE fraud prob
    if (page.askHiddenHU && page.askHiddenHUFirst) {
      html += huSliderHtml;
    }

    // DV1: Fraud Probability Slider (0-100) -- always shown
    html += '<div class="dv-card">';
    html += '<div class="question-prompt">What is the probability that this firm is fraudulent?<span class="question-required">*</span></div>';
    html += '<div class="slider-value-display" id="fraud_prob_display">50%</div>';
    html += '<div class="slider-wrapper">';
    html += '<span class="slider-label">0%</span>';
    html += '<input type="range" class="slider-input" id="fraud_prob" name="fraud_prob" ' +
            'min="0" max="100" step="1" value="50" data-touched="false" data-display="fraud_prob_display">';
    html += '<span class="slider-label">100%</span>';
    html += '</div>';
    html += '<div class="slider-hint">Drag the slider to set your estimate</div>';
    html += '<div class="field-error" id="error_fraud_prob"></div>';
    html += '</div>';

    // DV2: Confidence (1-7 Likert) -- always shown
    html += '<div class="dv-card" data-required="true" data-field-name="confidence" data-field-type="radio">';
    html += '<div class="question-prompt">How confident are you in your fraud assessment?<span class="question-required">*</span></div>';
    html += '<div class="option-list confidence-options">';
    var confLabels = [
      '1 - Not at all',
      '2 - Very slightly',
      '3 - Slightly',
      '4 - Moderately',
      '5 - Fairly',
      '6 - Very',
      '7 - Extremely confident'
    ];
    for (var ci = 0; ci < confLabels.length; ci++) {
      html += '<div class="option-card">';
      html += '<input type="radio" name="confidence" value="' + (ci + 1) + '">';
      html += '<span class="option-label">' + esc(confLabels[ci]) + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="field-error" id="error_confidence"></div>';
    html += '</div>';

    // If askHiddenHU but NOT first, show HU question AFTER confidence
    if (page.askHiddenHU && !page.askHiddenHUFirst) {
      html += huSliderHtml;
    }

    html += '</div>'; // end .trial-main-content
    html += '</div>'; // end .trial-layout

    return html;
  };

  // ── Transaction Display (format-dependent) ─────────────────────────────
  // Renders the disclosed transaction breakdown as list, chart_disclosed,
  // or chart_full depending on this.formatCondition.
  SurveyEngine.prototype.renderTransactionDisplay = function (trial) {
    var format = this.formatCondition;
    var hidden = trial.N - trial.k;
    console.log('[FBO2] Rendering format: ' + format + ' for trial ' + trial.id);

    if (format === 'list') {
      return this.renderListFormat(trial, hidden);
    } else if (format === 'chart_disclosed') {
      return this.renderChartDisclosed(trial, hidden);
    } else if (format === 'chart_full') {
      return this.renderChartFull(trial, hidden);
    }
    // fallback
    console.log('[FBO2] WARNING: format "' + format + '" not recognized, falling back to list');
    return this.renderListFormat(trial, hidden);
  };

  // ── Format: List ───────────────────────────────────────────────────────
  // Shows ONLY the disclosed transaction counts. No mention of undisclosed.
  // The undisclosed count is visible in the header card ("Manager disclosed k of N").
  SurveyEngine.prototype.renderListFormat = function (trial, hidden) {
    var html = '';
    html += '<div class="stimulus-title">Disclosed Transactions</div>';
    html += '<div class="disclosed-list">';
    html += '<div class="disclosed-list-item">';
    html += '<span class="type-dot" style="background:#4CAF50;"></span>';
    html += '<span class="disclosed-list-label">Normal</span>';
    html += '<span class="disclosed-list-count">' + trial.nNormal + '</span>';
    html += '</div>';
    html += '<div class="disclosed-list-item">';
    html += '<span class="type-dot" style="background:#FF9800;"></span>';
    html += '<span class="disclosed-list-label">Unusual</span>';
    html += '<span class="disclosed-list-count">' + trial.nUnusual + '</span>';
    html += '</div>';
    html += '<div class="disclosed-list-item">';
    html += '<span class="type-dot" style="background:#ef4444;"></span>';
    html += '<span class="disclosed-list-label">Highly Unusual</span>';
    html += '<span class="disclosed-list-count">' + trial.nHU + '</span>';
    html += '</div>';
    html += '</div>';
    return html;
  };

  // ── Format: Chart (disclosed only) ─────────────────────────────────────
  // Pie shows proportions of disclosed (k) only. Text note about undisclosed below.
  SurveyEngine.prototype.renderChartDisclosed = function (trial, hidden) {
    var html = '';
    html += '<div class="stimulus-title">Disclosed Transactions</div>';
    html += '<div class="pie-chart-section">';
    html += this.renderPieChart(trial, false);
    html += '</div>';
    html += '<div class="pie-undisclosed-note">' + hidden + ' transactions were not disclosed to you.</div>';
    return html;
  };

  // ── Format: Chart (full with undisclosed segment) ──────────────────────
  // Pie shows proportions of all N transactions. Gray segment = undisclosed.
  SurveyEngine.prototype.renderChartFull = function (trial, hidden) {
    var html = '';
    html += '<div class="stimulus-title">All Transactions</div>';
    html += '<div class="pie-chart-section">';
    html += this.renderPieChart(trial, true);
    html += '</div>';
    return html;
  };

  // ── Pie Chart Builder (CSS conic-gradient with legend) ─────────────────
  // Creates a pie chart using conic-gradient.
  // If showUndisclosed=true, includes a gray segment for hidden transactions.
  // For chart_disclosed: pie shows proportions of disclosed transactions only.
  // For chart_full: pie shows all transactions including undisclosed.
  SurveyEngine.prototype.renderPieChart = function (trial, showUndisclosed) {
    var hidden = trial.N - trial.k;

    // Build data segments
    var segments = [
      { label: 'Normal',           count: trial.nNormal,  color: '#4CAF50' },
      { label: 'Unusual',          count: trial.nUnusual, color: '#FF9800' },
      { label: 'Highly Unusual',   count: trial.nHU,      color: '#ef4444' }
    ];
    if (showUndisclosed) {
      segments.push({ label: 'Undisclosed', count: hidden, color: '#9CA3AF' });
    }

    // Total for percentage calculation
    var total = 0;
    for (var i = 0; i < segments.length; i++) {
      total += segments[i].count;
    }
    if (total === 0) total = 1; // avoid division by zero

    // Calculate degrees and percentages
    var cumDeg = 0;
    var gradientParts = [];
    for (var s = 0; s < segments.length; s++) {
      var seg = segments[s];
      var pct = seg.count / total;
      var deg = pct * 360;
      seg.pct = pct;
      seg.startDeg = cumDeg;
      seg.endDeg = cumDeg + deg;

      if (deg > 0) {
        gradientParts.push(seg.color + ' ' + cumDeg.toFixed(2) + 'deg ' + seg.endDeg.toFixed(2) + 'deg');
      }
      cumDeg = seg.endDeg;
    }

    // Build conic-gradient string
    var gradient = 'conic-gradient(' + gradientParts.join(', ') + ')';

    // Handle the case where all segments are zero except one (or all zero)
    if (gradientParts.length === 0) {
      gradient = 'conic-gradient(#e5e7eb 0deg 360deg)';
    }

    var html = '';
    html += '<div class="pie-chart-container">';

    // Pie chart circle (220px, set via CSS class .pie-chart)
    html += '<div class="pie-chart" style="background: ' + gradient + ';"></div>';

    // Legend (vertically stacked to right of pie)
    html += '<div class="pie-legend">';
    for (var li = 0; li < segments.length; li++) {
      var item = segments[li];
      if (item.count === 0) continue; // skip zero-count segments in legend
      var pctDisplay = Math.round(item.pct * 100);
      html += '<div class="pie-legend-item">';
      html += '<div class="pie-legend-swatch" style="background: ' + item.color + ';"></div>';
      html += '<div class="pie-legend-text">';
      html += '<span class="pie-legend-label">' + esc(item.label) + '</span>';
      html += '<span class="pie-legend-value">' + item.count + ' (' + pctDisplay + '%)</span>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    html += '</div>'; // end .pie-chart-container

    return html;
  };

  // Transition page
  SurveyEngine.prototype.renderTransition = function (page) {
    var html = '';
    html += '<h1 class="page-title">' + (page.title || 'Next Part') + '</h1>';
    var body = page.body || '';
    var fmt = this.formatCondition;
    body = body.replace(/<!--if:(\w+)-->([\s\S]*?)<!--endif:\1-->/g,
      function (match, cond, inner) {
        return cond === fmt ? inner : '';
      }
    );
    html += '<div class="page-body">' + body + '</div>';
    return html;
  };

  // Attention Check
  SurveyEngine.prototype.renderAttentionCheck = function (page) {
    var html = '';
    html += '<div class="question-block">';
    html += '<div class="question-prompt">' + (page.question || '') + '</div>';
    if (page.description) html += '<div class="question-description">' + page.description + '</div>';

    html += '<div class="option-list">';
    var name = 'attn_' + page.id;
    (page.options || []).forEach(function (opt) {
      var val = typeof opt === 'object' ? opt.value : opt;
      var label = typeof opt === 'object' ? opt.label : opt;
      html += '<div class="option-card">';
      html += '<input type="radio" name="' + name + '" value="' + esc(val) + '">';
      html += '<span class="option-label">' + esc(label) + '</span>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div class="field-error" id="error_' + name + '"></div>';
    html += '</div>';
    return html;
  };

  // ── Trial Attention Check (recall questions after selected trials) ─────
  SurveyEngine.prototype.renderTrialAttention = function (page) {
    var trial = page.trial;
    var html = '';

    html += '<h1 class="page-title">Attention Check</h1>';
    html += '<p>Please answer these questions about the firm you just evaluated.</p>';

    // Q1: How many total transactions did this firm have?
    // Build plausible options around the true N
    var nOptions = this.buildAttentionOptions(trial.N, [10, 100, 1000]);
    html += '<div class="question-block" data-required="true" data-field-name="attn_n" data-field-type="radio">';
    html += '<div class="question-prompt">How many total transactions did this firm have?</div>';
    html += '<div class="option-list">';
    nOptions.forEach(function (n) {
      html += '<div class="option-card">';
      html += '<input type="radio" name="attn_n" value="' + n + '">';
      html += '<span class="option-label">' + n + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="field-error" id="error_attn_n"></div>';
    html += '</div>';

    // Q2: How many transactions did the manager show you?
    var kOptions = this.buildAttentionOptions(trial.k, [3, 30, 300]);
    html += '<div class="question-block" data-required="true" data-field-name="attn_k" data-field-type="radio">';
    html += '<div class="question-prompt">How many transactions did the manager show you?</div>';
    html += '<div class="option-list">';
    kOptions.forEach(function (k) {
      html += '<div class="option-card">';
      html += '<input type="radio" name="attn_k" value="' + k + '">';
      html += '<span class="option-label">' + k + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="field-error" id="error_attn_k"></div>';
    html += '</div>';

    // Q3: How many Highly Unusual transactions were in the disclosed set?
    html += '<div class="question-block" data-required="true" data-field-name="attn_hu" data-field-type="number">';
    html += '<div class="question-prompt">How many Highly Unusual transactions were in the disclosed set?</div>';
    html += '<div class="number-input-wrapper">';
    html += '<input type="number" class="number-input" id="attn_hu" name="attn_hu" min="0" max="' + trial.k + '" step="1" placeholder="?">';
    html += '</div>';
    html += '<div class="field-error" id="error_attn_hu"></div>';
    html += '</div>';

    return html;
  };

  // Build plausible distractor options for attention checks.
  // Returns an array of 4 options containing the correct answer plus 3 distractors,
  // shuffled deterministically.
  SurveyEngine.prototype.buildAttentionOptions = function (correctValue, allPossible) {
    // Start with all possible values from the design
    var options = [correctValue];
    for (var i = 0; i < allPossible.length; i++) {
      if (allPossible[i] !== correctValue && options.length < 4) {
        options.push(allPossible[i]);
      }
    }
    // If we don't have 4 options, add nearby values
    var multipliers = [0.5, 2, 0.1, 10, 0.25, 5];
    for (var m = 0; m < multipliers.length && options.length < 4; m++) {
      var candidate = Math.round(correctValue * multipliers[m]);
      if (candidate > 0 && options.indexOf(candidate) === -1) {
        options.push(candidate);
      }
    }
    // Sort numerically
    options.sort(function (a, b) { return a - b; });
    return options;
  };

  // Questionnaire (generic questions page)
  SurveyEngine.prototype.renderQuestionnaire = function (page) {
    var html = '';
    if (page.title) html += '<h1 class="page-title">' + page.title + '</h1>';
    if (page.description) html += '<div class="page-body">' + page.description + '</div>';

    var self = this;
    (page.questions || []).forEach(function (q) {
      html += self.renderQuestion(q);
    });

    return html;
  };

  // Generic question renderer
  SurveyEngine.prototype.renderQuestion = function (q) {
    var html = '<div class="question-block" data-required="' + (q.required !== false) + '" ';
    html += 'data-field-name="' + q.id + '" data-field-type="' + q.type + '">';
    html += '<div class="question-prompt">' + q.prompt;
    if (q.required !== false) html += '<span class="question-required">*</span>';
    html += '</div>';
    if (q.description) html += '<div class="question-description">' + q.description + '</div>';

    switch (q.type) {
      case 'radio':
        html += '<div class="option-list">';
        (q.options || []).forEach(function (opt) {
          var val = typeof opt === 'object' ? opt.value : opt;
          var label = typeof opt === 'object' ? opt.label : opt;
          html += '<div class="option-card">';
          html += '<input type="radio" name="' + q.id + '" value="' + esc(val) + '">';
          html += '<span class="option-label">' + esc(label) + '</span>';
          html += '</div>';
        });
        html += '</div>';
        break;

      case 'number':
        html += '<div class="number-input-wrapper">';
        html += '<input type="number" class="number-input" id="' + q.id + '" name="' + q.id + '"';
        if (q.min !== undefined) html += ' min="' + q.min + '"';
        if (q.max !== undefined) html += ' max="' + q.max + '"';
        if (q.step !== undefined) html += ' step="' + q.step + '"';
        html += ' placeholder="?">';
        html += '</div>';
        if (q.hint) html += '<div class="number-input-hint">' + q.hint + '</div>';
        break;

      case 'text':
        if (q.paragraph) {
          html += '<textarea class="textarea-input" id="' + q.id + '" name="' + q.id + '"';
          if (q.placeholder) html += ' placeholder="' + esc(q.placeholder) + '"';
          html += '></textarea>';
        } else {
          html += '<input type="text" class="text-input" id="' + q.id + '" name="' + q.id + '"';
          if (q.placeholder) html += ' placeholder="' + esc(q.placeholder) + '"';
          html += '>';
        }
        break;

      case 'likert':
        html += '<div class="likert-container">';
        html += '<div class="likert-labels">';
        html += '<span class="likert-label-low">' + (q.minLabel || q.min || '') + '</span>';
        html += '<span class="likert-label-high">' + (q.maxLabel || q.max || '') + '</span>';
        html += '</div>';
        html += '<div class="likert-options">';
        for (var v = (q.min || 1); v <= (q.max || 7); v++) {
          html += '<div class="likert-option">';
          html += '<input type="radio" name="' + q.id + '" value="' + v + '" id="' + q.id + '_' + v + '">';
          html += '<label for="' + q.id + '_' + v + '">' + v + '</label>';
          html += '</div>';
        }
        html += '</div>';
        html += '</div>';
        break;

      case 'dropdown':
        html += '<select class="dropdown-input" id="' + q.id + '" name="' + q.id + '">';
        html += '<option value="">-- Select --</option>';
        (q.options || []).forEach(function (opt) {
          var val = typeof opt === 'object' ? opt.value : opt;
          var label = typeof opt === 'object' ? opt.label : opt;
          html += '<option value="' + esc(val) + '">' + esc(label) + '</option>';
        });
        html += '</select>';
        break;
    }

    html += '<div class="field-error" id="error_' + q.id + '"></div>';
    html += '</div>';
    return html;
  };

  // Slider Tutorial
  SurveyEngine.prototype.renderSliderTutorial = function (page) {
    var html = '';
    html += '<h1 class="page-title">' + (page.title || 'How to Answer') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';

    html += '<div class="tutorial-slider-section">';
    html += '<p class="tutorial-prompt">Try it now! Move the slider to <strong>' +
            (page.targetValue || '75') + '%</strong>:</p>';
    html += '<div class="slider-value-display" id="tutorial_slider_value">50%</div>';
    html += '<div class="slider-wrapper">';
    html += '<span class="slider-label">0%</span>';
    html += '<input type="range" class="slider-input" id="tutorial_slider" ' +
            'min="0" max="100" step="1" value="50" data-touched="false" data-display="tutorial_slider_value">';
    html += '<span class="slider-label">100%</span>';
    html += '</div>';
    html += '<div class="slider-hint">Drag the slider left or right</div>';
    html += '</div>';

    return html;
  };

  // Completion (Part 1 end -- pass)
  SurveyEngine.prototype.renderCompletion = function (page) {
    var self = this;
    var html = '';
    html += '<h1 class="page-title">' + (page.title || 'Complete!') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';

    var code = this.config.passCompletionCode || this.config.completionCode || 'XXXXXX';
    var redirectUrl = this.config.passCompletionUrl || this.config.completionUrl || '';
    html += '<p style="margin-top:24px;">Your completion code:</p>';
    html += '<div class="completion-code">' + esc(code) + '</div>';

    var part2Url = this.config.part2StudyUrl;
    if (this.part === 1 && part2Url) {
      html += '<p style="margin-top:24px;text-align:center;">';
      html += '<a href="' + esc(part2Url) + '" class="btn btn-primary" ' +
              'style="display:inline-block;font-size:18px;padding:14px 32px;text-decoration:none;">' +
              'Continue to Part 2</a>';
      html += '</p>';
      html += '<p style="text-align:center;margin-top:8px;color:#6b7280;font-size:14px;">' +
              'You will also need to submit your completion code above on Prolific.</p>';
    } else if (redirectUrl) {
      html += '<p style="margin-top:16px;text-align:center;">';
      html += '<a href="' + esc(redirectUrl) + '" class="btn btn-primary" ' +
              'style="display:inline-block;margin-top:8px;text-decoration:none;">' +
              'Return to Prolific</a>';
      html += '</p>';
    }

    html += '<div id="submit_status" class="alert alert-info" style="margin-top:24px;">';
    html += 'Submitting your responses... <span class="spinner"></span>';
    html += '</div>';

    if (redirectUrl) this.config.completionUrl = redirectUrl;

    setTimeout(function () {
      self.submitted = false;
      self.submitData();
    }, 500);

    return html;
  };

  // Part 1 Fail
  SurveyEngine.prototype.renderPart1Fail = function () {
    var self = this;
    var code = this.config.failCompletionCode || 'XXXXXX';
    var failUrl = this.config.failCompletionUrl || '';

    var failLink = failUrl
      ? '<p style="margin-top:16px;text-align:center;">' +
        '<a href="' + esc(failUrl) + '" class="btn btn-primary" ' +
        'style="display:inline-block;margin-top:8px;text-decoration:none;">' +
        'Return to Prolific</a></p>'
      : '';

    this.elContent.innerHTML =
      '<h1 class="page-title">Thank You</h1>' +
      '<div class="page-body">' +
      '<p>Unfortunately, you were unable to answer the comprehension questions correctly. ' +
      'We are unable to include you in Part 2 of this study.</p>' +
      '<p>You will still be paid for completing this part. Thank you for your time!</p>' +
      '</div>' +
      '<p style="margin-top:24px;">Your completion code:</p>' +
      '<div class="completion-code">' + esc(code) + '</div>' +
      failLink +
      '<div id="submit_status" class="alert alert-info" style="margin-top:24px;">' +
      'Submitting your responses... <span class="spinner"></span></div>';
    this.elNavButtons.style.display = 'none';

    var origUrl = this.config.completionUrl;
    if (failUrl) this.config.completionUrl = failUrl;

    setTimeout(function () {
      self.submitted = false;
      self.submitData();
      if (failUrl) self.config.completionUrl = origUrl;
    }, 500);
  };

  // Debrief
  SurveyEngine.prototype.renderDebrief = function (page) {
    var self = this;
    var html = '';
    html += '<h1 class="page-title">' + (page.title || 'Thank You!') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';

    // Show bonus
    if (page.showBonus && this.bonusInfo && this.bonusInfo.enabled && this.bonusInfo.amount !== undefined) {
      html += '<div class="bonus-display">';
      html += '<div class="bonus-amount">' + this.bonusInfo.currency + ' ' +
              this.bonusInfo.amount.toFixed(2) + '</div>';
      html += '<div class="bonus-detail">Your bonus based on Firm ' +
              this.bonusInfo.selectedTrialId + '</div>';
      html += '<div class="bonus-detail">Your estimate: ' + this.bonusInfo.fraudProb +
              '% | Benchmark: ' + (this.bonusInfo.bayesPosterior * 100).toFixed(1) +
              '% | Error: ' + this.bonusInfo.errorPp.toFixed(1) + ' pp</div>';
      html += '</div>';
    }

    var debriefCode = this.config.part2CompletionCode || this.config.completionCode || 'XXXXXX';
    html += '<p style="margin-top:24px;">Your completion code:</p>';
    html += '<div class="completion-code">' + esc(debriefCode) + '</div>';

    html += '<div id="submit_status" class="alert alert-info" style="margin-top:24px;">';
    html += 'Submitting your responses... <span class="spinner"></span>';
    html += '</div>';

    setTimeout(function () { self.submitData(); }, 500);

    return html;
  };

  // ── Submit Data ────────────────────────────────────────────────────────
  SurveyEngine.prototype.submitData = function () {
    if (this.submitted) return;
    this.submitted = true;

    var data = this.getAllData();
    var statusEl = document.getElementById('submit_status');
    var completionUrl = this.config.completionUrl;

    // Dev mode: skip actual submission
    if (this.devMode) {
      if (statusEl) {
        statusEl.className = 'alert alert-success';
        statusEl.innerHTML = '[DEV MODE] Submission skipped. Data logged to console.';
      }
      console.log('Survey data:', JSON.stringify(data, null, 2));
      return;
    }

    if (window.DataStorage && this.config.dataEndpoint) {
      window.DataStorage.submit(data, this.config.dataEndpoint, function (success) {
        if (success) {
          if (statusEl) {
            statusEl.className = 'alert alert-success';
            statusEl.innerHTML = 'Responses submitted successfully! Redirecting to Prolific...';
          }
          window.DataStorage.clearProgress();
          if (completionUrl) {
            setTimeout(function () { window.location.href = completionUrl; }, 2000);
          }
        } else {
          if (statusEl) {
            statusEl.className = 'alert alert-warning';
            statusEl.innerHTML = '<p><strong>Submission encountered an issue.</strong></p>' +
              '<p>Your completion code is shown above. Please copy it and return to Prolific.</p>' +
              '<p>If possible, please also copy the data below and email it to the researcher:</p>' +
              '<textarea class="textarea-input" style="font-size:11px;margin-top:8px;" readonly>' +
              JSON.stringify(data) + '</textarea>';
          }
        }
      });
    } else {
      if (statusEl) {
        statusEl.className = 'alert alert-warning';
        statusEl.innerHTML = '<p>No data endpoint configured. Your completion code is above.</p>';
      }
      console.log('Survey data:', JSON.stringify(data, null, 2));
    }
  };

  // ── Expose globally ────────────────────────────────────────────────────
  window.SurveyEngine = SurveyEngine;

  // ── Auto-init when config is available ─────────────────────────────────
  function autoInit() {
    if (window.SURVEY_CONFIG) {
      var engine = new SurveyEngine(window.SURVEY_CONFIG);
      engine.init();
      window._surveyEngine = engine;
    } else {
      console.error('SURVEY_CONFIG not found. Define it in config.js before loading engine.js.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();

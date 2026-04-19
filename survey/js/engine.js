/* ==========================================================================
   FBO 2 (Selection Neglect) Survey Engine v3.2
   Config-driven, generic survey framework.
   Design: Within-subject, 9 trials (3N x 1D x 3d_N), 2 transaction types, D=4 fixed.
   Firm sizes: Small (10), Medium (20), Large (50).
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

  // ── SurveyEngine ───────────────────────────────────────────────────────
  function SurveyEngine(config) {
    this.config = config;
    this.pages = [];
    this.currentPageIndex = 0;
    this.responses = {};
    this.timing = {};
    this.trialResponses = {};
    this.prolificPID = '';
    this.studyID = '';
    this.sessionID = '';

    this.comprehensionAttempts = 0;
    this.comprehensionFailed = false;
    this.attentionResults = [];
    this.trialAttentionResults = [];
    this.bonusInfo = null;
    this.minTimeTimer = null;
    this.minTimeReady = true;
    this.submitted = false;
    this.blockBoundaryIndices = [];

    // Quiz state (multi-page 10-question quiz)
    this.seenPages = new Set();     // page IDs the participant has advanced past
    this.quizResponses = [];        // entries: {questionIndex, selected, correct}
    this.quizRetakeCount = 0;       // how many times participant retook the quiz

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
    var params = new URLSearchParams(window.location.search);
    var rawPID = params.get('PROLIFIC_PID') || params.get('prolific_pid') || '';
    this.devMode = params.get('dev') === 'true';
    if (rawPID && (/^[0-9a-f]{24}$/i.test(rawPID) || this.devMode)) {
      this.prolificPID = rawPID;
    } else {
      this.prolificPID = '';
    }
    this.studyID = params.get('STUDY_ID') || params.get('study_id') || '';
    this.sessionID = params.get('SESSION_ID') || params.get('session_id') || '';
    this.part = parseInt(params.get('part')) || 0;

    // Select pages based on part
    if (this.part === 1 && this.config.part1Pages) {
      this.config.pages = this.config.part1Pages;
    } else if (this.part === 2 && this.config.part2Pages) {
      this.config.pages = this.config.part2Pages;
    }

    console.log('[FBO2] Init: part=' + this.part + ' PID=' + this.prolificPID);

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

  // ── Build Page Sequence ────────────────────────────────────────────────
  SurveyEngine.prototype.buildPageSequence = function () {
    var self = this;
    this.pages = [];
    this.blockBoundaryIndices = [];

    (this.config.pages || []).forEach(function (page) {
      if (page.type === 'trial_block') {
        var block = page.block || 1;

        // Get trials from config.stimuli (flat array)
        var trials = (self.config.stimuli || []).slice();

        // Randomize if requested
        if (page.randomize && self.prolificPID) {
          var baseSeed = hashString(self.prolificPID + '_trials_b' + block);
          trials = seededShuffle(trials, baseSeed);
        }

        // Read DV flags from trial_block config
        var askFlaggedEstimate = page.askFlaggedEstimate || false;

        // Record block boundary
        self.blockBoundaryIndices.push(self.pages.length);

        trials.forEach(function (trial, idx) {
          var idSuffix = (block > 1) ? '_b' + block : '';
          // Trial intro splash page
          self.pages.push({
            id: trial.id + idSuffix + '_intro',
            type: 'trial_intro',
            trial: trial,
            trialIndex: idx,
            totalTrials: trials.length,
            block: block,
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
            askFlaggedEstimate: askFlaggedEstimate,
            minTimeSeconds: page.minTimePerTrial || 10
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
  SurveyEngine.prototype.insertTrialAttentionChecks = function () {
    var numChecks = this.config.trialAttentionCheckCount || 0;
    if (numChecks <= 0 || !this.prolificPID) return;

    var trialIndices = [];
    for (var i = 0; i < this.pages.length; i++) {
      if (this.pages[i].type === 'fraud_trial') trialIndices.push(i);
    }
    if (trialIndices.length === 0) return;

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

    // Recompute block boundaries
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
    this.clearMinTime();
    this.minTimeReady = true;

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
        case 'slider_demo':     html = self.renderSliderDemo(page); break;
        case 'debrief':         html = self.renderDebrief(page); break;
        case 'quiz_gate':       html = self.renderQuizGate(page); break;
        case 'quiz_question':   html = self.renderQuizQuestion(page); break;
        case 'quiz_fail':       html = self.renderQuizFail(page); break;
        case 'fail_completion': html = self.renderFailCompletion(page); break;
        default:                html = '<p>Unknown page type: ' + esc(page.type) + '</p>';
      }

      self.elContent.innerHTML = html;

      // Toggle wider wrapper for trial pages
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

      // Show/hide nav buttons (quiz_fail and fail_completion render their own buttons)
      var showNav = page.type !== 'debrief' && page.type !== 'completion'
                    && page.type !== 'quiz_fail' && page.type !== 'fail_completion';
      self.elNavButtons.style.display = showNav ? '' : 'none';

      // Back button visibility
      var atBoundary = self.blockBoundaryIndices.indexOf(index) !== -1;
      var noBack = index === 0 || page.type === 'welcome' || page.type === 'debrief'
                   || page.type === 'comprehension' || page.type === 'transition'
                   || page.type === 'trial_attention' || page.type === 'trial_intro'
                   || page.type === 'quiz_question'
                   || atBoundary;
      self.elBtnBack.style.display = noBack ? 'none' : '';

      // Next button text
      if (page.type === 'welcome') {
        self.elBtnNext.textContent = page.buttonText || 'Begin';
      } else if (page.type === 'transition') {
        self.elBtnNext.textContent = 'Continue';
      } else if (page.type === 'quiz_gate') {
        self.elBtnNext.textContent = page.startButtonText || 'Start Quiz';
      } else if (page.type === 'quiz_question') {
        self.elBtnNext.textContent = (page.questionIndex === page.totalQuestions) ? 'Submit Quiz' : 'Next';
      } else if (index === self.pages.length - 2) {
        self.elBtnNext.textContent = 'Submit';
      } else {
        self.elBtnNext.textContent = 'Next';
      }

      // Min time enforcement (bypassed if the participant has already seen this page)
      self.elBtnNext.disabled = false;
      if (page.minTimeSeconds && page.minTimeSeconds > 0 && !self.seenPages.has(page.id)) {
        self.enforceMinTime(page.minTimeSeconds);
      }

      self.updateProgress();
      self.recordPageStart(index);
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
            if (parseFloat(slider.max) === 100) {
              display.textContent = Math.round(val) + '%';
            } else {
              display.textContent = val.toFixed(1);
            }
            slider.setAttribute('data-touched', 'true');
          });
        }
      });

      window.scrollTo(0, 0);
    }, 200);
  };

  // ── Stealth AI Check ───────────────────────────────────────────────────
  SurveyEngine.prototype._stealthQuestions = [
    "What is 8 + 3?", "What color is the sky on a clear day?",
    "What planet do humans live on?", "How many legs does a dog have?",
    "What is the capital of France?", "What is 15 minus 7?",
    "How many days are in a week?", "What animal says meow?",
    "What is the boiling point of water in Celsius?",
    "In what year did World War II end?", "What is the square root of 64?",
    "What is 6 times 7?", "What language is spoken in Brazil?",
    "How many sides does a triangle have?", "What is the chemical symbol for water?",
    "Who painted the Mona Lisa?", "What is 100 divided by 5?",
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
      if (e.target !== cb) { cb.checked = !cb.checked; }
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
    if (!this.timing[page.id]) { this.timing[page.id] = {}; }
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

    if (!this.devMode && page.type === 'comprehension') {
      var passed = this.handleComprehensionCheck(page);
      if (!passed) return;
    }

    if (!this.devMode && page.type === 'attention_check') {
      this.handleAttentionCheck(page);
    }

    // Quiz question: validate a radio was selected, record the answer
    if (page.type === 'quiz_question') {
      var sel = document.querySelector('input[name="quiz_q' + page.questionIndex + '"]:checked');
      if (!sel) {
        if (!this.devMode) {
          this.showError('quiz_q' + page.questionIndex, 'Please select an option.');
          return;
        }
      }
      var selectedValue = sel ? sel.value : null;
      this.quizResponses[page.questionIndex - 1] = {
        questionIndex: page.questionIndex,
        selected: selectedValue,
        correct: selectedValue === page.correct
      };
    }

    if (!this.devMode && !this.validatePage()) return;

    this.collectPageData(this.currentPageIndex);
    this.collectStealthAnswers();
    this.recordPageEnd(this.currentPageIndex);

    // Mark this page as seen so subsequent revisits skip the min-time overlay.
    // Exclude quiz_question pages so a retake forces re-answer of each question.
    if (page.type !== 'quiz_question') {
      this.seenPages.add(page.id);
    }

    this.saveProgress();

    // After the final quiz question, branch on score
    if (page.type === 'quiz_question' && page.questionIndex === page.totalQuestions) {
      var numCorrect = this.quizResponses.filter(function (r) { return r && r.correct; }).length;
      // Record quiz outcome in responses for audit trail
      this.responses[page.id] = this.responses[page.id] || {};
      this.responses[page.id].quizResponses = this.quizResponses.slice();
      this.responses[page.id].quizNumCorrect = numCorrect;
      this.responses[page.id].quizRetakeCount = this.quizRetakeCount;
      if (numCorrect >= 9) {
        this.goToPageId('p1_comprehension_result');
      } else {
        this.goToPageId('p1_quiz_fail');
      }
      return;
    }

    var nextPage = this.pages[this.currentPageIndex + 1];
    if (nextPage && nextPage.type === 'debrief') {
      this.calculateBonus();
    }

    if (this.currentPageIndex < this.pages.length - 1) {
      this.renderPage(this.currentPageIndex + 1);
    }
  };

  // Jump to a specific page by its id; used for quiz routing and retakes.
  SurveyEngine.prototype.goToPageId = function (id) {
    for (var i = 0; i < this.pages.length; i++) {
      if (this.pages[i].id === id) {
        this.renderPage(i);
        return true;
      }
    }
    console.warn('[FBO2] goToPageId: id not found', id);
    return false;
  };

  // Retake: clear quiz answers and seenPages for quiz pages, jump to instructions.
  SurveyEngine.prototype.retakeQuiz = function () {
    this.quizResponses = [];
    this.quizRetakeCount += 1;
    var self = this;
    this.pages.forEach(function (p) {
      if (p.type && p.type.indexOf('quiz_') === 0) {
        self.seenPages.delete(p.id);
      }
    });
    this.goToPageId('p1_inst_mission');
  };

  // Exit without retake: go to the FAIL1SN completion page.
  SurveyEngine.prototype.exitQuizNoRetake = function () {
    this.goToPageId('p1_fail_completion');
  };

  SurveyEngine.prototype.prevPage = function () {
    if (this.currentPageIndex > 0) {
      if (this.blockBoundaryIndices.indexOf(this.currentPageIndex) !== -1) return;
      this.recordPageEnd(this.currentPageIndex);
      this.renderPage(this.currentPageIndex - 1);
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────
  SurveyEngine.prototype.validatePage = function () {
    this.clearErrors();
    var page = this.pages[this.currentPageIndex];
    var valid = true;

    // Consent
    if (page.type === 'consent' && page.mustAgree) {
      var cb = document.getElementById('consent_agree');
      if (cb && !cb.checked) {
        this.showError('consent_agree', page.declineMessage || 'You must agree to participate.');
        valid = false;
      }
    }

    // Required fields
    var required = document.querySelectorAll('#pageContent [data-required="true"]');
    for (var i = 0; i < required.length; i++) {
      var field = required[i];
      var name = field.getAttribute('data-field-name');
      if (!name) continue;

      if (field.getAttribute('data-field-type') === 'radio' || field.getAttribute('data-field-type') === 'likert') {
        var checked = document.querySelector('input[name="' + name + '"]:checked');
        if (!checked) { this.showError(name, 'Please select an option.'); valid = false; }
      } else if (field.getAttribute('data-field-type') === 'number') {
        var input = document.getElementById(name);
        if (!input || input.value === '') { this.showError(name, 'Please enter a number.'); valid = false; }
        else {
          var val = parseFloat(input.value);
          var min = parseFloat(input.getAttribute('min'));
          var max = parseFloat(input.getAttribute('max'));
          if (isNaN(val)) { this.showError(name, 'Please enter a valid number.'); valid = false; }
          else if (!isNaN(min) && val < min) { this.showError(name, 'Value must be at least ' + min + '.'); valid = false; }
          else if (!isNaN(max) && val > max) { this.showError(name, 'Value must be at most ' + max + '.'); valid = false; }
        }
      } else if (field.getAttribute('data-field-type') === 'text') {
        var inp = document.getElementById(name);
        if (!inp || inp.value.trim() === '') { this.showError(name, 'Please provide a response.'); valid = false; }
      } else if (field.getAttribute('data-field-type') === 'dropdown') {
        var sel = document.getElementById(name);
        if (!sel || sel.value === '') { this.showError(name, 'Please make a selection.'); valid = false; }
      }
    }

    // Slider demo: require slider to be dragged
    if (page.type === 'slider_demo') {
      var demoSlider = document.getElementById('demo_slider');
      if (demoSlider && demoSlider.getAttribute('data-touched') !== 'true') {
        this.showError('demo_slider', 'Please drag the slider to continue.');
        valid = false;
      }
    }

    // Fraud trial: require fraud prob slider + confidence + optional flagged estimate
    if (page.type === 'fraud_trial') {
      var fraudSlider = document.getElementById('fraud_prob');
      if (fraudSlider && fraudSlider.getAttribute('data-touched') === 'false') {
        this.showError('fraud_prob', 'Please drag the slider to set your fraud probability estimate.');
        valid = false;
      }

      var confChecked = document.querySelector('input[name="confidence"]:checked');
      if (!confChecked) {
        this.showError('confidence', 'Please select your confidence level.');
        valid = false;
      }

    }

    // PID fallback
    if (page.type === 'welcome' && !this.prolificPID) {
      var pidInput = document.getElementById('pid_fallback_input');
      if (pidInput && pidInput.value.trim()) {
        var pidVal = pidInput.value.trim();
        if (!/^[0-9a-f]{24}$/i.test(pidVal) && !this.devMode) {
          this.showError('pid_fallback_input', 'Please enter a valid Prolific ID (24-character alphanumeric code).');
          valid = false;
        } else {
          this.prolificPID = pidVal;
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
    if (errEl) { errEl.textContent = message; errEl.classList.add('visible'); }
  };

  SurveyEngine.prototype.clearErrors = function () {
    var errors = document.querySelectorAll('.field-error');
    for (var i = 0; i < errors.length; i++) { errors[i].classList.remove('visible'); errors[i].textContent = ''; }
  };

  // ── Data Collection ────────────────────────────────────────────────────
  SurveyEngine.prototype.collectPageData = function (index) {
    var page = this.pages[index];
    var data = {};

    var inputs = document.querySelectorAll('#pageContent input, #pageContent select, #pageContent textarea');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      var name = el.name || el.id;
      if (!name || name.startsWith('hp_') || name.startsWith('ai_') || name.startsWith('sc_')) continue;
      if (el.type === 'radio') { if (el.checked) data[name] = el.value; }
      else if (el.type === 'checkbox') { data[name] = el.checked; }
      else { data[name] = el.value; }
    }

    // Store fraud trial response
    if (page.type === 'fraud_trial' && page.trial) {
      var trial = page.trial;
      var fraudProb = document.getElementById('fraud_prob');
      var confChecked = document.querySelector('input[name="confidence"]:checked');

      this.trialResponses[page.id] = {
        trialId: trial.id,
        block: page.block || 1,
        askFlaggedEstimate: false,
        fraudProb: fraudProb ? parseFloat(fraudProb.value) : null,
        confidence: confChecked ? parseInt(confChecked.value) : null,
        flaggedEstimate: null,
        N: trial.N,
        D: trial.D,
        dN: trial.dN,
        nFlagged: trial.nFlagged,
        hidden: trial.hidden,
        bayesPosterior: trial.bayesPosterior,
        snPosterior: trial.snPosterior,
        mrPosterior: trial.mrPosterior
      };
    }

    // Trial attention check
    if (page.type === 'trial_attention' && page.trial) {
      var t = page.trial;
      var nAns = data['attn_n'] ? parseInt(data['attn_n']) : null;
      var dAns = data['attn_d'] ? parseInt(data['attn_d']) : null;
      var flagAns = data['attn_flag'] ? parseInt(data['attn_flag']) : null;
      this.trialAttentionResults.push({
        trialId: t.id,
        block: page.block,
        nAnswer: nAns, nCorrect: nAns === t.N,
        dAnswer: dAns, dCorrect: dAns === t.D,
        flagAnswer: flagAns, flagCorrect: flagAns === t.nFlagged,
        allCorrect: nAns === t.N && dAns === t.D && flagAns === t.nFlagged
      });
    }

    this.responses[page.id] = data;
  };

  SurveyEngine.prototype.getAllData = function () {
    var botMetrics = window.BotDetector ? window.BotDetector.getMetrics() : {};
    return {
      surveyVersion: this.config.study ? this.config.study.version : '3.0',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      prolificPID: this.prolificPID,
      studyID: this.studyID,
      sessionID: this.sessionID,
      part: this.part,
      responses: this.responses,
      trialResponses: this.trialResponses,
      timing: this.timing,
      comprehensionAttempts: this.comprehensionAttempts,
      comprehensionFailed: this.comprehensionFailed,
      attentionResults: this.attentionResults,
      attentionPassed: this.attentionResults.filter(function (r) { return r.passed; }).length,
      attentionFailed: this.attentionResults.filter(function (r) { return !r.passed; }).length,
      trialAttentionResults: this.trialAttentionResults,
      trialAttentionAllCorrect: this.trialAttentionResults.filter(function (r) { return r.allCorrect; }).length,
      quizResponses: this.quizResponses,
      quizNumCorrect: this.quizResponses.filter(function (r) { return r && r.correct; }).length,
      quizRetakeCount: this.quizRetakeCount,
      bonus: this.bonusInfo,
      botMetrics: botMetrics,
      stealthCheck: this.collectStealthAnswers()
    };
  };

  // ── Save Progress ──────────────────────────────────────────────────────
  SurveyEngine.prototype.saveProgress = function () {
    if (!window.DataStorage) return;
    window.DataStorage.saveProgress({
      prolificPID: this.prolificPID,
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
        if (!input || input.value === '') { allCorrect = false; continue; }
        answer = parseFloat(input.value);
        var correct = parseFloat(q.correct);
        var tol = q.tolerance || 0.01;
        if (isNaN(answer) || Math.abs(answer - correct) > tol) allCorrect = false;
      } else if (q.type === 'radio') {
        var checked = document.querySelector('input[name="' + fieldId + '"]:checked');
        if (!checked) { allCorrect = false; continue; }
        answer = checked.value;
        if (answer !== q.correct) allCorrect = false;
      } else { allCorrect = false; }
    }

    // Check if any unanswered
    var anyUnanswered = false;
    for (var j = 0; j < questions.length; j++) {
      var fid = 'comp_' + j;
      if (questions[j].type === 'radio') {
        if (!document.querySelector('input[name="' + fid + '"]:checked')) { anyUnanswered = true; break; }
      } else if (questions[j].type === 'number') {
        var inp = document.getElementById(fid);
        if (!inp || inp.value === '') { anyUnanswered = true; break; }
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

    var resultsHtml = '<h1 class="page-title">Quiz Results</h1>';
    for (var r = 0; r < questions.length; r++) {
      var rq = questions[r];
      var rFieldId = 'comp_' + r;
      var rAnswer, rCorrect = false;
      if (rq.type === 'number') {
        var rInput = document.getElementById(rFieldId);
        rAnswer = rInput ? parseFloat(rInput.value) : NaN;
        rCorrect = !isNaN(rAnswer) && Math.abs(rAnswer - parseFloat(rq.correct)) <= (rq.tolerance || 0.01);
      } else if (rq.type === 'radio') {
        var rChecked = document.querySelector('input[name="' + rFieldId + '"]:checked');
        rAnswer = rChecked ? rChecked.value : '';
        rCorrect = rAnswer === rq.correct;
      }
      var icon = rCorrect ? '&#10003;' : '&#10007;';
      var cls = rCorrect ? 'comp-result-correct' : 'comp-result-wrong';
      resultsHtml += '<div class="comp-result-item ' + cls + '"><span class="comp-result-icon">' + icon + '</span> <span class="comp-result-prompt">' + rq.prompt + '</span></div>';
    }

    if (allCorrect) {
      resultsHtml += '<div class="alert alert-success" style="margin-top:24px;"><strong>All correct!</strong> You may continue.</div>';
    } else {
      resultsHtml += '<div class="alert alert-error" style="margin-top:24px;"><p><strong>' + (page.failMessage || 'You did not pass. Thank you for your time.') + '</strong></p></div>';
    }

    this.elContent.innerHTML = resultsHtml;
    this.elNavButtons.style.display = 'none';

    if (allCorrect) {
      var self = this;
      setTimeout(function () {
        self.elNavButtons.style.display = '';
        self.renderPage(self.currentPageIndex + 1);
      }, 2000);
    } else {
      this.comprehensionFailed = true;
      if (this.part === 1) {
        var self2 = this;
        setTimeout(function () { self2.renderPart1Fail(); }, 3000);
      }
    }
    return false;
  };

  // ── Attention Check ────────────────────────────────────────────────────
  SurveyEngine.prototype.handleAttentionCheck = function (page) {
    var checked = document.querySelector('input[name="attn_' + page.id + '"]:checked');
    var answer = checked ? checked.value : '';
    this.attentionResults.push({
      checkId: page.id,
      passed: answer === page.correctAnswer,
      answer: answer,
      expected: page.correctAnswer
    });
  };

  // ── Bonus Calculation ──────────────────────────────────────────────────
  SurveyEngine.prototype.calculateBonus = function () {
    var bonusCfg = this.config.bonus;
    if (!bonusCfg || !bonusCfg.enabled) { this.bonusInfo = { enabled: false }; return; }

    var trialIds = Object.keys(this.trialResponses);
    if (trialIds.length === 0) { this.bonusInfo = { enabled: true, amount: 0, reason: 'no_trials' }; return; }

    var seed = hashString(this.prolificPID + '_bonus');
    var rng = mulberry32(seed);
    var selectedIdx = Math.floor(rng() * trialIds.length);
    var selectedId = trialIds[selectedIdx];
    var trial = this.trialResponses[selectedId];

    var guess = trial.fraudProb / 100;
    var truth = trial.bayesPosterior;

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
      errorPp: Math.round(error * 10000) / 100,
      amount: amount,
      currency: bonusCfg.currency || 'GBP'
    };
  };

  // ── Page Renderers ─────────────────────────────────────────────────────

  SurveyEngine.prototype.renderWelcome = function (page) {
    var html = '<h1 class="page-title">' + (page.title || 'Welcome') + '</h1>';
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

  SurveyEngine.prototype.renderConsent = function (page) {
    var html = '<h1 class="page-title">' + (page.title || 'Consent') + '</h1>';
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

  SurveyEngine.prototype.renderInstructions = function (page) {
    var html = '<h1 class="page-title">' + (page.title || 'Instructions') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';
    return html;
  };

  SurveyEngine.prototype.renderComprehension = function (page) {
    var html = '<h1 class="page-title">' + (page.title || 'Comprehension Check') + '</h1>';
    if (page.description) html += '<div class="page-body">' + page.description + '</div>';
    (page.questions || []).forEach(function (q, idx) {
      var fieldId = 'comp_' + idx;
      html += '<div class="question-block">';
      html += '<div class="question-prompt">' + q.prompt + '</div>';
      if (q.type === 'number') {
        html += '<div class="number-input-wrapper">';
        html += '<input type="number" class="number-input" id="' + fieldId + '"';
        if (q.min !== undefined) html += ' min="' + q.min + '"';
        if (q.max !== undefined) html += ' max="' + q.max + '"';
        if (q.step !== undefined) html += ' step="' + q.step + '"';
        html += ' placeholder="?">';
        html += '</div>';
      } else if (q.type === 'radio') {
        html += '<div class="option-list">';
        (q.options || []).forEach(function (opt) {
          var val = typeof opt === 'object' ? opt.value : opt;
          var label = typeof opt === 'object' ? opt.label : opt;
          html += '<div class="option-card"><input type="radio" name="' + fieldId + '" value="' + esc(val) + '"><span class="option-label">' + esc(label) + '</span></div>';
        });
        html += '</div>';
      }
      html += '<div class="field-error" id="error_' + fieldId + '"></div></div>';
    });
    html += '<div class="comp-note" style="margin-top:16px;color:#6b7280;font-size:15px;">You have one attempt. All answers must be correct to continue.</div>';
    return html;
  };

  // ── Quiz Gate ──────────────────────────────────────────────────────────
  SurveyEngine.prototype.renderQuizGate = function (page) {
    var html = '<h1 class="page-title">' + (page.title || 'Before the Quiz') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';
    return html;
  };

  // ── Quiz Question (one per page) ───────────────────────────────────────
  SurveyEngine.prototype.renderQuizQuestion = function (page) {
    var fieldName = 'quiz_q' + page.questionIndex;
    var html = '';
    html += '<div class="quiz-progress">Question ' + page.questionIndex + ' of ' + page.totalQuestions + '</div>';
    html += '<div class="quiz-question-prompt">' + esc(page.prompt) + '</div>';
    html += '<div class="option-list">';
    // Preserve any previously selected answer (e.g., after validation fail, though uncommon here)
    var priorRecord = this.quizResponses[page.questionIndex - 1];
    var priorValue = priorRecord ? priorRecord.selected : null;
    (page.options || []).forEach(function (opt) {
      var val = typeof opt === 'object' ? opt.value : opt;
      var label = typeof opt === 'object' ? opt.label : opt;
      var selAttr = (priorValue !== null && priorValue === val) ? ' checked' : '';
      var selClass = selAttr ? ' selected' : '';
      html += '<div class="option-card' + selClass + '"><input type="radio" name="' + fieldName + '" value="' + esc(val) + '"' + selAttr + '><span class="option-label">' + esc(label) + '</span></div>';
    });
    html += '</div>';
    html += '<div class="field-error" id="error_' + fieldName + '"></div>';
    return html;
  };

  // ── Quiz Fail (offer retake or exit) ───────────────────────────────────
  SurveyEngine.prototype.renderQuizFail = function (page) {
    var self = this;
    var numCorrect = this.quizResponses.filter(function (r) { return r && r.correct; }).length;
    var total = this.quizResponses.length || 10;
    var html = '<h1 class="page-title">' + (page.title || 'Almost There') + '</h1>';
    html += '<div class="quiz-fail-score">' + numCorrect + '<span class="quiz-fail-score-denom"> / ' + total + '</span></div>';
    html += '<p style="text-align:center; font-size:16px;">You got <strong>' + numCorrect + ' out of ' + total + '</strong> correct. The passing grade is <strong>9 of 10</strong>.</p>';
    html += '<p style="text-align:center; color:#475569;">No worries -- the instructions are detailed. Take another pass through and try again.</p>';
    html += '<div class="quiz-fail-buttons">';
    html += '<button type="button" class="btn btn-primary" id="quiz_retake">' + esc(page.retakeText || 'Retake instructions') + '</button>';
    html += '<button type="button" class="btn btn-secondary" id="quiz_exit">' + esc(page.exitText || 'Exit without retake') + '</button>';
    html += '</div>';

    // Wire buttons after the HTML is injected
    setTimeout(function () {
      var retakeBtn = document.getElementById('quiz_retake');
      var exitBtn = document.getElementById('quiz_exit');
      if (retakeBtn) retakeBtn.addEventListener('click', function () { self.retakeQuiz(); });
      if (exitBtn) exitBtn.addEventListener('click', function () { self.exitQuizNoRetake(); });
    }, 0);

    return html;
  };

  // ── Fail Completion (FAIL1SN code) ─────────────────────────────────────
  SurveyEngine.prototype.renderFailCompletion = function (page) {
    var self = this;
    var codes = this.config.prolific ? this.config.prolific.completionCodes : {};
    var urls = this.config.prolific ? this.config.prolific.completionUrls : {};
    var code = codes.fail1 || 'XXXXXX';
    var failUrl = urls.fail1 || '';

    var html = '<h1 class="page-title">' + (page.title || 'Part 1 Complete') + '</h1>';
    html += '<div class="page-body">' +
            '<p>Thank you for your time. You will still be paid for completing this part.</p>' +
            '<p>You are not eligible for Part 2 of this study.</p>' +
            '</div>';
    html += '<p style="margin-top:24px;">Your completion code:</p>';
    html += '<div class="completion-code">' + esc(code) + '</div>';
    if (failUrl) {
      html += '<p style="margin-top:16px;text-align:center;"><a href="' + esc(failUrl) + '" class="btn btn-primary" style="display:inline-block;margin-top:8px;text-decoration:none;">Return to Prolific</a></p>';
    }
    html += '<div id="submit_status" class="alert alert-info" style="margin-top:24px;">Submitting your responses... <span class="spinner"></span></div>';

    this.config.completionUrl = failUrl;
    setTimeout(function () { self.submitted = false; self.submitData(); }, 500);
    return html;
  };

  // ── Trial Intro ────────────────────────────────────────────────────────
  SurveyEngine.prototype.getFirmSizeLabel = function (N) {
    if (N <= 10) return 'Small';
    if (N <= 20) return 'Medium';
    return 'Large';
  };

  SurveyEngine.prototype.getFirmSizeBadgeClass = function (N) {
    if (N <= 10) return 'firm-size-badge-small';
    if (N <= 20) return 'firm-size-badge-medium';
    return 'firm-size-badge-large';
  };

  SurveyEngine.prototype.renderTrialIntro = function (page) {
    var trial = page.trial;
    var firmLabel = 'Firm ' + (page.trialIndex + 1) + ' of ' + page.totalTrials;
    var sizeLabel = this.getFirmSizeLabel(trial.N);
    var html = '<div class="trial-intro-splash">';
    html += '<div class="page-subtitle" style="margin-bottom:24px;">' + firmLabel + '</div>';
    html += '<div class="trial-intro-main">';
    html += '<div class="trial-intro-line" style="font-size:48px;font-weight:700;text-align:center;margin-bottom:24px;">Firm ' + (page.trialIndex + 1) + '</div>';
    html += '<div class="trial-intro-detail" style="font-size:22px;text-align:center;color:#4b5563;line-height:1.6;">';
    html += 'This is a <strong>' + sizeLabel + ' Firm</strong> with <strong>' + trial.N + '</strong> transactions.<br>';
    html += 'The manager will show you <strong>' + trial.D + '</strong> transactions.';
    html += '</div></div></div>';
    return html;
  };

  // ── Fraud Trial Renderer ───────────────────────────────────────────────
  SurveyEngine.prototype.renderFraudTrial = function (page) {
    var trial = page.trial;
    var sizeLabel = this.getFirmSizeLabel(trial.N);
    var badgeClass = this.getFirmSizeBadgeClass(trial.N);
    var html = '';

    // Two-column layout
    html += '<div class="trial-layout">';

    // LEFT: Reference Panel
    html += '<div class="reference-panel">';
    html += '<div class="reference-title">Reference</div>';

    // Firm Type distribution pie (teal/purple) -- ABOVE transaction pies
    html += '<div class="ref-firm-type-section">';
    html += '<div class="ref-firm-type-label">How Common Is Fraud?</div>';
    html += '<div class="ref-firm-type-row">';
    html += '<div class="ref-firm-type-pie" style="background:conic-gradient(#14b8a6 0deg 288deg, #7c3aed 288deg 360deg);"></div>';
    html += '<div class="ref-firm-type-legend">';
    html += '<div class="ref-firm-type-legend-item"><span class="ref-firm-type-swatch" style="background:#14b8a6;"></span><span><strong>80%</strong> Clean</span></div>';
    html += '<div class="ref-firm-type-legend-item"><span class="ref-firm-type-swatch" style="background:#7c3aed;"></span><span><strong>20%</strong> Fraudulent</span></div>';
    html += '</div></div></div>';

    // Clean pie: 50% Normal, 50% Flagged  (teal framing)
    html += '<div class="ref-pie-section ref-pie-clean">';
    html += '<div class="ref-pie-label ref-pie-label-clean">Clean Firm</div>';
    html += '<div class="ref-pie-row">';
    html += '<div class="ref-pie" style="background:conic-gradient(#22c55e 0deg 180deg, #ef4444 180deg 360deg);"></div>';
    html += '<div class="ref-pie-legend">';
    html += '<div class="ref-legend-item"><span class="ref-swatch" style="background:#22c55e;"></span><span>Normal 50%</span></div>';
    html += '<div class="ref-legend-item"><span class="ref-swatch" style="background:#ef4444;"></span><span>Flagged 50%</span></div>';
    html += '</div></div></div>';

    // Fraudulent pie: 40% Normal, 60% Flagged  (purple framing)
    html += '<div class="ref-pie-section ref-pie-fraud">';
    html += '<div class="ref-pie-label ref-pie-label-fraud">Fraudulent Firm</div>';
    html += '<div class="ref-pie-row">';
    html += '<div class="ref-pie" style="background:conic-gradient(#22c55e 0deg 144deg, #ef4444 144deg 360deg);"></div>';
    html += '<div class="ref-pie-legend">';
    html += '<div class="ref-legend-item"><span class="ref-swatch" style="background:#22c55e;"></span><span>Normal 40%</span></div>';
    html += '<div class="ref-legend-item"><span class="ref-swatch" style="background:#ef4444;"></span><span>Flagged 60%</span></div>';
    html += '</div></div></div>';

    html += '</div>';

    // RIGHT: Main trial content
    html += '<div class="trial-main-content">';

    // Header Card -- firm size label
    html += '<div class="trial-header-card">';
    html += '<div class="trial-header-firm">Firm ' + (page.trialIndex + 1) + ' of ' + page.totalTrials + '</div>';
    html += '<div class="trial-header-stats">';
    html += '<div class="trial-header-stat"><span class="trial-header-stat-label">' + sizeLabel + ' Firm</span><span class="trial-header-stat-value">' + trial.N + ' transactions<span class="firm-size-badge ' + badgeClass + '">' + sizeLabel + '</span></span></div>';
    html += '</div></div>';

    // Stimulus Display (list format with document icons)
    html += '<div class="stimulus-display">';
    html += '<div class="stimulus-title">Disclosed Transactions</div>';
    html += '<div class="disclosed-list">';
    html += '<div class="disclosed-list-item"><span class="doc-icon doc-icon-normal">N</span><span class="disclosed-list-label">Normal</span><span class="disclosed-list-count">' + trial.dN + '</span></div>';
    html += '<div class="disclosed-list-item"><span class="doc-icon doc-icon-flagged">F</span><span class="disclosed-list-label">Flagged</span><span class="disclosed-list-count">' + trial.nFlagged + '</span></div>';
    html += '</div>';
    html += '</div>';

    // DV1: Fraud Probability Slider (default 20%, 10% increments)
    html += '<div class="dv-card">';
    html += '<div class="question-prompt">What is the probability that this firm is fraudulent?<span class="question-required">*</span></div>';
    html += '<div class="slider-sentence">This firm is <span class="slider-sentence-value" id="fraud_prob_display">20%</span> likely to be fraudulent.</div>';
    html += '<div class="slider-endpoint-labels">';
    html += '<span class="slider-endpoint-label clean">Certainly clean</span>';
    html += '<span class="slider-endpoint-label fraud">Certainly fraudulent</span>';
    html += '</div>';
    html += '<div class="slider-wrapper">';
    html += '<span class="slider-label">0%</span>';
    html += '<input type="range" class="slider-input" id="fraud_prob" name="fraud_prob" min="0" max="100" step="10" value="20" data-touched="false" data-display="fraud_prob_display">';
    html += '<span class="slider-label">100%</span>';
    html += '</div>';
    html += '<div class="slider-hint">Drag the slider to set your estimate (10% increments)</div>';
    html += '<div class="field-error" id="error_fraud_prob"></div>';
    html += '</div>';

    // DV2: Confidence (1-7 Likert)
    html += '<div class="dv-card" data-required="true" data-field-name="confidence" data-field-type="radio">';
    html += '<div class="question-prompt">How confident are you in your fraud assessment?<span class="question-required">*</span></div>';
    html += '<div class="option-list confidence-options">';
    var confLabels = ['1 - Not at all', '2 - Very slightly', '3 - Slightly', '4 - Moderately', '5 - Fairly', '6 - Very', '7 - Extremely confident'];
    for (var ci = 0; ci < confLabels.length; ci++) {
      html += '<div class="option-card"><input type="radio" name="confidence" value="' + (ci + 1) + '"><span class="option-label">' + esc(confLabels[ci]) + '</span></div>';
    }
    html += '</div>';
    html += '<div class="field-error" id="error_confidence"></div>';
    html += '</div>';

    html += '</div>'; // end .trial-main-content
    html += '</div>'; // end .trial-layout
    return html;
  };

  // ── Transition ─────────────────────────────────────────────────────────
  SurveyEngine.prototype.renderTransition = function (page) {
    var html = '<h1 class="page-title">' + (page.title || 'Next Part') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';
    return html;
  };

  // ── Attention Check ────────────────────────────────────────────────────
  SurveyEngine.prototype.renderAttentionCheck = function (page) {
    var html = '<div class="question-block">';
    html += '<div class="question-prompt">' + (page.question || '') + '</div>';
    if (page.description) html += '<div class="question-description">' + page.description + '</div>';
    html += '<div class="option-list">';
    var name = 'attn_' + page.id;
    (page.options || []).forEach(function (opt) {
      var val = typeof opt === 'object' ? opt.value : opt;
      var label = typeof opt === 'object' ? opt.label : opt;
      html += '<div class="option-card"><input type="radio" name="' + name + '" value="' + esc(val) + '"><span class="option-label">' + esc(label) + '</span></div>';
    });
    html += '</div>';
    html += '<div class="field-error" id="error_' + name + '"></div></div>';
    return html;
  };

  // ── Trial Attention Check ──────────────────────────────────────────────
  SurveyEngine.prototype.renderTrialAttention = function (page) {
    var trial = page.trial;
    var sizeLabel = this.getFirmSizeLabel(trial.N);
    var html = '<h1 class="page-title">Attention Check</h1>';
    html += '<p>Please answer these questions about the firm you just evaluated.</p>';

    // Q1: Firm size (total transactions)
    var sizeOptions = [
      { value: 10, label: 'Small (10 transactions)' },
      { value: 20, label: 'Medium (20 transactions)' },
      { value: 50, label: 'Large (50 transactions)' }
    ];
    html += '<div class="question-block" data-required="true" data-field-name="attn_n" data-field-type="radio">';
    html += '<div class="question-prompt">What size was this firm?</div>';
    html += '<div class="option-list">';
    sizeOptions.forEach(function (opt) {
      html += '<div class="option-card"><input type="radio" name="attn_n" value="' + opt.value + '"><span class="option-label">' + opt.label + '</span></div>';
    });
    html += '</div><div class="field-error" id="error_attn_n"></div></div>';

    // Q2: Disclosed transactions
    var dOptions = this.buildAttentionOptions(trial.D, [2, 4, 6, 8]);
    html += '<div class="question-block" data-required="true" data-field-name="attn_d" data-field-type="radio">';
    html += '<div class="question-prompt">How many transactions did the manager show you?</div>';
    html += '<div class="option-list">';
    dOptions.forEach(function (d) {
      html += '<div class="option-card"><input type="radio" name="attn_d" value="' + d + '"><span class="option-label">' + d + '</span></div>';
    });
    html += '</div><div class="field-error" id="error_attn_d"></div></div>';

    // Q3: Flagged count
    html += '<div class="question-block" data-required="true" data-field-name="attn_flag" data-field-type="number">';
    html += '<div class="question-prompt">How many Flagged transactions did the manager show you?</div>';
    html += '<div class="number-input-wrapper">';
    html += '<input type="number" class="number-input" id="attn_flag" name="attn_flag" min="0" max="' + trial.D + '" step="1" placeholder="?">';
    html += '</div><div class="field-error" id="error_attn_flag"></div></div>';

    return html;
  };

  SurveyEngine.prototype.buildAttentionOptions = function (correctValue, allPossible) {
    var options = [correctValue];
    for (var i = 0; i < allPossible.length; i++) {
      if (allPossible[i] !== correctValue && options.length < 4) options.push(allPossible[i]);
    }
    var multipliers = [0.5, 2, 0.1, 10, 0.25, 5];
    for (var m = 0; m < multipliers.length && options.length < 4; m++) {
      var candidate = Math.round(correctValue * multipliers[m]);
      if (candidate > 0 && options.indexOf(candidate) === -1) options.push(candidate);
    }
    options.sort(function (a, b) { return a - b; });
    return options;
  };

  // ── Questionnaire ──────────────────────────────────────────────────────
  SurveyEngine.prototype.renderQuestionnaire = function (page) {
    var html = '';
    if (page.title) html += '<h1 class="page-title">' + page.title + '</h1>';
    if (page.description) html += '<div class="page-body">' + page.description + '</div>';
    var self = this;
    (page.questions || []).forEach(function (q) { html += self.renderQuestion(q); });
    return html;
  };

  SurveyEngine.prototype.renderQuestion = function (q) {
    var html = '<div class="question-block" data-required="' + (q.required !== false) + '" data-field-name="' + q.id + '" data-field-type="' + q.type + '">';
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
          html += '<div class="option-card"><input type="radio" name="' + q.id + '" value="' + esc(val) + '"><span class="option-label">' + esc(label) + '</span></div>';
        });
        html += '</div>';
        break;
      case 'number':
        html += '<div class="number-input-wrapper"><input type="number" class="number-input" id="' + q.id + '" name="' + q.id + '"';
        if (q.min !== undefined) html += ' min="' + q.min + '"';
        if (q.max !== undefined) html += ' max="' + q.max + '"';
        if (q.step !== undefined) html += ' step="' + q.step + '"';
        html += ' placeholder="?"></div>';
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
        html += '<div class="likert-container"><div class="likert-labels">';
        html += '<span class="likert-label-low">' + (q.minLabel || q.min || '') + '</span>';
        html += '<span class="likert-label-high">' + (q.maxLabel || q.max || '') + '</span>';
        html += '</div><div class="likert-options">';
        for (var v = (q.min || 1); v <= (q.max || 7); v++) {
          html += '<div class="likert-option"><input type="radio" name="' + q.id + '" value="' + v + '" id="' + q.id + '_' + v + '"><label for="' + q.id + '_' + v + '">' + v + '</label></div>';
        }
        html += '</div></div>';
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
    html += '<div class="field-error" id="error_' + q.id + '"></div></div>';
    return html;
  };

  // ── Slider Demo (Part 1 Try-the-Slider page) ───────────────────────────
  SurveyEngine.prototype.renderSliderDemo = function (page) {
    var html = '<h1 class="page-title">' + (page.title || 'Try the Slider') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';
    html += '<div class="dv-card" style="max-width:620px; margin:0 auto;">';
    html += '<div class="slider-sentence">This firm is <span class="slider-sentence-value" id="demo_slider_display">50%</span> likely to be fraudulent.</div>';
    html += '<div class="slider-endpoint-labels">';
    html += '<span class="slider-endpoint-label clean">Certainly clean</span>';
    html += '<span class="slider-endpoint-label fraud">Certainly fraudulent</span>';
    html += '</div>';
    html += '<div class="slider-wrapper">';
    html += '<span class="slider-label">0%</span>';
    html += '<input type="range" class="slider-input" id="demo_slider" name="demo_slider" ' +
            'min="0" max="100" step="10" value="50" data-touched="false" data-display="demo_slider_display">';
    html += '<span class="slider-label">100%</span>';
    html += '</div>';
    html += '<div class="slider-hint">' +
      (page.hint || 'Drag the slider. It moves in 10% increments.') +
      '</div>';
    html += '<div class="field-error" id="error_demo_slider"></div>';
    html += '</div>';
    return html;
  };

  // ── Slider Tutorial ────────────────────────────────────────────────────
  SurveyEngine.prototype.renderSliderTutorial = function (page) {
    var html = '<h1 class="page-title">' + (page.title || 'How to Answer') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';
    html += '<div class="tutorial-slider-section">';
    html += '<p class="tutorial-prompt">Try it now! Move the slider to <strong>' + (page.targetValue || '75') + '%</strong>:</p>';
    html += '<div class="slider-value-display" id="tutorial_slider_value">50%</div>';
    html += '<div class="slider-wrapper"><span class="slider-label">0%</span>';
    html += '<input type="range" class="slider-input" id="tutorial_slider" min="0" max="100" step="10" value="50" data-touched="false" data-display="tutorial_slider_value">';
    html += '<span class="slider-label">100%</span></div>';
    html += '<div class="slider-hint">Drag the slider left or right</div></div>';
    return html;
  };

  // ── Completion (Part 1 pass) ───────────────────────────────────────────
  SurveyEngine.prototype.renderCompletion = function (page) {
    var self = this;
    var html = '<h1 class="page-title">' + (page.title || 'Complete!') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';

    var codes = this.config.prolific ? this.config.prolific.completionCodes : {};
    var urls = this.config.prolific ? this.config.prolific.completionUrls : {};
    var code = codes.pass1 || 'XXXXXX';
    var redirectUrl = urls.pass1 || '';

    html += '<p style="margin-top:24px;">Your completion code:</p>';
    html += '<div class="completion-code">' + esc(code) + '</div>';

    var part2Url = this.config.prolific ? this.config.prolific.part2StudyUrl : '';
    if (this.part === 1 && part2Url) {
      html += '<p style="margin-top:24px;text-align:center;"><a href="' + esc(part2Url) + '" class="btn btn-primary" style="display:inline-block;font-size:18px;padding:14px 32px;text-decoration:none;">Continue to Part 2</a></p>';
      html += '<p style="text-align:center;margin-top:8px;color:#6b7280;font-size:14px;">You will also need to submit your completion code above on Prolific.</p>';
    } else if (redirectUrl) {
      html += '<p style="margin-top:16px;text-align:center;"><a href="' + esc(redirectUrl) + '" class="btn btn-primary" style="display:inline-block;margin-top:8px;text-decoration:none;">Return to Prolific</a></p>';
    }

    html += '<div id="submit_status" class="alert alert-info" style="margin-top:24px;">Submitting your responses... <span class="spinner"></span></div>';

    this.config.completionUrl = redirectUrl;
    setTimeout(function () { self.submitted = false; self.submitData(); }, 500);
    return html;
  };

  // ── Part 1 Fail ────────────────────────────────────────────────────────
  SurveyEngine.prototype.renderPart1Fail = function () {
    var self = this;
    var codes = this.config.prolific ? this.config.prolific.completionCodes : {};
    var urls = this.config.prolific ? this.config.prolific.completionUrls : {};
    var code = codes.fail1 || 'XXXXXX';
    var failUrl = urls.fail1 || '';

    var failLink = failUrl
      ? '<p style="margin-top:16px;text-align:center;"><a href="' + esc(failUrl) + '" class="btn btn-primary" style="display:inline-block;margin-top:8px;text-decoration:none;">Return to Prolific</a></p>'
      : '';

    this.elContent.innerHTML =
      '<h1 class="page-title">Thank You</h1>' +
      '<div class="page-body"><p>Unfortunately, you were unable to answer the comprehension questions correctly. We are unable to include you in Part 2 of this study.</p>' +
      '<p>You will still be paid for completing this part. Thank you for your time!</p></div>' +
      '<p style="margin-top:24px;">Your completion code:</p>' +
      '<div class="completion-code">' + esc(code) + '</div>' +
      failLink +
      '<div id="submit_status" class="alert alert-info" style="margin-top:24px;">Submitting your responses... <span class="spinner"></span></div>';
    this.elNavButtons.style.display = 'none';

    this.config.completionUrl = failUrl;
    setTimeout(function () { self.submitted = false; self.submitData(); }, 500);
  };

  // ── Debrief ────────────────────────────────────────────────────────────
  SurveyEngine.prototype.renderDebrief = function (page) {
    var self = this;
    var html = '<h1 class="page-title">' + (page.title || 'Thank You!') + '</h1>';
    html += '<div class="page-body">' + (page.body || '') + '</div>';

    if (page.showBonus && this.bonusInfo && this.bonusInfo.enabled && this.bonusInfo.amount !== undefined) {
      html += '<div class="bonus-display">';
      html += '<div class="bonus-amount">' + this.bonusInfo.currency + ' ' + this.bonusInfo.amount.toFixed(2) + '</div>';
      html += '<div class="bonus-detail">Your bonus based on trial ' + this.bonusInfo.selectedTrialId + '</div>';
      html += '<div class="bonus-detail">Your estimate: ' + this.bonusInfo.fraudProb + '% | Benchmark: ' + (this.bonusInfo.bayesPosterior * 100).toFixed(1) + '% | Error: ' + this.bonusInfo.errorPp.toFixed(1) + ' pp</div>';
      html += '</div>';
    }

    var codes = this.config.prolific ? this.config.prolific.completionCodes : {};
    var urls = this.config.prolific ? this.config.prolific.completionUrls : {};
    var debriefCode = codes.comp2 || page.completionCode || 'XXXXXX';
    html += '<p style="margin-top:24px;">Your completion code:</p>';
    html += '<div class="completion-code">' + esc(debriefCode) + '</div>';

    html += '<div id="submit_status" class="alert alert-info" style="margin-top:24px;">Submitting your responses... <span class="spinner"></span></div>';

    this.config.completionUrl = urls.comp2 || '';
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
    var endpoint = this.config.study ? this.config.study.dataEndpoint : '';

    if (this.devMode) {
      if (statusEl) {
        statusEl.className = 'alert alert-success';
        statusEl.innerHTML = '[DEV MODE] Submission skipped. Data logged to console.';
      }
      console.log('Survey data:', JSON.stringify(data, null, 2));
      return;
    }

    if (window.DataStorage && endpoint) {
      window.DataStorage.submit(data, endpoint, function (success) {
        if (success) {
          if (statusEl) {
            statusEl.className = 'alert alert-success';
            statusEl.innerHTML = 'Responses submitted successfully! Redirecting to Prolific...';
          }
          window.DataStorage.clearProgress();
          if (completionUrl) { setTimeout(function () { window.location.href = completionUrl; }, 2000); }
        } else {
          if (statusEl) {
            statusEl.className = 'alert alert-warning';
            statusEl.innerHTML = '<p><strong>Submission encountered an issue.</strong></p>' +
              '<p>Your completion code is shown above. Please copy it and return to Prolific.</p>' +
              '<p>If possible, please also copy the data below and email it to the researcher:</p>' +
              '<textarea class="textarea-input" style="font-size:11px;margin-top:8px;" readonly>' + JSON.stringify(data) + '</textarea>';
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

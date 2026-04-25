/* ==========================================================================
   FBO 2 (Selection Neglect) -- Experiment Configuration v5.0

   Structure (matches docs/survey_script.md):
     ACT I    -- Consent & Overview           (5 pages)
     ACT II   -- How to Read a Company        (13 pages, incl. attention
                                                 check after 50/50 anchor)
     ACT III  -- The Manager                  (10 pages)
     ACT IV   -- Stakes & Bonus               (11 pages, incl. interactive
                                                 try-it pages)
     ACT V    -- 13-question comprehension quiz
     ACT VI   -- 30 scored trials in 2 blocks:
                 Block 1: 15 companies (K=4, N in {10,20,30}, k in {0..4})
                 Block 2: 15 companies (K=8, N in {10,20,30}, k in {0,1,4,7,8})
                 [rule change between blocks: K=4 -> K=8]
     ACT VII  -- Demographics + debrief

   Bonus rule:
     base = $4.00, guaranteed.
     per company:
       within 10 percentage points of truth  :  +10¢ answer  +  bet_cents (win bet)
       outside                                :   0¢         -  bet_cents (lose bet)
     bet in [0,10], default 0.  per company range: [-10¢, +20¢].
     total bonus = sum over all 30 companies, floored at $0, capped at $6.00.
     base pay NEVER reduced by lost bets.
   ========================================================================== */

var SURVEY_CONFIG = {

  // -- Study Metadata -------------------------------------------------------
  study: {
    title: "Decision Making Study",
    version: "5.0.0",
    dataEndpoint: "https://script.google.com/macros/s/AKfycbwUkl3FnttwsmkiQ0jRD_UOgyYSCwVERR2_2oTre_ib50bltFzTMk3TPuQdzefWy-OX/exec"
  },

  // -- Prolific Integration -------------------------------------------------
  // Single-study design (v4.x). No more two-part + participant-group gate.
  // Every participant who finishes the survey hits the same completion code
  // and the same debrief page.
  prolific: {
    completionCode: "COMP2SN",
    completionUrl: "https://app.prolific.com/submissions/complete?cc=COMP2SN"
  },

  // -- Attention check count during trials ---------------------------------
  trialAttentionCheckCount: 3,

  // -- Bonus parameters -----------------------------------------------------
  bonus: {
    enabled: true,
    currency: "USD",
    fixedBase: 4.00,          // guaranteed base pay (untouched by penalties)
    answerCents: 10,          // 10¢ if estimate is within threshold
    betMaxCents: 10,          // bet slider 0..10 cents
    accuracyThreshold: 0.10,  // "within 10 percentage points"
    maxBonus: 6.00,           // 30 trials × 20¢ max
    floor: 0.00,              // total bonus floored at $0 (base untouched)
    selectionMethod: "sum_all_trials"
  },

  // -- Stimuli --------------------------------------------------------------
  //
  // Each trial:
  //   id, phase, K, k, N, nClean=K-k, hidden=N-K,
  //   thetaSN    = k / K               (selection-neglect prediction)
  //   thetaNV    = (k + 0.5*(N-K))/N   (naive / uniform-prior prediction)
  //   thetaTrue  = payment benchmark, PIECEWISE under strategic disclosure:
  //                  k = 0:  thetaTrue = (N-K)/(2*N)  = thetaNV
  //                            (manager who hid 0 disclosed-suspicious is
  //                             consistent with any s in {0,...,N-K};
  //                             under uniform prior, posterior mean is the
  //                             midpoint of that range. Same number as the
  //                             "naive" formula, but for a Bayesian reason.)
  //                  k >= 1: thetaTrue = (k + N - K)/N
  //                            (strategic-K disclosure with k>=1 forced
  //                             implies s = N-K+k uniquely, so all hidden
  //                             transactions are suspicious -- unraveling.)
  //   thetaRB    = thetaTrue           (rational benchmark, alias)
  //
  // Legacy aliases kept for engine.js plumbing:
  //   D = K, dN = K-k, nFlagged = k,
  //   bayesPosterior = thetaRB, snPosterior = thetaSN, mrPosterior = thetaNV
  //
  // phase=1: K=4 (N in {10,20,30}, k in {0,1,2,3,4})         [15 trials]
  // phase=2: K=8 (N in {10,20,30}, k in {0,1,4,7,8})         [15 trials]
  // 5 disclosure compositions per K: all C, k-1 C & 1 S, half/half,
  //   1 C & k-1 S, all S.
  stimuli: [
    // ── Phase 1: K=4, N in {10,20,30}, k in {0,1,2,3,4} ─────────
    { id: "p1t01", phase: 1, K: 4, k: 0, N: 10, nClean: 4, hidden:  6, thetaTrue: 0.300, thetaSN: 0.000, thetaNV: 0.300, thetaRB: 0.300,
      D: 4, dN: 4, nFlagged: 0, bayesPosterior: 0.300, snPosterior: 0.000, mrPosterior: 0.300 },
    { id: "p1t02", phase: 1, K: 4, k: 1, N: 10, nClean: 3, hidden:  6, thetaTrue: 0.700, thetaSN: 0.250, thetaNV: 0.400, thetaRB: 0.700,
      D: 4, dN: 3, nFlagged: 1, bayesPosterior: 0.700, snPosterior: 0.250, mrPosterior: 0.400 },
    { id: "p1t03", phase: 1, K: 4, k: 2, N: 10, nClean: 2, hidden:  6, thetaTrue: 0.800, thetaSN: 0.500, thetaNV: 0.500, thetaRB: 0.800,
      D: 4, dN: 2, nFlagged: 2, bayesPosterior: 0.800, snPosterior: 0.500, mrPosterior: 0.500 },
    { id: "p1t04", phase: 1, K: 4, k: 3, N: 10, nClean: 1, hidden:  6, thetaTrue: 0.900, thetaSN: 0.750, thetaNV: 0.600, thetaRB: 0.900,
      D: 4, dN: 1, nFlagged: 3, bayesPosterior: 0.900, snPosterior: 0.750, mrPosterior: 0.600 },
    { id: "p1t05", phase: 1, K: 4, k: 4, N: 10, nClean: 0, hidden:  6, thetaTrue: 1.000, thetaSN: 1.000, thetaNV: 0.700, thetaRB: 1.000,
      D: 4, dN: 0, nFlagged: 4, bayesPosterior: 1.000, snPosterior: 1.000, mrPosterior: 0.700 },
    { id: "p1t06", phase: 1, K: 4, k: 0, N: 20, nClean: 4, hidden: 16, thetaTrue: 0.400, thetaSN: 0.000, thetaNV: 0.400, thetaRB: 0.400,
      D: 4, dN: 4, nFlagged: 0, bayesPosterior: 0.400, snPosterior: 0.000, mrPosterior: 0.400 },
    { id: "p1t07", phase: 1, K: 4, k: 1, N: 20, nClean: 3, hidden: 16, thetaTrue: 0.850, thetaSN: 0.250, thetaNV: 0.450, thetaRB: 0.850,
      D: 4, dN: 3, nFlagged: 1, bayesPosterior: 0.850, snPosterior: 0.250, mrPosterior: 0.450 },
    { id: "p1t08", phase: 1, K: 4, k: 2, N: 20, nClean: 2, hidden: 16, thetaTrue: 0.900, thetaSN: 0.500, thetaNV: 0.500, thetaRB: 0.900,
      D: 4, dN: 2, nFlagged: 2, bayesPosterior: 0.900, snPosterior: 0.500, mrPosterior: 0.500 },
    { id: "p1t09", phase: 1, K: 4, k: 3, N: 20, nClean: 1, hidden: 16, thetaTrue: 0.950, thetaSN: 0.750, thetaNV: 0.550, thetaRB: 0.950,
      D: 4, dN: 1, nFlagged: 3, bayesPosterior: 0.950, snPosterior: 0.750, mrPosterior: 0.550 },
    { id: "p1t10", phase: 1, K: 4, k: 4, N: 20, nClean: 0, hidden: 16, thetaTrue: 1.000, thetaSN: 1.000, thetaNV: 0.600, thetaRB: 1.000,
      D: 4, dN: 0, nFlagged: 4, bayesPosterior: 1.000, snPosterior: 1.000, mrPosterior: 0.600 },
    { id: "p1t11", phase: 1, K: 4, k: 0, N: 30, nClean: 4, hidden: 26, thetaTrue: 0.433, thetaSN: 0.000, thetaNV: 0.433, thetaRB: 0.433,
      D: 4, dN: 4, nFlagged: 0, bayesPosterior: 0.433, snPosterior: 0.000, mrPosterior: 0.433 },
    { id: "p1t12", phase: 1, K: 4, k: 1, N: 30, nClean: 3, hidden: 26, thetaTrue: 0.900, thetaSN: 0.250, thetaNV: 0.467, thetaRB: 0.900,
      D: 4, dN: 3, nFlagged: 1, bayesPosterior: 0.900, snPosterior: 0.250, mrPosterior: 0.467 },
    { id: "p1t13", phase: 1, K: 4, k: 2, N: 30, nClean: 2, hidden: 26, thetaTrue: 0.933, thetaSN: 0.500, thetaNV: 0.500, thetaRB: 0.933,
      D: 4, dN: 2, nFlagged: 2, bayesPosterior: 0.933, snPosterior: 0.500, mrPosterior: 0.500 },
    { id: "p1t14", phase: 1, K: 4, k: 3, N: 30, nClean: 1, hidden: 26, thetaTrue: 0.967, thetaSN: 0.750, thetaNV: 0.533, thetaRB: 0.967,
      D: 4, dN: 1, nFlagged: 3, bayesPosterior: 0.967, snPosterior: 0.750, mrPosterior: 0.533 },
    { id: "p1t15", phase: 1, K: 4, k: 4, N: 30, nClean: 0, hidden: 26, thetaTrue: 1.000, thetaSN: 1.000, thetaNV: 0.567, thetaRB: 1.000,
      D: 4, dN: 0, nFlagged: 4, bayesPosterior: 1.000, snPosterior: 1.000, mrPosterior: 0.567 },

    // ── Phase 2: K=8, N in {10,20,30}, k in {0,1,4,7,8} ─────────
    { id: "p2t01", phase: 2, K: 8, k: 0, N: 10, nClean: 8, hidden:  2, thetaTrue: 0.100, thetaSN: 0.000, thetaNV: 0.100, thetaRB: 0.100,
      D: 8, dN: 8, nFlagged: 0, bayesPosterior: 0.100, snPosterior: 0.000, mrPosterior: 0.100 },
    { id: "p2t02", phase: 2, K: 8, k: 1, N: 10, nClean: 7, hidden:  2, thetaTrue: 0.300, thetaSN: 0.125, thetaNV: 0.200, thetaRB: 0.300,
      D: 8, dN: 7, nFlagged: 1, bayesPosterior: 0.300, snPosterior: 0.125, mrPosterior: 0.200 },
    { id: "p2t03", phase: 2, K: 8, k: 4, N: 10, nClean: 4, hidden:  2, thetaTrue: 0.600, thetaSN: 0.500, thetaNV: 0.500, thetaRB: 0.600,
      D: 8, dN: 4, nFlagged: 4, bayesPosterior: 0.600, snPosterior: 0.500, mrPosterior: 0.500 },
    { id: "p2t04", phase: 2, K: 8, k: 7, N: 10, nClean: 1, hidden:  2, thetaTrue: 0.900, thetaSN: 0.875, thetaNV: 0.800, thetaRB: 0.900,
      D: 8, dN: 1, nFlagged: 7, bayesPosterior: 0.900, snPosterior: 0.875, mrPosterior: 0.800 },
    { id: "p2t05", phase: 2, K: 8, k: 8, N: 10, nClean: 0, hidden:  2, thetaTrue: 1.000, thetaSN: 1.000, thetaNV: 0.900, thetaRB: 1.000,
      D: 8, dN: 0, nFlagged: 8, bayesPosterior: 1.000, snPosterior: 1.000, mrPosterior: 0.900 },
    { id: "p2t06", phase: 2, K: 8, k: 0, N: 20, nClean: 8, hidden: 12, thetaTrue: 0.300, thetaSN: 0.000, thetaNV: 0.300, thetaRB: 0.300,
      D: 8, dN: 8, nFlagged: 0, bayesPosterior: 0.300, snPosterior: 0.000, mrPosterior: 0.300 },
    { id: "p2t07", phase: 2, K: 8, k: 1, N: 20, nClean: 7, hidden: 12, thetaTrue: 0.650, thetaSN: 0.125, thetaNV: 0.350, thetaRB: 0.650,
      D: 8, dN: 7, nFlagged: 1, bayesPosterior: 0.650, snPosterior: 0.125, mrPosterior: 0.350 },
    { id: "p2t08", phase: 2, K: 8, k: 4, N: 20, nClean: 4, hidden: 12, thetaTrue: 0.800, thetaSN: 0.500, thetaNV: 0.500, thetaRB: 0.800,
      D: 8, dN: 4, nFlagged: 4, bayesPosterior: 0.800, snPosterior: 0.500, mrPosterior: 0.500 },
    { id: "p2t09", phase: 2, K: 8, k: 7, N: 20, nClean: 1, hidden: 12, thetaTrue: 0.950, thetaSN: 0.875, thetaNV: 0.650, thetaRB: 0.950,
      D: 8, dN: 1, nFlagged: 7, bayesPosterior: 0.950, snPosterior: 0.875, mrPosterior: 0.650 },
    { id: "p2t10", phase: 2, K: 8, k: 8, N: 20, nClean: 0, hidden: 12, thetaTrue: 1.000, thetaSN: 1.000, thetaNV: 0.700, thetaRB: 1.000,
      D: 8, dN: 0, nFlagged: 8, bayesPosterior: 1.000, snPosterior: 1.000, mrPosterior: 0.700 },
    { id: "p2t11", phase: 2, K: 8, k: 0, N: 30, nClean: 8, hidden: 22, thetaTrue: 0.367, thetaSN: 0.000, thetaNV: 0.367, thetaRB: 0.367,
      D: 8, dN: 8, nFlagged: 0, bayesPosterior: 0.367, snPosterior: 0.000, mrPosterior: 0.367 },
    { id: "p2t12", phase: 2, K: 8, k: 1, N: 30, nClean: 7, hidden: 22, thetaTrue: 0.767, thetaSN: 0.125, thetaNV: 0.400, thetaRB: 0.767,
      D: 8, dN: 7, nFlagged: 1, bayesPosterior: 0.767, snPosterior: 0.125, mrPosterior: 0.400 },
    { id: "p2t13", phase: 2, K: 8, k: 4, N: 30, nClean: 4, hidden: 22, thetaTrue: 0.867, thetaSN: 0.500, thetaNV: 0.500, thetaRB: 0.867,
      D: 8, dN: 4, nFlagged: 4, bayesPosterior: 0.867, snPosterior: 0.500, mrPosterior: 0.500 },
    { id: "p2t14", phase: 2, K: 8, k: 7, N: 30, nClean: 1, hidden: 22, thetaTrue: 0.967, thetaSN: 0.875, thetaNV: 0.600, thetaRB: 0.967,
      D: 8, dN: 1, nFlagged: 7, bayesPosterior: 0.967, snPosterior: 0.875, mrPosterior: 0.600 },
    { id: "p2t15", phase: 2, K: 8, k: 8, N: 30, nClean: 0, hidden: 22, thetaTrue: 1.000, thetaSN: 1.000, thetaNV: 0.633, thetaRB: 1.000,
      D: 8, dN: 0, nFlagged: 8, bayesPosterior: 1.000, snPosterior: 1.000, mrPosterior: 0.633 }
  ],

  // ====================================================================
  //  PAGES (single flow, no Part 1 / Part 2 split)
  // ====================================================================
  pages: [

    // ==================================================================
    //  ACT I -- CONSENT & OVERVIEW
    // ==================================================================

    // -- Page 1: Welcome (decision-making framing) ----------------------
    {
      id: "p1_intro_decisions",
      type: "instructions",
      title: "Welcome to our Study",
      body:
        "<p style='text-align:justify;'>This is a study about " +
        "<strong>decision-making</strong>. You'll face a series of " +
        "<strong>hypothetical scenarios</strong> where you make decisions. " +
        "<strong>The better your decisions, the more you earn.</strong></p>",
      minTimeSeconds: 5
    },

    // -- Page 2: Role only (no auditing background) ---------------------
    {
      id: "p1_intro_role",
      type: "instructions",
      title: "What the Study is About",
      body:
        "<p style='text-align:justify;'>You'll play the role of a " +
        "<strong>government auditor</strong> screening companies for fraud. " +
        "<strong>No auditing background is needed. The scenario is simplified.</strong></p>",
      minTimeSeconds: 5
    },

    // -- Page 2b: Introduction (read carefully + attention checks) ------
    {
      id: "p1_intro_attention",
      type: "instructions",
      title: "Introduction",
      body:
        "<p style='text-align:justify;'>Please " +
        "<strong>read the instructions carefully</strong>. Throughout the study " +
        "you'll see short attention checks and quizzes to test your understanding " +
        "of your task. You can try each one as many times as you need.</p>" +
        "<p style='text-align:justify; margin-top:14px; padding:12px 14px; " +
        "background:#fee2e2; border-left:4px solid #b91c1c; border-radius:4px;'>" +
        "<strong style='color:#b91c1c; text-transform:uppercase; letter-spacing:0.5px;'>Important.</strong> " +
        "Every wrong answer triggers a <strong>10-second timeout</strong> before " +
        "you can try again. <strong>Think carefully about your answers.</strong></p>",
      minTimeSeconds: 10
    },

    // -- Page 3: IRB consent (checkbox) ---------------------------------
    {
      id: "p1_consent",
      type: "consent",
      title: "Consent",
      body:
        "<p style='text-align:justify;'><strong>What you'll do.</strong> Learn a simple " +
        "auditing task, then go through 30 auditing rounds.</p>" +
        "<p style='text-align:justify;'><strong>Time.</strong> About 20 minutes.</p>" +
        "<p style='text-align:justify;'><strong>Pay.</strong> $4.00 base + up to $6.00 " +
        "performance bonus. Base pay is <strong>guaranteed</strong>; no penalty can " +
        "reduce it.</p>" +
        "<p style='text-align:justify;'><strong>Risks.</strong> None beyond everyday life.</p>" +
        "<p style='text-align:justify;'><strong>Confidentiality.</strong> Anonymous. We " +
        "collect your Prolific ID only for payment.</p>" +
        "<p style='text-align:justify;'><strong>Voluntary.</strong> You may withdraw at " +
        "any time by closing this window.</p>" +
        "<p style='text-align:justify; margin-top:14px; padding:12px 14px; " +
        "background:#fee2e2; border-left:4px solid #b91c1c; border-radius:4px;'>" +
        "<strong style='color:#b91c1c; text-transform:uppercase; letter-spacing:0.5px;'>Important.</strong> " +
        "This study includes hidden checks for automated agents (e.g., AI assistants " +
        "completing the form on your behalf). If detected, the survey will end " +
        "immediately. <strong>No completion code will be issued, and no payment will " +
        "be made.</strong> Please complete the study yourself.</p>",
      mustAgree: true,
      declineMessage: "You must agree to participate in order to continue.",
      minTimeSeconds: 15
    },

    // -- Page 4: Overview -----------------------------------------------
    {
      id: "p1_overview",
      type: "instructions",
      title: "",
      body:
        "<div class='mission-badge'>" +
          "<svg viewBox='0 0 100 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
            "<defs>" +
              "<linearGradient id='auditorMagMain' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                "<stop offset='0%' stop-color='#0ea5a0'/>" +
                "<stop offset='100%' stop-color='#0f766e'/>" +
              "</linearGradient>" +
            "</defs>" +
            "<rect x='16' y='18' width='54' height='72' rx='4' fill='#ffffff' stroke='#0f766e' stroke-width='2'/>" +
            "<line x1='24' y1='32' x2='62' y2='32' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
            "<line x1='24' y1='42' x2='58' y2='42' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
            "<line x1='24' y1='52' x2='62' y2='52' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
            "<line x1='24' y1='62' x2='50' y2='62' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
            "<circle cx='66' cy='72' r='20' fill='none' stroke='url(#auditorMagMain)' stroke-width='7'/>" +
            "<circle cx='66' cy='72' r='16' fill='#ccfbf1' opacity='0.5'/>" +
            "<line x1='80' y1='86' x2='96' y2='104' stroke='url(#auditorMagMain)' stroke-width='8' stroke-linecap='round'/>" +
          "</svg>" +
          "<div class='mission-badge-label'>GOVERNMENT AUDITOR</div>" +
        "</div>" +
        "<p style='text-align:justify; font-size:18px; max-width:620px; margin:0 auto; line-height:1.65;'>" +
          "You play the role of a <strong>government auditor</strong>. For each company, you review its " +
          "transactions and provide a preliminary <strong>fraud estimate</strong>." +
        "</p>" +
        "<p style='text-align:justify; font-size:18px; max-width:620px; margin:18px auto 0; line-height:1.65;'>" +
          "At the end of the study, we reveal each company's <strong>correct answer</strong>. " +
          "<strong>The closer your estimate to the correct answer, the more you earn.</strong>" +
        "</p>",
      minTimeSeconds: 10
    },

    // -- Page 5: Quick attention check ----------------------------------
    {
      id: "p1_overview_check",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "In this study, what is your task?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='audit' data-mode='retry' " +
             "data-explain='You assign fraud estimates. The more accurate you are, the more you earn.'>" +
          "<button type='button' class='practice-btn' data-val='sell'>Decide which company to sell products to.</button>" +
          "<button type='button' class='practice-btn' data-val='audit'>Assign a fraud estimate to each company.</button>" +
          "<button type='button' class='practice-btn' data-val='rate'>Give each company a customer-service score.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Page 6: Transition -- "now the details" ------------------------
    {
      id: "p1_inst_mission",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; max-width:620px; margin:0 auto 16px; font-weight:700;'>" +
          "What follows: the details." +
        "</p>" +
        "<p style='text-align:justify; font-size:17px; max-width:620px; margin:0 auto; line-height:1.6;'>" +
          "The next section explains the auditing process, the two types of transactions, " +
          "and how the bonus is calculated." +
        "</p>",
      minTimeSeconds: 5
    },

    // ==================================================================
    //  ACT II -- HOW TO READ A FIRM
    // ==================================================================

    // -- Page 7: A transaction (neutral document icon) ------------------
    {
      id: "p2_inst_transaction_intro",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; max-width:620px; margin:0 auto 8px; font-weight:600;'>" +
          "How do you assess a company for fraud?" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px;'>" +
          "By examining the company's <strong>transactions</strong>." +
        "</p>" +
        "<div style='display:flex; justify-content:center; margin:12px 0;'>" +
          "<div class='transaction-doc neutral large'></div>" +
        "</div>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:18px auto 0; line-height:1.6;'>" +
          "This is a single transaction. You will not need to read its contents. " +
          "You only need to know <strong>what type</strong> of transaction it is." +
        "</p>",
      minTimeSeconds: 8
    },

    // -- Page 8: Clean transaction --------------------------------------
    {
      id: "p2_inst_transaction_clean",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; margin:0 auto 28px; font-weight:600;'>" +
          "Each transaction is one of two types." +
        "</p>" +
        "<div class='two-types-row'>" +
          "<div class='transaction-doc-wrap'>" +
            "<div class='transaction-doc large clean'>C</div>" +
            "<div class='transaction-doc-caption' style='color:#15803d;'>Clean</div>" +
          "</div>" +
          "<div class='transaction-doc-wrap' style='visibility:hidden;' aria-hidden='true'>" +
            "<div class='transaction-doc large'></div>" +
            "<div class='transaction-doc-caption'>&nbsp;</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 3
    },

    // -- Page 9: Clean AND Suspicious transactions ----------------------
    {
      id: "p2_inst_transactions_both",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; margin:0 auto 28px; font-weight:600;'>" +
          "Each transaction is one of two types." +
        "</p>" +
        "<div class='two-types-row'>" +
          "<div class='transaction-doc-wrap'>" +
            "<div class='transaction-doc large clean'>C</div>" +
            "<div class='transaction-doc-caption' style='color:#15803d;'>Clean</div>" +
          "</div>" +
          "<div class='transaction-doc-wrap'>" +
            "<div class='transaction-doc large suspicious'>S</div>" +
            "<div class='transaction-doc-caption' style='color:#b91c1c;'>Suspicious</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 2
    },

    // -- Page 10: 50/50 coin flip ---------------------------------------
    {
      id: "p2_inst_fifty_fifty",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; margin:0 auto 22px; max-width:620px;'>" +
          "Any given transaction is a coin flip." +
        "</p>" +
        "<div class='two-types-row'>" +
          "<div class='transaction-doc-wrap'>" +
            "<div class='transaction-doc large clean'>C</div>" +
            "<div class='transaction-doc-caption coin-flip-pct' style='color:#15803d;'>50%</div>" +
          "</div>" +
          "<div class='transaction-doc-wrap'>" +
            "<div class='transaction-doc large suspicious'>S</div>" +
            "<div class='transaction-doc-caption coin-flip-pct' style='color:#b91c1c;'>50%</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:24px; max-width:620px; margin:28px auto 0; line-height:1.5;'>" +
          "Your job is to assess the <strong>proportion of a company's transactions that are suspicious</strong>." +
        "</p>",
      minTimeSeconds: 5
    },

    // -- Page 10b: Attention check -- prob(transaction is clean)? ------
    // Placed immediately after the 50/50 coin-flip anchor so the idea is
    // tested while it's fresh, not only in the end-of-instructions quiz.
    {
      id: "p2_attn_coin_flip",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "What's the probability that any given transaction is <strong>clean</strong>?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='fifty' data-mode='retry' " +
             "data-explain='Any given transaction is a coin flip: 50% clean, 50% suspicious.'>" +
          "<button type='button' class='practice-btn' data-val='zero'>0%</button>" +
          "<button type='button' class='practice-btn' data-val='twentyfive'>25%</button>" +
          "<button type='button' class='practice-btn' data-val='fifty'>50%</button>" +
          "<button type='button' class='practice-btn' data-val='hundred'>100%</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 6
    },

    // -- Page 11: Companies have many transactions (cluster) ----------------
    {
      id: "p2_inst_cluster",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; margin:0 auto 22px; max-width:620px; font-weight:600;'>" +
          "Each company has many transactions." +
        "</p>" +
        "<div class='doc-cluster'>" +
          // 20 neutral document icons, positioned pseudo-randomly
          "<div class='cluster-doc' style='top:10%; left:18%;'></div>" +
          "<div class='cluster-doc' style='top:22%; left:32%;'></div>" +
          "<div class='cluster-doc' style='top:7%;  left:48%;'></div>" +
          "<div class='cluster-doc' style='top:28%; left:60%;'></div>" +
          "<div class='cluster-doc' style='top:12%; left:72%;'></div>" +
          "<div class='cluster-doc' style='top:38%; left:22%;'></div>" +
          "<div class='cluster-doc' style='top:40%; left:40%;'></div>" +
          "<div class='cluster-doc' style='top:46%; left:56%;'></div>" +
          "<div class='cluster-doc' style='top:32%; left:78%;'></div>" +
          "<div class='cluster-doc' style='top:56%; left:15%;'></div>" +
          "<div class='cluster-doc' style='top:60%; left:34%;'></div>" +
          "<div class='cluster-doc' style='top:54%; left:50%;'></div>" +
          "<div class='cluster-doc' style='top:64%; left:66%;'></div>" +
          "<div class='cluster-doc' style='top:58%; left:82%;'></div>" +
          "<div class='cluster-doc' style='top:74%; left:24%;'></div>" +
          "<div class='cluster-doc' style='top:78%; left:44%;'></div>" +
          "<div class='cluster-doc' style='top:72%; left:58%;'></div>" +
          "<div class='cluster-doc' style='top:82%; left:72%;'></div>" +
          "<div class='cluster-doc' style='top:18%; left:88%;'></div>" +
          "<div class='cluster-doc' style='top:70%; left:8%;'></div>" +
        "</div>",
      minTimeSeconds: 3
    },

    // -- Page 12: Different mixes ---------------------------------------
    // Two cluster panels side by side, same transaction-cluster style as
    // Page 11 but with C/S stamps. Left = mostly clean (18 C + 2 S),
    // right = mostly suspicious (2 C + 18 S). Keeps the "companies have
    // many transactions" visual metaphor consistent across pages.
    {
      id: "p2_inst_mixes",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:20px; margin:0 auto 22px;'>" +
          "Companies vary in how many of their transactions are suspicious." +
        "</p>" +
        "<div class='company-mix-pair'>" +
          "<div class='company-mix-panel'>" +
            "<div class='company-mix-label mostly-clean'>Mostly clean</div>" +
            "<div class='doc-cluster mini'>" +
              // 18 clean + 2 suspicious, same 20 positions as Page 11 cluster.
              "<div class='cluster-doc labeled clean' style='top:10%; left:18%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:22%; left:32%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:7%;  left:48%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:28%; left:60%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:12%; left:72%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:38%; left:22%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:40%; left:40%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:46%; left:56%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:32%; left:78%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:56%; left:15%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:60%; left:34%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:54%; left:50%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:64%; left:66%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:58%; left:82%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:74%; left:24%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:78%; left:44%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:72%; left:58%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:82%; left:72%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:18%; left:88%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:70%; left:8%;'></div>" +
            "</div>" +
          "</div>" +
          "<div class='company-mix-panel'>" +
            "<div class='company-mix-label mostly-suspicious'>Mostly suspicious</div>" +
            "<div class='doc-cluster mini'>" +
              // 2 clean + 18 suspicious, same 20 positions.
              "<div class='cluster-doc labeled suspicious' style='top:10%; left:18%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:22%; left:32%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:7%;  left:48%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:28%; left:60%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:12%; left:72%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:38%; left:22%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:40%; left:40%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:46%; left:56%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:32%; left:78%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:56%; left:15%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:60%; left:34%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:54%; left:50%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:64%; left:66%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:58%; left:82%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:74%; left:24%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:78%; left:44%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:72%; left:58%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:82%; left:72%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:18%; left:88%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:70%; left:8%;'></div>" +
            "</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:24px; max-width:620px; margin:22px auto 0;'>" +
          "Your task is to distinguish them by providing a <strong>fraud estimate</strong>." +
        "</p>",
      minTimeSeconds: 10
    },

    // -- Page 13: Fraud estimate = share suspicious ---------------------
    {
      id: "p2_inst_rule",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "<strong>Fraud estimate</strong> <span style='color:var(--color-primary);'>=</span> " +
          "share of suspicious transactions." +
        "</p>" +
        "<p style='text-align:justify; font-size:17px; max-width:620px; margin:0 auto 24px; line-height:1.6;'>" +
          "Three example companies, with every transaction shown:" +
        "</p>" +
        "<div style='max-width:620px; margin:0 auto; display:flex; flex-direction:column; gap:14px;'>" +
          // 0 / 10
          "<div class='rule-example-row rule-example-stack'>" +
            "<div class='rule-example-cards'>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
            "</div>" +
            "<div class='rule-example-summary'>" +
              "<span class='rule-example-ratio'>0 / 10</span>" +
              "<span class='rule-example-arrow'>&rarr;</span>" +
              "<span class='rule-example-result' style='color:#15803d;'>0%</span>" +
            "</div>" +
          "</div>" +
          // 3 / 10
          "<div class='rule-example-row rule-example-stack'>" +
            "<div class='rule-example-cards'>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc suspicious rule-tiny'>S</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc suspicious rule-tiny'>S</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc suspicious rule-tiny'>S</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
            "</div>" +
            "<div class='rule-example-summary'>" +
              "<span class='rule-example-ratio'>3 / 10</span>" +
              "<span class='rule-example-arrow'>&rarr;</span>" +
              "<span class='rule-example-result' style='color:#b45309;'>30%</span>" +
            "</div>" +
          "</div>" +
          // 7 / 10
          "<div class='rule-example-row rule-example-stack'>" +
            "<div class='rule-example-cards'>" +
              "<div class='transaction-doc suspicious rule-tiny'>S</div>" +
              "<div class='transaction-doc suspicious rule-tiny'>S</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc suspicious rule-tiny'>S</div>" +
              "<div class='transaction-doc suspicious rule-tiny'>S</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc suspicious rule-tiny'>S</div>" +
              "<div class='transaction-doc clean rule-tiny'>C</div>" +
              "<div class='transaction-doc suspicious rule-tiny'>S</div>" +
              "<div class='transaction-doc suspicious rule-tiny'>S</div>" +
            "</div>" +
            "<div class='rule-example-summary'>" +
              "<span class='rule-example-ratio'>7 / 10</span>" +
              "<span class='rule-example-arrow'>&rarr;</span>" +
              "<span class='rule-example-result' style='color:#b91c1c;'>70%</span>" +
            "</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 10
    },

    // -- Page 13b: Attention check -- fraud estimate definition -------
    {
      id: "p2_check_definition",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "The fraud estimate for a company is ..." +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='share' data-mode='retry' " +
             "data-explain='The fraud estimate is the share of a company&apos;s transactions that are suspicious, expressed as a percentage.'>" +
          "<button type='button' class='practice-btn' data-val='gut'>Your gut feeling about the company, in percent.</button>" +
          "<button type='button' class='practice-btn' data-val='count'>The total number of suspicious transactions.</button>" +
          "<button type='button' class='practice-btn' data-val='share'>The share of suspicious transactions out of all its transactions.</button>" +
          "<button type='button' class='practice-btn' data-val='fifty'>Always 50%, set by law for every company.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 6
    },

    // -- Page 14: Lottery consequence chain -----------------------------
    {
      id: "p2_inst_consequence",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:left; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "What happens to a company after you submit its estimate?" +
        "</p>" +
        "<ul style='text-align:left; font-size:18px; max-width:620px; margin:0 auto; line-height:1.65; padding-left:22px;'>" +
          "<li>Your estimates feed a <strong>lottery</strong>.</li>" +
          "<li>A higher estimate means <strong>more lottery tickets</strong> for that company.</li>" +
          "<li>Companies drawn in the lottery face a <strong>full audit</strong>, which is very costly for them.</li>" +
        "</ul>",
      minTimeSeconds: 10
    },

    // -- Page 14b: The audit stakes (own page, more weight) -------------
    {
      id: "p2_inst_consequence_weight",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; max-width:620px; margin:0 auto 16px; font-weight:700; line-height:1.35;'>" +
          "The higher your estimate, the more likely the assessed company will face a full audit." +
        "</p>" +
        "<p style='text-align:justify; font-size:19px; max-width:620px; margin:0 auto; line-height:1.65;'>" +
          "A full audit reviews every transaction. It's costly for the company " +
          "whether fraud is found or not." +
        "</p>",
      minTimeSeconds: 7
    },

    // -- Page 14c: Calculator notice (heads-up before first arithmetic page) --
    {
      id: "p2_inst_calculator_notice",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 14px;'>" +
          "Heads-up" +
        "</p>" +
        "<p style='text-align:center; font-size:24px; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "A calculator will appear on the right side of the page." +
        "</p>" +
        "<p style='text-align:justify; font-size:18px; max-width:560px; margin:0 auto; line-height:1.65;'>" +
          "From here on, a small calculator sits on the right side of your screen whenever the page calls for arithmetic. " +
          "Open it any time you would like to work out the math. There is no requirement to use it." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Page 15: Practice math #1 -- N=10 ------------------------------
    {
      id: "p2_inst_try_n10",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; max-width:620px; margin:0 auto 12px; font-weight:600;'>" +
          "Your turn. What's the fraud estimate?" +
        "</p>" +
        "<p style='text-align:justify; font-size:16px; max-width:620px; margin:0 auto 16px; line-height:1.6;'>" +
          "A company with <strong>10</strong> transactions, all shown." +
        "</p>" +
        "<div class='cards-grid-10'>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
        "</div>" +
        "<div class='practice-buttons' data-correct='50' data-mode='directional' " +
             "data-explain='5 of 10 transactions are suspicious &rarr; 5 / 10 = 50%.'>" +
          "<button type='button' class='practice-btn' data-val='10'>10%</button>" +
          "<button type='button' class='practice-btn' data-val='30'>30%</button>" +
          "<button type='button' class='practice-btn' data-val='50'>50%</button>" +
          "<button type='button' class='practice-btn' data-val='70'>70%</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      showCalculator: true,
      minTimeSeconds: 5
    },

    // -- Page 16: Practice math #2 -- N=20 ------------------------------
    {
      id: "p2_inst_try_n20",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; max-width:620px; margin:0 auto 12px; font-weight:600;'>" +
          "A second example." +
        "</p>" +
        "<p style='text-align:justify; font-size:16px; max-width:620px; margin:0 auto 16px; line-height:1.6;'>" +
          "A company with <strong>20</strong> transactions, all shown." +
        "</p>" +
        "<div class='cards-grid-10'>" +
          // Row 1 (10): 8 C + 2 S
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          // Row 2 (10): 8 C + 2 S  (total: 16 C + 4 S = 20%)
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
        "</div>" +
        "<div class='practice-buttons' data-correct='20' data-mode='directional' " +
             "data-explain='4 of 20 transactions are suspicious &rarr; 4 / 20 = 20%.'>" +
          "<button type='button' class='practice-btn' data-val='10'>10%</button>" +
          "<button type='button' class='practice-btn' data-val='20'>20%</button>" +
          "<button type='button' class='practice-btn' data-val='50'>50%</button>" +
          "<button type='button' class='practice-btn' data-val='80'>80%</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      showCalculator: true,
      minTimeSeconds: 5
    },

    // -- Page 17: Practice math #3 -- N=30 ------------------------------
    {
      id: "p2_inst_try_n30",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; max-width:620px; margin:0 auto 12px; font-weight:600;'>" +
          "A final example." +
        "</p>" +
        "<p style='text-align:justify; font-size:16px; max-width:620px; margin:0 auto 16px; line-height:1.6;'>" +
          "A company with <strong>30</strong> transactions, all shown." +
        "</p>" +
        "<div class='cards-grid-10'>" +
          // 24 S + 6 C spread across 3 rows of 13
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
        "</div>" +
        "<div class='practice-buttons' data-correct='80' data-mode='directional' " +
             "data-explain='24 of 30 transactions are suspicious &rarr; 24 / 30 = 80%.'>" +
          "<button type='button' class='practice-btn' data-val='40'>40%</button>" +
          "<button type='button' class='practice-btn' data-val='60'>60%</button>" +
          "<button type='button' class='practice-btn' data-val='80'>80%</button>" +
          "<button type='button' class='practice-btn' data-val='90'>90%</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      showCalculator: true,
      minTimeSeconds: 5
    },

    // -- Page 18: Attention check -- high estimate means what? ----------
    {
      id: "p2_check_audit",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "What happens when you rate a company <strong>high</strong>?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='likely' data-mode='retry' " +
             "data-explain='A higher estimate means more lottery tickets, and a higher chance of a full audit, though not a guarantee.'>" +
          "<button type='button' class='practice-btn' data-val='never'>They never face a full audit.</button>" +
          "<button type='button' class='practice-btn' data-val='always'>They face a full audit for sure.</button>" +
          "<button type='button' class='practice-btn' data-val='likely'>They are more likely to face a full audit.</button>" +
          "<button type='button' class='practice-btn' data-val='random'>Audits are random &mdash; your estimate doesn&apos;t matter.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 5
    },

    // ==================================================================
    //  ACT III -- THE MANAGER AND THE TWIST
    // ==================================================================

    // -- Page 19: Law requires exactly 4 (cluster + 4 highlighted) -----
    {
      id: "p3_inst_law_4",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; line-height:1.45; max-width:620px; margin:0 auto 18px;'>" +
          "Here&apos;s the catch: A company has many transactions, but the law requires it to send you, the auditor, only " +
          "<strong style='color:#b91c1c; font-size:44px; line-height:1; padding:0 4px;'>4</strong> <strong>transactions</strong> for the preliminary audit." +
        "</p>" +
        "<div class='doc-cluster'>" +
          // Same 20 positions as before, but 4 are highlighted
          "<div class='cluster-doc highlighted' style='top:22%; left:32%;'></div>" +
          "<div class='cluster-doc' style='top:10%; left:18%;'></div>" +
          "<div class='cluster-doc' style='top:7%;  left:48%;'></div>" +
          "<div class='cluster-doc' style='top:28%; left:60%;'></div>" +
          "<div class='cluster-doc' style='top:12%; left:72%;'></div>" +
          "<div class='cluster-doc highlighted' style='top:38%; left:22%;'></div>" +
          "<div class='cluster-doc' style='top:40%; left:40%;'></div>" +
          "<div class='cluster-doc' style='top:46%; left:56%;'></div>" +
          "<div class='cluster-doc' style='top:32%; left:78%;'></div>" +
          "<div class='cluster-doc' style='top:56%; left:15%;'></div>" +
          "<div class='cluster-doc' style='top:60%; left:34%;'></div>" +
          "<div class='cluster-doc highlighted' style='top:54%; left:50%;'></div>" +
          "<div class='cluster-doc' style='top:64%; left:66%;'></div>" +
          "<div class='cluster-doc' style='top:58%; left:82%;'></div>" +
          "<div class='cluster-doc' style='top:74%; left:24%;'></div>" +
          "<div class='cluster-doc highlighted' style='top:78%; left:44%;'></div>" +
          "<div class='cluster-doc' style='top:72%; left:58%;'></div>" +
          "<div class='cluster-doc' style='top:82%; left:72%;'></div>" +
          "<div class='cluster-doc' style='top:18%; left:88%;'></div>" +
          "<div class='cluster-doc' style='top:70%; left:8%;'></div>" +
        "</div>",
      minTimeSeconds: 5
    },

    // -- Page 20: You only see the nature of those 4 -------------------
    {
      id: "p3_inst_law_4_nature",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:22px; line-height:1.4; max-width:620px; margin:0 auto 18px;'>" +
          "You only learn the nature (clean vs suspicious) of those " +
          "<strong>4 transactions.</strong>" +
        "</p>" +
        "<div class='doc-cluster'>" +
          // 4 highlighted with C/S labels, the rest with ? marks
          "<div class='cluster-doc highlighted labeled clean' style='top:22%; left:32%;'>C</div>" +
          "<div class='cluster-doc hidden-q' style='top:10%; left:18%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:7%;  left:48%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:28%; left:60%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:12%; left:72%;'>?</div>" +
          "<div class='cluster-doc highlighted labeled clean' style='top:38%; left:22%;'>C</div>" +
          "<div class='cluster-doc hidden-q' style='top:40%; left:40%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:46%; left:56%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:32%; left:78%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:56%; left:15%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:60%; left:34%;'>?</div>" +
          "<div class='cluster-doc highlighted labeled suspicious' style='top:54%; left:50%;'>S</div>" +
          "<div class='cluster-doc hidden-q' style='top:64%; left:66%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:58%; left:82%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:74%; left:24%;'>?</div>" +
          "<div class='cluster-doc highlighted labeled clean' style='top:78%; left:44%;'>C</div>" +
          "<div class='cluster-doc hidden-q' style='top:72%; left:58%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:82%; left:72%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:18%; left:88%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:70%; left:8%;'>?</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:26px; max-width:620px; margin:28px auto 0; line-height:1.5;'>" +
          "This means that your view of the company's overall transactions in this preliminary audit is <strong>always incomplete</strong>." +
        "</p>",
      minTimeSeconds: 5
    },

    // -- Page 21: Attention check -- do you see all? -------------------
    {
      id: "p3_check_all",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "When you audit a company, do you see <strong>all</strong> of its transactions?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='no' data-mode='retry' " +
             "data-explain='The law requires only 4 transactions per company.'>" +
          "<button type='button' class='practice-btn' data-val='yes'>Yes, all of them.</button>" +
          "<button type='button' class='practice-btn' data-val='no'>No, only 4.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 5
    },

    // -- Page 22: Attention check -- who picks how many? ---------------
    {
      id: "p3_check_how_many",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "Who decides <strong>how many</strong> transactions you see?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='law' data-mode='retry' " +
             "data-explain='The law. Fixed at 4; no one can change it.'>" +
          "<button type='button' class='practice-btn' data-val='law'>The law.</button>" +
          "<button type='button' class='practice-btn' data-val='manager'>The manager.</button>" +
          "<button type='button' class='practice-btn' data-val='auditor'>You.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 5
    },

    // ==================================================================
    //  INDEPENDENCE INTERLUDE -- 5 pages building intuition that one
    //  random transaction doesn't tell you about the rest. Placed
    //  IMMEDIATELY BEFORE the manager intro so the contrast is crisp:
    //  "random picking tells you little" -> "but here it isn't random
    //  -- someone with a conflict of interest picks what you see."
    // ==================================================================

    // -- Page 18b: Setup -- imagine grabbing one random transaction ----
    {
      id: "p2_inst_random_a",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Consider the following thought experiment." +
        "</p>" +
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 26px; line-height:1.5;'>" +
          "Imagine you could grab <strong>one random transaction</strong> from a company." +
        "</p>" +
        "<div class='random-single-slot'>" +
          "<div class='transaction-doc large neutral' style='visibility:hidden;'>&nbsp;</div>" +
          "<div class='random-single-caption' style='visibility:hidden;'>&nbsp;</div>" +
        "</div>",
      minTimeSeconds: 2
    },

    // -- Page 18c: Reveal -- it's suspicious ---------------------------
    {
      id: "p2_inst_random_b",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Consider the following thought experiment." +
        "</p>" +
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 26px; line-height:1.5;'>" +
          "Imagine you could grab <strong>one random transaction</strong> from a company." +
        "</p>" +
        "<div class='random-single-slot'>" +
          "<div class='transaction-doc large suspicious'>S</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:22px; font-weight:700; max-width:620px; margin:22px auto 0; color:#b91c1c;'>" +
          "It turns out to be suspicious." +
        "</p>",
      minTimeSeconds: 3
    },

    // -- Page 18d: Pose the question -----------------------------------
    {
      id: "p2_inst_random_c",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 24px; font-weight:700;'>" +
          "Does this mean most of the company's other transactions are also suspicious?" +
        "</p>" +
        "<div class='random-question-row'>" +
          "<div class='transaction-doc large suspicious'>S</div>" +
          "<div class='random-question-arrow'>&rarr;</div>" +
          "<div class='random-question-unknowns'>" +
            "<div class='transaction-doc-mini hidden-mini'>?</div>" +
            "<div class='transaction-doc-mini hidden-mini'>?</div>" +
            "<div class='transaction-doc-mini hidden-mini'>?</div>" +
            "<div class='transaction-doc-mini hidden-mini'>?</div>" +
            "<div class='transaction-doc-mini hidden-mini'>?</div>" +
            "<div class='transaction-doc-mini hidden-mini'>?</div>" +
            "<div class='transaction-doc-mini hidden-mini'>?</div>" +
            "<div class='transaction-doc-mini hidden-mini'>?</div>" +
            "<div class='transaction-doc-mini hidden-mini'>?</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 3
    },

    // -- Page 18e: Punchline -- no, it could be any of these -----------
    {
      id: "p2_inst_random_d",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:22px; line-height:1.4; max-width:620px; margin:0 auto 18px;'>" +
          "No. It could be <strong>any</strong> of these companies." +
        "</p>" +
        "<div class='company-triple'>" +
          // Mostly clean (2 S, 18 C)
          "<div class='company-mix-panel'>" +
            "<div class='company-mix-label mostly-clean'>Mostly clean</div>" +
            "<div class='doc-cluster micro'>" +
              "<div class='cluster-doc labeled clean' style='top:10%; left:18%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:22%; left:32%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:7%;  left:48%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:28%; left:60%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:12%; left:72%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:38%; left:22%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:40%; left:40%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:46%; left:56%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:32%; left:78%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:56%; left:15%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:60%; left:34%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:54%; left:50%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:64%; left:66%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:58%; left:82%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:74%; left:24%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:78%; left:44%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:72%; left:58%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:82%; left:72%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:18%; left:88%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:70%; left:8%;'></div>" +
            "</div>" +
          "</div>" +
          // Half-half (10 C + 10 S)
          "<div class='company-mix-panel'>" +
            "<div class='company-mix-label company-mix-label-half'>Half &amp; half</div>" +
            "<div class='doc-cluster micro'>" +
              "<div class='cluster-doc labeled suspicious' style='top:10%; left:18%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:22%; left:32%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:7%;  left:48%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:28%; left:60%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:12%; left:72%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:38%; left:22%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:40%; left:40%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:46%; left:56%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:32%; left:78%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:56%; left:15%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:60%; left:34%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:54%; left:50%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:64%; left:66%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:58%; left:82%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:74%; left:24%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:78%; left:44%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:72%; left:58%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:82%; left:72%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:18%; left:88%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:70%; left:8%;'></div>" +
            "</div>" +
          "</div>" +
          // Mostly suspicious (18 S + 2 C)
          "<div class='company-mix-panel'>" +
            "<div class='company-mix-label mostly-suspicious'>Mostly suspicious</div>" +
            "<div class='doc-cluster micro'>" +
              "<div class='cluster-doc labeled suspicious' style='top:10%; left:18%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:22%; left:32%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:7%;  left:48%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:28%; left:60%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:12%; left:72%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:38%; left:22%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:40%; left:40%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:46%; left:56%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:32%; left:78%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:56%; left:15%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:60%; left:34%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:54%; left:50%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:64%; left:66%;'></div>" +
              "<div class='cluster-doc labeled clean' style='top:58%; left:82%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:74%; left:24%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:78%; left:44%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:72%; left:58%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:82%; left:72%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:18%; left:88%;'></div>" +
              "<div class='cluster-doc labeled suspicious' style='top:70%; left:8%;'></div>" +
            "</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:25px; font-weight:800; max-width:620px; margin:22px auto 0; line-height:1.45;'>" +
          "The type of single randomly selected transaction tells you nothing about the nature of the rest of the company's transactions." +
        "</p>",
      minTimeSeconds: 8
    },

    // -- Page 18f: Attention check -- flipped to clean -----------------
    // Test that the participant internalized the lesson. The visible
    // transaction is now CLEAN (opposite of the teaching example) so
    // they can't just pattern-match on "suspicious -> nothing".
    {
      id: "p2_attn_random",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 14px; font-weight:700; line-height:1.5;'>" +
          "You grab one random transaction from a company. It's <strong>clean</strong>." +
        "</p>" +
        "<div class='random-single-slot' style='margin:10px auto 18px;'>" +
          "<div class='transaction-doc large clean'>C</div>" +
        "</div>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700; line-height:1.5;'>" +
          "What does that tell you about the company's other transactions?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='nothing' data-mode='retry' " +
             "data-explain='Right. The type of one transaction doesn&apos;t tell you anything about the type of any other. They are independent.'>" +
          "<button type='button' class='practice-btn' data-val='mostly_clean'>Most of them are probably clean too.</button>" +
          "<button type='button' class='practice-btn' data-val='mostly_susp'>Most of them are probably suspicious too.</button>" +
          "<button type='button' class='practice-btn' data-val='nothing'>Nothing &mdash; the type of one transaction tells you nothing about the type of another.</button>" +
          "<button type='button' class='practice-btn' data-val='half'>Roughly half of them should be clean too.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 6
    },

    // -- Page 22g: Bridge -- "but here they are NOT random" -----------
    // Stands alone on its own page (no golden call-out box). Plain black
    // text, centered, large. Lands the pivot before the manager is
    // introduced on the next page.
    {
      id: "p3_inst_not_random",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:28px; line-height:1.4; max-width:620px; margin:80px auto 0; font-weight:700; color:#0f172a;'>" +
          "In this study, however, the 4 transactions you see about a company are " +
          "<strong style='color:#b91c1c;'>NOT selected at random</strong> from all of its transactions." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Page 23: Meet the manager -------------------------------------
    {
      id: "p3_inst_meet_manager",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:22px; line-height:1.4; max-width:620px; margin:0 auto 22px;'>" +
          "Meet the <strong>manager</strong> of the company you are auditing." +
        "</p>" +
        "<div class='manager-badge'>" +
          "<svg viewBox='0 0 120 140' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
            "<defs>" +
              "<linearGradient id='mgrGrad' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                "<stop offset='0%' stop-color='#6366f1'/>" +
                "<stop offset='100%' stop-color='#4338ca'/>" +
              "</linearGradient>" +
            "</defs>" +
            "<rect x='4' y='4' width='112' height='132' rx='22' " +
                  "fill='url(#mgrGrad)' stroke='#3730a3' stroke-width='2'/>" +
            "<circle cx='60' cy='54' r='18' fill='#ffffff'/>" +
            "<path d='M24 126 C24 96 40 80 60 80 C80 80 96 96 96 126 Z' fill='#ffffff'/>" +
          "</svg>" +
          "<div class='manager-badge-label'>MANAGER</div>" +
        "</div>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto;'>" +
          "The manager is responsible for sending you the 4 transactions for the preliminary audit." +
        "</p>",
      minTimeSeconds: 7
    },

    // -- Page 24: Manager knows all, picks 4 ---------------------------
    {
      id: "p3_inst_manager_knows_all",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; line-height:1.4; max-width:620px; margin:0 auto 18px;'>" +
          "Here&apos;s the catch: the manager <strong>knows the type of every transaction</strong> in the company, and " +
          "decides <strong style='color:#b91c1c;'>which 4</strong> are sent for the preliminary audit." +
        "</p>" +
        "<div class='manager-above-wrap'>" +
          "<div class='manager-badge-mini'>" +
            "<svg viewBox='0 0 120 140' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' width='72'>" +
              "<defs>" +
                "<linearGradient id='mgrGradB' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                  "<stop offset='0%' stop-color='#6366f1'/>" +
                  "<stop offset='100%' stop-color='#4338ca'/>" +
                "</linearGradient>" +
              "</defs>" +
              "<rect x='4' y='4' width='112' height='132' rx='22' fill='url(#mgrGradB)' stroke='#3730a3' stroke-width='2'/>" +
              "<circle cx='60' cy='54' r='18' fill='#ffffff'/>" +
              "<path d='M24 126 C24 96 40 80 60 80 C80 80 96 96 96 126 Z' fill='#ffffff'/>" +
            "</svg>" +
            "<div class='manager-badge-caption'>Sees everything</div>" +
          "</div>" +
          "<div class='manager-cards-below'>" +
            // 10 transactions: 6 C + 4 S, visually diverse so the
            // "sees everything" framing lands.
            "<div class='transaction-doc clean rule-small'>C</div>" +
            "<div class='transaction-doc suspicious rule-small'>S</div>" +
            "<div class='transaction-doc clean rule-small'>C</div>" +
            "<div class='transaction-doc clean rule-small'>C</div>" +
            "<div class='transaction-doc suspicious rule-small'>S</div>" +
            "<div class='transaction-doc clean rule-small'>C</div>" +
            "<div class='transaction-doc suspicious rule-small'>S</div>" +
            "<div class='transaction-doc clean rule-small'>C</div>" +
            "<div class='transaction-doc clean rule-small'>C</div>" +
            "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 5
    },

    // -- Page 25: Split view -- manager picks 4, auditor sees 4 --------
    {
      id: "p3_inst_manager_picks",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; line-height:1.35; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "The manager picks the <strong>4</strong> you see." +
        "</p>" +
        "<div class='split-view'>" +
          "<div class='split-side'>" +
            "<div class='split-badge'>" +
              "<svg viewBox='0 0 120 140' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' width='56'>" +
                "<defs>" +
                  "<linearGradient id='mgrGradC' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                    "<stop offset='0%' stop-color='#6366f1'/>" +
                    "<stop offset='100%' stop-color='#4338ca'/>" +
                  "</linearGradient>" +
                "</defs>" +
                "<rect x='4' y='4' width='112' height='132' rx='22' fill='url(#mgrGradC)' stroke='#3730a3' stroke-width='2'/>" +
                "<circle cx='60' cy='54' r='18' fill='#ffffff'/>" +
                "<path d='M24 126 C24 96 40 80 60 80 C80 80 96 96 96 126 Z' fill='#ffffff'/>" +
              "</svg>" +
              "<div class='split-badge-label'>Manager</div>" +
            "</div>" +
            "<div class='split-cards'>" +
              // 10 transactions: same 6 C + 4 S as Page 24, so the
              // "manager sees all 10" visual carries over.
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc suspicious rule-small'>S</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc suspicious rule-small'>S</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc suspicious rule-small'>S</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc suspicious rule-small'>S</div>" +
            "</div>" +
            "<div class='split-caption'>Sees all 10</div>" +
          "</div>" +
          "<div class='split-arrow' style='font-size:64px; display:flex; flex-direction:column; align-items:center;'>" +
            "<span style=\"font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:#64748b; margin-bottom:-4px; font-weight:700;\">sent</span>" +
            "&rarr;" +
          "</div>" +
          "<div class='split-side'>" +
            "<div class='split-badge'>" +
              "<svg viewBox='0 0 100 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' width='72'>" +
                "<defs>" +
                  "<linearGradient id='auditorMagSplit' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                    "<stop offset='0%' stop-color='#0ea5a0'/>" +
                    "<stop offset='100%' stop-color='#0f766e'/>" +
                  "</linearGradient>" +
                "</defs>" +
                "<rect x='16' y='18' width='54' height='72' rx='4' fill='#ffffff' stroke='#0f766e' stroke-width='2'/>" +
                "<line x1='24' y1='32' x2='62' y2='32' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='42' x2='58' y2='42' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='52' x2='62' y2='52' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='62' x2='50' y2='62' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<circle cx='66' cy='72' r='20' fill='none' stroke='url(#auditorMagSplit)' stroke-width='7'/>" +
                "<circle cx='66' cy='72' r='16' fill='#ccfbf1' opacity='0.5'/>" +
                "<line x1='80' y1='86' x2='96' y2='104' stroke='url(#auditorMagSplit)' stroke-width='8' stroke-linecap='round'/>" +
              "</svg>" +
              "<div class='split-badge-label'>You</div>" +
            "</div>" +
            "<div class='split-cards'>" +
              // All 4 Clean: the manager strategically picked the
              // cleanest-looking transactions. The auditor sees a
              // company that looks spotless even though there were
              // 4 suspicious transactions in the full set.
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
            "</div>" +
            "<div class='split-caption'>Sees 4 (manager's pick)</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 5
    },

    // -- Page 26a: Mandate split, screen A -- giant "4" + headline only --
    {
      id: "p3_inst_mandate_a",
      type: "instructions",
      title: "",
      body:
        "<div style='text-align:center; margin:14px 0 26px;'>" +
          "<div style='font-size:110px; font-weight:800; line-height:1; letter-spacing:-0.05em; color:var(--color-primary);'>4</div>" +
          "<div style='font-size:24px; font-weight:700; color:#0f172a; margin-top:6px;'>transactions disclosed</div>" +
          "<div style='font-size:14px; text-transform:uppercase; letter-spacing:1.2px; font-weight:700; color:var(--color-text-slate); margin-top:8px;'>required by law</div>" +
        "</div>" +
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "Two rules the manager <strong>cannot</strong> break:" +
        "</p>",
      minTimeSeconds: 3
    },

    // -- Page 26b: Mandate split, screen B -- rule 1 only ---------------
    {
      id: "p3_inst_mandate_b",
      type: "instructions",
      title: "",
      body:
        "<div style='text-align:center; margin:14px 0 26px;'>" +
          "<div style='font-size:110px; font-weight:800; line-height:1; letter-spacing:-0.05em; color:var(--color-primary);'>4</div>" +
          "<div style='font-size:24px; font-weight:700; color:#0f172a; margin-top:6px;'>transactions disclosed</div>" +
          "<div style='font-size:14px; text-transform:uppercase; letter-spacing:1.2px; font-weight:700; color:var(--color-text-slate); margin-top:8px;'>required by law</div>" +
        "</div>" +
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "Two rules the manager <strong>cannot</strong> break:" +
        "</p>" +
        "<ol style='font-size:19px; max-width:620px; margin:0 auto 18px; line-height:1.6; padding-left:28px;'>" +
          "<li style='margin-bottom:10px;'>The manager sends <strong>exactly 4</strong> transactions. Not more, not fewer.</li>" +
        "</ol>",
      minTimeSeconds: 3
    },

    // -- Page 26c: Mandate split, screen C -- both rules ----------------
    {
      id: "p3_inst_mandate_c",
      type: "instructions",
      title: "",
      body:
        "<div style='text-align:center; margin:14px 0 26px;'>" +
          "<div style='font-size:110px; font-weight:800; line-height:1; letter-spacing:-0.05em; color:var(--color-primary);'>4</div>" +
          "<div style='font-size:24px; font-weight:700; color:#0f172a; margin-top:6px;'>transactions disclosed</div>" +
          "<div style='font-size:14px; text-transform:uppercase; letter-spacing:1.2px; font-weight:700; color:var(--color-text-slate); margin-top:8px;'>required by law</div>" +
        "</div>" +
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "Two rules the manager <strong>cannot</strong> break:" +
        "</p>" +
        "<ol style='font-size:19px; max-width:620px; margin:0 auto 18px; line-height:1.6; padding-left:28px;'>" +
          "<li style='margin-bottom:10px;'>The manager sends <strong>exactly 4</strong> transactions. Not more, not fewer.</li>" +
          "<li>The manager <strong>cannot falsify or forge transactions</strong> to change their types.</li>" +
        "</ol>",
      minTimeSeconds: 5
    },

    // -- Page 27: Attention check -- who picks which? ------------------
    {
      id: "p3_check_which",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "Who picks <strong>which</strong> transactions you see?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='manager' data-mode='retry' " +
             "data-explain='The law sets how many. The manager picks which ones.'>" +
          "<button type='button' class='practice-btn' data-val='law'>The law.</button>" +
          "<button type='button' class='practice-btn' data-val='random'>Random chance.</button>" +
          "<button type='button' class='practice-btn' data-val='manager'>The manager.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 5
    },

    // -- Page 28: Attention check -- can manager fake a transaction? ----
    {
      id: "p3_check_fake",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "The manager can turn a suspicious transaction into a clean one." +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='false' data-mode='retry' " +
             "data-explain='The manager can&apos;t fake transactions. They can only pick which ones get sent.'>" +
          "<button type='button' class='practice-btn' data-val='true'>True.</button>" +
          "<button type='button' class='practice-btn' data-val='false'>False.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 5
    },

    // ==================================================================
    //  ACT IV -- STAKES AND YOUR BONUS
    // ==================================================================

    // -- Page 29: Manager's stakes (the raise) --------------------------
    {
      id: "p4_inst_manager_stakes",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "What's at stake for the manager? Their raise!" +
        "</p>" +
        "<p style='text-align:justify; font-size:18px; max-width:620px; margin:0 auto 22px; line-height:1.6;'>" +
          "A full audit is costly for the company. And if it happens, the manager " +
          "<strong>loses their raise</strong>." +
        "</p>" +
        "<div class='scenario-pair'>" +
          "<div class='scenario-line scenario-good'>" +
            "<span class='scenario-tag'>You estimate 10%</span>" +
            "<span class='scenario-arrow'>&rarr;</span>" +
            "<span><strong>Full audit</strong> unlikely</span>" +
            "<span class='scenario-arrow'>&rarr;</span>" +
            "<span class='scenario-outcome'>Manager gets the raise</span>" +
          "</div>" +
          "<div class='scenario-line scenario-bad'>" +
            "<span class='scenario-tag'>You estimate 80%</span>" +
            "<span class='scenario-arrow'>&rarr;</span>" +
            "<span><strong>Full audit</strong> likely</span>" +
            "<span class='scenario-arrow'>&rarr;</span>" +
            "<span class='scenario-outcome'>Manager loses the raise</span>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:justify; font-size:18px; max-width:620px; margin:22px auto 0; line-height:1.6;'>" +
          "The manager therefore wants a <strong>low</strong> fraud estimate." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Page 29b: Attention check -- manager's incentive --------------
    {
      id: "p4_check_manager_incentive",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "Why does the manager <strong>not</strong> want a high fraud estimate?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='raise' data-mode='retry' " +
             "data-explain='A high estimate makes a full audit likely, and a full audit costs the manager their raise.'>" +
          "<button type='button' class='practice-btn' data-val='fine'>A high estimate triggers a personal fine for the manager.</button>" +
          "<button type='button' class='practice-btn' data-val='raise'>A high estimate makes a full audit likely and costs them their raise.</button>" +
          "<button type='button' class='practice-btn' data-val='bonus'>A high estimate lowers the government auditor&apos;s bonus payout.</button>" +
          "<button type='button' class='practice-btn' data-val='indifferent'>The manager has no stake in what you estimate.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 6
    },

    // -- Page 30: Your stakes -------------------------------------------
    {
      id: "p4_inst_auditor_stakes",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 16px; font-weight:700;'>" +
          "What's at stake for <strong>you</strong>?" +
        "</p>" +
        "<ul style='list-style:none; text-align:left; font-size:19px; max-width:620px; margin:0 auto; line-height:1.6; padding:0;'>" +
          "<li style='display:flex; align-items:flex-start; gap:14px; margin-bottom:14px;'>" +
            "<span style='display:inline-flex; width:36px; height:36px; border-radius:50%; background:#dbe4ff; color:#3730a3; font-weight:800; font-size:18px; align-items:center; justify-content:center; flex-shrink:0;'>1</span>" +
            "<span>You earn more when your estimates are <strong>accurate</strong>, summed across all 30 companies you will audit.</span>" +
          "</li>" +
          "<li style='display:flex; align-items:flex-start; gap:14px; margin-bottom:14px;'>" +
            "<span style='display:inline-flex; width:36px; height:36px; border-radius:50%; background:#dbe4ff; color:#3730a3; font-weight:800; font-size:18px; align-items:center; justify-content:center; flex-shrink:0;'>2</span>" +
            "<span>You also earn extra when you're <strong>confident and correct</strong> (by placing bets on your estimates).</span>" +
          "</li>" +
        "</ul>",
      minTimeSeconds: 8
    },

    // -- Page 31a: Your task has two answers -- reveal Answer 1 --------
    {
      id: "p4_inst_two_answers_a",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 26px; font-weight:700;'>" +
          "For each audited company, you are required to provide <strong>two</strong> answers." +
        "</p>" +
        "<div class='two-answers-row'>" +
          "<div class='answer-card'>" +
            "<div class='answer-num'>1</div>" +
            "<div class='answer-title'>Fraud estimate</div>" +
            "<div class='answer-sub'>Your best guess of the share of the company's transactions that are suspicious. Be as <strong>precise</strong> as you can.</div>" +
          "</div>" +
          "<div class='answer-card' style='visibility:hidden;' aria-hidden='true'>" +
            "<div class='answer-num'>2</div>" +
            "<div class='answer-title'>Bet</div>" +
            "<div class='answer-sub'>&nbsp;</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 5
    },

    // -- Page 31b: Your task has two answers -- reveal Answer 2 --------
    {
      id: "p4_inst_two_answers_b",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 26px; font-weight:700;'>" +
          "For each audited company, you are required to provide <strong>two</strong> answers." +
        "</p>" +
        "<div class='two-answers-row'>" +
          "<div class='answer-card'>" +
            "<div class='answer-num'>1</div>" +
            "<div class='answer-title'>Fraud estimate</div>" +
            "<div class='answer-sub'>Your best guess of the share of the company's transactions that are suspicious. Be as <strong>precise</strong> as you can.</div>" +
          "</div>" +
          "<div class='answer-card'>" +
            "<div class='answer-num'>2</div>" +
            "<div class='answer-title'>Bet</div>" +
            "<div class='answer-sub'>How confident you are that your estimate is " +
              "<strong>within 10 percentage points</strong> of the correct answer.</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:26px auto 0; font-weight:700;'>" +
          "Each one earns its own bonus." +
        "</p>",
      minTimeSeconds: 4
    },

    // -- Page 32: Estimate bonus -- introduction ------------------------
    {
      id: "p4_inst_estimate_intro",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "<span style='display:inline-flex; width:24px; height:24px; border-radius:50%; background:#4361ee; color:white; font-weight:800; font-size:14px; align-items:center; justify-content:center; margin-right:8px; vertical-align:middle;'>1</span>" +
          "Answer 1: fraud estimate" +
        "</p>" +
        "<p style='text-align:left; font-size:24px; max-width:620px; margin:0 auto 16px; font-weight:700;'>" +
          "The estimate bonus." +
        "</p>" +
        "<ul style='text-align:left; font-size:18px; max-width:620px; margin:0 auto 18px; line-height:1.65; padding-left:22px;'>" +
          "<li>If your estimate is <strong>within 10 percentage points</strong> of the correct answer, you earn <strong>+10&cent;</strong>.</li>" +
          "<li>If your estimate is <strong>more than 10 percentage points</strong> away from the correct answer, you earn <strong>0&cent;</strong>.</li>" +
        "</ul>",
      minTimeSeconds: 8
    },

    // -- Page 32b: Walk-through example intro (own page) ----------------
    {
      id: "p4_inst_estimate_example_intro",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "<span style='display:inline-flex; width:24px; height:24px; border-radius:50%; background:#4361ee; color:white; font-weight:800; font-size:14px; align-items:center; justify-content:center; margin-right:8px; vertical-align:middle;'>1</span>" +
          "Answer 1: fraud estimate" +
        "</p>" +
        "<p style='text-align:center; font-size:22px; max-width:620px; margin:60px auto 0; line-height:1.6; font-weight:700;'>" +
          "Let us walk through an example. For this company, let's assume that the correct answer is <strong style='color:#b91c1c;'>35%</strong>." +
        "</p>",
      minTimeSeconds: 4
    },

    // -- Page 33: Estimate practice -- move to 50% (wrong, 0¢) ----------
    {
      id: "p4_inst_estimate_try_50",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "<span style='display:inline-flex; width:24px; height:24px; border-radius:50%; background:#4361ee; color:white; font-weight:800; font-size:14px; align-items:center; justify-content:center; margin-right:8px; vertical-align:middle;'>1</span>" +
          "Answer 1: fraud estimate" +
        "</p>" +
        "<p style='text-align:left; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "Practice this." +
        "</p>" +
        "<ul style='text-align:left; font-size:18px; max-width:620px; margin:0 auto 18px; line-height:1.6; padding-left:22px;'>" +
          "<li>The correct answer for this company is <strong>35%</strong>.</li>" +
          "<li>Move your estimate to <strong>60%</strong>.</li>" +
        "</ul>" +
        "<div class='estimate-sim' data-truth='35' data-target='60' data-band-low='25' data-band-high='45'>" +
          
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your estimate: <span class='sim-slider-value' id='est35_val'>50%</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>0%</span>" +
              "<div class='slider-range-wrap'>" +
                "<div class='slider-band' style='left:25%; right:55%;'></div>" +
                "<div class='slider-coverage-band' id='est35_cov'></div>" +
                "<input type='range' class='slider-input' id='est35_slider' min='0' max='100' step='1' value='50' data-display='est35_val' data-coverage-band='est35_cov'>" +
              "</div>" +
              "<span class='slider-label'>100%</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-result'>" +
            "<div class='sim-result-row'>Within 10 percentage points of the correct answer? <span id='est35_within' class='sim-flag-no'>No &#10008;</span></div>" +
            "<div class='sim-result-total'>Estimate bonus: <span id='est35_bonus'>0&cent;</span></div>" +
          "</div>" +
        "</div>" +
        "<div class='practice-feedback-card' style='display:none;'>" +
          "<p style='text-align:left; font-size:20px; max-width:620px; margin:22px auto 0; line-height:1.5; font-weight:700; color:#b91c1c;'>" +
            "At 60%, you&apos;re 25 percentage points off the correct answer. You earn <strong>0&cent;</strong> on this company." +
          "</p>" +
        "</div>",
      showCalculator: true,
      minTimeSeconds: 0
    },

    // -- Page 34: Estimate practice -- move to 30% (right, +10¢) --------
    {
      id: "p4_inst_estimate_try_30",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "<span style='display:inline-flex; width:24px; height:24px; border-radius:50%; background:#4361ee; color:white; font-weight:800; font-size:14px; align-items:center; justify-content:center; margin-right:8px; vertical-align:middle;'>1</span>" +
          "Answer 1: fraud estimate" +
        "</p>" +
        "<p style='text-align:left; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "Now try a different estimate." +
        "</p>" +
        "<ul style='text-align:left; font-size:18px; max-width:620px; margin:0 auto 18px; line-height:1.6; padding-left:22px;'>" +
          "<li>Same correct answer: <strong>35%</strong>.</li>" +
          "<li>Move your estimate to <strong>30%</strong>.</li>" +
        "</ul>" +
        "<div class='estimate-sim' data-truth='35' data-target='30' data-band-low='25' data-band-high='45'>" +
          
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your estimate: <span class='sim-slider-value' id='est30_val'>50%</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>0%</span>" +
              "<div class='slider-range-wrap'>" +
                "<div class='slider-band' style='left:25%; right:55%;'></div>" +
                "<div class='slider-coverage-band' id='est30_cov'></div>" +
                "<input type='range' class='slider-input' id='est30_slider' min='0' max='100' step='1' value='50' data-display='est30_val' data-coverage-band='est30_cov'>" +
              "</div>" +
              "<span class='slider-label'>100%</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-result'>" +
            "<div class='sim-result-row'>Within 10 percentage points of the correct answer? <span id='est30_within' class='sim-flag-no'>No &#10008;</span></div>" +
            "<div class='sim-result-total'>Estimate bonus: <span id='est30_bonus'>0&cent;</span></div>" +
          "</div>" +
        "</div>" +
        "<div class='practice-feedback-card' style='display:none;'>" +
          "<p style='text-align:left; font-size:20px; max-width:620px; margin:22px auto 0; line-height:1.5; font-weight:700; color:#15803d;'>" +
            "At 30%, you&apos;re within 10 percentage points of 35%. You earn <strong>+10&cent;</strong>." +
          "</p>" +
        "</div>",
      showCalculator: true,
      minTimeSeconds: 0
    },

    // -- Page 35: Takeaway ---------------------------------------------
    {
      id: "p4_inst_estimate_takeaway",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "<span style='display:inline-flex; width:24px; height:24px; border-radius:50%; background:#4361ee; color:white; font-weight:800; font-size:14px; align-items:center; justify-content:center; margin-right:8px; vertical-align:middle;'>1</span>" +
          "Answer 1: fraud estimate" +
        "</p>" +
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:600;'>" +
          "Summary." +
        "</p>" +
        "<p style='text-align:justify; font-size:18px; max-width:620px; margin:0 auto; line-height:1.6;'>" +
          "Correct answer <strong>35%</strong> &rarr; the bonus pays out for any estimate between " +
          "<strong>25%</strong> and <strong>45%</strong>." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Page 35b: Attention check -- estimate bonus numeric ----------
    // Tests the "within 10 percentage points" rule on a fresh number
    // (truth = 60%) to check the participant didn't just memorize the
    // 35/25/45 example above.
    {
      id: "p4_check_estimate_bonus",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quick attention check" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700; line-height:1.5;'>" +
          "The correct answer is <strong>60%</strong>. You estimate <strong>55%</strong>. " +
          "How much would you earn from the estimate?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='ten' data-mode='retry' " +
             "data-explain='55% is within 10 percentage points of 60% (difference is 5), so the estimate bonus is +10&cent;.'>" +
          "<button type='button' class='practice-btn' data-val='zero'>0&cent;</button>" +
          "<button type='button' class='practice-btn' data-val='five'>+5&cent;</button>" +
          "<button type='button' class='practice-btn' data-val='ten'>+10&cent;</button>" +
          "<button type='button' class='practice-btn' data-val='minus'>&minus;5&cent;</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      showCalculator: true,
      minTimeSeconds: 6
    },

    // -- Page 36: Bet bonus intro ---------------------------------------
    // -- Page 36: Bet intro (concept) -- no kicker --------------------
    {
      id: "p4_inst_bet_intro",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:#b45309; margin:0 auto 10px;'>" +
          "<span style='display:inline-flex; width:24px; height:24px; border-radius:50%; background:#4361ee; color:white; font-weight:800; font-size:14px; align-items:center; justify-content:center; margin-right:8px; vertical-align:middle;'>2</span>" +
          "Answer 2: bet" +
        "</p>" +
        "<p style='text-align:justify; font-size:26px; max-width:620px; margin:0 auto 16px; font-weight:700;'>" +
          "The bet." +
        "</p>" +
        "<p style='text-align:justify; font-size:18px; max-width:620px; margin:0 auto; line-height:1.6;'>" +
          "In addition to your estimate, you may <strong>bet up to 10&cent;</strong> on whether your estimate is within 10 percentage points of the correct answer." +
        "</p>",
      minTimeSeconds: 7
    },

    // -- Page 36b: Bet example (concrete) -- no kicker ------------------
    {
      id: "p4_inst_bet_example",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:#b45309; margin:0 auto 10px;'>" +
          "<span style='display:inline-flex; width:24px; height:24px; border-radius:50%; background:#4361ee; color:white; font-weight:800; font-size:14px; align-items:center; justify-content:center; margin-right:8px; vertical-align:middle;'>2</span>" +
          "Answer 2: bet" +
        "</p>" +
        "<p style='text-align:center; font-size:22px; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "For example, suppose you bet <strong>5&cent;</strong> on your estimate:" +
        "</p>" +
        "<ul style='text-align:left; font-size:18px; max-width:620px; margin:0 auto 14px; line-height:1.65; padding-left:22px;'>" +
          "<li>Within 10 percentage points &rarr; you <strong>win the bet</strong>: <strong>+5&cent;</strong>.</li>" +
          "<li>More than 10 percentage points away &rarr; you <strong>lose the bet</strong>: <strong>&minus;5&cent;</strong> (deducted from bonus on other companies).</li>" +
        "</ul>",
      minTimeSeconds: 9
    },

    // -- Page 37a: Bet safety -- $4 base pay never affected (highlighted) --
    {
      id: "p4_inst_bet_safety",
      type: "instructions",
      title: "",
      body:
        "<div style='max-width:560px; margin:80px auto 0; padding:36px 32px; background:#dcfce7; border-left:6px solid #15803d; border-radius:8px; text-align:center;'>" +
          "<p style='font-size:24px; font-weight:800; color:#0f172a; margin:0 0 14px;'>Your $4 base pay is never affected.</p>" +
          "<p style='font-size:17px; color:#0f172a; margin:0; line-height:1.6;'>Lost bets only reduce the bonus from other companies, and the total bonus cannot fall below $0.</p>" +
        "</div>",
      minTimeSeconds: 6
    },

    // -- Page 37: Bet practice -- good scenario (+18¢) -----------------
    {
      id: "p4_inst_bet_try_good",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:#b45309; margin:0 auto 10px;'>" +
          "<span style='display:inline-flex; width:24px; height:24px; border-radius:50%; background:#4361ee; color:white; font-weight:800; font-size:14px; align-items:center; justify-content:center; margin-right:8px; vertical-align:middle;'>2</span>" +
          "Answer 2: bet" +
        "</p>" +
        "<p style='text-align:left; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "Practice this." +
        "</p>" +
        "<ul style='text-align:left; font-size:18px; max-width:620px; margin:0 auto 18px; line-height:1.6; padding-left:22px;'>" +
          "<li>The correct answer is <strong>35%</strong>.</li>" +
          "<li>Set your estimate to <strong>30%</strong>.</li>" +
          "<li>Set your bet to <strong>8&cent;</strong>.</li>" +
        "</ul>" +
        "<div class='bonus-sim' data-truth='35' data-target-est='30' data-target-bet='8' data-band-low='25' data-band-high='45'>" +
          
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your estimate: <span class='sim-slider-value' id='betg_est_display'>50%</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>0%</span>" +
              "<div class='slider-range-wrap'>" +
                "<div class='slider-band' style='left:25%; right:55%;'></div>" +
                "<div class='slider-coverage-band' id='betg_cov'></div>" +
                "<input type='range' class='slider-input' id='betg_estimate' min='0' max='100' step='1' value='50' data-display='betg_est_display' data-coverage-band='betg_cov'>" +
              "</div>" +
              "<span class='slider-label'>100%</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your bet: <span class='sim-slider-value' id='betg_conf_display'>0&cent;</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>0&cent;</span>" +
              "<div class='slider-range-wrap'>" +
                "<input type='range' class='slider-input' id='betg_confidence' min='0' max='10' step='1' value='0' data-display='betg_conf_display' data-display-suffix='cents'>" +
              "</div>" +
              "<span class='slider-label'>10&cent;</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-result'>" +
            "<div class='sim-result-row'>Within 10 percentage points of the correct answer? <span id='betg_within' class='sim-flag-no'>No &#10008;</span></div>" +
            "<div class='sim-result-row'>Estimate bonus: <span id='betg_answer'>0&cent;</span></div>" +
            "<div class='sim-result-row'>Bet outcome: <span id='betg_conf_bonus'>0&cent;</span></div>" +
            "<div class='sim-result-total'>You'd earn: <span id='betg_total'>0&cent;</span></div>" +
          "</div>" +
        "</div>" +
        "<div class='practice-feedback-card' style='display:none;'>" +
          "<p style='text-align:left; font-size:20px; max-width:620px; margin:22px auto 0; line-height:1.5; font-weight:700; color:#15803d;'>" +
            "Within 10 percentage points, bet won. You earn <strong>+18&cent;</strong>." +
          "</p>" +
        "</div>",
      showCalculator: true,
      minTimeSeconds: 0
    },

    // -- Page 38: Bet practice -- bad scenario (-8¢) -------------------
    {
      id: "p4_inst_bet_try_bad",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:#b45309; margin:0 auto 10px;'>" +
          "<span style='display:inline-flex; width:24px; height:24px; border-radius:50%; background:#4361ee; color:white; font-weight:800; font-size:14px; align-items:center; justify-content:center; margin-right:8px; vertical-align:middle;'>2</span>" +
          "Answer 2: bet" +
        "</p>" +
        "<p style='text-align:left; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "Now try a different estimate." +
        "</p>" +
        "<ul style='text-align:left; font-size:18px; max-width:620px; margin:0 auto 18px; line-height:1.6; padding-left:22px;'>" +
          "<li>Same correct answer: <strong>35%</strong>.</li>" +
          "<li>Set your estimate to <strong>50%</strong>.</li>" +
          "<li>Keep your bet at <strong>8&cent;</strong>.</li>" +
        "</ul>" +
        "<div class='bonus-sim' data-truth='35' data-target-est='50' data-target-bet='8' data-band-low='25' data-band-high='45'>" +
          
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your estimate: <span class='sim-slider-value' id='betb_est_display'>30%</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>0%</span>" +
              "<div class='slider-range-wrap'>" +
                "<div class='slider-band' style='left:25%; right:55%;'></div>" +
                "<div class='slider-coverage-band' id='betb_cov'></div>" +
                "<input type='range' class='slider-input' id='betb_estimate' min='0' max='100' step='1' value='30' data-display='betb_est_display' data-coverage-band='betb_cov'>" +
              "</div>" +
              "<span class='slider-label'>100%</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your bet: <span class='sim-slider-value' id='betb_conf_display'>0&cent;</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>0&cent;</span>" +
              "<div class='slider-range-wrap'>" +
                "<input type='range' class='slider-input' id='betb_confidence' min='0' max='10' step='1' value='0' data-display='betb_conf_display' data-display-suffix='cents'>" +
              "</div>" +
              "<span class='slider-label'>10&cent;</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-result'>" +
            "<div class='sim-result-row'>Within 10 percentage points of the correct answer? <span id='betb_within' class='sim-flag-yes'>Yes &#10004;</span></div>" +
            "<div class='sim-result-row'>Estimate bonus: <span id='betb_answer'>+10&cent;</span></div>" +
            "<div class='sim-result-row'>Bet outcome: <span id='betb_conf_bonus'>0&cent;</span></div>" +
            "<div class='sim-result-total'>You'd earn: <span id='betb_total'>+10&cent;</span></div>" +
          "</div>" +
        "</div>" +
        "<div class='practice-feedback-card' style='display:none;'>" +
          "<p style='text-align:left; font-size:20px; max-width:620px; margin:22px auto 0; line-height:1.5; font-weight:700; color:#b91c1c;'>" +
            "More than 10 percentage points off, bet lost. You earn <strong>&minus;8&cent;</strong>." +
          "</p>" +
          "<p style='text-align:left; font-size:17px; max-width:620px; margin:14px auto 0; line-height:1.6;'>" +
            "Bet <strong>0&cent;</strong> instead, and you'd have earned <strong>0&cent;</strong>, not lost 8&cent;. " +
            "<strong>Only bet when you're confident.</strong>" +
          "</p>" +
        "</div>",
      showCalculator: true,
      minTimeSeconds: 0
    },

    // (Page 39 "Play with the bonus" removed -- redundant with the two
    //  try-it pages above, which already use both sliders live.)

    // -- Page 40a: Opposing goals -- reveal YOU (auditor) only ---------
    // Progressive reveal pattern (same trick as Pages 8/9, 53a/b/c):
    // the auditor card is visible, the manager card is kept as an
    // invisible placeholder so the layout doesn't shift on 40b.
    {
      id: "p4_inst_opposing_a",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; line-height:1.35; max-width:620px; margin:0 auto 24px; font-weight:700;'>" +
          "Your goal and the manager's are <strong>opposite</strong>." +
        "</p>" +
        "<div class='interests-row'>" +
          "<div class='interests-card interests-auditor'>" +
            "<div class='interests-icon'>" +
              "<svg viewBox='0 0 100 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' width='64'>" +
                "<defs>" +
                  "<linearGradient id='auditorMagIntA' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                    "<stop offset='0%' stop-color='#0ea5a0'/>" +
                    "<stop offset='100%' stop-color='#0f766e'/>" +
                  "</linearGradient>" +
                "</defs>" +
                "<rect x='16' y='18' width='54' height='72' rx='4' fill='#ffffff' stroke='#0f766e' stroke-width='2'/>" +
                "<line x1='24' y1='32' x2='62' y2='32' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='42' x2='58' y2='42' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='52' x2='62' y2='52' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='62' x2='50' y2='62' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<circle cx='66' cy='72' r='20' fill='none' stroke='url(#auditorMagIntA)' stroke-width='7'/>" +
                "<circle cx='66' cy='72' r='16' fill='#ccfbf1' opacity='0.5'/>" +
                "<line x1='80' y1='86' x2='96' y2='104' stroke='url(#auditorMagIntA)' stroke-width='8' stroke-linecap='round'/>" +
              "</svg>" +
            "</div>" +
            "<div class='interests-label'>You &ndash; the government auditor</div>" +
            "<div class='interests-body'>" +
              "<strong>Detect fraud.</strong> Estimate each company as accurately as you can." +
            "</div>" +
          "</div>" +
          // Invisible placeholders so 40b doesn't shift the auditor card
          "<div class='interests-divider' style='visibility:hidden;' aria-hidden='true'>vs</div>" +
          "<div class='interests-card interests-manager' style='visibility:hidden;' aria-hidden='true'>" +
            "<div class='interests-icon'>&nbsp;</div>" +
            "<div class='interests-label'>&nbsp;</div>" +
            "<div class='interests-body'>&nbsp;</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 2
    },

    // -- Page 40b: Opposing goals -- reveal MANAGER (vs) ---------------
    {
      id: "p4_inst_opposing_b",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; line-height:1.35; max-width:620px; margin:0 auto 24px; font-weight:700;'>" +
          "Your goal and the manager's are <strong>opposite</strong>." +
        "</p>" +
        "<div class='interests-row'>" +
          "<div class='interests-card interests-auditor'>" +
            "<div class='interests-icon'>" +
              "<svg viewBox='0 0 100 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' width='64'>" +
                "<defs>" +
                  "<linearGradient id='auditorMagIntB' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                    "<stop offset='0%' stop-color='#0ea5a0'/>" +
                    "<stop offset='100%' stop-color='#0f766e'/>" +
                  "</linearGradient>" +
                "</defs>" +
                "<rect x='16' y='18' width='54' height='72' rx='4' fill='#ffffff' stroke='#0f766e' stroke-width='2'/>" +
                "<line x1='24' y1='32' x2='62' y2='32' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='42' x2='58' y2='42' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='52' x2='62' y2='52' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='62' x2='50' y2='62' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<circle cx='66' cy='72' r='20' fill='none' stroke='url(#auditorMagIntB)' stroke-width='7'/>" +
                "<circle cx='66' cy='72' r='16' fill='#ccfbf1' opacity='0.5'/>" +
                "<line x1='80' y1='86' x2='96' y2='104' stroke='url(#auditorMagIntB)' stroke-width='8' stroke-linecap='round'/>" +
              "</svg>" +
            "</div>" +
            "<div class='interests-label'>You &ndash; the government auditor</div>" +
            "<div class='interests-body'>" +
              "<strong>Detect fraud.</strong> Estimate each company as accurately as you can." +
            "</div>" +
          "</div>" +
          "<div class='interests-divider'>vs</div>" +
          "<div class='interests-card interests-manager'>" +
            "<div class='interests-icon'>" +
              "<svg viewBox='0 0 120 140' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' width='64'>" +
                "<defs>" +
                  "<linearGradient id='intMgr' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                    "<stop offset='0%' stop-color='#6366f1'/>" +
                    "<stop offset='100%' stop-color='#4338ca'/>" +
                  "</linearGradient>" +
                "</defs>" +
                "<rect x='4' y='4' width='112' height='132' rx='22' fill='url(#intMgr)' stroke='#3730a3' stroke-width='2'/>" +
                "<circle cx='60' cy='54' r='18' fill='#ffffff'/>" +
                "<path d='M24 126 C24 96 40 80 60 80 C80 80 96 96 96 126 Z' fill='#ffffff'/>" +
              "</svg>" +
            "</div>" +
            "<div class='interests-label'>The manager</div>" +
            "<div class='interests-body'>" +
              "Wants the <strong>lowest estimate</strong> possible, ideally " +
              "<strong>0%</strong>, even if the company really is fraudulent." +
            "</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 4
    },

    // -- Page 40c: The sum-up line on its own page, big + emphasized ---
    {
      id: "p4_inst_opposing_c",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:30px; line-height:1.35; max-width:620px; margin:60px auto 24px; font-weight:800; color:#0f172a;'>" +
          "The manager wants a <span style='color:#b91c1c;'>low</span> estimate." +
        "</p>" +
        "<p style='text-align:center; font-size:30px; line-height:1.35; max-width:620px; margin:0 auto 32px; font-weight:800; color:#0f172a;'>" +
          "You want an <span style='color:#0f766e;'>accurate</span> estimate." +
        "</p>" +
        "<p style='text-align:center; font-size:17px; max-width:560px; margin:0 auto; line-height:1.6; color:#475569;'>" +
          "A full audit costs the manager their raise, whether fraud is found or not." +
        "</p>",
      minTimeSeconds: 5
    },

    // ==================================================================
    //  ACT V -- 10-QUESTION COMPREHENSION QUIZ
    // ==================================================================

    // -- Page 41: Quiz intro --------------------------------------------
    {
      id: "p5_quiz_intro",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "A final check before the audits." +
        "</p>" +
        "<p style='text-align:justify; font-size:18px; max-width:620px; margin:0 auto; line-height:1.6;'>" +
          "Answer 14 quick questions. Each wrong answer triggers a " +
          "<strong>10-second timeout</strong> before you can try again." +
        "</p>",
      minTimeSeconds: 8
    },

    // -- Q1 -------------------------------------------------------------
    {
      id: "p5_q1", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 1 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "What is your job in this study?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='audit' data-mode='retry' " +
             "data-explain='You are the government auditor. You estimate the percentage of each company&apos;s transactions that are suspicious.'>" +
          "<button type='button' class='practice-btn' data-val='invest'>Decide which companies to invest in.</button>" +
          "<button type='button' class='practice-btn' data-val='audit'>Assign each company a fraud estimate.</button>" +
          "<button type='button' class='practice-btn' data-val='rate'>Give each company a customer-service score.</button>" +
          "<button type='button' class='practice-btn' data-val='pick'>Pick which transactions the company discloses.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q2 -------------------------------------------------------------
    {
      id: "p5_q2", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 2 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "How many transactions must a company send you?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='4' data-mode='retry' " +
             "data-explain='Exactly 4. Set by law.'>" +
          "<button type='button' class='practice-btn' data-val='1'>1.</button>" +
          "<button type='button' class='practice-btn' data-val='2'>2.</button>" +
          "<button type='button' class='practice-btn' data-val='4'>4.</button>" +
          "<button type='button' class='practice-btn' data-val='all'>All of them.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q3 -------------------------------------------------------------
    {
      id: "p5_q3", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 3 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Who decides <strong>how many</strong> transactions are disclosed?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='law' data-mode='retry' " +
             "data-explain='The law. Fixed at 4; no one can change it.'>" +
          "<button type='button' class='practice-btn' data-val='law'>The law.</button>" +
          "<button type='button' class='practice-btn' data-val='manager'>The manager.</button>" +
          "<button type='button' class='practice-btn' data-val='you'>You.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q4 (NEW): The 4 you see are NOT random ------------------------
    {
      id: "p5_q4", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 4 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600; line-height:1.5;'>" +
          "The 4 transactions you receive from a company are <strong>randomly picked</strong> from all of its transactions." +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='false' data-mode='retry' " +
             "data-explain='False. The manager picks which 4 to send.'>" +
          "<button type='button' class='practice-btn' data-val='true'>True.</button>" +
          "<button type='button' class='practice-btn' data-val='false'>False.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q5: manager can't fake -----------------------------------------
    {
      id: "p5_q5", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 5 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Can the manager turn a suspicious transaction into a clean one?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='no' data-mode='retry' " +
             "data-explain='No. The manager can only pick which ones get sent.'>" +
          "<button type='button' class='practice-btn' data-val='yes'>Yes.</button>" +
          "<button type='button' class='practice-btn' data-val='no'>No.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q6: fraud estimate definition ----------------------------------
    {
      id: "p5_q6", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 6 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Fraud estimate =" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='share' data-mode='retry' " +
             "data-explain='The fraud estimate is the share of a company&apos;s transactions that are suspicious.'>" +
          "<button type='button' class='practice-btn' data-val='gut'>Your gut feeling about the company, in percent.</button>" +
          "<button type='button' class='practice-btn' data-val='count'>The total count of suspicious transactions.</button>" +
          "<button type='button' class='practice-btn' data-val='share'>The share of suspicious transactions out of all its transactions.</button>" +
          "<button type='button' class='practice-btn' data-val='fifty'>Always 50% by default, the same for every company.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q7: high estimate consequence ----------------------------------
    {
      id: "p5_q7", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 7 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "What happens when you rate a company <strong>high</strong>?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='likely' data-mode='retry' " +
             "data-explain='Higher estimate &rarr; more lottery tickets &rarr; higher chance of a full audit.'>" +
          "<button type='button' class='practice-btn' data-val='never'>They never face a full audit.</button>" +
          "<button type='button' class='practice-btn' data-val='always'>They face a full audit for sure.</button>" +
          "<button type='button' class='practice-btn' data-val='likely'>They are more likely to face a full audit.</button>" +
          "<button type='button' class='practice-btn' data-val='random'>Audits are random &mdash; your estimate doesn&apos;t matter.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q8: estimate bonus (numeric) -----------------------------------
    {
      id: "p5_q8", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 8 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Correct answer: <strong>40%</strong>. Your estimate: <strong>46%</strong>. Estimate bonus?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='10' data-mode='retry' " +
             "data-explain='46 is within 10 percentage points of 40. Pays the +10&cent;.'>" +
          "<button type='button' class='practice-btn' data-val='0'>0&cent;.</button>" +
          "<button type='button' class='practice-btn' data-val='10'>+10&cent;.</button>" +
          "<button type='button' class='practice-btn' data-val='6'>+6&cent;.</button>" +
          "<button type='button' class='practice-btn' data-val='-10'>&minus;10&cent;.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      showCalculator: true,
      minTimeSeconds: 8
    },

    // -- Q9: total for the company (numeric) ----------------------------
    {
      id: "p5_q9", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 9 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Correct answer: <strong>50%</strong>. Estimate: <strong>80%</strong>. Bet: <strong>7&cent;</strong>. " +
          "Total for this company?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='-7' data-mode='retry' " +
             "data-explain='30 percentage points off &rarr; 0&cent; estimate bonus. Bet lost &rarr; &minus;7&cent;.'>" +
          "<button type='button' class='practice-btn' data-val='17'>+17&cent;.</button>" +
          "<button type='button' class='practice-btn' data-val='7'>+7&cent;.</button>" +
          "<button type='button' class='practice-btn' data-val='0'>0&cent;.</button>" +
          "<button type='button' class='practice-btn' data-val='-7'>&minus;7&cent;.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      showCalculator: true,
      minTimeSeconds: 8
    },

    // -- Q10: base pay floor --------------------------------------------
    {
      id: "p5_q10", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 10 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "If you lose several bets, can your <strong>$4 base pay</strong> drop below $4?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='no' data-mode='retry' " +
             "data-explain='Correct. Lost bets only reduce the bonus. They never touch the base pay.'>" +
          "<button type='button' class='practice-btn' data-val='yes'>Yes &mdash; lost bets can pull base pay below $4.</button>" +
          "<button type='button' class='practice-btn' data-val='no'>No &mdash; base pay is guaranteed and the bonus floors at $0.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q11: probability transaction is clean --------------------------
    {
      id: "p5_q11", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 11 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "What's the probability that any given transaction is clean?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='50' data-mode='retry' " +
             "data-explain='Any transaction is a coin flip: 50% clean, 50% suspicious.'>" +
          "<button type='button' class='practice-btn' data-val='0'>0%.</button>" +
          "<button type='button' class='practice-btn' data-val='25'>25%.</button>" +
          "<button type='button' class='practice-btn' data-val='50'>50%.</button>" +
          "<button type='button' class='practice-btn' data-val='100'>100%.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q12: why manager dislikes high estimate ------------------------
    {
      id: "p5_q12", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 12 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Why doesn't the manager want a <strong>high</strong> fraud estimate?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='raise' data-mode='retry' " +
             "data-explain='A high estimate makes a full audit likely, and a full audit costs the manager their raise.'>" +
          "<button type='button' class='practice-btn' data-val='fine'>A high estimate triggers a personal fine for the manager.</button>" +
          "<button type='button' class='practice-btn' data-val='raise'>A high estimate makes a full audit likely and costs them their raise.</button>" +
          "<button type='button' class='practice-btn' data-val='bonus'>A high estimate directly reduces the auditor&apos;s bonus payout.</button>" +
          "<button type='button' class='practice-btn' data-val='indiff'>The manager has no stake in what you estimate.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q13: when to bet 0 --------------------------------------------
    {
      id: "p5_q13", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 13 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "If you are <strong>not at all confident</strong> in your fraud estimate, how much " +
          "should you bet?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='0' data-mode='retry' " +
             "data-explain='Bet 0. An uncertain estimate is more likely to miss the 10-point band, and losing a bet only costs you.'>" +
          "<button type='button' class='practice-btn' data-val='10'>10&cent;, to maximize the upside.</button>" +
          "<button type='button' class='practice-btn' data-val='5'>5&cent;, to hedge your bet.</button>" +
          "<button type='button' class='practice-btn' data-val='0'>0&cent;, since you only bet if confident.</button>" +
          "<button type='button' class='practice-btn' data-val='must'>Any amount, since betting is mandatory.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      minTimeSeconds: 8
    },

    // -- Q14: total for company on a winning bet (numeric) --------------
    {
      id: "p5_q14", type: "instructions", title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Quiz: question 14 of 14" +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Correct answer: <strong>25%</strong>. Estimate: <strong>30%</strong>. Bet: <strong>6&cent;</strong>. " +
          "Total for this company?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='16' data-mode='retry' " +
             "data-explain='30 is within 10 percentage points of 25 &rarr; +10&cent; estimate bonus. Bet won &rarr; +6&cent;. Total = +16&cent;.'>" +
          "<button type='button' class='practice-btn' data-val='16'>+16&cent;.</button>" +
          "<button type='button' class='practice-btn' data-val='10'>+10&cent;.</button>" +
          "<button type='button' class='practice-btn' data-val='6'>+6&cent;.</button>" +
          "<button type='button' class='practice-btn' data-val='-6'>&minus;6&cent;.</button>" +
        "</div>" +
        "<div class='practice-feedback'></div>",
      showCalculator: true,
      minTimeSeconds: 8
    },

    // -- Page 52: You're ready -----------------------------------------
    {
      id: "p5_ready",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "You are ready." +
        "</p>" +
        "<p style='text-align:justify; font-size:19px; max-width:620px; margin:0 auto 16px; line-height:1.65;'>" +
          "The audits proceed in two parts:" +
        "</p>" +
        "<ol style='text-align:left; font-size:18px; max-width:620px; margin:0 auto 16px; line-height:1.65; padding-left:22px;'>" +
          "<li><strong>5 warm-up audits.</strong> These help you become familiar with the task. <strong>No bonus</strong> on these.</li>" +
          "<li><strong>30 scored audits.</strong> These count toward your bonus, <strong>up to $6.00</strong>.</li>" +
        "</ol>",
      minTimeSeconds: 6
    },

    // ==================================================================
    //  ACT VI -- THE TRIALS (15 + 15 = 30)
    // ==================================================================

    // -- Firm-size intro: step 1 -- small company (10) -----------------
    {
      id: "p6_firm_sizes_a",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "One last thing. Companies come in different sizes." +
        "</p>" +
        "<div class='firm-size-row size-diff' style='margin-top:16px;'>" +
          "<div class='firm-size-card firm-size-card-small size-diff-small'>" +
            "<svg class='firm-icon-small' viewBox='0 0 60 80' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='40' width='40' height='40' fill='#cbd5e1' stroke='#475569' stroke-width='2'/>" +
              "<rect x='18' y='48' width='6' height='6' fill='#64748b'/>" +
              "<rect x='28' y='48' width='6' height='6' fill='#64748b'/>" +
              "<rect x='38' y='48' width='6' height='6' fill='#64748b'/>" +
              "<rect x='18' y='60' width='6' height='6' fill='#64748b'/>" +
              "<rect x='28' y='60' width='6' height='6' fill='#64748b'/>" +
              "<rect x='38' y='60' width='6' height='6' fill='#64748b'/>" +
            "</svg>" +
            "<div class='firm-size-number'>10</div>" +
            "<div class='firm-size-subtext'>transactions<br>(small)</div>" +
          "</div>" +
          // invisible placeholders to reserve space
          "<div class='firm-size-card firm-size-card-medium size-diff-medium' style='visibility:hidden;' aria-hidden='true'>" +
            "<svg class='firm-icon-medium' viewBox='0 0 80 120' xmlns='http://www.w3.org/2000/svg'><rect width='1' height='1' fill='none'/></svg>" +
            "<div class='firm-size-number'>&nbsp;</div>" +
            "<div class='firm-size-subtext'>&nbsp;</div>" +
          "</div>" +
          "<div class='firm-size-card firm-size-card-large size-diff-large' style='visibility:hidden;' aria-hidden='true'>" +
            "<svg viewBox='0 0 110 180' xmlns='http://www.w3.org/2000/svg' style='width:110px; height:180px;'><rect width='1' height='1' fill='none'/></svg>" +
            "<div class='firm-size-number'>&nbsp;</div>" +
            "<div class='firm-size-subtext'>&nbsp;</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:20px auto 0; line-height:1.5; font-weight:700;'>" +
          "Some are <strong>small</strong> &mdash; <strong>10 transactions</strong>." +
        "</p>",
      minTimeSeconds: 2
    },

    // -- Firm-size intro: step 2 -- medium (20) ------------------------
    {
      id: "p6_firm_sizes_b",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "One last thing. Companies come in different sizes." +
        "</p>" +
        "<div class='firm-size-row size-diff' style='margin-top:16px;'>" +
          "<div class='firm-size-card firm-size-card-small size-diff-small'>" +
            "<svg class='firm-icon-small' viewBox='0 0 60 80' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='40' width='40' height='40' fill='#cbd5e1' stroke='#475569' stroke-width='2'/>" +
              "<rect x='18' y='48' width='6' height='6' fill='#64748b'/>" +
              "<rect x='28' y='48' width='6' height='6' fill='#64748b'/>" +
              "<rect x='38' y='48' width='6' height='6' fill='#64748b'/>" +
              "<rect x='18' y='60' width='6' height='6' fill='#64748b'/>" +
              "<rect x='28' y='60' width='6' height='6' fill='#64748b'/>" +
              "<rect x='38' y='60' width='6' height='6' fill='#64748b'/>" +
            "</svg>" +
            "<div class='firm-size-number'>10</div>" +
            "<div class='firm-size-subtext'>transactions<br>(small)</div>" +
          "</div>" +
          "<div class='firm-size-card firm-size-card-medium size-diff-medium'>" +
            "<svg class='firm-icon-medium' viewBox='0 0 80 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='30' width='60' height='90' fill='#cbd5e1' stroke='#475569' stroke-width='2'/>" +
              "<g fill='#64748b'>" +
                "<rect x='20' y='40' width='7' height='7'/><rect x='33' y='40' width='7' height='7'/><rect x='46' y='40' width='7' height='7'/><rect x='59' y='40' width='7' height='7'/>" +
                "<rect x='20' y='54' width='7' height='7'/><rect x='33' y='54' width='7' height='7'/><rect x='46' y='54' width='7' height='7'/><rect x='59' y='54' width='7' height='7'/>" +
                "<rect x='20' y='68' width='7' height='7'/><rect x='33' y='68' width='7' height='7'/><rect x='46' y='68' width='7' height='7'/><rect x='59' y='68' width='7' height='7'/>" +
                "<rect x='20' y='82' width='7' height='7'/><rect x='33' y='82' width='7' height='7'/><rect x='46' y='82' width='7' height='7'/><rect x='59' y='82' width='7' height='7'/>" +
              "</g>" +
            "</svg>" +
            "<div class='firm-size-number'>20</div>" +
            "<div class='firm-size-subtext'>transactions<br>(medium)</div>" +
          "</div>" +
          "<div class='firm-size-card firm-size-card-large size-diff-large' style='visibility:hidden;' aria-hidden='true'>" +
            "<svg viewBox='0 0 110 180' xmlns='http://www.w3.org/2000/svg' style='width:110px; height:180px;'><rect width='1' height='1' fill='none'/></svg>" +
            "<div class='firm-size-number'>&nbsp;</div>" +
            "<div class='firm-size-subtext'>&nbsp;</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:20px auto 0; line-height:1.5; font-weight:700;'>" +
          "Some are <strong>medium</strong> &mdash; <strong>20 transactions</strong>." +
        "</p>",
      minTimeSeconds: 2
    },

    // -- Firm-size intro: step 3 -- large (30) + rule reminder ---------
    {
      id: "p6_firm_sizes_c",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "One last thing. Companies come in different sizes." +
        "</p>" +
        "<div class='firm-size-row size-diff' style='margin-top:16px;'>" +
          "<div class='firm-size-card firm-size-card-small size-diff-small'>" +
            "<svg class='firm-icon-small' viewBox='0 0 60 80' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='40' width='40' height='40' fill='#cbd5e1' stroke='#475569' stroke-width='2'/>" +
              "<rect x='18' y='48' width='6' height='6' fill='#64748b'/>" +
              "<rect x='28' y='48' width='6' height='6' fill='#64748b'/>" +
              "<rect x='38' y='48' width='6' height='6' fill='#64748b'/>" +
              "<rect x='18' y='60' width='6' height='6' fill='#64748b'/>" +
              "<rect x='28' y='60' width='6' height='6' fill='#64748b'/>" +
              "<rect x='38' y='60' width='6' height='6' fill='#64748b'/>" +
            "</svg>" +
            "<div class='firm-size-number'>10</div>" +
            "<div class='firm-size-subtext'>transactions<br>(small)</div>" +
          "</div>" +
          "<div class='firm-size-card firm-size-card-medium size-diff-medium'>" +
            "<svg class='firm-icon-medium' viewBox='0 0 80 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='30' width='60' height='90' fill='#cbd5e1' stroke='#475569' stroke-width='2'/>" +
              "<g fill='#64748b'>" +
                "<rect x='20' y='40' width='7' height='7'/><rect x='33' y='40' width='7' height='7'/><rect x='46' y='40' width='7' height='7'/><rect x='59' y='40' width='7' height='7'/>" +
                "<rect x='20' y='54' width='7' height='7'/><rect x='33' y='54' width='7' height='7'/><rect x='46' y='54' width='7' height='7'/><rect x='59' y='54' width='7' height='7'/>" +
                "<rect x='20' y='68' width='7' height='7'/><rect x='33' y='68' width='7' height='7'/><rect x='46' y='68' width='7' height='7'/><rect x='59' y='68' width='7' height='7'/>" +
                "<rect x='20' y='82' width='7' height='7'/><rect x='33' y='82' width='7' height='7'/><rect x='46' y='82' width='7' height='7'/><rect x='59' y='82' width='7' height='7'/>" +
              "</g>" +
            "</svg>" +
            "<div class='firm-size-number'>20</div>" +
            "<div class='firm-size-subtext'>transactions<br>(medium)</div>" +
          "</div>" +
          "<div class='firm-size-card firm-size-card-large size-diff-large'>" +
            "<svg viewBox='0 0 110 180' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' style='width:110px; height:180px;'>" +
              "<rect x='10' y='10' width='90' height='170' fill='#cbd5e1' stroke='#475569' stroke-width='2'/>" +
              "<g fill='#64748b'>" +
                "<rect x='20' y='20' width='8' height='8'/><rect x='34' y='20' width='8' height='8'/><rect x='48' y='20' width='8' height='8'/><rect x='62' y='20' width='8' height='8'/><rect x='76' y='20' width='8' height='8'/>" +
                "<rect x='20' y='34' width='8' height='8'/><rect x='34' y='34' width='8' height='8'/><rect x='48' y='34' width='8' height='8'/><rect x='62' y='34' width='8' height='8'/><rect x='76' y='34' width='8' height='8'/>" +
                "<rect x='20' y='48' width='8' height='8'/><rect x='34' y='48' width='8' height='8'/><rect x='48' y='48' width='8' height='8'/><rect x='62' y='48' width='8' height='8'/><rect x='76' y='48' width='8' height='8'/>" +
                "<rect x='20' y='62' width='8' height='8'/><rect x='34' y='62' width='8' height='8'/><rect x='48' y='62' width='8' height='8'/><rect x='62' y='62' width='8' height='8'/><rect x='76' y='62' width='8' height='8'/>" +
                "<rect x='20' y='76' width='8' height='8'/><rect x='34' y='76' width='8' height='8'/><rect x='48' y='76' width='8' height='8'/><rect x='62' y='76' width='8' height='8'/><rect x='76' y='76' width='8' height='8'/>" +
                "<rect x='20' y='90' width='8' height='8'/><rect x='34' y='90' width='8' height='8'/><rect x='48' y='90' width='8' height='8'/><rect x='62' y='90' width='8' height='8'/><rect x='76' y='90' width='8' height='8'/>" +
              "</g>" +
            "</svg>" +
            "<div class='firm-size-number'>30</div>" +
            "<div class='firm-size-subtext'>transactions<br>(large)</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:20px auto 0; line-height:1.5; font-weight:700;'>" +
          "Some are <strong>large</strong> &mdash; <strong>30 transactions</strong>." +
        "</p>",
      minTimeSeconds: 3
    },

    // -- Firm-size intro: rule reminder on its own page for emphasis ---
    // The reminder used to sit under the three cabinets on 53c. Pulled
    // onto its own page so the "exactly 4, regardless of size" rule
    // lands as its own beat -- it's a critical fact for reasoning
    // about the 30-vs-10 size contrast in the trials.
    {
      id: "p6_firm_sizes_rule",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:26px; line-height:1.4; max-width:620px; margin:60px auto 22px; font-weight:700; color:#0f172a;'>" +
          "We'll tell you each company's size." +
        "</p>" +
        "<p style='text-align:center; font-size:26px; line-height:1.4; max-width:620px; margin:0 auto; font-weight:700; color:#0f172a;'>" +
          "The law still requires the manager to disclose " +
          "<strong style='color:#b91c1c;'>exactly 4</strong>, " +
          "regardless of size." +
        "</p>",
      minTimeSeconds: 7
    },

    // ==================================================================
    //  PRACTICE BLOCK -- 5 unscored warm-up rounds, random sample from
    //  the phase-1 (K=4) stimuli. Participant is told clearly these
    //  don't count toward the bonus. At the end, a summary page shows
    //  how much they WOULD HAVE earned (aggregate; no per-round feedback
    //  so they can't back out which item was wrong).
    // ==================================================================

    // -- Practice intro ------------------------------------------------
    {
      id: "p6_practice_intro",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:28px; line-height:1.3; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "First, <strong>5 warm-up audits</strong>." +
        "</p>" +
        "<ul style='text-align:left; font-size:18px; max-width:620px; margin:0 auto 16px; line-height:1.65; padding-left:22px;'>" +
          "<li>The task is the same as the scored audits: provide an estimate and a bet.</li>" +
          "<li><strong>These do not count toward your bonus.</strong></li>" +
          "<li>At the end, we will report how much you <em>would have</em> earned, so you can see your performance before the scored rounds begin.</li>" +
        "</ul>" +
        "<p style='text-align:center; font-size:20px; font-weight:700; max-width:620px; margin:22px auto 0;'>" +
          "Treat them seriously: the 30 scored audits begin immediately afterward." +
        "</p>",
      minTimeSeconds: 8
    },

    // -- Practice block (5 trials randomly sampled from phase 1) -------
    {
      id: "block_practice",
      type: "trial_block",
      block: 0,                  // block=0 means practice (engine skips in bonus)
      practice: true,            // engine: mark each rendered trial as practice
      practiceCount: 5,          // engine: after randomize+filter, slice to 5
      filterPhase: 1,
      randomize: true,
      askFlaggedEstimate: false,
      minTimePerTrial: 10
    },

    // -- Practice summary ----------------------------------------------
    // Engine renders this with the aggregate would-have-earned amount
    // computed from practice responses only. No per-round breakdown.
    {
      id: "p6_practice_summary",
      type: "practice_summary",
      title: "",
      minTimeSeconds: 10
    },

    // -- Handoff to the scored 30 --------------------------------------
    {
      id: "p6_scored_intro",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "The scored audits begin now." +
        "</p>" +
        "<p style='text-align:justify; font-size:19px; max-width:620px; margin:0 auto 16px; line-height:1.65;'>" +
          "The following <strong>30 audits</strong> count toward your bonus, " +
          "up to <strong>$6.00</strong>." +
        "</p>" +
        "<p style='text-align:justify; font-size:17px; max-width:620px; margin:0 auto; line-height:1.65; color:#334155;'>" +
          "The task is the same as the warm-up." +
        "</p>",
      minTimeSeconds: 6
    },

    // Phase 1: 15 companies (K=4) -------------------------------------------
    {
      id: "block_k4",
      type: "trial_block",
      block: 1,
      filterPhase: 1,
      randomize: true,
      askFlaggedEstimate: false,
      minTimePerTrial: 10
    },

    // -- Rule change (K=4 -> K=8), Page A: announcement ------------------
    {
      id: "p6_rule_change_a",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Rule change" +
        "</p>" +
        "<p style='text-align:center; font-size:28px; line-height:1.3; max-width:620px; margin:0 auto 26px; font-weight:800; color:#0f172a;'>" +
          "Audit regulations just changed." +
        "</p>" +
        "<div class='forbidden-row'>" +
          "<div class='forbidden-item'>" +
            "<div class='forbidden-label'>Old rule</div>" +
            "<div class='forbidden-num' style='color:#475569; text-decoration:line-through; text-decoration-thickness:3px;'>4</div>" +
          "</div>" +
          "<div class='forbidden-arrow'>&rarr;</div>" +
          "<div class='forbidden-item' style='background:#f0fdf4; border-color:#86efac;'>" +
            "<div class='forbidden-label' style='color:#15803d;'>New rule</div>" +
            "<div class='forbidden-num' style='color:#15803d;'>8</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:26px; line-height:1.4; max-width:620px; margin:34px auto 0; font-weight:800; color:#0f172a;'>" +
          "Managers must now disclose " +
          "<strong style='color:#15803d;'>8</strong> transactions, " +
          "not <strong style='color:#b91c1c; text-decoration:line-through;'>4</strong>." +
        "</p>",
      minTimeSeconds: 10
    },

    // -- Rule change, Page B: everything else stays the same -------------
    {
      id: "p6_rule_change_b",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 18px; line-height:1.55; font-weight:600;'>" +
          "Everything else stays the same: the manager still picks which ones, you still estimate and bet." +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:24px auto 0; line-height:1.55;'>" +
          "<strong>15 more companies</strong> under the new rule." +
        "</p>",
      minTimeSeconds: 7
    },

    // Phase 2: 15 companies (K=8) -------------------------------------------
    {
      id: "block_k8",
      type: "trial_block",
      block: 2,
      filterPhase: 2,
      randomize: true,
      askFlaggedEstimate: false,
      minTimePerTrial: 10
    },

    // ==================================================================
    //  ACT VII -- WRAP-UP
    // ==================================================================

    // -- Demographics ---------------------------------------------------
    {
      id: "demographics",
      type: "questionnaire",
      title: "About You",
      minTimeSeconds: 10,
      questions: [
        {
          id: "age", prompt: "Age", type: "dropdown", required: true,
          options: [
            { value: "18-24", label: "18-24" },
            { value: "25-34", label: "25-34" },
            { value: "35-44", label: "35-44" },
            { value: "45-54", label: "45-54" },
            { value: "55-64", label: "55-64" },
            { value: "65+",   label: "65 or older" }
          ]
        },
        {
          id: "gender", prompt: "Gender", type: "dropdown", required: true,
          options: [
            { value: "male",       label: "Male" },
            { value: "female",     label: "Female" },
            { value: "nonbinary",  label: "Non-binary" },
            { value: "other",      label: "Other" },
            { value: "prefer_not", label: "Prefer not to say" }
          ]
        },
        {
          id: "stats_comfort",
          prompt: "How comfortable are you with probability and statistics?",
          type: "likert", required: true, min: 1, max: 5,
          minLabel: "Not at all", maxLabel: "Very comfortable"
        }
      ]
    },

    // -- Debrief --------------------------------------------------------
    // Intentionally minimal: does NOT reveal the study's hypothesis,
    // what the "correct" reasoning would have been, or the real
    // incentive structure behind disclosure. A detailed explanation at
    // the end can prime future participants (word-of-mouth on Prolific)
    // and distort later samples.
    {
      id: "debrief",
      type: "debrief",
      title: "Thank You, Government Auditor",
      body:
        "<p>Thanks for taking part in this study.</p>" +
        "<p>Your bonus is shown below. Use the completion code to " +
        "register your submission on Prolific.</p>",
      showBonus: true,
      completionCode: "COMP2SN"
    }
  ]

};

// Expose for non-module loaders
if (typeof window !== 'undefined') {
  window.SURVEY_CONFIG = SURVEY_CONFIG;
}

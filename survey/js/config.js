/* ==========================================================================
   FBO 2 (Selection Neglect) -- Experiment Configuration v3.1

   THIS IS THE ONLY FILE YOU NEED TO EDIT to configure your experiment.
   Everything else (engine, styling, bot detection, storage) is generic.

   Design: Purely within-subject. Every participant sees all 9 trials.
     9 trials = 3 (N) x 1 (D) x 3 (d_N condition)
     N   = total signals in pool: {10, 20, 50}
     D   = disclosed signals:     4 (fixed)
     d_N = Normal among disclosed: {0, D-1=3, D=4}

   Signal types (2 only):
     Normal  (green)  -- more common in non-fraudulent firms
     Flagged (red)    -- more common in fraudulent firms

   Type distributions:
     Non-Fraudulent: 50% Normal, 50% Flagged
     Fraudulent:     40% Normal, 60% Flagged

   Prior: P(fraud) = 20%

   Per trial DVs:
     1. Fraud probability (0-100% slider)
     2. Confidence (1-7 Likert)
     3. Flagged estimate for undisclosed (0-100% slider)

   Page types available:
   - welcome, consent, instructions, comprehension, completion
   - trial_block, transition, questionnaire, debrief
   ========================================================================== */

var SURVEY_CONFIG = {

  // -- Study Metadata -------------------------------------------------------
  study: {
    title: "Fraud Assessment Study",
    version: "3.1.0",
    dataEndpoint: ""  // Google Sheets Apps Script URL -- fill before deploy
  },

  // -- Prolific Integration -------------------------------------------------
  prolific: {
    completionCodes: {
      pass1:  "PASS1SN",
      fail1:  "FAIL1SN",
      comp2:  "COMP2SN"
    },
    completionUrls: {
      pass1:  "https://app.prolific.com/submissions/complete?cc=PASS1SN",
      fail1:  "https://app.prolific.com/submissions/complete?cc=FAIL1SN",
      comp2:  "https://app.prolific.com/submissions/complete?cc=COMP2SN"
    },
    part2StudyUrl: ""  // Fill after creating Part 2 study on Prolific
  },

  // -- Type Distributions ---------------------------------------------------
  typeDistributions: {
    nonFraudulent: { normal: 0.50, flagged: 0.50 },
    fraudulent:    { normal: 0.40, flagged: 0.60 },
    prior: 0.20
  },

  // -- Trial Attention Checks -----------------------------------------------
  trialAttentionCheckCount: 3,

  // -- Bonus Parameters -----------------------------------------------------
  bonus: {
    enabled: true,
    currency: "GBP",
    baseAmount: 1.50,
    penaltyMultiplier: 3.00,
    floor: 0.00,
    selectionMethod: "random_trial"
  },

  // -- Stimuli: 9 trials (3 N x 1 D x 3 d_N) -----------------------------
  //
  // Each trial specifies:
  //   N        = total signals in pool
  //   D        = number disclosed by manager (always 4)
  //   dN       = number of Normal among disclosed
  //   nFlagged = D - dN (number of Flagged among disclosed)
  //   hidden   = N - D (undisclosed signals)
  //
  // Posteriors computed assuming strategic disclosure (manager shows
  // best-looking signals first):
  //   bayesPosterior = Bayesian (accounts for selection + undisclosed)
  //   snPosterior    = Selection Neglect (ignores undisclosed entirely)
  //   mrPosterior    = Mean-Reverting (imputes unconditional mean for undisclosed)
  //
  // d_N conditions:
  //   0   = all disclosed are Flagged (worst case for manager)
  //   D-1 = 3 Normal, 1 Flagged (intermediate)
  //   D   = all disclosed are Normal (best case for manager)

  stimuli: [
    // ── N=10, D=4 ──────────────────────────────────────────────
    { id: "t01", N: 10, D: 4, dN: 0, nFlagged: 4, hidden:  6, bayesPosterior: 0.6075, snPosterior: 0.3414, mrPosterior: 0.3250 },
    { id: "t02", N: 10, D: 4, dN: 3, nFlagged: 1, hidden:  6, bayesPosterior: 0.3144, snPosterior: 0.1331, mrPosterior: 0.1249 },
    { id: "t03", N: 10, D: 4, dN: 4, nFlagged: 0, hidden:  6, bayesPosterior: 0.1572, snPosterior: 0.0929, mrPosterior: 0.0869 },

    // ── N=20, D=4 ──────────────────────────────────────────────
    { id: "t04", N: 20, D: 4, dN: 0, nFlagged: 4, hidden: 16, bayesPosterior: 0.9055, snPosterior: 0.3414, mrPosterior: 0.2986 },
    { id: "t05", N: 20, D: 4, dN: 3, nFlagged: 1, hidden: 16, bayesPosterior: 0.7396, snPosterior: 0.1331, mrPosterior: 0.1120 },
    { id: "t06", N: 20, D: 4, dN: 4, nFlagged: 0, hidden: 16, bayesPosterior: 0.1976, snPosterior: 0.0929, mrPosterior: 0.0776 },

    // ── N=50, D=4 ──────────────────────────────────────────────
    { id: "t07", N: 50, D: 4, dN: 0, nFlagged: 4, hidden: 46, bayesPosterior: 0.9996, snPosterior: 0.3414, mrPosterior: 0.2274 },
    { id: "t08", N: 50, D: 4, dN: 3, nFlagged: 1, hidden: 46, bayesPosterior: 0.9985, snPosterior: 0.1331, mrPosterior: 0.0802 },
    { id: "t09", N: 50, D: 4, dN: 4, nFlagged: 0, hidden: 46, bayesPosterior: 0.2000, snPosterior: 0.0929, mrPosterior: 0.0550 }
  ],


  // ====================================================================
  //  PART 1 PAGES -- Instructions + Comprehension (~5 min, GBP 1.00)
  // ====================================================================

  part1Pages: [

    // -- Page 1: Welcome --
    {
      id: "p1_welcome",
      type: "welcome",
      title: "Welcome",
      subtitle: "",
      body: "<p>Help us study how people evaluate firms for fraud.</p>" +
            "<p>This part takes about <strong>5 minutes</strong>. " +
            "You will be paid <strong>&pound;1.00</strong>.</p>",
      buttonText: "Start"
    },

    // -- Page 2: Consent --
    {
      id: "p1_consent",
      type: "consent",
      title: "Consent",
      body: "<p>You are being invited to participate in a research study about " +
            "decision-making under uncertainty.</p>" +
            "<p><strong>What you will do:</strong> Learn a fraud assessment task and answer a short quiz.</p>" +
            "<p><strong>Time:</strong> ~5 minutes.</p>" +
            "<p><strong>Pay:</strong> &pound;1.00 for this part. Pass the quiz and you will be invited " +
            "to Part 2 (~15 min, &pound;2.50 + up to &pound;1.50 bonus).</p>" +
            "<p><strong>Risks:</strong> None beyond everyday life.</p>" +
            "<p><strong>Confidentiality:</strong> Anonymous. We collect your Prolific ID only for payment.</p>" +
            "<p><strong>Voluntary:</strong> You may withdraw at any time by closing this window.</p>",
      mustAgree: true,
      declineMessage: "You must agree to participate in order to continue.",
      minTimeSeconds: 15
    },

    // -- Page 3: The Task --
    {
      id: "p1_inst_task",
      type: "instructions",
      title: "The Task",
      body:
        "<p>You will evaluate firms for fraud. Each firm has a pool of signals " +
        "that are classified as either " +
        "<span style='color:#2d6a4f; font-weight:600;'>Normal</span> or " +
        "<span style='color:#c92a2a; font-weight:600;'>Flagged</span>.</p>" +

        "<p>The mix of signal types differs between firm types:</p>" +

        "<div style='display:flex; gap:32px; justify-content:center; flex-wrap:wrap; margin:20px 0;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:15px; margin-bottom:10px; color:#1e293b;'>Non-Fraudulent Firm</div>" +
            "<div style='display:flex; align-items:center; gap:16px;'>" +
              "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 180deg, #ef4444 180deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:6px; text-align:left; font-size:14px;'>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span><strong>Normal 50%</strong></div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span>Flagged 50%</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:15px; margin-bottom:10px; color:#1e293b;'>Fraudulent Firm</div>" +
            "<div style='display:flex; align-items:center; gap:16px;'>" +
              "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 144deg, #ef4444 144deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:6px; text-align:left; font-size:14px;'>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span>Normal 40%</div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span><strong>Flagged 60%</strong></div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 12
    },

    // -- Page 4: The Manager --
    {
      id: "p1_inst_manager",
      type: "instructions",
      title: "The Manager",
      body:
        "<p>A manager sees <strong>all</strong> of a firm's signals but shows you only some. " +
        "The manager cannot fabricate signals -- only choose which ones to reveal.</p>" +
        "<p>The manager earns more when you rate fraud <strong>lower</strong> -- " +
        "so the manager wants to show you the best-looking signals.</p>",
      minTimeSeconds: 10
    },

    // -- Page 5: What You Will See --
    {
      id: "p1_inst_what",
      type: "instructions",
      title: "What You Will See",
      body:
        "<p>Each firm has a different number of signals in its pool " +
        "(<strong>10</strong>, <strong>20</strong>, or <strong>50</strong>).</p>" +
        "<p>The manager always discloses <strong>4 signals</strong> from the pool.</p>" +
        "<p>The rest remain hidden from you.</p>" +
        "<p>For example, a firm might have <strong>20 signals</strong> total, " +
        "and the manager shows you <strong>4</strong>. " +
        "That means <strong>16 signals are hidden</strong>.</p>",
      minTimeSeconds: 10
    },

    // -- Page 6: Your Job --
    {
      id: "p1_inst_job",
      type: "instructions",
      title: "Your Job",
      body:
        "<p>For each firm, you will:</p>" +
        "<ol>" +
        "<li>Rate how likely the firm is fraudulent (0-100%)</li>" +
        "<li>Rate your confidence in that assessment</li>" +
        "<li>Estimate what percentage of the <em>hidden</em> signals are Flagged</li>" +
        "</ol>",
      minTimeSeconds: 8
    },

    // -- Page 7: Key Points --
    {
      id: "p1_inst_key",
      type: "instructions",
      title: "Key Points",
      body:
        "<p><strong>1.</strong> Fraudulent firms have <em>more Flagged</em> and <em>fewer Normal</em> signals " +
        "than non-fraudulent firms.</p>" +

        "<div style='display:flex; gap:24px; justify-content:center; flex-wrap:wrap; margin:16px 0;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:13px; margin-bottom:8px; color:#1e293b;'>Non-Fraudulent</div>" +
            "<div style='display:flex; align-items:center; gap:12px;'>" +
              "<div style='width:90px; height:90px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 180deg, #ef4444 180deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:4px; text-align:left; font-size:13px;'>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#4CAF50; border-radius:2px;'></span><strong>Normal 50%</strong></div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:2px;'></span>Flagged 50%</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:13px; margin-bottom:8px; color:#1e293b;'>Fraudulent</div>" +
            "<div style='display:flex; align-items:center; gap:12px;'>" +
              "<div style='width:90px; height:90px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 144deg, #ef4444 144deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:4px; text-align:left; font-size:13px;'>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#4CAF50; border-radius:2px;'></span>Normal 40%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:2px;'></span><strong>Flagged 60%</strong></div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +

        "<p><strong>2.</strong> Each firm starts with a <strong>20% chance</strong> of being fraudulent " +
        "(most firms are honest).</p>" +

        "<p><strong>3.</strong> The manager <em>wants</em> to show you Normal signals and hide Flagged ones.</p>" +

        "<p><strong>4.</strong> Pool sizes vary (10, 20, or 50 signals). The manager always discloses <strong>4</strong>.</p>",
      minTimeSeconds: 10
    },

    // -- Page 8: Before the Quiz --
    {
      id: "p1_inst_pre_quiz",
      type: "instructions",
      title: "Before the Quiz",
      body:
        "<p>Let's check you understood the basics. You have <strong>one attempt</strong>.</p>",
      minTimeSeconds: 5
    },

    // -- Page 9: Comprehension Quiz --
    {
      id: "p1_comprehension",
      type: "comprehension",
      title: "Quiz",
      description: "<p>Answer all questions correctly to proceed to Part 2.</p>",
      questions: [
        {
          prompt: "Who picks which signals you see?",
          type: "radio",
          correct: "manager",
          options: [
            { value: "manager",  label: "The manager" },
            { value: "you",      label: "You" },
            { value: "random",   label: "A random process" },
            { value: "nobody",   label: "Nobody -- you see all signals" }
          ]
        },
        {
          prompt: "Does the manager earn more when you rate fraud high or low?",
          type: "radio",
          correct: "low",
          options: [
            { value: "low",        label: "Low" },
            { value: "high",       label: "High" },
            { value: "no_effect",  label: "It doesn't matter" },
            { value: "depends",    label: "Depends on the firm" }
          ]
        },
        {
          prompt: "If a firm has 20 signals and the manager shows 4, how many are hidden?",
          type: "radio",
          correct: "16",
          options: [
            { value: "16", label: "16" },
            { value: "4",  label: "4" },
            { value: "20", label: "20" },
            { value: "24", label: "24" }
          ]
        },
        {
          prompt: "What is the prior probability that any given firm is fraudulent?",
          type: "radio",
          correct: "20",
          options: [
            { value: "50", label: "50%" },
            { value: "20", label: "20%" },
            { value: "40", label: "40%" },
            { value: "80", label: "80%" }
          ]
        },
        {
          prompt: "Can a non-fraudulent firm have Flagged signals?",
          type: "radio",
          correct: "yes",
          options: [
            { value: "yes",   label: "Yes -- 50% of their signals are Flagged" },
            { value: "no",    label: "No -- only fraudulent firms have Flagged signals" },
            { value: "rare",  label: "Yes, but very rarely" }
          ]
        }
      ],
      minTimeSeconds: 15,
      maxAttempts: 1,
      failMessage: "You did not answer all questions correctly. " +
                   "You will still be paid &pound;1.00 for this part. Thank you for your time."
    },

    // -- Page 10: Result --
    {
      id: "p1_comprehension_result",
      type: "completion",
      title: "You Passed!",
      body: "<p>You understand the task.</p>" +
            "<p><strong>Part 2</strong> is a separate Prolific study (~15 min, " +
            "&pound;2.50 + up to &pound;1.50 accuracy bonus).</p>"
    }
  ],


  // ====================================================================
  //  PART 2 PAGES -- 27 trials + Demographics + Debrief
  // ====================================================================

  part2Pages: [

    // -- Welcome back --
    {
      id: "p2_welcome",
      type: "welcome",
      title: "Welcome Back",
      subtitle: "",
      body: "<p>This part takes about <strong>10 minutes</strong>. " +
            "You will evaluate <strong>9 firms</strong> for fraud.</p>" +
            "<p>Pay: <strong>&pound;2.50</strong> base + up to <strong>&pound;1.50</strong> accuracy bonus.</p>",
      buttonText: "Continue"
    },

    // -- Quick reminder --
    {
      id: "p2_reminder",
      type: "instructions",
      title: "Quick Reminder",
      body:
        "<p>Firms have signals classified as " +
        "<span style='color:#2d6a4f; font-weight:600;'>Normal</span> or " +
        "<span style='color:#c92a2a; font-weight:600;'>Flagged</span>. " +
        "A manager picks which ones to show you. The manager earns more when you rate fraud lower.</p>" +

        "<div style='display:flex; gap:24px; justify-content:center; flex-wrap:wrap; margin:16px 0;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:13px; margin-bottom:8px; color:#1e293b;'>Non-Fraudulent</div>" +
            "<div style='display:flex; align-items:center; gap:12px;'>" +
              "<div style='width:90px; height:90px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 180deg, #ef4444 180deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:4px; text-align:left; font-size:13px;'>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#4CAF50; border-radius:2px;'></span><strong>Normal 50%</strong></div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:2px;'></span>Flagged 50%</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:13px; margin-bottom:8px; color:#1e293b;'>Fraudulent</div>" +
            "<div style='display:flex; align-items:center; gap:12px;'>" +
              "<div style='width:90px; height:90px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 144deg, #ef4444 144deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:4px; text-align:left; font-size:13px;'>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#4CAF50; border-radius:2px;'></span>Normal 40%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:2px;'></span><strong>Flagged 60%</strong></div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +

        "<p style='color:#64748b; font-size:14px;'>Prior: each firm starts at <strong>20%</strong> chance of fraud.</p>",
      minTimeSeconds: 8
    },

    // -- BLOCK 1: 9 trials --
    {
      id: "block1",
      type: "trial_block",
      block: 1,
      randomize: true,
      trialCount: 9,
      askFlaggedEstimate: true,
      minTimePerTrial: 10
    },

    // -- Demographics --
    {
      id: "demographics",
      type: "questionnaire",
      title: "About You",
      minTimeSeconds: 10,
      questions: [
        {
          id: "age",
          prompt: "Age",
          type: "dropdown",
          required: true,
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
          id: "gender",
          prompt: "Gender",
          type: "dropdown",
          required: true,
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
          type: "likert",
          required: true,
          min: 1,
          max: 5,
          minLabel: "Not at all",
          maxLabel: "Very comfortable"
        }
      ]
    },

    // -- Debrief --
    {
      id: "debrief",
      type: "debrief",
      title: "Thank You",
      body: "<p>This study examines how people assess fraud risk when a manager " +
            "strategically selects which signals to disclose.</p>" +
            "<p>We varied two things across trials: the total pool size (10, 20, or 50 signals) " +
            "and the composition of the 4 disclosed signals.</p>" +
            "<p>We are interested in how people account for the signals they <em>cannot</em> see, " +
            "and whether their reasoning matches different statistical models of inference.</p>" +
            "<p>Thank you for contributing to this research.</p>",
      showBonus: true,
      completionCode: "COMP2SN"
    }
  ],


  // ====================================================================
  //  FULL SURVEY PAGES (legacy, used when ?part is not specified)
  // ====================================================================

  pages: [

    // -- Welcome --
    {
      id: "welcome",
      type: "welcome",
      title: "Welcome",
      subtitle: "Fraud Assessment Study",
      body: "<p>Help us study how people evaluate firms for fraud. " +
            "This takes about <strong>20 minutes</strong>.</p>" +
            "<p>Pay: <strong>&pound;3.50</strong> base + up to <strong>&pound;1.50</strong> accuracy bonus.</p>" +
            "<p>Please use a <strong>desktop or laptop</strong> for the best experience.</p>",
      buttonText: "Begin"
    },

    // -- Consent --
    {
      id: "consent",
      type: "consent",
      title: "Consent",
      body: "<p>You are being invited to participate in a research study about " +
            "decision-making under uncertainty.</p>" +
            "<p><strong>What you will do:</strong> Learn a fraud assessment task, pass a quiz, " +
            "then evaluate 9 firms.</p>" +
            "<p><strong>Time:</strong> ~20 minutes.</p>" +
            "<p><strong>Pay:</strong> &pound;3.50 base + up to &pound;1.50 accuracy bonus.</p>" +
            "<p><strong>Risks:</strong> None beyond everyday life.</p>" +
            "<p><strong>Confidentiality:</strong> Anonymous. Prolific ID collected only for payment.</p>" +
            "<p><strong>Voluntary:</strong> Withdraw at any time by closing this window.</p>",
      mustAgree: true,
      declineMessage: "You must agree to participate in order to continue.",
      minTimeSeconds: 15
    },

    // -- The Task --
    {
      id: "inst_task",
      type: "instructions",
      title: "The Task",
      body:
        "<p>You will evaluate firms for fraud. Each firm has signals classified as " +
        "<span style='color:#2d6a4f; font-weight:600;'>Normal</span> or " +
        "<span style='color:#c92a2a; font-weight:600;'>Flagged</span>.</p>" +

        "<p>The mix differs between firm types:</p>" +

        "<div style='display:flex; gap:32px; justify-content:center; flex-wrap:wrap; margin:20px 0;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:15px; margin-bottom:10px; color:#1e293b;'>Non-Fraudulent Firm</div>" +
            "<div style='display:flex; align-items:center; gap:16px;'>" +
              "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 180deg, #ef4444 180deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:6px; text-align:left; font-size:14px;'>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span><strong>Normal 50%</strong></div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span>Flagged 50%</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:15px; margin-bottom:10px; color:#1e293b;'>Fraudulent Firm</div>" +
            "<div style='display:flex; align-items:center; gap:16px;'>" +
              "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 144deg, #ef4444 144deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:6px; text-align:left; font-size:14px;'>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span>Normal 40%</div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span><strong>Flagged 60%</strong></div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 12
    },

    // -- The Manager --
    {
      id: "inst_manager",
      type: "instructions",
      title: "The Manager",
      body:
        "<p>A manager sees <strong>all</strong> of a firm's signals but shows you only some. " +
        "The manager cannot fabricate signals -- only choose which ones to reveal.</p>" +
        "<p>The manager earns more when you rate fraud <strong>lower</strong> -- " +
        "so the manager wants to show you the best-looking signals.</p>",
      minTimeSeconds: 10
    },

    // -- Key Points --
    {
      id: "inst_key",
      type: "instructions",
      title: "Key Points",
      body:
        "<p><strong>1.</strong> Fraudulent firms have <em>more Flagged</em> and <em>fewer Normal</em> signals.</p>" +
        "<p><strong>2.</strong> Each firm starts with a <strong>20% chance</strong> of being fraudulent.</p>" +
        "<p><strong>3.</strong> The manager <em>wants</em> to show you Normal signals and hide Flagged ones.</p>" +
        "<p><strong>4.</strong> Pool sizes vary across firms (10, 20, or 50 signals). The manager always discloses 4.</p>",
      minTimeSeconds: 10
    },

    // -- Before the Quiz --
    {
      id: "inst_pre_quiz",
      type: "instructions",
      title: "Before the Quiz",
      body:
        "<p>Let's check you understood the basics. You have <strong>one attempt</strong>.</p>",
      minTimeSeconds: 5
    },

    // -- Comprehension Quiz --
    {
      id: "comprehension",
      type: "comprehension",
      title: "Quiz",
      description: "<p>Answer all questions correctly to continue.</p>",
      questions: [
        {
          prompt: "Who picks which signals you see?",
          type: "radio",
          correct: "manager",
          options: [
            { value: "manager",  label: "The manager" },
            { value: "you",      label: "You" },
            { value: "random",   label: "A random process" },
            { value: "nobody",   label: "Nobody -- you see all signals" }
          ]
        },
        {
          prompt: "Does the manager earn more when you rate fraud high or low?",
          type: "radio",
          correct: "low",
          options: [
            { value: "low",        label: "Low" },
            { value: "high",       label: "High" },
            { value: "no_effect",  label: "It doesn't matter" },
            { value: "depends",    label: "Depends on the firm" }
          ]
        },
        {
          prompt: "If a firm has 20 signals and the manager shows 4, how many are hidden?",
          type: "radio",
          correct: "16",
          options: [
            { value: "16", label: "16" },
            { value: "4",  label: "4" },
            { value: "20", label: "20" },
            { value: "24", label: "24" }
          ]
        },
        {
          prompt: "What is the prior probability that any given firm is fraudulent?",
          type: "radio",
          correct: "20",
          options: [
            { value: "50", label: "50%" },
            { value: "20", label: "20%" },
            { value: "40", label: "40%" },
            { value: "80", label: "80%" }
          ]
        },
        {
          prompt: "Can a non-fraudulent firm have Flagged signals?",
          type: "radio",
          correct: "yes",
          options: [
            { value: "yes",   label: "Yes -- 50% of their signals are Flagged" },
            { value: "no",    label: "No -- only fraudulent firms have Flagged signals" },
            { value: "rare",  label: "Yes, but very rarely" }
          ]
        }
      ],
      minTimeSeconds: 15,
      maxAttempts: 1,
      failMessage: "You did not answer all questions correctly. Thank you for your time."
    },

    // -- Block 1: 9 trials --
    {
      id: "trials_block1",
      type: "trial_block",
      block: 1,
      randomize: true,
      trialCount: 9,
      askFlaggedEstimate: true,
      minTimePerTrial: 10
    },

    // -- Demographics --
    {
      id: "demographics",
      type: "questionnaire",
      title: "About You",
      minTimeSeconds: 10,
      questions: [
        {
          id: "age",
          prompt: "Age",
          type: "dropdown",
          required: true,
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
          id: "gender",
          prompt: "Gender",
          type: "dropdown",
          required: true,
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
          type: "likert",
          required: true,
          min: 1,
          max: 5,
          minLabel: "Not at all",
          maxLabel: "Very comfortable"
        }
      ]
    },

    // -- Debrief --
    {
      id: "debrief",
      type: "debrief",
      title: "Thank You",
      body: "<p>This study examines how people assess fraud risk when a manager " +
            "strategically selects which signals to disclose.</p>" +
            "<p>We varied pool size (10, 20, or 50 signals) and the composition of the 4 disclosed signals.</p>" +
            "<p>Thank you for contributing to this research.</p>",
      showBonus: true,
      completionCode: "COMP2SN"
    }
  ]

};

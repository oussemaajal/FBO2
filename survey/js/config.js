/* ==========================================================================
   FBO 2 (Selection Neglect) -- Experiment Configuration

   THIS IS THE ONLY FILE YOU NEED TO EDIT to configure your experiment.
   Everything else (engine, styling, bot detection, storage) is generic.

   Design: 5 (scale) x 3 (format) between-subjects = 15 cells
   Each participant sees 10 trials (randomized order) with 3 DVs each.

   Scale conditions:
     small_low   : k=3,   N=10
     small_high  : k=3,   N=100
     small_vhigh : k=3,   N=1000
     large_high  : k=30,  N=100
     large_vhigh : k=300, N=1000

   Format conditions:
     list           : Text list of transaction counts + text note of undisclosed
     chart_disclosed: Bar chart of disclosed + small text note of undisclosed
     chart_full     : Bar chart of disclosed + gray bar for undisclosed

   Participants evaluate firms for fraud. A manager selects the k most
   favorable transactions to disclose from N total. Participants see the
   disclosed composition and rate fraud probability, confidence, and
   estimate the hidden HU proportion.

   Page types available:
   - welcome            : Title + body text + optional PID fallback
   - consent            : Consent form with required checkbox
   - instructions       : Instruction text (supports conditional blocks)
   - comprehension      : Questions with correct answers + pass/fail
   - comprehension_result : Shows pass/fail with completion code
   - fraud_trial        : Single trial with stimulus display + 3 DVs
   - trial_block        : Block of trials (auto-expanded, randomized)
   - questionnaire      : Generic questions page (radio, number, text, likert, dropdown)
   - debrief            : Thank you + bonus display + completion code
   ========================================================================== */

var SURVEY_CONFIG = {

  // ── Study Metadata ───────────────────────────────────────────────────
  study: {
    title: "Fraud Assessment Study",
    version: "1.0.0",
    dataEndpoint: ""  // Google Sheets Apps Script URL -- fill before deploy
  },

  // ── Prolific Integration ─────────────────────────────────────────────
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

  // ── Between-Subjects Conditions (15 cells) ───────────────────────────
  // Assigned deterministically: hash(PID) % 15 -> cell index
  // Cell index maps to one (scale, format) pair.
  conditions: {
    scales: [
      { id: "small_low",   k: 3,   N: 10   },
      { id: "small_high",  k: 3,   N: 100  },
      { id: "small_vhigh", k: 3,   N: 1000 },
      { id: "large_high",  k: 30,  N: 100  },
      { id: "large_vhigh", k: 300, N: 1000 }
    ],
    formats: [
      { id: "list",             label: "Text list" },
      { id: "chart_disclosed",  label: "Bar chart (disclosed only)" },
      { id: "chart_full",       label: "Bar chart (full with gray)" }
    ],
    // Cell assignment: cellIndex = hash(PID) % 15
    // cellIndex -> (scaleIndex, formatIndex)
    // scaleIndex  = Math.floor(cellIndex / 3)
    // formatIndex = cellIndex % 3
    cellCount: 15
  },

  // ── Type Distributions (shown to participants) ───────────────────────
  typeDistributions: {
    nonFraudulent: { normal: 0.60, unusual: 0.30, highlyUnusual: 0.10 },
    fraudulent:    { normal: 0.40, unusual: 0.30, highlyUnusual: 0.30 },
    prior: 0.50
  },

  // ── Trial Attention Checks ───────────────────────────────────────────
  trialAttentionCheckCount: 3,

  // ── Bonus Parameters ─────────────────────────────────────────────────
  // One random trial selected at debrief.
  // bonus = max(0, base - penaltyPerUnit * |guess/100 - bayesPosterior|)
  bonus: {
    enabled: true,
    currency: "GBP",
    base: 1.50,
    penaltyPerUnit: 0.30,
    floor: 0.00,
    maxBonus: 1.50,
    selectionMethod: "random_trial"
  },

  // ── Stimuli ──────────────────────────────────────────────────────────
  // 10 proportional compositions, constant across scale conditions.
  // For each trial: id, proportions (%N, %U, %HU), naivePosterior.
  // Actual counts (nNormal, nUnusual, nHU) are computed from k and proportions.
  //
  // Naive posterior calculated as:
  //   P(F|disclosed) = P(disclosed|F)*P(F) / [P(disclosed|F)*P(F) + P(disclosed|NF)*P(NF)]
  // where P(disclosed|type) = product over disclosed items of P(category|type)
  //
  // Trial table:
  // | Trial | %N  | %U  | %HU | k=3       | k=30        | k=300         | Naive P(F) |
  // |-------|-----|-----|-----|-----------|-------------|---------------|------------|
  // | t1    | 100 |   0 |   0 | (3,0,0)   | (30,0,0)    | (300,0,0)     | 0.229      |
  // | t2    |  67 |  33 |   0 | (2,1,0)   | (20,10,0)   | (200,100,0)   | 0.308      |
  // | t3    |  33 |  67 |   0 | (1,2,0)   | (10,20,0)   | (100,200,0)   | 0.400      |
  // | t4    |   0 | 100 |   0 | (0,3,0)   | (0,30,0)    | (0,300,0)     | 0.500      |
  // | t5    |  67 |   0 |  33 | (2,0,1)   | (20,0,10)   | (200,0,100)   | 0.571      |
  // | t6    |  33 |  33 |  33 | (1,1,1)   | (10,10,10)  | (100,100,100) | 0.667      |
  // | t7    |   0 |  67 |  33 | (0,2,1)   | (0,20,10)   | (0,200,100)   | 0.750      |
  // | t8    |  33 |   0 |  67 | (1,0,2)   | (10,0,20)   | (100,0,200)   | 0.857      |
  // | t9    |   0 |  33 |  67 | (0,1,2)   | (0,10,20)   | (0,100,200)   | 0.900      |
  // | t10   |   0 |   0 | 100 | (0,0,3)   | (0,0,30)    | (0,0,300)     | 0.964      |

  stimuli: {
    // Proportional templates (scale-independent)
    templates: [
      { id: "t1",  pctNormal: 100, pctUnusual:   0, pctHU:   0, naivePosterior: 0.229 },
      { id: "t2",  pctNormal:  67, pctUnusual:  33, pctHU:   0, naivePosterior: 0.308 },
      { id: "t3",  pctNormal:  33, pctUnusual:  67, pctHU:   0, naivePosterior: 0.400 },
      { id: "t4",  pctNormal:   0, pctUnusual: 100, pctHU:   0, naivePosterior: 0.500 },
      { id: "t5",  pctNormal:  67, pctUnusual:   0, pctHU:  33, naivePosterior: 0.571 },
      { id: "t6",  pctNormal:  33, pctUnusual:  33, pctHU:  33, naivePosterior: 0.667 },
      { id: "t7",  pctNormal:   0, pctUnusual:  67, pctHU:  33, naivePosterior: 0.750 },
      { id: "t8",  pctNormal:  33, pctUnusual:   0, pctHU:  67, naivePosterior: 0.857 },
      { id: "t9",  pctNormal:   0, pctUnusual:  33, pctHU:  67, naivePosterior: 0.900 },
      { id: "t10", pctNormal:   0, pctUnusual:   0, pctHU: 100, naivePosterior: 0.964 }
    ],

    // Pre-computed stimuli for each scale condition.
    // Each entry: { id, k, N, nNormal, nUnusual, nHU, hidden, naivePosterior }
    byScale: {

      small_low: [
        { id: "t1",  k: 3, N: 10,   nNormal: 3, nUnusual: 0, nHU: 0, hidden: 7,    naivePosterior: 0.229 },
        { id: "t2",  k: 3, N: 10,   nNormal: 2, nUnusual: 1, nHU: 0, hidden: 7,    naivePosterior: 0.308 },
        { id: "t3",  k: 3, N: 10,   nNormal: 1, nUnusual: 2, nHU: 0, hidden: 7,    naivePosterior: 0.400 },
        { id: "t4",  k: 3, N: 10,   nNormal: 0, nUnusual: 3, nHU: 0, hidden: 7,    naivePosterior: 0.500 },
        { id: "t5",  k: 3, N: 10,   nNormal: 2, nUnusual: 0, nHU: 1, hidden: 7,    naivePosterior: 0.571 },
        { id: "t6",  k: 3, N: 10,   nNormal: 1, nUnusual: 1, nHU: 1, hidden: 7,    naivePosterior: 0.667 },
        { id: "t7",  k: 3, N: 10,   nNormal: 0, nUnusual: 2, nHU: 1, hidden: 7,    naivePosterior: 0.750 },
        { id: "t8",  k: 3, N: 10,   nNormal: 1, nUnusual: 0, nHU: 2, hidden: 7,    naivePosterior: 0.857 },
        { id: "t9",  k: 3, N: 10,   nNormal: 0, nUnusual: 1, nHU: 2, hidden: 7,    naivePosterior: 0.900 },
        { id: "t10", k: 3, N: 10,   nNormal: 0, nUnusual: 0, nHU: 3, hidden: 7,    naivePosterior: 0.964 }
      ],

      small_high: [
        { id: "t1",  k: 3, N: 100,  nNormal: 3, nUnusual: 0, nHU: 0, hidden: 97,   naivePosterior: 0.229 },
        { id: "t2",  k: 3, N: 100,  nNormal: 2, nUnusual: 1, nHU: 0, hidden: 97,   naivePosterior: 0.308 },
        { id: "t3",  k: 3, N: 100,  nNormal: 1, nUnusual: 2, nHU: 0, hidden: 97,   naivePosterior: 0.400 },
        { id: "t4",  k: 3, N: 100,  nNormal: 0, nUnusual: 3, nHU: 0, hidden: 97,   naivePosterior: 0.500 },
        { id: "t5",  k: 3, N: 100,  nNormal: 2, nUnusual: 0, nHU: 1, hidden: 97,   naivePosterior: 0.571 },
        { id: "t6",  k: 3, N: 100,  nNormal: 1, nUnusual: 1, nHU: 1, hidden: 97,   naivePosterior: 0.667 },
        { id: "t7",  k: 3, N: 100,  nNormal: 0, nUnusual: 2, nHU: 1, hidden: 97,   naivePosterior: 0.750 },
        { id: "t8",  k: 3, N: 100,  nNormal: 1, nUnusual: 0, nHU: 2, hidden: 97,   naivePosterior: 0.857 },
        { id: "t9",  k: 3, N: 100,  nNormal: 0, nUnusual: 1, nHU: 2, hidden: 97,   naivePosterior: 0.900 },
        { id: "t10", k: 3, N: 100,  nNormal: 0, nUnusual: 0, nHU: 3, hidden: 97,   naivePosterior: 0.964 }
      ],

      small_vhigh: [
        { id: "t1",  k: 3, N: 1000, nNormal: 3, nUnusual: 0, nHU: 0, hidden: 997,  naivePosterior: 0.229 },
        { id: "t2",  k: 3, N: 1000, nNormal: 2, nUnusual: 1, nHU: 0, hidden: 997,  naivePosterior: 0.308 },
        { id: "t3",  k: 3, N: 1000, nNormal: 1, nUnusual: 2, nHU: 0, hidden: 997,  naivePosterior: 0.400 },
        { id: "t4",  k: 3, N: 1000, nNormal: 0, nUnusual: 3, nHU: 0, hidden: 997,  naivePosterior: 0.500 },
        { id: "t5",  k: 3, N: 1000, nNormal: 2, nUnusual: 0, nHU: 1, hidden: 997,  naivePosterior: 0.571 },
        { id: "t6",  k: 3, N: 1000, nNormal: 1, nUnusual: 1, nHU: 1, hidden: 997,  naivePosterior: 0.667 },
        { id: "t7",  k: 3, N: 1000, nNormal: 0, nUnusual: 2, nHU: 1, hidden: 997,  naivePosterior: 0.750 },
        { id: "t8",  k: 3, N: 1000, nNormal: 1, nUnusual: 0, nHU: 2, hidden: 997,  naivePosterior: 0.857 },
        { id: "t9",  k: 3, N: 1000, nNormal: 0, nUnusual: 1, nHU: 2, hidden: 997,  naivePosterior: 0.900 },
        { id: "t10", k: 3, N: 1000, nNormal: 0, nUnusual: 0, nHU: 3, hidden: 997,  naivePosterior: 0.964 }
      ],

      large_high: [
        { id: "t1",  k: 30, N: 100,  nNormal: 30, nUnusual:  0, nHU:  0, hidden: 70,  naivePosterior: 0.229 },
        { id: "t2",  k: 30, N: 100,  nNormal: 20, nUnusual: 10, nHU:  0, hidden: 70,  naivePosterior: 0.308 },
        { id: "t3",  k: 30, N: 100,  nNormal: 10, nUnusual: 20, nHU:  0, hidden: 70,  naivePosterior: 0.400 },
        { id: "t4",  k: 30, N: 100,  nNormal:  0, nUnusual: 30, nHU:  0, hidden: 70,  naivePosterior: 0.500 },
        { id: "t5",  k: 30, N: 100,  nNormal: 20, nUnusual:  0, nHU: 10, hidden: 70,  naivePosterior: 0.571 },
        { id: "t6",  k: 30, N: 100,  nNormal: 10, nUnusual: 10, nHU: 10, hidden: 70,  naivePosterior: 0.667 },
        { id: "t7",  k: 30, N: 100,  nNormal:  0, nUnusual: 20, nHU: 10, hidden: 70,  naivePosterior: 0.750 },
        { id: "t8",  k: 30, N: 100,  nNormal: 10, nUnusual:  0, nHU: 20, hidden: 70,  naivePosterior: 0.857 },
        { id: "t9",  k: 30, N: 100,  nNormal:  0, nUnusual: 10, nHU: 20, hidden: 70,  naivePosterior: 0.900 },
        { id: "t10", k: 30, N: 100,  nNormal:  0, nUnusual:  0, nHU: 30, hidden: 70,  naivePosterior: 0.964 }
      ],

      large_vhigh: [
        { id: "t1",  k: 300, N: 1000, nNormal: 300, nUnusual:   0, nHU:   0, hidden: 700, naivePosterior: 0.229 },
        { id: "t2",  k: 300, N: 1000, nNormal: 200, nUnusual: 100, nHU:   0, hidden: 700, naivePosterior: 0.308 },
        { id: "t3",  k: 300, N: 1000, nNormal: 100, nUnusual: 200, nHU:   0, hidden: 700, naivePosterior: 0.400 },
        { id: "t4",  k: 300, N: 1000, nNormal:   0, nUnusual: 300, nHU:   0, hidden: 700, naivePosterior: 0.500 },
        { id: "t5",  k: 300, N: 1000, nNormal: 200, nUnusual:   0, nHU: 100, hidden: 700, naivePosterior: 0.571 },
        { id: "t6",  k: 300, N: 1000, nNormal: 100, nUnusual: 100, nHU: 100, hidden: 700, naivePosterior: 0.667 },
        { id: "t7",  k: 300, N: 1000, nNormal:   0, nUnusual: 200, nHU: 100, hidden: 700, naivePosterior: 0.750 },
        { id: "t8",  k: 300, N: 1000, nNormal: 100, nUnusual:   0, nHU: 200, hidden: 700, naivePosterior: 0.857 },
        { id: "t9",  k: 300, N: 1000, nNormal:   0, nUnusual: 100, nHU: 200, hidden: 700, naivePosterior: 0.900 },
        { id: "t10", k: 300, N: 1000, nNormal:   0, nUnusual:   0, nHU: 300, hidden: 700, naivePosterior: 0.964 }
      ]
    }
  },

  // ── Dependent Variables (per trial) ──────────────────────────────────
  trialDVs: [
    {
      id: "fraud_probability",
      type: "slider",
      prompt: "Based on the disclosed transactions, what is the probability this firm is fraudulent?",
      min: 0,
      max: 100,
      step: 1,
      minLabel: "0% -- Definitely not fraudulent",
      maxLabel: "100% -- Definitely fraudulent",
      unit: "%"
    },
    {
      id: "confidence",
      type: "likert",
      prompt: "How confident are you in your fraud assessment?",
      min: 1,
      max: 7,
      minLabel: "Not at all confident",
      maxLabel: "Extremely confident"
    },
    {
      id: "hidden_hu_estimate",
      type: "slider",
      prompt: "Of the {hidden} transactions NOT shown to you, what percentage do you think are Highly Unusual?",
      min: 0,
      max: 100,
      step: 1,
      minLabel: "0% -- None are HU",
      maxLabel: "100% -- All are HU",
      unit: "%"
    }
  ],


  // ====================================================================
  //  PART 1 PAGES -- Instructions + Comprehension (~5 min, GBP 1.00)
  // ====================================================================
  // Accessed via ?part=1

  part1Pages: [

    // ── 1. WELCOME ──
    {
      id: "p1_welcome",
      type: "welcome",
      title: "Welcome!",
      subtitle: "Part 1: Learning the Task",
      body: "<p>In this short task (<strong>~5 minutes</strong>), we will teach you " +
            "a fraud assessment exercise and ask you a short quiz.</p>" +
            "<p>If you pass the quiz, you will be invited to <strong>Part 2</strong> " +
            "(a separate Prolific study, ~15 minutes) where you complete the " +
            "assessment for <strong>&pound;2.50 base pay</strong> plus an " +
            "<strong>accuracy bonus of up to &pound;1.50</strong>.</p>" +
            "<p>You will be paid <strong>&pound;1.00</strong> for completing this part, " +
            "regardless of your quiz result.</p>",
      buttonText: "Let's Go"
    },

    // ── 2. CONSENT ──
    {
      id: "p1_consent",
      type: "consent",
      title: "Informed Consent",
      body: "<p>You are being invited to participate in a research study about " +
            "decision-making under uncertainty.</p>" +
            "<p><strong>What you will do:</strong> Learn the rules of a fraud " +
            "assessment task and answer a short quiz.</p>" +
            "<p><strong>Time:</strong> Approximately 5 minutes.</p>" +
            "<p><strong>Compensation:</strong> &pound;1.00 for this part. If you pass the quiz, " +
            "you will be invited to Part 2 (a separate Prolific study, ~15 minutes, " +
            "&pound;2.50 base + up to &pound;1.50 accuracy bonus).</p>" +
            "<p><strong>Risks:</strong> No known risks beyond those of everyday life.</p>" +
            "<p><strong>Confidentiality:</strong> Your responses are anonymous. " +
            "We collect your Prolific ID only to process payment.</p>" +
            "<p><strong>Voluntary:</strong> You may withdraw at any time by closing " +
            "this window.</p>",
      mustAgree: true,
      declineMessage: "You must agree to participate in order to continue.",
      minTimeSeconds: 20
    },

    // ── 3. INSTRUCTION: The Setting ──
    {
      id: "p1_inst_setting",
      type: "instructions",
      title: "The Setting",
      body:
        "<p>You are a <strong>fraud assessor</strong>. Your job is to evaluate " +
        "whether firms are fraudulent based on their financial transactions.</p>" +

        "<p>Each firm has a number of transactions. These transactions have already " +
        "been classified by an automated system into three types:</p>" +

        "<div class='info-box'>" +
          "<div class='option-card'>" +
            "<div class='option-card-header' style='color:#2d6a4f;'>Normal (N)</div>" +
            "<div class='option-card-body'>Routine business activity. Nothing suspicious.</div>" +
          "</div>" +
          "<div class='option-card'>" +
            "<div class='option-card-header' style='color:#e67700;'>Unusual (U)</div>" +
            "<div class='option-card-body'>Somewhat atypical. Could occur at any firm.</div>" +
          "</div>" +
          "<div class='option-card'>" +
            "<div class='option-card-header' style='color:#c92a2a;'>Highly Unusual (HU)</div>" +
            "<div class='option-card-body'>Rare and potentially suspicious. Warrants attention.</div>" +
          "</div>" +
        "</div>" +

        "<p>The total number of transactions varies across firms. " +
        "You will be told how many transactions each firm has.</p>",
      minTimeSeconds: 15
    },

    // ── 4. INSTRUCTION: Transaction Types ──
    {
      id: "p1_inst_types",
      type: "instructions",
      title: "What the Transaction Types Tell You",
      body:
        "<p>Here is the key information. The proportion of each transaction type " +
        "differs between fraudulent and non-fraudulent firms:</p>" +

        "<table class='info-table' style='width:100%; border-collapse:collapse; margin:16px 0;'>" +
          "<thead>" +
            "<tr>" +
              "<th style='text-align:left; padding:8px; border-bottom:2px solid #333;'>Transaction Type</th>" +
              "<th style='text-align:center; padding:8px; border-bottom:2px solid #333;'>Non-Fraudulent Firms</th>" +
              "<th style='text-align:center; padding:8px; border-bottom:2px solid #333;'>Fraudulent Firms</th>" +
            "</tr>" +
          "</thead>" +
          "<tbody>" +
            "<tr style='background:#f8f9fa;'>" +
              "<td style='padding:8px; color:#2d6a4f;'><strong>Normal</strong></td>" +
              "<td style='text-align:center; padding:8px;'><strong>60%</strong></td>" +
              "<td style='text-align:center; padding:8px;'><strong>40%</strong></td>" +
            "</tr>" +
            "<tr>" +
              "<td style='padding:8px; color:#e67700;'><strong>Unusual</strong></td>" +
              "<td style='text-align:center; padding:8px;'>30%</td>" +
              "<td style='text-align:center; padding:8px;'>30%</td>" +
            "</tr>" +
            "<tr style='background:#f8f9fa;'>" +
              "<td style='padding:8px; color:#c92a2a;'><strong>Highly Unusual</strong></td>" +
              "<td style='text-align:center; padding:8px;'><strong>10%</strong></td>" +
              "<td style='text-align:center; padding:8px;'><strong>30%</strong></td>" +
            "</tr>" +
          "</tbody>" +
        "</table>" +

        "<div class='info-box' style='background:#fff8e6; border-left:4px solid #e67700; padding:12px 16px;'>" +
          "<p style='margin:0;'><strong>Notice:</strong> Unusual transactions occur at the " +
          "<strong>same rate</strong> (30%) in both types of firms. " +
          "So Unusual transactions are <em>not informative</em> about fraud.</p>" +
          "<p style='margin:8px 0 0 0;'>The key difference is in Normal vs. Highly Unusual: " +
          "non-fraudulent firms have <strong>more Normal</strong> and <strong>fewer Highly Unusual</strong> " +
          "transactions.</p>" +
        "</div>" +

        "<p>Before you see any transactions, each firm has a <strong>50% chance</strong> " +
        "of being fraudulent (50/50 prior).</p>",
      minTimeSeconds: 20
    },

    // ── 5. INSTRUCTION: The Manager ──
    {
      id: "p1_inst_manager",
      type: "instructions",
      title: "The Manager",
      body:
        "<p>Each firm has a <strong>manager</strong> who has access to " +
        "<strong>all</strong> of the firm's transactions.</p>" +

        "<p>The manager must select exactly <strong>some</strong> of these transactions " +
        "to show you. The manager cannot fabricate or change any transaction -- " +
        "they can only choose <em>which ones</em> to disclose.</p>" +

        "<div class='info-box' style='background:#fff0f0; border-left:4px solid #c92a2a; padding:12px 16px;'>" +
          "<p style='margin:0;'><strong>Important:</strong> The manager earns a larger bonus " +
          "when you rate the firm's fraud probability <strong>lower</strong>.</p>" +
          "<p style='margin:8px 0 0 0;'>In other words, the manager wants to convince you " +
          "the firm is <em>not</em> fraudulent. The manager will therefore try to show you " +
          "the most favorable transactions.</p>" +
        "</div>" +

        "<p>You will always be told:</p>" +
        "<ul>" +
          "<li>How many <strong>total</strong> transactions the firm has (N)</li>" +
          "<li>How many the manager is <strong>required to show</strong> you (k)</li>" +
          "<li>The <strong>composition</strong> of the disclosed transactions (how many Normal, Unusual, HU)</li>" +
        "</ul>" +

        "<p>You will <strong>not</strong> be told the manager's exact selection strategy.</p>",
      minTimeSeconds: 18
    },

    // ── 6. INSTRUCTION: Your Task ──
    {
      id: "p1_inst_task",
      type: "instructions",
      title: "Your Task",
      body:
        "<p>For each firm, you will see the disclosed transactions and then answer " +
        "three questions:</p>" +

        "<div class='info-box'>" +
          "<div class='option-card'>" +
            "<div class='option-card-header'>1. Fraud Probability</div>" +
            "<div class='option-card-body'>Rate the probability that this firm " +
            "is fraudulent (0-100%).</div>" +
          "</div>" +
          "<div class='option-card'>" +
            "<div class='option-card-header'>2. Confidence</div>" +
            "<div class='option-card-body'>How confident are you in your fraud " +
            "assessment? (1-7 scale)</div>" +
          "</div>" +
          "<div class='option-card'>" +
            "<div class='option-card-header'>3. Hidden Transactions</div>" +
            "<div class='option-card-body'>Of the transactions NOT shown to you, what " +
            "percentage do you think are Highly Unusual? (0-100%)</div>" +
          "</div>" +
        "</div>" +

        "<p>Your <strong>accuracy bonus</strong> depends on how close your fraud " +
        "probability rating is to the correct answer. One firm will be randomly " +
        "selected for your bonus at the end.</p>",
      minTimeSeconds: 15
    },

    // ── 7. INSTRUCTION: Example ──
    {
      id: "p1_inst_example",
      type: "instructions",
      title: "A Worked Example",
      body:
        "<p>Let's walk through a concrete example.</p>" +

        "<p><strong>Setup:</strong> A firm has <strong>10 transactions</strong> total. " +
        "The manager must show you <strong>3</strong> of them.</p>" +

        "<p><strong>You see:</strong> The manager discloses 3 transactions: " +
        "<strong>2 Normal</strong>, <strong>1 Unusual</strong>, <strong>0 Highly Unusual</strong>.</p>" +

        "<div class='info-box' style='background:#f0f4ff; border-left:4px solid #4361ee; padding:12px 16px;'>" +
          "<p style='margin:0;'><strong>What should you think?</strong></p>" +
          "<p style='margin:8px 0 0 0;'>The disclosed sample looks fairly clean " +
          "(mostly Normal, no HU). But remember:</p>" +
          "<ul style='margin:4px 0 0 0;'>" +
            "<li>The manager <em>chose</em> these 3 out of 10.</li>" +
            "<li>The manager wants you to think fraud is low.</li>" +
            "<li>There are still <strong>7 hidden</strong> transactions you haven't seen.</li>" +
            "<li>A skeptical evaluator would ask: what might the other 7 look like?</li>" +
          "</ul>" +
        "</div>" +

        "<p>If the firm were truly non-fraudulent, we'd expect about 60% Normal, " +
        "30% Unusual, and 10% HU among all 10 transactions. " +
        "The manager showing you the 2 most Normal plus 1 Unusual is consistent " +
        "with <em>either</em> a clean firm or a dirty firm where the manager " +
        "cherry-picked the best transactions.</p>" +

        "<p>The right answer depends on weighing the disclosed evidence against " +
        "what might be hidden. There is no trick -- just careful reasoning.</p>",
      minTimeSeconds: 20
    },

    // ── 8. COMPREHENSION QUIZ ──
    {
      id: "p1_comprehension",
      type: "comprehension",
      title: "Quick Quiz",
      description: "<p>Answer these questions to show you understand the task. " +
                   "You must get all correct to proceed to Part 2.</p>",
      questions: [
        {
          prompt: "Who picks which transactions you see?",
          type: "radio",
          correct: "manager",
          options: [
            { value: "manager",  label: "The manager selects which transactions to disclose" },
            { value: "you",      label: "I choose which transactions to look at" },
            { value: "random",   label: "A random process selects the transactions" },
            { value: "nobody",   label: "Nobody -- I see all transactions" }
          ]
        },
        {
          prompt: "Does the manager earn more when you rate fraud probability high or low?",
          type: "radio",
          correct: "low",
          options: [
            { value: "low",        label: "Low -- the manager benefits when I rate fraud as less likely" },
            { value: "high",       label: "High -- the manager benefits when I rate fraud as more likely" },
            { value: "no_effect",  label: "It doesn't matter -- the manager's pay is unrelated to my rating" },
            { value: "depends",    label: "It depends on whether the firm is actually fraudulent" }
          ]
        },
        {
          prompt: "If a firm has 10 transactions and the manager shows you 3, how many transactions are hidden from you?",
          type: "radio",
          correct: "7",
          options: [
            { value: "7",  label: "7" },
            { value: "3",  label: "3" },
            { value: "10", label: "10" },
            { value: "0",  label: "0" }
          ]
        },
        {
          prompt: "Can a non-fraudulent firm have a Highly Unusual transaction?",
          type: "radio",
          correct: "yes",
          options: [
            { value: "yes",       label: "Yes -- 10% of a non-fraudulent firm's transactions are Highly Unusual" },
            { value: "no",        label: "No -- Highly Unusual only occurs in fraudulent firms" },
            { value: "only_fraud", label: "Only if the firm turns out to be fraudulent" },
            { value: "not_enough", label: "Not enough information to say" }
          ]
        }
      ],
      minTimeSeconds: 20,
      maxAttempts: 1,
      failMessage: "Unfortunately, you did not answer all comprehension questions correctly. " +
                   "We are unable to include you in Part 2. Thank you for your time -- you will " +
                   "still be paid &pound;1.00 for completing this part."
    },

    // ── 9. COMPREHENSION RESULT ──
    {
      id: "p1_comprehension_result",
      type: "completion",
      title: "You Passed!",
      body: "<p>Great job -- you understand the task!</p>" +
            "<p><strong>Part 2</strong> is a separate Prolific study (~15 minutes, " +
            "&pound;2.50 base + up to &pound;1.50 accuracy bonus).</p>"
    }
  ],


  // ====================================================================
  //  PART 2 PAGES -- Trials + Debrief (~15 min, GBP 2.50 + bonus)
  // ====================================================================
  // Accessed via ?part=2

  part2Pages: [

    // ── 1. WELCOME BACK ──
    {
      id: "p2_welcome",
      type: "welcome",
      title: "Welcome to Part 2!",
      subtitle: "Fraud Assessment Task",
      body: "<p>Thank you for returning! This part takes about <strong>15 minutes</strong>.</p>" +
            "<p>You will receive <strong>&pound;2.50 base payment</strong> plus an " +
            "<strong>accuracy-based bonus of up to &pound;1.50</strong>.</p>" +
            "<p>You will evaluate <strong>10 firms</strong> for potential fraud.</p>",
      buttonText: "Continue"
    },

    // ── 2. REMINDER ──
    {
      id: "p2_reminder",
      type: "instructions",
      title: "Quick Reminder",
      body:
        "<div class='game-flow game-flow-compact'>" +
          "<div class='flow-step'>" +
            "<div class='flow-step-number'>1</div>" +
            "<div class='flow-step-content'>" +
              "Each firm has <strong>N transactions</strong> classified as Normal, Unusual, or Highly Unusual" +
            "</div>" +
          "</div>" +
          "<div class='flow-arrow'>&#9660;</div>" +
          "<div class='flow-step'>" +
            "<div class='flow-step-number'>2</div>" +
            "<div class='flow-step-content'>" +
              "The <strong>manager</strong> selects <strong>k transactions</strong> to show you (wants you to rate fraud <em>low</em>)" +
            "</div>" +
          "</div>" +
          "<div class='flow-arrow'>&#9660;</div>" +
          "<div class='flow-step'>" +
            "<div class='flow-step-number'>3</div>" +
            "<div class='flow-step-content'>" +
              "You see the disclosed transactions and <strong>rate fraud probability</strong>, " +
              "your <strong>confidence</strong>, and <strong>estimate hidden HU %</strong>" +
            "</div>" +
          "</div>" +
        "</div>" +

        "<div class='info-box' style='background:#fff8e6; border-left:4px solid #e67700; padding:12px 16px; margin-top:16px;'>" +
          "<p style='margin:0;'><strong>Distributions reminder:</strong></p>" +
          "<table style='width:100%; border-collapse:collapse; margin:8px 0 0 0; font-size:0.9em;'>" +
            "<tr>" +
              "<td></td>" +
              "<td style='text-align:center;'><strong>Non-Fraud</strong></td>" +
              "<td style='text-align:center;'><strong>Fraud</strong></td>" +
            "</tr>" +
            "<tr><td style='color:#2d6a4f;'>Normal</td><td style='text-align:center;'>60%</td><td style='text-align:center;'>40%</td></tr>" +
            "<tr><td style='color:#e67700;'>Unusual</td><td style='text-align:center;'>30%</td><td style='text-align:center;'>30%</td></tr>" +
            "<tr><td style='color:#c92a2a;'>Highly Unusual</td><td style='text-align:center;'>10%</td><td style='text-align:center;'>30%</td></tr>" +
          "</table>" +
          "<p style='margin:8px 0 0 0;'>Prior: 50% chance of fraud before seeing any transactions.</p>" +
        "</div>",
      minTimeSeconds: 10
    },

    // ── 3. FORMAT INTRO (condition-specific) ──
    {
      id: "p2_format_intro",
      type: "instructions",
      title: "How Transactions Will Be Displayed",
      body:
        "<p>For each firm, you will see the transactions the manager chose to disclose.</p>" +

        "<!--if:list-->" +
        "<p>The disclosed transactions will be shown as a <strong>text summary</strong> " +
        "listing how many of each type (Normal, Unusual, Highly Unusual) the manager " +
        "selected. The number of undisclosed transactions will also be noted.</p>" +
        "<div class='info-box' style='padding:16px;'>" +
          "<p style='margin:0 0 8px 0;'><strong>Example:</strong> A firm with 10 total transactions. " +
          "The manager shows you 3:</p>" +
          "<div style='background:#f8f9fa; border-radius:8px; padding:12px 16px; font-size:0.95em;'>" +
            "<p style='margin:0 0 4px 0;'><strong>Disclosed transactions (3 of 10):</strong></p>" +
            "<ul style='margin:0; padding-left:20px;'>" +
              "<li><span style='color:#2d6a4f;'>Normal:</span> <strong>2</strong></li>" +
              "<li><span style='color:#e67700;'>Unusual:</span> <strong>1</strong></li>" +
              "<li><span style='color:#c92a2a;'>Highly Unusual:</span> <strong>0</strong></li>" +
            "</ul>" +
            "<p style='margin:8px 0 0 0; color:#666; font-style:italic;'>" +
              "7 transactions were not disclosed.</p>" +
          "</div>" +
        "</div>" +
        "<!--endif:list-->" +

        "<!--if:chart_disclosed-->" +
        "<p>The disclosed transactions will be shown as a <strong>bar chart</strong> " +
        "displaying the composition of what the manager selected (Normal, Unusual, " +
        "Highly Unusual). A small text note will indicate how many transactions " +
        "were not disclosed.</p>" +
        "<div class='info-box' style='padding:16px;'>" +
          "<p style='margin:0 0 8px 0;'><strong>Example:</strong> A firm with 10 total transactions. " +
          "The manager shows you 3:</p>" +
          "<div style='background:#f8f9fa; border-radius:8px; padding:12px 16px;'>" +
            "<p style='margin:0 0 8px 0;'><strong>Disclosed transactions (3 of 10):</strong></p>" +
            "<div style='display:flex; align-items:flex-end; height:80px; gap:8px; margin:0 0 8px 0;'>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#2d6a4f; height:60px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>Normal (2)</div>" +
              "</div>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#e67700; height:30px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>Unusual (1)</div>" +
              "</div>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#c92a2a; height:0px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>HU (0)</div>" +
              "</div>" +
            "</div>" +
            "<p style='margin:0; color:#666; font-style:italic;'>" +
              "7 transactions were not disclosed.</p>" +
          "</div>" +
        "</div>" +
        "<!--endif:chart_disclosed-->" +

        "<!--if:chart_full-->" +
        "<p>The disclosed transactions will be shown as a <strong>bar chart</strong> " +
        "displaying the composition of what the manager selected. " +
        "A <strong>gray bar</strong> will represent the undisclosed transactions, " +
        "so you can visually compare disclosed versus undisclosed.</p>" +
        "<div class='info-box' style='padding:16px;'>" +
          "<p style='margin:0 0 8px 0;'><strong>Example:</strong> A firm with 10 total transactions. " +
          "The manager shows you 3:</p>" +
          "<div style='background:#f8f9fa; border-radius:8px; padding:12px 16px;'>" +
            "<p style='margin:0 0 8px 0;'><strong>All transactions (10 total):</strong></p>" +
            "<div style='display:flex; align-items:flex-end; height:100px; gap:8px; margin:0 0 8px 0;'>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#2d6a4f; height:28px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>Normal (2)</div>" +
              "</div>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#e67700; height:14px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>Unusual (1)</div>" +
              "</div>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#c92a2a; height:0px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>HU (0)</div>" +
              "</div>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#bbb; height:96px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>Not Disclosed (7)</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
        "<!--endif:chart_full-->" +

        "<p>Remember: the manager chose these transactions strategically. " +
        "Think about what the undisclosed transactions might look like.</p>",
      minTimeSeconds: 12
    },

    // ── 4-13. TRIAL BLOCK (10 trials, randomized) ──
    // The engine will look up the participant's scale condition and
    // pull the appropriate stimuli from stimuli.byScale[scaleId].
    // Each trial is rendered as a fraud_trial page with 3 DVs.
    {
      id: "trials_main",
      type: "trial_block",
      block: 1,
      randomize: true,
      trialCount: 10,
      // Trials are populated dynamically from stimuli.byScale[assigned scale]
      // Each trial page shows:
      //   1. Firm intro splash: "This firm has [N] transactions. The manager shows you [k]."
      //   2. Disclosed composition in the assigned format
      //   3. Three DV inputs (fraud_probability slider, confidence likert, hidden_hu_estimate slider)
      trialIntroTemplate:
        "<p>This firm has <strong>{N} transactions</strong> in total.</p>" +
        "<p>The manager has selected <strong>{k} transactions</strong> to show you.</p>",
      trialStimulusTemplates: {
        list:
          "<div class='stimulus-card stimulus-list'>" +
            "<p class='stimulus-header'><strong>Disclosed transactions ({k} of {N}):</strong></p>" +
            "<ul class='stimulus-list-items'>" +
              "<li><span style='color:#2d6a4f;'>Normal:</span> <strong>{nNormal}</strong></li>" +
              "<li><span style='color:#e67700;'>Unusual:</span> <strong>{nUnusual}</strong></li>" +
              "<li><span style='color:#c92a2a;'>Highly Unusual:</span> <strong>{nHU}</strong></li>" +
            "</ul>" +
            "<p class='stimulus-hidden-note'>{hidden} transactions were not disclosed.</p>" +
          "</div>",

        chart_disclosed:
          "<div class='stimulus-card stimulus-chart'>" +
            "<p class='stimulus-header'><strong>Disclosed transactions ({k} of {N}):</strong></p>" +
            "<div class='stimulus-chart-container' " +
              "data-n-normal='{nNormal}' data-n-unusual='{nUnusual}' data-n-hu='{nHU}' " +
              "data-chart-type='disclosed'>" +
            "</div>" +
            "<p class='stimulus-hidden-note'>{hidden} transactions were not disclosed.</p>" +
          "</div>",

        chart_full:
          "<div class='stimulus-card stimulus-chart'>" +
            "<p class='stimulus-header'><strong>All transactions ({N} total):</strong></p>" +
            "<div class='stimulus-chart-container' " +
              "data-n-normal='{nNormal}' data-n-unusual='{nUnusual}' data-n-hu='{nHU}' " +
              "data-hidden='{hidden}' data-chart-type='full'>" +
            "</div>" +
          "</div>"
      },
      minTimePerTrial: 10
    },

    // ── 14. DEMOGRAPHICS ──
    {
      id: "demographics",
      type: "questionnaire",
      title: "About You",
      minTimeSeconds: 20,
      questions: [
        {
          id: "age",
          prompt: "What is your age?",
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
          prompt: "What is your gender?",
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
          id: "education",
          prompt: "What is your highest level of education?",
          type: "dropdown",
          required: true,
          options: [
            { value: "high_school",  label: "High school or equivalent" },
            { value: "some_college", label: "Some college" },
            { value: "bachelors",    label: "Bachelor's degree" },
            { value: "masters",      label: "Master's degree" },
            { value: "doctorate",    label: "Doctorate or professional degree" },
            { value: "other",        label: "Other" }
          ]
        },
        {
          id: "stats_comfort",
          prompt: "How comfortable are you with probability and statistics?",
          type: "likert",
          required: true,
          min: 1,
          max: 5,
          minLabel: "Not at all comfortable",
          maxLabel: "Very comfortable"
        },
        {
          id: "fin_literacy_compound",
          prompt: "Suppose you had $100 in a savings account and the interest rate was 2% per year. After 5 years, how much would you have?",
          type: "radio",
          required: true,
          options: [
            { value: "more_than_102", label: "More than $102" },
            { value: "exactly_102",   label: "Exactly $102" },
            { value: "less_than_102", label: "Less than $102" },
            { value: "dont_know",     label: "I don't know" }
          ]
        },
        {
          id: "fin_literacy_inflation",
          prompt: "Imagine that the interest rate on your savings account was 1% per year and inflation was 2% per year. After 1 year, how much would you be able to buy with the money in this account?",
          type: "radio",
          required: true,
          options: [
            { value: "more",      label: "More than today" },
            { value: "same",      label: "Exactly the same" },
            { value: "less",      label: "Less than today" },
            { value: "dont_know", label: "I don't know" }
          ]
        }
      ]
    },

    // ── 15. DEBRIEF ──
    {
      id: "debrief",
      type: "debrief",
      title: "Thank You!",
      body: "<p>This study examines how people assess fraud risk when a strategic " +
            "manager selectively discloses financial transactions. The manager always " +
            "shows the most favorable transactions, meaning the undisclosed transactions " +
            "are likely to contain more Highly Unusual items than what you saw.</p>" +

            "<p>A key question is whether people sufficiently account for the " +
            "<em>undisclosed</em> information when forming their judgments. " +
            "When many transactions are hidden, does the sheer number of unseen " +
            "transactions change how people reason about what might be concealed?</p>" +

            "<p>We also varied how the disclosed information was presented (text list " +
            "vs. bar chart) to understand whether visual format affects " +
            "sensitivity to omitted information.</p>" +

            "<p>Your responses will help us understand how presentation format " +
            "and disclosure scale interact to shape fraud judgments under " +
            "strategic selection. Thank you for contributing to this research!</p>",
      showBonus: true,
      completionCode: "COMP2SN"
    }
  ],


  // ====================================================================
  //  FULL SURVEY PAGES (legacy, used when ?part is not specified)
  // ====================================================================
  // Complete single-session version combining Part 1 and Part 2.

  pages: [

    // ── WELCOME ──
    {
      id: "welcome",
      type: "welcome",
      title: "Welcome to this Research Study",
      subtitle: "Fraud Assessment Task",
      body: "<p>In this study, you will evaluate firms for potential fraud based on " +
            "disclosed financial transactions. It takes approximately " +
            "<strong>20 minutes</strong> to complete.</p>" +
            "<p>You will receive <strong>&pound;3.50 base payment</strong> plus an " +
            "<strong>accuracy-based bonus of up to &pound;1.50</strong> depending on " +
            "how close your assessments are to the correct answers.</p>" +
            "<p>Your responses are anonymous and will be used for academic research only.</p>" +
            "<p>Please complete this study on a <strong>desktop or laptop computer</strong> " +
            "for the best experience.</p>",
      buttonText: "Begin"
    },

    // ── CONSENT ──
    {
      id: "consent",
      type: "consent",
      title: "Informed Consent",
      body: "<p>You are being invited to participate in a research study about " +
            "decision-making under uncertainty.</p>" +
            "<p><strong>What you will do:</strong> You will learn about a fraud " +
            "assessment task, pass a comprehension quiz, then evaluate 10 firms.</p>" +
            "<p><strong>Time:</strong> Approximately 20 minutes.</p>" +
            "<p><strong>Compensation:</strong> &pound;3.50 base payment plus an " +
            "accuracy-based bonus of up to &pound;1.50.</p>" +
            "<p><strong>Risks:</strong> No known risks beyond those of everyday life.</p>" +
            "<p><strong>Confidentiality:</strong> Your responses are anonymous. " +
            "We collect your Prolific ID only to process payment.</p>" +
            "<p><strong>Voluntary:</strong> You may withdraw at any time by closing " +
            "this window.</p>",
      mustAgree: true,
      declineMessage: "You must agree to participate in order to continue with this study.",
      minTimeSeconds: 20
    },

    // ── INSTRUCTION: The Setting ──
    {
      id: "inst_setting",
      type: "instructions",
      title: "The Setting",
      body:
        "<p>You are a <strong>fraud assessor</strong>. Your job is to evaluate " +
        "whether firms are fraudulent based on their financial transactions.</p>" +

        "<p>Each firm has a number of transactions. These transactions have already " +
        "been classified by an automated system into three types:</p>" +

        "<div class='info-box'>" +
          "<div class='option-card'>" +
            "<div class='option-card-header' style='color:#2d6a4f;'>Normal (N)</div>" +
            "<div class='option-card-body'>Routine business activity. Nothing suspicious.</div>" +
          "</div>" +
          "<div class='option-card'>" +
            "<div class='option-card-header' style='color:#e67700;'>Unusual (U)</div>" +
            "<div class='option-card-body'>Somewhat atypical. Could occur at any firm.</div>" +
          "</div>" +
          "<div class='option-card'>" +
            "<div class='option-card-header' style='color:#c92a2a;'>Highly Unusual (HU)</div>" +
            "<div class='option-card-body'>Rare and potentially suspicious. Warrants attention.</div>" +
          "</div>" +
        "</div>" +

        "<p>The total number of transactions varies across firms.</p>",
      minTimeSeconds: 15
    },

    // ── INSTRUCTION: Transaction Types ──
    {
      id: "inst_types",
      type: "instructions",
      title: "What the Transaction Types Tell You",
      body:
        "<p>The proportion of each transaction type differs between " +
        "fraudulent and non-fraudulent firms:</p>" +

        "<table class='info-table' style='width:100%; border-collapse:collapse; margin:16px 0;'>" +
          "<thead>" +
            "<tr>" +
              "<th style='text-align:left; padding:8px; border-bottom:2px solid #333;'>Transaction Type</th>" +
              "<th style='text-align:center; padding:8px; border-bottom:2px solid #333;'>Non-Fraudulent Firms</th>" +
              "<th style='text-align:center; padding:8px; border-bottom:2px solid #333;'>Fraudulent Firms</th>" +
            "</tr>" +
          "</thead>" +
          "<tbody>" +
            "<tr style='background:#f8f9fa;'>" +
              "<td style='padding:8px; color:#2d6a4f;'><strong>Normal</strong></td>" +
              "<td style='text-align:center; padding:8px;'><strong>60%</strong></td>" +
              "<td style='text-align:center; padding:8px;'><strong>40%</strong></td>" +
            "</tr>" +
            "<tr>" +
              "<td style='padding:8px; color:#e67700;'><strong>Unusual</strong></td>" +
              "<td style='text-align:center; padding:8px;'>30%</td>" +
              "<td style='text-align:center; padding:8px;'>30%</td>" +
            "</tr>" +
            "<tr style='background:#f8f9fa;'>" +
              "<td style='padding:8px; color:#c92a2a;'><strong>Highly Unusual</strong></td>" +
              "<td style='text-align:center; padding:8px;'><strong>10%</strong></td>" +
              "<td style='text-align:center; padding:8px;'><strong>30%</strong></td>" +
            "</tr>" +
          "</tbody>" +
        "</table>" +

        "<div class='info-box' style='background:#fff8e6; border-left:4px solid #e67700; padding:12px 16px;'>" +
          "<p style='margin:0;'><strong>Key insight:</strong> Unusual transactions occur at the " +
          "<strong>same rate</strong> (30%) in both types of firms, so they are " +
          "<em>not informative</em> about fraud.</p>" +
          "<p style='margin:8px 0 0 0;'>The real signal is in Normal vs. Highly Unusual: " +
          "non-fraudulent firms have <strong>more Normal</strong> and " +
          "<strong>fewer Highly Unusual</strong> transactions.</p>" +
        "</div>" +

        "<p>Before you see any transactions, each firm has a <strong>50% chance</strong> " +
        "of being fraudulent.</p>",
      minTimeSeconds: 20
    },

    // ── INSTRUCTION: The Manager ──
    {
      id: "inst_manager",
      type: "instructions",
      title: "The Manager",
      body:
        "<p>Each firm has a <strong>manager</strong> who has access to " +
        "<strong>all</strong> of the firm's transactions.</p>" +

        "<p>The manager must select exactly <strong>some</strong> of these transactions " +
        "to show you. The manager cannot fabricate or change any transaction -- " +
        "they can only choose <em>which ones</em> to disclose.</p>" +

        "<div class='info-box' style='background:#fff0f0; border-left:4px solid #c92a2a; padding:12px 16px;'>" +
          "<p style='margin:0;'><strong>Important:</strong> The manager earns a larger bonus " +
          "when you rate the firm's fraud probability <strong>lower</strong>.</p>" +
          "<p style='margin:8px 0 0 0;'>The manager wants to convince you " +
          "the firm is <em>not</em> fraudulent. The manager will therefore try to show you " +
          "the most favorable transactions.</p>" +
        "</div>" +

        "<p>You will always be told:</p>" +
        "<ul>" +
          "<li>How many <strong>total</strong> transactions the firm has (N)</li>" +
          "<li>How many the manager is <strong>required to show</strong> you (k)</li>" +
          "<li>The <strong>composition</strong> of the disclosed transactions</li>" +
        "</ul>" +

        "<p>You will <strong>not</strong> be told the manager's exact selection strategy.</p>",
      minTimeSeconds: 18
    },

    // ── INSTRUCTION: Your Task ──
    {
      id: "inst_task",
      type: "instructions",
      title: "Your Task",
      body:
        "<p>For each firm, you will see the disclosed transactions and then answer " +
        "three questions:</p>" +

        "<div class='info-box'>" +
          "<div class='option-card'>" +
            "<div class='option-card-header'>1. Fraud Probability</div>" +
            "<div class='option-card-body'>Rate the probability that this firm " +
            "is fraudulent (0-100%).</div>" +
          "</div>" +
          "<div class='option-card'>" +
            "<div class='option-card-header'>2. Confidence</div>" +
            "<div class='option-card-body'>How confident are you in your fraud " +
            "assessment? (1-7 scale)</div>" +
          "</div>" +
          "<div class='option-card'>" +
            "<div class='option-card-header'>3. Hidden Transactions</div>" +
            "<div class='option-card-body'>Of the transactions NOT shown to you, what " +
            "percentage do you think are Highly Unusual? (0-100%)</div>" +
          "</div>" +
        "</div>" +

        "<p>Your <strong>accuracy bonus</strong> (up to &pound;1.50) depends on how close " +
        "your fraud probability rating is to the correct answer for one randomly " +
        "selected firm.</p>",
      minTimeSeconds: 15
    },

    // ── INSTRUCTION: Example ──
    {
      id: "inst_example",
      type: "instructions",
      title: "A Worked Example",
      body:
        "<p>Let's walk through a concrete example.</p>" +

        "<p><strong>Setup:</strong> A firm has <strong>10 transactions</strong> total. " +
        "The manager must show you <strong>3</strong> of them.</p>" +

        "<p><strong>You see:</strong> 2 Normal, 1 Unusual, 0 Highly Unusual.</p>" +

        "<div class='info-box' style='background:#f0f4ff; border-left:4px solid #4361ee; padding:12px 16px;'>" +
          "<p style='margin:0;'><strong>What should you think?</strong></p>" +
          "<ul style='margin:8px 0 0 0;'>" +
            "<li>The manager <em>chose</em> these 3 out of 10.</li>" +
            "<li>The manager wants you to think fraud is low.</li>" +
            "<li>There are still <strong>7 hidden</strong> transactions.</li>" +
            "<li>A skeptical evaluator would ask: what might the other 7 look like?</li>" +
          "</ul>" +
        "</div>" +

        "<p>The right answer depends on weighing the disclosed evidence against " +
        "what might be hidden. There is no trick -- just careful reasoning.</p>",
      minTimeSeconds: 18
    },

    // ── COMPREHENSION QUIZ ──
    {
      id: "comprehension",
      type: "comprehension",
      title: "Quick Quiz",
      description: "<p>Answer these questions to show you understand the task.</p>",
      questions: [
        {
          prompt: "Who picks which transactions you see?",
          type: "radio",
          correct: "manager",
          options: [
            { value: "manager",  label: "The manager selects which transactions to disclose" },
            { value: "you",      label: "I choose which transactions to look at" },
            { value: "random",   label: "A random process selects the transactions" },
            { value: "nobody",   label: "Nobody -- I see all transactions" }
          ]
        },
        {
          prompt: "Does the manager earn more when you rate fraud probability high or low?",
          type: "radio",
          correct: "low",
          options: [
            { value: "low",        label: "Low -- the manager benefits when I rate fraud as less likely" },
            { value: "high",       label: "High -- the manager benefits when I rate fraud as more likely" },
            { value: "no_effect",  label: "It doesn't matter" },
            { value: "depends",    label: "It depends on the firm" }
          ]
        },
        {
          prompt: "If a firm has 10 transactions and the manager shows you 3, how many are hidden?",
          type: "radio",
          correct: "7",
          options: [
            { value: "7",  label: "7" },
            { value: "3",  label: "3" },
            { value: "10", label: "10" },
            { value: "0",  label: "0" }
          ]
        },
        {
          prompt: "Can a non-fraudulent firm have a Highly Unusual transaction?",
          type: "radio",
          correct: "yes",
          options: [
            { value: "yes",       label: "Yes -- 10% of non-fraudulent firms' transactions are Highly Unusual" },
            { value: "no",        label: "No -- only fraudulent firms have HU transactions" },
            { value: "only_fraud", label: "Only if the firm turns out to be fraudulent" },
            { value: "not_enough", label: "Not enough information to say" }
          ]
        }
      ],
      minTimeSeconds: 20,
      maxAttempts: 1,
      failMessage: "Unfortunately, you did not answer all comprehension questions correctly. " +
                   "We are unable to include your responses in the study. Thank you for your time."
    },

    // ── FORMAT EXPLANATION (condition-specific) ──
    {
      id: "inst_format",
      type: "instructions",
      title: "What You Will See",
      body:
        "<p>For each firm, you will see the transactions the manager chose to disclose.</p>" +

        "<!--if:list-->" +
        "<p>The disclosed transactions will be shown as a <strong>text summary</strong>.</p>" +
        "<div class='info-box' style='padding:16px;'>" +
          "<p style='margin:0 0 8px 0;'><strong>Example:</strong> 3 of 10 disclosed:</p>" +
          "<div style='background:#f8f9fa; border-radius:8px; padding:12px 16px; font-size:0.95em;'>" +
            "<ul style='margin:0; padding-left:20px;'>" +
              "<li><span style='color:#2d6a4f;'>Normal:</span> <strong>2</strong></li>" +
              "<li><span style='color:#e67700;'>Unusual:</span> <strong>1</strong></li>" +
              "<li><span style='color:#c92a2a;'>Highly Unusual:</span> <strong>0</strong></li>" +
            "</ul>" +
            "<p style='margin:8px 0 0 0; color:#666; font-style:italic;'>7 transactions were not disclosed.</p>" +
          "</div>" +
        "</div>" +
        "<!--endif:list-->" +

        "<!--if:chart_disclosed-->" +
        "<p>The disclosed transactions will be shown as a <strong>bar chart</strong>.</p>" +
        "<div class='info-box' style='padding:16px;'>" +
          "<p style='margin:0 0 8px 0;'><strong>Example:</strong> 3 of 10 disclosed:</p>" +
          "<div style='background:#f8f9fa; border-radius:8px; padding:12px 16px;'>" +
            "<div style='display:flex; align-items:flex-end; height:80px; gap:8px;'>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#2d6a4f; height:60px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>Normal (2)</div>" +
              "</div>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#e67700; height:30px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>Unusual (1)</div>" +
              "</div>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#c92a2a; height:0px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>HU (0)</div>" +
              "</div>" +
            "</div>" +
            "<p style='margin:8px 0 0 0; color:#666; font-style:italic;'>7 transactions were not disclosed.</p>" +
          "</div>" +
        "</div>" +
        "<!--endif:chart_disclosed-->" +

        "<!--if:chart_full-->" +
        "<p>The transactions will be shown as a <strong>bar chart</strong> with a " +
        "<strong>gray bar</strong> for undisclosed transactions.</p>" +
        "<div class='info-box' style='padding:16px;'>" +
          "<p style='margin:0 0 8px 0;'><strong>Example:</strong> 3 of 10 total:</p>" +
          "<div style='background:#f8f9fa; border-radius:8px; padding:12px 16px;'>" +
            "<div style='display:flex; align-items:flex-end; height:100px; gap:8px;'>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#2d6a4f; height:28px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>Normal (2)</div>" +
              "</div>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#e67700; height:14px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>Unusual (1)</div>" +
              "</div>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#c92a2a; height:0px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>HU (0)</div>" +
              "</div>" +
              "<div style='flex:0 0 60px; text-align:center;'>" +
                "<div style='background:#bbb; height:96px; border-radius:4px 4px 0 0;'></div>" +
                "<div style='font-size:0.75em; margin-top:4px;'>Not Disclosed (7)</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
        "<!--endif:chart_full-->" +

        "<p>Think carefully about what the undisclosed transactions might look like.</p>",
      minTimeSeconds: 12
    },

    // ── READY ──
    {
      id: "inst_ready",
      type: "instructions",
      title: "Ready to Start!",
      body:
        "<p>You will evaluate <strong>10 firms</strong>.</p>" +
        "<p>Remember:</p>" +
        "<ul>" +
          "<li>The manager wants you to rate fraud <strong>low</strong></li>" +
          "<li>You want to rate fraud <strong>accurately</strong></li>" +
          "<li>Think about what the manager chose to show -- and what they might be hiding</li>" +
        "</ul>" +

        "<div class='info-box' style='background:#fff8e6; border-left:4px solid #e67700; padding:12px 16px;'>" +
          "<table style='width:100%; border-collapse:collapse; font-size:0.9em;'>" +
            "<tr>" +
              "<td></td>" +
              "<td style='text-align:center;'><strong>Non-Fraud</strong></td>" +
              "<td style='text-align:center;'><strong>Fraud</strong></td>" +
            "</tr>" +
            "<tr><td style='color:#2d6a4f;'>Normal</td><td style='text-align:center;'>60%</td><td style='text-align:center;'>40%</td></tr>" +
            "<tr><td style='color:#e67700;'>Unusual</td><td style='text-align:center;'>30%</td><td style='text-align:center;'>30%</td></tr>" +
            "<tr><td style='color:#c92a2a;'>Highly Unusual</td><td style='text-align:center;'>10%</td><td style='text-align:center;'>30%</td></tr>" +
          "</table>" +
          "<p style='margin:8px 0 0 0;'>Prior: 50% chance of fraud. Unusual is uninformative (30% both).</p>" +
        "</div>" +

        "<p>Good luck!</p>",
      minTimeSeconds: 8
    },

    // ── TRIAL BLOCK (10 trials, randomized) ──
    {
      id: "trials_main",
      type: "trial_block",
      block: 1,
      randomize: true,
      trialCount: 10,
      trialIntroTemplate:
        "<p>This firm has <strong>{N} transactions</strong> in total.</p>" +
        "<p>The manager has selected <strong>{k} transactions</strong> to show you.</p>",
      trialStimulusTemplates: {
        list:
          "<div class='stimulus-card stimulus-list'>" +
            "<p class='stimulus-header'><strong>Disclosed transactions ({k} of {N}):</strong></p>" +
            "<ul class='stimulus-list-items'>" +
              "<li><span style='color:#2d6a4f;'>Normal:</span> <strong>{nNormal}</strong></li>" +
              "<li><span style='color:#e67700;'>Unusual:</span> <strong>{nUnusual}</strong></li>" +
              "<li><span style='color:#c92a2a;'>Highly Unusual:</span> <strong>{nHU}</strong></li>" +
            "</ul>" +
            "<p class='stimulus-hidden-note'>{hidden} transactions were not disclosed.</p>" +
          "</div>",

        chart_disclosed:
          "<div class='stimulus-card stimulus-chart'>" +
            "<p class='stimulus-header'><strong>Disclosed transactions ({k} of {N}):</strong></p>" +
            "<div class='stimulus-chart-container' " +
              "data-n-normal='{nNormal}' data-n-unusual='{nUnusual}' data-n-hu='{nHU}' " +
              "data-chart-type='disclosed'>" +
            "</div>" +
            "<p class='stimulus-hidden-note'>{hidden} transactions were not disclosed.</p>" +
          "</div>",

        chart_full:
          "<div class='stimulus-card stimulus-chart'>" +
            "<p class='stimulus-header'><strong>All transactions ({N} total):</strong></p>" +
            "<div class='stimulus-chart-container' " +
              "data-n-normal='{nNormal}' data-n-unusual='{nUnusual}' data-n-hu='{nHU}' " +
              "data-hidden='{hidden}' data-chart-type='full'>" +
            "</div>" +
          "</div>"
      },
      minTimePerTrial: 10
    },

    // ── ATTENTION CHECK ──
    {
      id: "attention1",
      type: "attention_check",
      question: "People sometimes answer surveys without reading the questions carefully. " +
                "To show that you are paying attention, please select " +
                "\"Strongly Disagree\" below.",
      options: [
        { value: "strongly_disagree", label: "Strongly Disagree" },
        { value: "disagree",          label: "Disagree" },
        { value: "neutral",           label: "Neutral" },
        { value: "agree",             label: "Agree" },
        { value: "strongly_agree",    label: "Strongly Agree" }
      ],
      correctAnswer: "strongly_disagree",
      minTimeSeconds: 8
    },

    // ── POST-TASK QUESTIONNAIRE ──
    {
      id: "posttask",
      type: "questionnaire",
      title: "Your Experience",
      minTimeSeconds: 15,
      questions: [
        {
          id: "strategy_awareness",
          prompt: "When making your fraud assessments, how much did you think about what the manager might be hiding?",
          type: "radio",
          required: true,
          options: [
            { value: "a_lot",      label: "A lot -- I was very focused on what was NOT shown" },
            { value: "somewhat",   label: "Somewhat -- I considered hidden transactions for some firms" },
            { value: "a_little",   label: "A little -- I mostly focused on what was disclosed" },
            { value: "not_at_all", label: "Not at all -- I based my ratings on the disclosed transactions" }
          ]
        },
        {
          id: "hidden_belief",
          prompt: "In general, what did you think the hidden transactions looked like compared to the disclosed ones?",
          type: "radio",
          required: true,
          options: [
            { value: "worse",       label: "Worse -- more Highly Unusual than what was disclosed" },
            { value: "similar",     label: "Similar -- roughly the same mix as disclosed" },
            { value: "better",      label: "Better -- more Normal than what was disclosed" },
            { value: "didnt_think", label: "I didn't really think about it" }
          ]
        },
        {
          id: "scale_impact",
          prompt: "Did the number of hidden transactions (how many were NOT shown) affect your fraud assessment?",
          type: "radio",
          required: true,
          options: [
            { value: "yes_a_lot",   label: "Yes, a lot -- more hidden transactions made me rate fraud higher" },
            { value: "yes_somewhat", label: "Yes, somewhat -- it influenced my thinking" },
            { value: "not_really",  label: "Not really -- I focused mainly on the disclosed composition" },
            { value: "no",          label: "No -- the number of hidden transactions didn't matter to me" }
          ]
        }
      ]
    },

    // ── DEMOGRAPHICS ──
    {
      id: "demographics",
      type: "questionnaire",
      title: "About You",
      minTimeSeconds: 15,
      questions: [
        {
          id: "age",
          prompt: "What is your age?",
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
          prompt: "What is your gender?",
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
          id: "education",
          prompt: "What is your highest level of education?",
          type: "dropdown",
          required: true,
          options: [
            { value: "high_school",  label: "High school or equivalent" },
            { value: "some_college", label: "Some college" },
            { value: "bachelors",    label: "Bachelor's degree" },
            { value: "masters",      label: "Master's degree" },
            { value: "doctorate",    label: "Doctorate or professional degree" },
            { value: "other",        label: "Other" }
          ]
        },
        {
          id: "stats_comfort",
          prompt: "How comfortable are you with probability and statistics?",
          type: "likert",
          required: true,
          min: 1,
          max: 5,
          minLabel: "Not at all comfortable",
          maxLabel: "Very comfortable"
        },
        {
          id: "fin_literacy_compound",
          prompt: "Suppose you had $100 in a savings account and the interest rate was 2% per year. After 5 years, how much would you have?",
          type: "radio",
          required: true,
          options: [
            { value: "more_than_102", label: "More than $102" },
            { value: "exactly_102",   label: "Exactly $102" },
            { value: "less_than_102", label: "Less than $102" },
            { value: "dont_know",     label: "I don't know" }
          ]
        },
        {
          id: "fin_literacy_inflation",
          prompt: "Imagine that the interest rate on your savings account was 1% per year and inflation was 2% per year. After 1 year, how much would you be able to buy with the money in this account?",
          type: "radio",
          required: true,
          options: [
            { value: "more",      label: "More than today" },
            { value: "same",      label: "Exactly the same" },
            { value: "less",      label: "Less than today" },
            { value: "dont_know", label: "I don't know" }
          ]
        }
      ]
    },

    // ── DEBRIEF ──
    {
      id: "debrief",
      type: "debrief",
      title: "Thank You!",
      body: "<p>This study examines how people assess fraud risk when a strategic " +
            "manager selectively discloses financial transactions. The manager always " +
            "shows the most favorable transactions, meaning the undisclosed transactions " +
            "are likely to contain more Highly Unusual items than what you saw.</p>" +

            "<p>A key question is whether people sufficiently account for the " +
            "<em>undisclosed</em> information when forming their judgments, " +
            "and whether the scale of undisclosed information (7 hidden vs. 700 hidden) " +
            "changes their reasoning.</p>" +

            "<p>We also varied how the disclosed information was presented -- as a text " +
            "list, a bar chart of disclosed transactions, or a bar chart that also shows " +
            "a gray bar for the undisclosed count -- to understand whether visual format " +
            "affects sensitivity to omitted information.</p>" +

            "<p>Your responses will help us understand how presentation format " +
            "and disclosure scale interact to shape fraud judgments under " +
            "strategic selection. Thank you for contributing to this research!</p>",
      showBonus: true,
      completionCode: "COMP2SN"
    }
  ]

};

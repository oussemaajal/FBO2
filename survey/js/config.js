/* ==========================================================================
   FBO 2 (Selection Neglect) -- Experiment Configuration

   THIS IS THE ONLY FILE YOU NEED TO EDIT to configure your experiment.
   Everything else (engine, styling, bot detection, storage) is generic.

   Design: 5 (scale) x 3 (format) between-subjects = 15 cells
   Within-participant: 2 blocks of 10 trials (same stimuli, same order)
     Block 1: fraud probability + confidence (NO hidden HU question)
     Block 2: hidden HU estimate FIRST, then fraud probability + confidence

   Scale conditions:
     small_low   : k=3,   N=10
     small_high  : k=3,   N=100
     small_vhigh : k=3,   N=1000
     large_high  : k=30,  N=100
     large_vhigh : k=300, N=1000

   Format conditions:
     list           : Text list of transaction counts + text note of undisclosed
     chart_disclosed: Pie chart of disclosed + small text note of undisclosed
     chart_full     : Pie chart of disclosed + gray segment for undisclosed

   Page types available:
   - welcome            : Title + body text + optional PID fallback
   - consent            : Consent form with required checkbox
   - instructions       : Instruction text (supports conditional blocks)
   - comprehension      : Questions with correct answers + pass/fail
   - completion         : Shows pass/fail with completion code
   - trial_block        : Block of trials (auto-expanded, randomized)
   - transition         : Between-block transition page
   - questionnaire      : Generic questions page (radio, number, text, likert, dropdown)
   - debrief            : Thank you + bonus display + completion code
   ========================================================================== */

var SURVEY_CONFIG = {

  // -- Study Metadata -------------------------------------------------------
  study: {
    title: "Fraud Assessment Study",
    version: "2.0.0",
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

  // -- Between-Subjects Conditions (15 cells) --------------------------------
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
      { id: "chart_disclosed",  label: "Pie chart (disclosed only)" },
      { id: "chart_full",       label: "Pie chart (full with gray)" }
    ],
    // cellIndex = hash(PID) % 15
    // scaleIndex  = Math.floor(cellIndex / 3)
    // formatIndex = cellIndex % 3
    cellCount: 15
  },

  // -- Type Distributions ---------------------------------------------------
  typeDistributions: {
    nonFraudulent: { normal: 0.60, unusual: 0.30, highlyUnusual: 0.10 },
    fraudulent:    { normal: 0.40, unusual: 0.30, highlyUnusual: 0.30 },
    prior: 0.50
  },

  // -- Trial Attention Checks -----------------------------------------------
  trialAttentionCheckCount: 3,

  // -- Bonus Parameters -----------------------------------------------------
  bonus: {
    enabled: true,
    currency: "GBP",
    base: 1.50,
    penaltyPerUnit: 0.30,
    floor: 0.00,
    maxBonus: 1.50,
    selectionMethod: "random_trial"
  },

  // -- Stimuli --------------------------------------------------------------
  // 10 proportional compositions, constant across scale conditions.
  // For each trial: id, proportions (%N, %U, %HU), naivePosterior.
  // Actual counts computed from k and proportions.
  //
  // Naive posterior:
  //   P(F|disclosed) = P(disclosed|F)*P(F) / [P(disclosed|F)*P(F) + P(disclosed|NF)*P(NF)]
  //
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

  // -- Dependent Variables (per trial) --------------------------------------
  // Block 1 uses: fraud_probability, confidence
  // Block 2 uses: hidden_hu_estimate (FIRST), fraud_probability, confidence
  trialDVs: [
    {
      id: "fraud_probability",
      type: "slider",
      prompt: "How likely is it that this firm is fraudulent?",
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
      prompt: "What percentage of the {hidden} undisclosed transactions do you think are Highly Unusual?",
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
        "<p>You will evaluate firms for fraud. Each firm has transactions classified as " +
        "<span style='color:#2d6a4f; font-weight:600;'>Normal</span>, " +
        "<span style='color:#e67700; font-weight:600;'>Unusual</span>, or " +
        "<span style='color:#c92a2a; font-weight:600;'>Highly Unusual</span>.</p>" +

        "<p>The mix of transaction types differs between firm types:</p>" +

        "<div style='display:flex; gap:32px; justify-content:center; flex-wrap:wrap; margin:20px 0;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:15px; margin-bottom:10px; color:#1e293b;'>Non-Fraudulent Firm</div>" +
            "<div style='display:flex; align-items:center; gap:16px;'>" +
              "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 216deg, #FF9800 216deg 324deg, #ef4444 324deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:6px; text-align:left; font-size:14px;'>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span><strong>Normal 60%</strong></div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#FF9800; border-radius:3px;'></span>Unusual 30%</div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span>HU 10%</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:15px; margin-bottom:10px; color:#1e293b;'>Fraudulent Firm</div>" +
            "<div style='display:flex; align-items:center; gap:16px;'>" +
              "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 144deg, #FF9800 144deg 252deg, #ef4444 252deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:6px; text-align:left; font-size:14px;'>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span>Normal 40%</div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#FF9800; border-radius:3px;'></span>Unusual 30%</div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span><strong>HU 30%</strong></div>" +
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
        "<p>A manager sees <strong>all</strong> of a firm's transactions but shows you only some. " +
        "The manager cannot fabricate transactions -- only choose which ones to reveal.</p>" +
        "<p>The manager earns more when you rate fraud <strong>lower</strong> -- " +
        "so the manager wants to show you the best-looking transactions.</p>",
      minTimeSeconds: 10
    },

    // -- Page 5: Your Job --
    {
      id: "p1_inst_job",
      type: "instructions",
      title: "Your Job",
      body:
        "<p>Rate how likely the firm is fraudulent (0-100%) and how confident you are in that rating.</p>",
      minTimeSeconds: 8
    },

    // -- Page 6: Key Point --
    {
      id: "p1_inst_key",
      type: "instructions",
      title: "Key Point",
      body:
        "<p>Unusual transactions occur at the <strong>same rate (30%)</strong> in both firm types -- " +
        "they tell you nothing about fraud. The difference is in Normal vs. Highly Unusual.</p>" +

        "<div style='display:flex; gap:24px; justify-content:center; flex-wrap:wrap; margin:16px 0;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:13px; margin-bottom:8px; color:#1e293b;'>Non-Fraudulent</div>" +
            "<div style='display:flex; align-items:center; gap:12px;'>" +
              "<div style='width:90px; height:90px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 216deg, #FF9800 216deg 324deg, #ef4444 324deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:4px; text-align:left; font-size:13px;'>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#4CAF50; border-radius:2px;'></span><strong>N 60%</strong></div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#FF9800; border-radius:2px;'></span>U 30%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:2px;'></span>HU 10%</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:13px; margin-bottom:8px; color:#1e293b;'>Fraudulent</div>" +
            "<div style='display:flex; align-items:center; gap:12px;'>" +
              "<div style='width:90px; height:90px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 144deg, #FF9800 144deg 252deg, #ef4444 252deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:4px; text-align:left; font-size:13px;'>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#4CAF50; border-radius:2px;'></span>N 40%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#FF9800; border-radius:2px;'></span>U 30%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:2px;'></span><strong>HU 30%</strong></div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 10
    },

    // -- Page 7: Before the Quiz --
    {
      id: "p1_inst_pre_quiz",
      type: "instructions",
      title: "Before the Quiz",
      body:
        "<p>Each firm starts with a <strong>50% chance</strong> of being fraudulent. " +
        "Let's check you understood the basics.</p>",
      minTimeSeconds: 5
    },

    // -- Pages 8-11: Quiz (4 questions, comprehension type) --
    {
      id: "p1_comprehension",
      type: "comprehension",
      title: "Quiz",
      description: "<p>Answer all questions correctly to proceed to Part 2.</p>",
      questions: [
        {
          prompt: "Who picks which transactions you see?",
          type: "radio",
          correct: "manager",
          options: [
            { value: "manager",  label: "The manager" },
            { value: "you",      label: "You" },
            { value: "random",   label: "A random process" },
            { value: "nobody",   label: "Nobody" }
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
          prompt: "If a firm has 10 transactions and the manager shows 3, how many are hidden?",
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
            { value: "yes",        label: "Yes" },
            { value: "no",         label: "No" },
            { value: "only_fraud", label: "Only if it's fraud" },
            { value: "not_enough", label: "Not enough information" }
          ]
        }
      ],
      minTimeSeconds: 15,
      maxAttempts: 1,
      failMessage: "You did not answer all questions correctly. " +
                   "You will still be paid &pound;1.00 for this part. Thank you for your time."
    },

    // -- Page 12: Result --
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
  //  PART 2 PAGES -- Two blocks of 10 trials + Debrief
  // ====================================================================

  part2Pages: [

    // -- Welcome back --
    {
      id: "p2_welcome",
      type: "welcome",
      title: "Welcome Back",
      subtitle: "",
      body: "<p>This part takes about <strong>15 minutes</strong>. " +
            "You will evaluate <strong>10 firms</strong> twice.</p>" +
            "<p>Pay: <strong>&pound;2.50</strong> base + up to <strong>&pound;1.50</strong> accuracy bonus.</p>",
      buttonText: "Continue"
    },

    // -- Quick reminder --
    {
      id: "p2_reminder",
      type: "instructions",
      title: "Quick Reminder",
      body:
        "<p>Firms have transactions classified as Normal, Unusual, or Highly Unusual. " +
        "A manager picks which ones to show you. The manager earns more when you rate fraud lower.</p>" +

        "<div style='display:flex; gap:24px; justify-content:center; flex-wrap:wrap; margin:16px 0;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:13px; margin-bottom:8px; color:#1e293b;'>Non-Fraudulent</div>" +
            "<div style='display:flex; align-items:center; gap:12px;'>" +
              "<div style='width:90px; height:90px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 216deg, #FF9800 216deg 324deg, #ef4444 324deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:4px; text-align:left; font-size:13px;'>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#4CAF50; border-radius:2px;'></span><strong>N 60%</strong></div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#FF9800; border-radius:2px;'></span>U 30%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:2px;'></span>HU 10%</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:13px; margin-bottom:8px; color:#1e293b;'>Fraudulent</div>" +
            "<div style='display:flex; align-items:center; gap:12px;'>" +
              "<div style='width:90px; height:90px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 144deg, #FF9800 144deg 252deg, #ef4444 252deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:4px; text-align:left; font-size:13px;'>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#4CAF50; border-radius:2px;'></span>N 40%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#FF9800; border-radius:2px;'></span>U 30%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:2px;'></span><strong>HU 30%</strong></div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +

        "<p style='color:#64748b; font-size:14px;'>Prior: each firm starts at 50% chance of fraud.</p>",
      minTimeSeconds: 8
    },

    // -- Format intro (condition-specific) --
    {
      id: "p2_format_intro",
      type: "instructions",
      title: "How You Will See Transactions",
      body:
        "<p>For each firm, you will see the transactions the manager chose to disclose.</p>" +

        "<!--if:list-->" +
        "<p>Transactions are shown as a <strong>text summary</strong> listing counts by type.</p>" +
        "<div style='background:#f8f9fa; border-radius:8px; padding:12px 16px; margin:12px 0; font-size:0.95em;'>" +
          "<p style='margin:0 0 4px 0;'><strong>Example</strong> -- 3 of 10 disclosed:</p>" +
          "<ul style='margin:0; padding-left:20px;'>" +
            "<li><span style='color:#2d6a4f;'>Normal:</span> <strong>2</strong></li>" +
            "<li><span style='color:#e67700;'>Unusual:</span> <strong>1</strong></li>" +
            "<li><span style='color:#c92a2a;'>Highly Unusual:</span> <strong>0</strong></li>" +
          "</ul>" +
          "<p style='margin:8px 0 0 0; color:#666; font-style:italic;'>7 transactions were not disclosed.</p>" +
        "</div>" +
        "<!--endif:list-->" +

        "<!--if:chart_disclosed-->" +
        "<p>Transactions are shown as a <strong>pie chart</strong> of the disclosed composition. " +
        "A note tells you how many were not disclosed.</p>" +
        "<div style='background:#f8f9fa; border-radius:8px; padding:16px; margin:12px 0; display:flex; align-items:center; gap:20px; flex-wrap:wrap; justify-content:center;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-size:13px; color:#64748b; margin-bottom:6px;'>Example: 3 of 10 disclosed</div>" +
            "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 240deg, #FF9800 240deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1); margin:0 auto;'></div>" +
          "</div>" +
          "<div style='display:flex; flex-direction:column; gap:6px; font-size:14px;'>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span><strong>Normal:</strong> 2 (67%)</div>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#FF9800; border-radius:3px;'></span><strong>Unusual:</strong> 1 (33%)</div>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span><strong>HU:</strong> 0 (0%)</div>" +
            "<div style='color:#666; font-style:italic; margin-top:4px;'>7 transactions not disclosed.</div>" +
          "</div>" +
        "</div>" +
        "<!--endif:chart_disclosed-->" +

        "<!--if:chart_full-->" +
        "<p>Transactions are shown as a <strong>pie chart</strong> with a " +
        "<strong style='color:#9CA3AF;'>gray segment</strong> for undisclosed transactions.</p>" +
        "<div style='background:#f8f9fa; border-radius:8px; padding:16px; margin:12px 0; display:flex; align-items:center; gap:20px; flex-wrap:wrap; justify-content:center;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-size:13px; color:#64748b; margin-bottom:6px;'>Example: 3 of 10 total</div>" +
            "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 72deg, #FF9800 72deg 108deg, #9CA3AF 108deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1); margin:0 auto;'></div>" +
          "</div>" +
          "<div style='display:flex; flex-direction:column; gap:6px; font-size:14px;'>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span><strong>Normal:</strong> 2 (20%)</div>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#FF9800; border-radius:3px;'></span><strong>Unusual:</strong> 1 (10%)</div>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span><strong>HU:</strong> 0 (0%)</div>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#9CA3AF; border-radius:3px;'></span><strong>Undisclosed:</strong> 7 (70%)</div>" +
          "</div>" +
        "</div>" +
        "<!--endif:chart_full-->",
      minTimeSeconds: 10
    },

    // -- BLOCK 1: 10 trials, NO hidden HU question --
    {
      id: "block1",
      type: "trial_block",
      block: 1,
      randomize: true,
      trialCount: 10,
      askHiddenHU: false,
      askHiddenHUFirst: false,
      trialIntroTemplate:
        "<p>This firm has <strong>{N} transactions</strong> in total. " +
        "The manager shows you <strong>{k}</strong>.</p>",
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

    // -- Transition between blocks --
    {
      id: "p2_transition",
      type: "transition",
      title: "Part 2 of the Evaluation",
      body: "<p>You've now seen all 10 firms.</p>" +
            "<p>Next, you will see the <strong>same firms again</strong>. " +
            "This time, we will first ask you to think about the transactions " +
            "the manager chose <strong>not</strong> to show you, before you rate fraud probability.</p>"
    },

    // -- BLOCK 2: SAME 10 trials, WITH hidden HU question FIRST --
    {
      id: "block2",
      type: "trial_block",
      block: 2,
      randomize: false,       // Same order as block 1 (engine preserves block 1 order)
      trialCount: 10,
      askHiddenHU: true,
      askHiddenHUFirst: true, // HU estimate comes before fraud probability
      trialIdSuffix: "_b2",  // Trial IDs become t1_b2, t2_b2, etc.
      trialIntroTemplate:
        "<p>This firm has <strong>{N} transactions</strong> in total. " +
        "The manager shows you <strong>{k}</strong>.</p>",
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

    // -- Demographics (3 questions only) --
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
            "strategically selects which transactions to disclose.</p>" +
            "<p>We are interested in whether asking people to think about what was " +
            "<em>not</em> shown changes their fraud judgments, and how the number " +
            "of hidden transactions affects reasoning.</p>" +
            "<p>We also varied how disclosed information was presented (text vs. pie chart) " +
            "to understand whether format affects sensitivity to omitted information.</p>" +
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
            "then evaluate 10 firms twice.</p>" +
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
        "<p>You will evaluate firms for fraud. Each firm has transactions classified as " +
        "<span style='color:#2d6a4f; font-weight:600;'>Normal</span>, " +
        "<span style='color:#e67700; font-weight:600;'>Unusual</span>, or " +
        "<span style='color:#c92a2a; font-weight:600;'>Highly Unusual</span>.</p>" +

        "<p>The mix differs between firm types:</p>" +

        "<div style='display:flex; gap:32px; justify-content:center; flex-wrap:wrap; margin:20px 0;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:15px; margin-bottom:10px; color:#1e293b;'>Non-Fraudulent Firm</div>" +
            "<div style='display:flex; align-items:center; gap:16px;'>" +
              "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 216deg, #FF9800 216deg 324deg, #ef4444 324deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:6px; text-align:left; font-size:14px;'>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span><strong>Normal 60%</strong></div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#FF9800; border-radius:3px;'></span>Unusual 30%</div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span>HU 10%</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:15px; margin-bottom:10px; color:#1e293b;'>Fraudulent Firm</div>" +
            "<div style='display:flex; align-items:center; gap:16px;'>" +
              "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 144deg, #FF9800 144deg 252deg, #ef4444 252deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:6px; text-align:left; font-size:14px;'>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span>Normal 40%</div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#FF9800; border-radius:3px;'></span>Unusual 30%</div>" +
                "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span><strong>HU 30%</strong></div>" +
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
        "<p>A manager sees <strong>all</strong> of a firm's transactions but shows you only some. " +
        "The manager cannot fabricate transactions -- only choose which ones to reveal.</p>" +
        "<p>The manager earns more when you rate fraud <strong>lower</strong> -- " +
        "so the manager wants to show you the best-looking transactions.</p>",
      minTimeSeconds: 10
    },

    // -- Your Job --
    {
      id: "inst_job",
      type: "instructions",
      title: "Your Job",
      body:
        "<p>Rate how likely the firm is fraudulent (0-100%) and how confident you are in that rating.</p>",
      minTimeSeconds: 8
    },

    // -- Key Point --
    {
      id: "inst_key",
      type: "instructions",
      title: "Key Point",
      body:
        "<p>Unusual transactions occur at the <strong>same rate (30%)</strong> in both firm types -- " +
        "they tell you nothing about fraud. The difference is in Normal vs. Highly Unusual.</p>" +

        "<div style='display:flex; gap:24px; justify-content:center; flex-wrap:wrap; margin:16px 0;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:13px; margin-bottom:8px; color:#1e293b;'>Non-Fraudulent</div>" +
            "<div style='display:flex; align-items:center; gap:12px;'>" +
              "<div style='width:90px; height:90px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 216deg, #FF9800 216deg 324deg, #ef4444 324deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:4px; text-align:left; font-size:13px;'>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#4CAF50; border-radius:2px;'></span><strong>N 60%</strong></div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#FF9800; border-radius:2px;'></span>U 30%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:2px;'></span>HU 10%</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:13px; margin-bottom:8px; color:#1e293b;'>Fraudulent</div>" +
            "<div style='display:flex; align-items:center; gap:12px;'>" +
              "<div style='width:90px; height:90px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 144deg, #FF9800 144deg 252deg, #ef4444 252deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:4px; text-align:left; font-size:13px;'>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#4CAF50; border-radius:2px;'></span>N 40%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#FF9800; border-radius:2px;'></span>U 30%</div>" +
                "<div style='display:flex; align-items:center; gap:6px;'><span style='display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:2px;'></span><strong>HU 30%</strong></div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 10
    },

    // -- Before the Quiz --
    {
      id: "inst_pre_quiz",
      type: "instructions",
      title: "Before the Quiz",
      body:
        "<p>Each firm starts with a <strong>50% chance</strong> of being fraudulent. " +
        "Let's check you understood the basics.</p>",
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
          prompt: "Who picks which transactions you see?",
          type: "radio",
          correct: "manager",
          options: [
            { value: "manager",  label: "The manager" },
            { value: "you",      label: "You" },
            { value: "random",   label: "A random process" },
            { value: "nobody",   label: "Nobody" }
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
          prompt: "If a firm has 10 transactions and the manager shows 3, how many are hidden?",
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
            { value: "yes",        label: "Yes" },
            { value: "no",         label: "No" },
            { value: "only_fraud", label: "Only if it's fraud" },
            { value: "not_enough", label: "Not enough information" }
          ]
        }
      ],
      minTimeSeconds: 15,
      maxAttempts: 1,
      failMessage: "You did not answer all questions correctly. Thank you for your time."
    },

    // -- Format intro (condition-specific) --
    {
      id: "inst_format",
      type: "instructions",
      title: "How You Will See Transactions",
      body:
        "<p>For each firm, you will see the transactions the manager chose to disclose.</p>" +

        "<!--if:list-->" +
        "<p>Transactions are shown as a <strong>text summary</strong> listing counts by type.</p>" +
        "<div style='background:#f8f9fa; border-radius:8px; padding:12px 16px; margin:12px 0; font-size:0.95em;'>" +
          "<p style='margin:0 0 4px 0;'><strong>Example</strong> -- 3 of 10 disclosed:</p>" +
          "<ul style='margin:0; padding-left:20px;'>" +
            "<li><span style='color:#2d6a4f;'>Normal:</span> <strong>2</strong></li>" +
            "<li><span style='color:#e67700;'>Unusual:</span> <strong>1</strong></li>" +
            "<li><span style='color:#c92a2a;'>Highly Unusual:</span> <strong>0</strong></li>" +
          "</ul>" +
          "<p style='margin:8px 0 0 0; color:#666; font-style:italic;'>7 transactions were not disclosed.</p>" +
        "</div>" +
        "<!--endif:list-->" +

        "<!--if:chart_disclosed-->" +
        "<p>Transactions are shown as a <strong>pie chart</strong> of the disclosed composition. " +
        "A note tells you how many were not disclosed.</p>" +
        "<div style='background:#f8f9fa; border-radius:8px; padding:16px; margin:12px 0; display:flex; align-items:center; gap:20px; flex-wrap:wrap; justify-content:center;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-size:13px; color:#64748b; margin-bottom:6px;'>Example: 3 of 10 disclosed</div>" +
            "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 240deg, #FF9800 240deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1); margin:0 auto;'></div>" +
          "</div>" +
          "<div style='display:flex; flex-direction:column; gap:6px; font-size:14px;'>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span><strong>Normal:</strong> 2 (67%)</div>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#FF9800; border-radius:3px;'></span><strong>Unusual:</strong> 1 (33%)</div>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span><strong>HU:</strong> 0 (0%)</div>" +
            "<div style='color:#666; font-style:italic; margin-top:4px;'>7 transactions not disclosed.</div>" +
          "</div>" +
        "</div>" +
        "<!--endif:chart_disclosed-->" +

        "<!--if:chart_full-->" +
        "<p>Transactions are shown as a <strong>pie chart</strong> with a " +
        "<strong style='color:#9CA3AF;'>gray segment</strong> for undisclosed transactions.</p>" +
        "<div style='background:#f8f9fa; border-radius:8px; padding:16px; margin:12px 0; display:flex; align-items:center; gap:20px; flex-wrap:wrap; justify-content:center;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-size:13px; color:#64748b; margin-bottom:6px;'>Example: 3 of 10 total</div>" +
            "<div style='width:120px; height:120px; border-radius:50%; background:conic-gradient(#4CAF50 0deg 72deg, #FF9800 72deg 108deg, #9CA3AF 108deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1); margin:0 auto;'></div>" +
          "</div>" +
          "<div style='display:flex; flex-direction:column; gap:6px; font-size:14px;'>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#4CAF50; border-radius:3px;'></span><strong>Normal:</strong> 2 (20%)</div>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#FF9800; border-radius:3px;'></span><strong>Unusual:</strong> 1 (10%)</div>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#ef4444; border-radius:3px;'></span><strong>HU:</strong> 0 (0%)</div>" +
            "<div style='display:flex; align-items:center; gap:8px;'><span style='display:inline-block; width:14px; height:14px; background:#9CA3AF; border-radius:3px;'></span><strong>Undisclosed:</strong> 7 (70%)</div>" +
          "</div>" +
        "</div>" +
        "<!--endif:chart_full-->",
      minTimeSeconds: 10
    },

    // -- Block 1: 10 trials, NO hidden HU question --
    {
      id: "trials_block1",
      type: "trial_block",
      block: 1,
      randomize: true,
      trialCount: 10,
      askHiddenHU: false,
      askHiddenHUFirst: false,
      trialIntroTemplate:
        "<p>This firm has <strong>{N} transactions</strong> in total. " +
        "The manager shows you <strong>{k}</strong>.</p>",
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

    // -- Transition --
    {
      id: "transition",
      type: "transition",
      title: "Part 2 of the Evaluation",
      body: "<p>You've now seen all 10 firms.</p>" +
            "<p>Next, you will see the <strong>same firms again</strong>. " +
            "This time, we will first ask you to think about the transactions " +
            "the manager chose <strong>not</strong> to show you, before you rate fraud probability.</p>"
    },

    // -- Block 2: SAME 10 trials, WITH hidden HU question FIRST --
    {
      id: "trials_block2",
      type: "trial_block",
      block: 2,
      randomize: false,
      trialCount: 10,
      askHiddenHU: true,
      askHiddenHUFirst: true,
      trialIdSuffix: "_b2",
      trialIntroTemplate:
        "<p>This firm has <strong>{N} transactions</strong> in total. " +
        "The manager shows you <strong>{k}</strong>.</p>",
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
            "strategically selects which transactions to disclose.</p>" +
            "<p>We are interested in whether asking people to think about what was " +
            "<em>not</em> shown changes their fraud judgments, and how the number " +
            "of hidden transactions affects reasoning.</p>" +
            "<p>We also varied how disclosed information was presented (text vs. pie chart) " +
            "to understand whether format affects sensitivity to omitted information.</p>" +
            "<p>Thank you for contributing to this research.</p>",
      showBonus: true,
      completionCode: "COMP2SN"
    }
  ]

};

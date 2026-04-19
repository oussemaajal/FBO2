/* ==========================================================================
   FBO 2 (Selection Neglect) -- Experiment Configuration v3.2

   THIS IS THE ONLY FILE YOU NEED TO EDIT to configure your experiment.
   Everything else (engine, styling, bot detection, storage) is generic.

   Design: Purely within-subject. Every participant sees all 9 trials.
     9 trials = 3 (N) x 1 (D) x 3 (d_N condition)
     N   = total transactions: {10, 20, 50}  (Small, Medium, Large firm)
     D   = disclosed transactions: 4 (fixed)
     d_N = Normal among disclosed: {0, D-1=3, D=4}

   Transaction types (2 only):
     Normal  (green doc)  -- more common in clean firms
     Flagged (red doc)    -- more common in fraudulent firms

   Type distributions:
     Clean:      50% Normal, 50% Flagged
     Fraudulent: 40% Normal, 60% Flagged

   Prior: P(fraud) = 20%

   Per trial DVs:
     1. Fraud probability (0-100% slider)
     2. Confidence (1-7 Likert)

   Page types available:
   - welcome, consent, instructions, comprehension, completion
   - trial_block, transition, questionnaire, debrief
   ========================================================================== */

var SURVEY_CONFIG = {

  // -- Study Metadata -------------------------------------------------------
  study: {
    title: "Fraud Assessment Study",
    version: "3.2.0",
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
    clean:      { normal: 0.50, flagged: 0.50 },
    fraudulent: { normal: 0.40, flagged: 0.60 },
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
  //   N        = total transactions (10=Small, 20=Medium, 50=Large)
  //   D        = number disclosed by manager (always 4)
  //   dN       = number of Normal among disclosed
  //   nFlagged = D - dN (number of Flagged among disclosed)
  //   hidden   = N - D (undisclosed transactions)
  //
  // Posteriors computed assuming strategic disclosure (manager shows
  // best-looking transactions first):
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
      body: "<p>Help us study how people detect fraudulent firms.</p>" +
            "<p>Part 1 takes ~<strong>5 minutes</strong> for <strong>&pound;1.00</strong>. " +
            "Pass the quiz to unlock Part 2 (~10 min, <strong>&pound;1.50</strong> + up to <strong>&pound;1.00</strong> bonus).</p>",
      buttonText: "Start"
    },

    // -- Page 2: Consent --
    {
      id: "p1_consent",
      type: "consent",
      title: "Consent",
      body: "<p>You are being invited to participate in a research study about decision-making.</p>" +
            "<p><strong>What you will do:</strong> Learn a fraud assessment task and answer a short quiz.</p>" +
            "<p><strong>Time:</strong> ~5 minutes.</p>" +
            "<p><strong>Pay:</strong> &pound;1.00 for this part. Pass the quiz and you will be invited " +
            "to Part 2 (~10 min, &pound;1.50 base + up to &pound;1.00 accuracy bonus).</p>" +
            "<p><strong>Risks:</strong> None beyond everyday life.</p>" +
            "<p><strong>Confidentiality:</strong> Anonymous. We collect your Prolific ID only for payment.</p>" +
            "<p><strong>Voluntary:</strong> You may withdraw at any time by closing this window.</p>",
      mustAgree: true,
      declineMessage: "You must agree to participate in order to continue.",
      minTimeSeconds: 15
    },

    // -- Page 3: Your Mission --
    {
      id: "p1_inst_mission",
      type: "instructions",
      title: "Your Mission",
      body:
        "<div class='mission-badge'>" +
          "<svg viewBox='0 0 100 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
            "<defs>" +
              "<linearGradient id='shieldGrad' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                "<stop offset='0%' stop-color='#0ea5a0'/>" +
                "<stop offset='100%' stop-color='#0f766e'/>" +
              "</linearGradient>" +
            "</defs>" +
            "<path d='M50 5 L90 20 V55 C90 82 72 105 50 115 C28 105 10 82 10 55 V20 Z' " +
                  "fill='url(#shieldGrad)' stroke='#0f766e' stroke-width='2'/>" +
            "<path d='M32 58 L45 72 L70 42' stroke='#ffffff' stroke-width='7' " +
                  "stroke-linecap='round' stroke-linejoin='round' fill='none'/>" +
          "</svg>" +
          "<div class='mission-badge-label'>AUDITOR</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:19px; max-width:560px; margin:0 auto;'>" +
          "You are a <strong>government auditor</strong>. Your job is to detect " +
          "<strong>fraudulent firms</strong>. For each firm you investigate, you will estimate " +
          "the probability that it is fraudulent." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Page 4: Firms -- Clean or Fraudulent --
    {
      id: "p1_inst_firms",
      type: "instructions",
      title: "Firms: Clean or Fraudulent",
      body:
        "<p style='text-align:center; font-size:18px; margin-bottom:20px;'>" +
          "Firms come in two types:" +
        "</p>" +
        "<div class='firm-types-row'>" +
          "<div class='firm-type-icon firm-type-clean'>" +
            "<svg viewBox='0 0 80 90' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='25' width='60' height='60' rx='3' fill='#ccfbf1' stroke='#14b8a6' stroke-width='3'/>" +
              "<rect x='20' y='35' width='10' height='10' fill='#14b8a6'/>" +
              "<rect x='35' y='35' width='10' height='10' fill='#14b8a6'/>" +
              "<rect x='50' y='35' width='10' height='10' fill='#14b8a6'/>" +
              "<rect x='20' y='50' width='10' height='10' fill='#14b8a6'/>" +
              "<rect x='35' y='50' width='10' height='10' fill='#14b8a6'/>" +
              "<rect x='50' y='50' width='10' height='10' fill='#14b8a6'/>" +
              "<rect x='32' y='65' width='16' height='20' fill='#0f766e'/>" +
            "</svg>" +
            "<div class='firm-type-label'>Clean Firm</div>" +
          "</div>" +
          "<div class='firm-type-icon firm-type-fraud'>" +
            "<svg viewBox='0 0 80 90' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='25' width='60' height='60' rx='3' fill='#ede9fe' stroke='#7c3aed' stroke-width='3'/>" +
              "<rect x='20' y='35' width='10' height='10' fill='#7c3aed'/>" +
              "<rect x='35' y='35' width='10' height='10' fill='#7c3aed'/>" +
              "<rect x='50' y='35' width='10' height='10' fill='#7c3aed'/>" +
              "<rect x='20' y='50' width='10' height='10' fill='#7c3aed'/>" +
              "<rect x='35' y='50' width='10' height='10' fill='#7c3aed'/>" +
              "<rect x='50' y='50' width='10' height='10' fill='#7c3aed'/>" +
              "<rect x='32' y='65' width='16' height='20' fill='#5b21b6'/>" +
            "</svg>" +
            "<div class='firm-type-label'>Fraudulent Firm</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:17px; margin:24px 0 12px; color:#475569;'>" +
          "How common is each type?" +
        "</p>" +
        "<div class='firm-prior-visual'>" +
          "<div class='firm-prior-pie'></div>" +
          "<div class='firm-prior-legend'>" +
            "<div class='firm-prior-legend-item'>" +
              "<span class='firm-prior-swatch' style='background:#14b8a6;'></span>" +
              "<span><strong>80%</strong> Clean</span>" +
            "</div>" +
            "<div class='firm-prior-legend-item'>" +
              "<span class='firm-prior-swatch' style='background:#7c3aed;'></span>" +
              "<span><strong>20%</strong> Fraudulent</span>" +
            "</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:18px; margin-top:8px;'>" +
          "Most firms are <strong>clean</strong>. About <strong>1 in 5</strong> is fraudulent." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Page 5: Every Firm Has Transactions --
    {
      id: "p1_inst_has_transactions",
      type: "instructions",
      title: "How Do You Tell Them Apart?",
      body:
        "<p style='text-align:center; font-size:18px; margin-bottom:18px; color:#1e293b;'>" +
          "As an auditor, you examine each firm's <strong>transactions</strong>." +
        "</p>" +
        "<div class='firm-fanout-visual'>" +
          "<svg viewBox='0 0 260 180' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
            "<rect x='110' y='60' width='40' height='100' rx='2' fill='#e5e7eb' stroke='#475569' stroke-width='2'/>" +
            "<rect x='118' y='70' width='8' height='8' fill='#94a3b8'/>" +
            "<rect x='132' y='70' width='8' height='8' fill='#94a3b8'/>" +
            "<rect x='118' y='84' width='8' height='8' fill='#94a3b8'/>" +
            "<rect x='132' y='84' width='8' height='8' fill='#94a3b8'/>" +
            "<rect x='118' y='98' width='8' height='8' fill='#94a3b8'/>" +
            "<rect x='132' y='98' width='8' height='8' fill='#94a3b8'/>" +
            "<rect x='123' y='130' width='14' height='30' fill='#475569'/>" +
            "<g fill='#ffffff' stroke='#64748b' stroke-width='2'>" +
              "<rect x='10'  y='30'  width='36' height='46' rx='3' transform='rotate(-18 28 53)'/>" +
              "<rect x='40'  y='10'  width='36' height='46' rx='3' transform='rotate(-10 58 33)'/>" +
              "<rect x='180' y='10'  width='36' height='46' rx='3' transform='rotate(10 198 33)'/>" +
              "<rect x='210' y='30'  width='36' height='46' rx='3' transform='rotate(18 228 53)'/>" +
              "<rect x='25'  y='115' width='36' height='46' rx='3' transform='rotate(-14 43 138)'/>" +
              "<rect x='200' y='115' width='36' height='46' rx='3' transform='rotate(14 218 138)'/>" +
            "</g>" +
            "<g stroke='#cbd5e1' stroke-width='1' stroke-dasharray='3,3'>" +
              "<line x1='110' y1='90' x2='45'  y2='55'/>" +
              "<line x1='110' y1='85' x2='75'  y2='35'/>" +
              "<line x1='150' y1='85' x2='185' y2='35'/>" +
              "<line x1='150' y1='90' x2='215' y2='55'/>" +
              "<line x1='110' y1='120' x2='60' y2='140'/>" +
              "<line x1='150' y1='120' x2='200' y2='140'/>" +
            "</g>" +
          "</svg>" +
        "</div>" +
        "<p style='text-align:center; font-size:17px; max-width:560px; margin:0 auto; color:#475569;'>" +
          "Each firm processes many transactions. These are your evidence for judging " +
          "whether the firm is clean or fraudulent." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Page 7: Two Types of Transactions --
    {
      id: "p1_inst_two_types",
      type: "instructions",
      title: "Two Types of Transactions",
      body:
        "<div class='two-types-row'>" +
          "<div class='transaction-doc-wrap'>" +
            "<div class='transaction-doc large normal'>N</div>" +
            "<div class='transaction-doc-caption' style='color:#15803d;'>Normal</div>" +
          "</div>" +
          "<div class='transaction-doc-wrap'>" +
            "<div class='transaction-doc large flagged'>F</div>" +
            "<div class='transaction-doc-caption' style='color:#b91c1c;'>Flagged</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:18px; margin-top:8px;'>" +
          "Every transaction is classified as either <strong>Normal</strong> or <strong>Flagged</strong>." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Page 8: Firms Look Different --
    {
      id: "p1_inst_mix_differs",
      type: "instructions",
      title: "Firms Look Different",
      body:
        "<div class='type-pie-row'>" +
          "<div class='type-pie-card type-pie-clean'>" +
            "<div class='type-pie-label'>Clean Firm</div>" +
            "<div class='type-pie' style='background:conic-gradient(#22c55e 0deg 180deg, #ef4444 180deg 360deg);'></div>" +
            "<div class='type-pie-legend'>" +
              "<div class='type-pie-legend-item'><span class='doc-icon doc-icon-normal' style='width:18px; height:22px; font-size:10px;'>N</span><strong>50%</strong></div>" +
              "<div class='type-pie-legend-item'><span class='doc-icon doc-icon-flagged' style='width:18px; height:22px; font-size:10px;'>F</span>50%</div>" +
            "</div>" +
          "</div>" +
          "<div class='type-pie-card type-pie-fraud'>" +
            "<div class='type-pie-label'>Fraudulent Firm</div>" +
            "<div class='type-pie' style='background:conic-gradient(#22c55e 0deg 144deg, #ef4444 144deg 360deg);'></div>" +
            "<div class='type-pie-legend'>" +
              "<div class='type-pie-legend-item'><span class='doc-icon doc-icon-normal' style='width:18px; height:22px; font-size:10px;'>N</span>40%</div>" +
              "<div class='type-pie-legend-item'><span class='doc-icon doc-icon-flagged' style='width:18px; height:22px; font-size:10px;'>F</span><strong>60%</strong></div>" +
            "</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:17px; margin-top:8px;'>" +
          "<strong>Clean</strong> firms have about half Normal and half Flagged. " +
          "<strong>Fraudulent</strong> firms tilt toward <strong>Flagged</strong> -- about 60%." +
        "</p>",
      minTimeSeconds: 8
    },

    // -- Page 9: Firm Sizes --
    {
      id: "p1_inst_sizes",
      type: "instructions",
      title: "Firm Sizes",
      body:
        "<div class='firm-size-row size-diff'>" +
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
            "<div class='firm-size-subtext'>transactions</div>" +
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
            "<div class='firm-size-subtext'>transactions</div>" +
          "</div>" +
          "<div class='firm-size-card firm-size-card-large size-diff-large'>" +
            "<svg class='firm-icon-large' viewBox='0 0 110 180' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='10' width='90' height='170' fill='#cbd5e1' stroke='#475569' stroke-width='2'/>" +
              "<g fill='#64748b'>" +
                "<rect x='20' y='20' width='8' height='8'/><rect x='34' y='20' width='8' height='8'/><rect x='48' y='20' width='8' height='8'/><rect x='62' y='20' width='8' height='8'/><rect x='76' y='20' width='8' height='8'/>" +
                "<rect x='20' y='34' width='8' height='8'/><rect x='34' y='34' width='8' height='8'/><rect x='48' y='34' width='8' height='8'/><rect x='62' y='34' width='8' height='8'/><rect x='76' y='34' width='8' height='8'/>" +
                "<rect x='20' y='48' width='8' height='8'/><rect x='34' y='48' width='8' height='8'/><rect x='48' y='48' width='8' height='8'/><rect x='62' y='48' width='8' height='8'/><rect x='76' y='48' width='8' height='8'/>" +
                "<rect x='20' y='62' width='8' height='8'/><rect x='34' y='62' width='8' height='8'/><rect x='48' y='62' width='8' height='8'/><rect x='62' y='62' width='8' height='8'/><rect x='76' y='62' width='8' height='8'/>" +
                "<rect x='20' y='76' width='8' height='8'/><rect x='34' y='76' width='8' height='8'/><rect x='48' y='76' width='8' height='8'/><rect x='62' y='76' width='8' height='8'/><rect x='76' y='76' width='8' height='8'/>" +
                "<rect x='20' y='90' width='8' height='8'/><rect x='34' y='90' width='8' height='8'/><rect x='48' y='90' width='8' height='8'/><rect x='62' y='90' width='8' height='8'/><rect x='76' y='90' width='8' height='8'/>" +
                "<rect x='20' y='104' width='8' height='8'/><rect x='34' y='104' width='8' height='8'/><rect x='48' y='104' width='8' height='8'/><rect x='62' y='104' width='8' height='8'/><rect x='76' y='104' width='8' height='8'/>" +
                "<rect x='20' y='118' width='8' height='8'/><rect x='34' y='118' width='8' height='8'/><rect x='48' y='118' width='8' height='8'/><rect x='62' y='118' width='8' height='8'/><rect x='76' y='118' width='8' height='8'/>" +
                "<rect x='20' y='132' width='8' height='8'/><rect x='34' y='132' width='8' height='8'/><rect x='48' y='132' width='8' height='8'/><rect x='62' y='132' width='8' height='8'/><rect x='76' y='132' width='8' height='8'/>" +
              "</g>" +
            "</svg>" +
            "<div class='firm-size-number'>50</div>" +
            "<div class='firm-size-subtext'>transactions</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:17px; margin-top:8px;'>" +
          "Firms come in three sizes. Larger firms process more transactions." +
        "</p>" +
        "<div class='size-constant-note'>" +
          "<div class='size-constant-badge'>4</div>" +
          "<div class='size-constant-text'>" +
            "<strong>Regardless of firm size</strong>, the manager " +
            "discloses only <strong>4 transactions</strong> to you." +
          "</div>" +
        "</div>",
      minTimeSeconds: 8
    },

    // -- Page 10: The Manager --
    {
      id: "p1_inst_manager",
      type: "instructions",
      title: "The Manager",
      body:
        "<div class='manager-flow-diagram'>" +
          "<div class='mfd-col'>" +
            "<div class='mfd-col-label'>Firm has</div>" +
            "<div class='mfd-stack'>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
            "</div>" +
            "<div class='mfd-col-sub'>all transactions</div>" +
          "</div>" +
          "<div class='mfd-arrow'>" +
            "<svg viewBox='0 0 100 80' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<circle cx='50' cy='28' r='12' fill='#475569'/>" +
              "<path d='M30 62 Q50 44 70 62 L70 74 L30 74 Z' fill='#475569'/>" +
              "<line x1='14' y1='42' x2='86' y2='42' stroke='#94a3b8' stroke-width='2' stroke-dasharray='4,3'/>" +
            "</svg>" +
            "<div class='mfd-arrow-label'>Manager picks</div>" +
          "</div>" +
          "<div class='mfd-col'>" +
            "<div class='mfd-col-label'>You see</div>" +
            "<div class='mfd-reveal'>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
              "<span class='transaction-doc small hidden'>?</span>" +
            "</div>" +
            "<div class='mfd-col-sub'>only 4</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center;'>The manager chooses which <strong>4 transactions</strong> " +
          "to reveal. The manager cannot change or fabricate any transaction.</p>",
      minTimeSeconds: 8
    },

    // -- Page 10b: Manager Incentives --
    {
      id: "p1_inst_incentives",
      type: "instructions",
      title: "Manager Incentives",
      body:
        "<p style='text-align:center; font-size:18px; margin-bottom:20px;'>" +
          "How well the manager does depends on <strong>your rating</strong>:" +
        "</p>" +
        "<div class='incentive-examples'>" +
          "<div class='incentive-example incentive-good'>" +
            "<div class='incentive-manager-avatar incentive-manager-happy'>" +
              "<svg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
                "<circle cx='30' cy='30' r='28' fill='#d1fae5' stroke='#059669' stroke-width='2'/>" +
                "<circle cx='22' cy='26' r='2.5' fill='#059669'/>" +
                "<circle cx='38' cy='26' r='2.5' fill='#059669'/>" +
                "<path d='M20 38 Q30 46 40 38' stroke='#059669' stroke-width='2.5' fill='none' stroke-linecap='round'/>" +
              "</svg>" +
            "</div>" +
            "<div class='incentive-rating-gauge'>" +
              "<div class='incentive-rating-label'>Your rating</div>" +
              "<div class='incentive-rating-value' style='color:#059669;'>15%</div>" +
              "<div class='incentive-rating-bar'>" +
                "<div class='incentive-rating-fill' style='width:15%; background:#10b981;'></div>" +
              "</div>" +
            "</div>" +
            "<div class='incentive-outcome incentive-outcome-good'>" +
              "<span class='incentive-outcome-icon'>&#128176;</span>" +
              "<div><strong>Bonus earned</strong></div>" +
            "</div>" +
          "</div>" +
          "<div class='incentive-example incentive-bad'>" +
            "<div class='incentive-manager-avatar incentive-manager-sad'>" +
              "<svg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
                "<circle cx='30' cy='30' r='28' fill='#fee2e2' stroke='#dc2626' stroke-width='2'/>" +
                "<circle cx='22' cy='26' r='2.5' fill='#dc2626'/>" +
                "<circle cx='38' cy='26' r='2.5' fill='#dc2626'/>" +
                "<path d='M20 44 Q30 36 40 44' stroke='#dc2626' stroke-width='2.5' fill='none' stroke-linecap='round'/>" +
              "</svg>" +
            "</div>" +
            "<div class='incentive-rating-gauge'>" +
              "<div class='incentive-rating-label'>Your rating</div>" +
              "<div class='incentive-rating-value' style='color:#dc2626;'>75%</div>" +
              "<div class='incentive-rating-bar'>" +
                "<div class='incentive-rating-fill' style='width:75%; background:#ef4444;'></div>" +
              "</div>" +
            "</div>" +
            "<div class='incentive-outcome incentive-outcome-bad'>" +
              "<span class='incentive-outcome-icon'>&#128178;</span>" +
              "<div><strong>Fined</strong></div>" +
            "</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:16px; margin-top:20px; color:#475569;'>" +
          "Managers prefer <strong>low</strong> fraud ratings from auditors." +
        "</p>",
      minTimeSeconds: 8
    },

    // -- Page 11: Your Job + Try the Slider --
    {
      id: "p1_slider_demo",
      type: "slider_demo",
      title: "Your Job",
      body:
        "<p style='text-align:center; font-size:18px; margin-bottom:8px;'>" +
          "For each firm, you will see <strong>4 transactions</strong> " +
          "and assign a <strong>probability</strong> that the firm is fraudulent." +
        "</p>" +
        "<p style='text-align:center; font-size:16px; color:#475569; margin-bottom:4px;'>" +
          "Try the slider below to continue." +
        "</p>",
      hint: "The slider moves in 10% increments.",
      minTimeSeconds: 4
    },

    // -- Page 12: Example (1 of 3) --
    {
      id: "p1_example_1",
      type: "instructions",
      title: "Example",
      body:
        "<p class='example-subtitle'>A medium firm has 10 transactions.</p>" +
        "<div class='example-grid'>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
        "</div>" +
        "<p style='text-align:center; margin-top:8px;'>This firm has <strong>10 transactions</strong> in total.</p>",
      minTimeSeconds: 4
    },

    // -- Page 12: Example (2 of 3) --
    {
      id: "p1_example_2",
      type: "instructions",
      title: "Example (2 of 3)",
      body:
        "<p class='example-subtitle'>The manager shows you only 4.</p>" +
        "<div class='example-grid'>" +
          "<div class='transaction-doc small normal'>N</div>" +
          "<div class='transaction-doc small flagged'>F</div>" +
          "<div class='transaction-doc small normal'>N</div>" +
          "<div class='transaction-doc small flagged'>F</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div>" +
        "</div>" +
        "<p style='text-align:center; margin-top:8px;'>You see <strong>4 transactions</strong>: 2 Normal, 2 Flagged. The other 6 are <strong>hidden</strong>.</p>",
      minTimeSeconds: 5
    },

    // -- Page 13: Example (3 of 3) --
    {
      id: "p1_example_3",
      type: "instructions",
      title: "Example (3 of 3)",
      body:
        "<p class='example-subtitle'>The firm's actual transactions were these.</p>" +
        "<div class='example-grid'>" +
          "<div class='transaction-doc small normal'>N</div>" +
          "<div class='transaction-doc small flagged'>F</div>" +
          "<div class='transaction-doc small normal'>N</div>" +
          "<div class='transaction-doc small flagged'>F</div>" +
          "<div class='transaction-doc small flagged reveal'>F</div>" +
          "<div class='transaction-doc small flagged reveal'>F</div>" +
          "<div class='transaction-doc small flagged reveal'>F</div>" +
          "<div class='transaction-doc small flagged reveal'>F</div>" +
          "<div class='transaction-doc small flagged reveal'>F</div>" +
          "<div class='transaction-doc small flagged reveal'>F</div>" +
        "</div>" +
        "<p style='text-align:center; margin-top:8px; color:#475569;'>" +
          "You only saw 4 of them. The other 6 remained hidden." +
        "</p>",
      minTimeSeconds: 5
    },

    // -- Page 14: Quiz --
    {
      id: "p1_comprehension",
      type: "comprehension",
      title: "Quiz",
      description: "<p>Answer all questions correctly to proceed to Part 2.</p>",
      questions: [
        {
          prompt: "For each firm, who decides which transactions you will see?",
          type: "radio",
          correct: "manager",
          options: [
            { value: "manager",  label: "The firm's manager" },
            { value: "you",      label: "You, the auditor" },
            { value: "random",   label: "A random selection" },
            { value: "nobody",   label: "No one -- you see every transaction" }
          ]
        },
        {
          prompt: "The manager is more likely to earn a bonus when the auditor assigns a:",
          type: "radio",
          correct: "low",
          options: [
            { value: "low",        label: "Low fraud probability" },
            { value: "high",       label: "High fraud probability" },
            { value: "mid",        label: "A fraud probability close to 50%" },
            { value: "no_effect",  label: "The rating does not affect the manager" }
          ]
        },
        {
          prompt: "Out of every 100 firms you audit, about how many are fraudulent?",
          type: "radio",
          correct: "20",
          options: [
            { value: "20", label: "About 20 out of 100 (20%)" },
            { value: "40", label: "About 40 out of 100 (40%)" },
            { value: "50", label: "About 50 out of 100 (50%)" },
            { value: "80", label: "About 80 out of 100 (80%)" }
          ]
        },
        {
          prompt: "A clean firm has exactly 50% Normal and 50% Flagged transactions. A fraudulent firm has 40% Normal and 60% Flagged. Which of the following is true?",
          type: "radio",
          correct: "both",
          options: [
            { value: "both",  label: "Both types of firm can have Flagged transactions" },
            { value: "only_fraud",  label: "Only fraudulent firms have Flagged transactions" },
            { value: "only_clean",  label: "Only clean firms have Normal transactions" },
            { value: "neither",  label: "Neither type has Flagged transactions" }
          ]
        }
      ],
      minTimeSeconds: 15,
      maxAttempts: 1,
      failMessage: "You did not answer all questions correctly. " +
                   "You will still be paid &pound;1.00 for this part. Thank you for your time."
    },

    // -- Page 15: Completion --
    {
      id: "p1_comprehension_result",
      type: "completion",
      title: "You Passed!",
      body: "<p>You understand the task.</p>" +
            "<p><strong>Part 2</strong> is a separate Prolific study (~10 min, " +
            "&pound;1.50 base + up to &pound;1.00 accuracy bonus).</p>"
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
            "<p>Pay: <strong>&pound;1.50</strong> base + up to <strong>&pound;1.00</strong> accuracy bonus.</p>",
      buttonText: "Continue"
    },

    // -- Quick reminder --
    {
      id: "p2_reminder",
      type: "instructions",
      title: "Quick Reminder",
      body:
        "<p>Firms have transactions classified as " +
        "<span class='doc-icon doc-icon-normal' style='display:inline-flex; width:20px; height:24px; font-size:11px; vertical-align:middle;'>N</span> " +
        "<span style='color:#15803d; font-weight:600;'>Normal</span> or " +
        "<span class='doc-icon doc-icon-flagged' style='display:inline-flex; width:20px; height:24px; font-size:11px; vertical-align:middle;'>F</span> " +
        "<span style='color:#b91c1c; font-weight:600;'>Flagged</span>. " +
        "A manager picks which ones to show you. The manager earns more when you rate fraud lower.</p>" +

        "<div style='display:flex; align-items:center; gap:16px; justify-content:center; margin:16px 0;'>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:12px; margin-bottom:6px; color:#1e293b;'>How Common Is Fraud?</div>" +
            "<div style='width:80px; height:80px; border-radius:50%; background:conic-gradient(#14b8a6 0deg 288deg, #7c3aed 288deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1); margin:0 auto;'></div>" +
            "<div style='display:flex; flex-direction:column; gap:3px; text-align:left; font-size:12px; margin-top:6px;'>" +
              "<div style='display:flex; align-items:center; gap:5px;'><span style='display:inline-block; width:10px; height:10px; background:#14b8a6; border-radius:2px;'></span><strong>80% Clean</strong></div>" +
              "<div style='display:flex; align-items:center; gap:5px;'><span style='display:inline-block; width:10px; height:10px; background:#7c3aed; border-radius:2px;'></span>20% Fraudulent</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:12px; margin-bottom:6px; color:#14b8a6; border:2px solid #14b8a6; padding:2px 8px; border-radius:6px; display:inline-block;'>Clean Firm</div>" +
            "<div style='display:flex; align-items:center; gap:10px;'>" +
              "<div style='width:80px; height:80px; border-radius:50%; background:conic-gradient(#22c55e 0deg 180deg, #ef4444 180deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:3px; text-align:left; font-size:12px;'>" +
                "<div style='display:flex; align-items:center; gap:5px;'><span class='doc-icon doc-icon-normal' style='width:16px; height:18px; font-size:9px;'>N</span><strong>50%</strong></div>" +
                "<div style='display:flex; align-items:center; gap:5px;'><span class='doc-icon doc-icon-flagged' style='width:16px; height:18px; font-size:9px;'>F</span>50%</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div style='text-align:center;'>" +
            "<div style='font-weight:600; font-size:12px; margin-bottom:6px; color:#7c3aed; border:2px solid #7c3aed; padding:2px 8px; border-radius:6px; display:inline-block;'>Fraudulent Firm</div>" +
            "<div style='display:flex; align-items:center; gap:10px;'>" +
              "<div style='width:80px; height:80px; border-radius:50%; background:conic-gradient(#22c55e 0deg 144deg, #ef4444 144deg 360deg); box-shadow:0 2px 8px rgba(0,0,0,0.1);'></div>" +
              "<div style='display:flex; flex-direction:column; gap:3px; text-align:left; font-size:12px;'>" +
                "<div style='display:flex; align-items:center; gap:5px;'><span class='doc-icon doc-icon-normal' style='width:16px; height:18px; font-size:9px;'>N</span>40%</div>" +
                "<div style='display:flex; align-items:center; gap:5px;'><span class='doc-icon doc-icon-flagged' style='width:16px; height:18px; font-size:9px;'>F</span><strong>60%</strong></div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +

        "<p style='color:#64748b; font-size:14px;'>Firm sizes: <strong>Small</strong> (10), <strong>Medium</strong> (20), <strong>Large</strong> (50) transactions. Manager always shows 4.</p>",
      minTimeSeconds: 8
    },

    // -- BLOCK 1: 9 trials --
    {
      id: "block1",
      type: "trial_block",
      block: 1,
      randomize: true,
      trialCount: 9,
      askFlaggedEstimate: false,
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
            "<p>We varied two things across trials: firm size (Small, Medium, or Large) " +
            "and the composition of the 4 disclosed transactions.</p>" +
            "<p>We are interested in how people account for the transactions they <em>cannot</em> see, " +
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
      body: "<p>Help us study how people detect fraudulent firms. " +
            "This takes about <strong>15 minutes</strong>.</p>" +
            "<p>Pay: <strong>&pound;2.50</strong> base + up to <strong>&pound;1.00</strong> accuracy bonus.</p>" +
            "<p>Please use a <strong>desktop or laptop</strong> for the best experience.</p>",
      buttonText: "Begin"
    },

    // -- Consent --
    {
      id: "consent",
      type: "consent",
      title: "Consent",
      body: "<p>You are being invited to participate in a research study about decision-making.</p>" +
            "<p><strong>What you will do:</strong> Learn a fraud assessment task, pass a quiz, " +
            "then evaluate 9 firms.</p>" +
            "<p><strong>Time:</strong> ~15 minutes.</p>" +
            "<p><strong>Pay:</strong> &pound;2.50 base + up to &pound;1.00 accuracy bonus.</p>" +
            "<p><strong>Risks:</strong> None beyond everyday life.</p>" +
            "<p><strong>Confidentiality:</strong> Anonymous. Prolific ID collected only for payment.</p>" +
            "<p><strong>Voluntary:</strong> Withdraw at any time by closing this window.</p>",
      mustAgree: true,
      declineMessage: "You must agree to participate in order to continue.",
      minTimeSeconds: 15
    },

    // -- Your Mission --
    {
      id: "inst_mission",
      type: "instructions",
      title: "Your Mission",
      body:
        "<div class='mission-badge'>" +
          "<svg viewBox='0 0 100 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
            "<defs>" +
              "<linearGradient id='shieldGrad2' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                "<stop offset='0%' stop-color='#0ea5a0'/>" +
                "<stop offset='100%' stop-color='#0f766e'/>" +
              "</linearGradient>" +
            "</defs>" +
            "<path d='M50 5 L90 20 V55 C90 82 72 105 50 115 C28 105 10 82 10 55 V20 Z' " +
                  "fill='url(#shieldGrad2)' stroke='#0f766e' stroke-width='2'/>" +
            "<path d='M32 58 L45 72 L70 42' stroke='#ffffff' stroke-width='7' " +
                  "stroke-linecap='round' stroke-linejoin='round' fill='none'/>" +
          "</svg>" +
          "<div class='mission-badge-label'>AUDITOR</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:19px; max-width:560px; margin:0 auto;'>" +
          "You are a <strong>government auditor</strong>. Your job is to detect " +
          "<strong>fraudulent firms</strong>. For each firm you investigate, you will estimate " +
          "the probability that it is fraudulent." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Try the Slider --
    {
      id: "slider_demo",
      type: "slider_demo",
      title: "Try the Slider",
      body: "<p>Here is how you will report your fraud estimate. " +
            "Drag the slider to any value to continue.</p>",
      hint: "The slider moves in 10% increments.",
      minTimeSeconds: 4
    },

    // -- Firms: Clean or Fraudulent --
    {
      id: "inst_firms",
      type: "instructions",
      title: "Firms: Clean or Fraudulent",
      body:
        "<div class='firm-prior-visual'>" +
          "<div class='firm-prior-pie'></div>" +
          "<div class='firm-prior-legend'>" +
            "<div class='firm-prior-legend-item'>" +
              "<span class='firm-prior-swatch' style='background:#14b8a6;'></span>" +
              "<span><strong>80%</strong> Clean</span>" +
            "</div>" +
            "<div class='firm-prior-legend-item'>" +
              "<span class='firm-prior-swatch' style='background:#7c3aed;'></span>" +
              "<span><strong>20%</strong> Fraudulent</span>" +
            "</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:18px; margin-top:8px;'>" +
          "Most firms are <strong>clean</strong>. About <strong>1 in 5</strong> is fraudulent." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Two Types of Transactions --
    {
      id: "inst_two_types",
      type: "instructions",
      title: "Two Types of Transactions",
      body:
        "<div class='two-types-row'>" +
          "<div class='transaction-doc-wrap'>" +
            "<div class='transaction-doc large normal'>N</div>" +
            "<div class='transaction-doc-caption' style='color:#15803d;'>Normal</div>" +
          "</div>" +
          "<div class='transaction-doc-wrap'>" +
            "<div class='transaction-doc large flagged'>F</div>" +
            "<div class='transaction-doc-caption' style='color:#b91c1c;'>Flagged</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:18px; margin-top:8px;'>" +
          "Every transaction is classified as either <strong>Normal</strong> or <strong>Flagged</strong>." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Firms Look Different --
    {
      id: "inst_mix_differs",
      type: "instructions",
      title: "Firms Look Different",
      body:
        "<div class='type-pie-row'>" +
          "<div class='type-pie-card type-pie-clean'>" +
            "<div class='type-pie-label'>Clean Firm</div>" +
            "<div class='type-pie' style='background:conic-gradient(#22c55e 0deg 180deg, #ef4444 180deg 360deg);'></div>" +
            "<div class='type-pie-legend'>" +
              "<div class='type-pie-legend-item'><span class='doc-icon doc-icon-normal' style='width:18px; height:22px; font-size:10px;'>N</span><strong>50%</strong></div>" +
              "<div class='type-pie-legend-item'><span class='doc-icon doc-icon-flagged' style='width:18px; height:22px; font-size:10px;'>F</span>50%</div>" +
            "</div>" +
          "</div>" +
          "<div class='type-pie-card type-pie-fraud'>" +
            "<div class='type-pie-label'>Fraudulent Firm</div>" +
            "<div class='type-pie' style='background:conic-gradient(#22c55e 0deg 144deg, #ef4444 144deg 360deg);'></div>" +
            "<div class='type-pie-legend'>" +
              "<div class='type-pie-legend-item'><span class='doc-icon doc-icon-normal' style='width:18px; height:22px; font-size:10px;'>N</span>40%</div>" +
              "<div class='type-pie-legend-item'><span class='doc-icon doc-icon-flagged' style='width:18px; height:22px; font-size:10px;'>F</span><strong>60%</strong></div>" +
            "</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:17px; margin-top:8px;'>" +
          "<strong>Clean</strong> firms have about half Normal and half Flagged. " +
          "<strong>Fraudulent</strong> firms tilt toward <strong>Flagged</strong> -- about 60%." +
        "</p>",
      minTimeSeconds: 8
    },

    // -- Firm Sizes --
    {
      id: "inst_sizes",
      type: "instructions",
      title: "Firm Sizes",
      body:
        "<div class='firm-size-row size-diff'>" +
          "<div class='firm-size-card firm-size-card-small size-diff-small'>" +
            "<svg class='firm-icon-small' viewBox='0 0 60 80' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='40' width='40' height='40' fill='#cbd5e1' stroke='#475569' stroke-width='2'/>" +
            "</svg>" +
            "<div class='firm-size-number'>10</div>" +
            "<div class='firm-size-subtext'>transactions</div>" +
          "</div>" +
          "<div class='firm-size-card firm-size-card-medium size-diff-medium'>" +
            "<svg class='firm-icon-medium' viewBox='0 0 80 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='30' width='60' height='90' fill='#cbd5e1' stroke='#475569' stroke-width='2'/>" +
            "</svg>" +
            "<div class='firm-size-number'>20</div>" +
            "<div class='firm-size-subtext'>transactions</div>" +
          "</div>" +
          "<div class='firm-size-card firm-size-card-large size-diff-large'>" +
            "<svg class='firm-icon-large' viewBox='0 0 110 180' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>" +
              "<rect x='10' y='10' width='90' height='170' fill='#cbd5e1' stroke='#475569' stroke-width='2'/>" +
            "</svg>" +
            "<div class='firm-size-number'>50</div>" +
            "<div class='firm-size-subtext'>transactions</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:17px; margin-top:8px;'>" +
          "Firms come in three sizes. The manager always shows you <strong>4 transactions</strong>." +
        "</p>",
      minTimeSeconds: 8
    },

    // -- The Manager --
    {
      id: "inst_manager",
      type: "instructions",
      title: "The Manager",
      body:
        "<div class='manager-visual'>" +
          "<div class='manager-figure'>&#128188;</div>" +
          "<div class='manager-transactions'>" +
            "<span class='transaction-doc small normal manager-show'>N</span>" +
            "<span class='transaction-doc small flagged manager-hide'>F</span>" +
            "<span class='transaction-doc small normal manager-show'>N</span>" +
            "<span class='transaction-doc small flagged manager-hide'>F</span>" +
            "<span class='transaction-doc small normal manager-show'>N</span>" +
            "<span class='transaction-doc small flagged manager-hide'>F</span>" +
          "</div>" +
        "</div>" +
        "<p>The manager sees <em>all</em> of the firm's transactions but only shows you " +
          "<strong>4</strong>. The manager cannot fabricate transactions -- only choose which to reveal.</p>" +
        "<p>The manager prefers <strong>lower</strong> fraud ratings. A low rating from you means " +
          "the manager is unlikely to be fined and more likely to earn a bonus.</p>" +
        "<div class='incentive-cards incentive-cards-compact'>" +
          "<div class='incentive-card incentive-card-good'>" +
            "<div class='incentive-card-icon'>&#9989;</div>" +
            "<div><strong>Your rating: LOW</strong></div>" +
            "<div>Manager earns a bonus</div>" +
          "</div>" +
          "<div class='incentive-card incentive-card-bad'>" +
            "<div class='incentive-card-icon'>&#10060;</div>" +
            "<div><strong>Your rating: HIGH</strong></div>" +
            "<div>Manager gets fined</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 10
    },

    // -- Example (1 of 3) --
    {
      id: "example_1",
      type: "instructions",
      title: "Example",
      body:
        "<p class='example-subtitle'>A medium firm has 10 transactions.</p>" +
        "<div class='example-grid'>" +
          "<div class='transaction-doc small hidden'>?</div><div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div><div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div><div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div><div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div><div class='transaction-doc small hidden'>?</div>" +
        "</div>" +
        "<p style='text-align:center; margin-top:8px;'>This firm has <strong>10 transactions</strong> in total.</p>",
      minTimeSeconds: 4
    },

    // -- Example (2 of 3) --
    {
      id: "example_2",
      type: "instructions",
      title: "Example (2 of 3)",
      body:
        "<p class='example-subtitle'>The manager shows you only 4.</p>" +
        "<div class='example-grid'>" +
          "<div class='transaction-doc small normal'>N</div><div class='transaction-doc small flagged'>F</div>" +
          "<div class='transaction-doc small normal'>N</div><div class='transaction-doc small flagged'>F</div>" +
          "<div class='transaction-doc small hidden'>?</div><div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div><div class='transaction-doc small hidden'>?</div>" +
          "<div class='transaction-doc small hidden'>?</div><div class='transaction-doc small hidden'>?</div>" +
        "</div>" +
        "<p style='text-align:center; margin-top:8px;'>You see <strong>4 transactions</strong>: 2 Normal, 2 Flagged. The other 6 are <strong>hidden</strong>.</p>",
      minTimeSeconds: 5
    },

    // -- Example (3 of 3) --
    {
      id: "example_3",
      type: "instructions",
      title: "Example (3 of 3)",
      body:
        "<p class='example-subtitle'>In this example, all 6 hidden transactions were Flagged.</p>" +
        "<div class='example-grid'>" +
          "<div class='transaction-doc small normal'>N</div><div class='transaction-doc small flagged'>F</div>" +
          "<div class='transaction-doc small normal'>N</div><div class='transaction-doc small flagged'>F</div>" +
          "<div class='transaction-doc small flagged reveal'>F</div><div class='transaction-doc small flagged reveal'>F</div>" +
          "<div class='transaction-doc small flagged reveal'>F</div><div class='transaction-doc small flagged reveal'>F</div>" +
          "<div class='transaction-doc small flagged reveal'>F</div><div class='transaction-doc small flagged reveal'>F</div>" +
        "</div>" +
        "<p style='margin-top:8px;'><strong>Why it matters</strong>: The manager chose to hide transactions " +
          "that looked bad. A firm that shows only 2 Flagged out of 4 may actually have many more hidden.</p>",
      minTimeSeconds: 8
    },

    // -- Comprehension Quiz --
    {
      id: "comprehension",
      type: "comprehension",
      title: "Quiz",
      description: "<p>Answer all questions correctly to continue.</p>",
      questions: [
        {
          prompt: "For each firm, who decides which transactions you will see?",
          type: "radio",
          correct: "manager",
          options: [
            { value: "manager",  label: "The firm's manager" },
            { value: "you",      label: "You, the auditor" },
            { value: "random",   label: "A random selection" },
            { value: "nobody",   label: "No one -- you see every transaction" }
          ]
        },
        {
          prompt: "The manager is more likely to earn a bonus when the auditor assigns a:",
          type: "radio",
          correct: "low",
          options: [
            { value: "low",        label: "Low fraud probability" },
            { value: "high",       label: "High fraud probability" },
            { value: "mid",        label: "A fraud probability close to 50%" },
            { value: "no_effect",  label: "The rating does not affect the manager" }
          ]
        },
        {
          prompt: "Out of every 100 firms you audit, about how many are fraudulent?",
          type: "radio",
          correct: "20",
          options: [
            { value: "20", label: "About 20 out of 100 (20%)" },
            { value: "40", label: "About 40 out of 100 (40%)" },
            { value: "50", label: "About 50 out of 100 (50%)" },
            { value: "80", label: "About 80 out of 100 (80%)" }
          ]
        },
        {
          prompt: "A clean firm has exactly 50% Normal and 50% Flagged transactions. A fraudulent firm has 40% Normal and 60% Flagged. Which of the following is true?",
          type: "radio",
          correct: "both",
          options: [
            { value: "both",  label: "Both types of firm can have Flagged transactions" },
            { value: "only_fraud",  label: "Only fraudulent firms have Flagged transactions" },
            { value: "only_clean",  label: "Only clean firms have Normal transactions" },
            { value: "neither",  label: "Neither type has Flagged transactions" }
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
      askFlaggedEstimate: false,
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
            "<p>We varied firm size (Small, Medium, or Large) and the composition of the 4 disclosed transactions.</p>" +
            "<p>Thank you for contributing to this research.</p>",
      showBonus: true,
      completionCode: "COMP2SN"
    }
  ]

};

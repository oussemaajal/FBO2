/* ==========================================================================
   FBO 2 (Selection Neglect) -- Experiment Configuration v7.0

   V7 change vs v6: N is now STOCHASTIC within each size category. The
   participant only learns the size; the exact N is uniformly distributed
   over the size's range. This gives a Bayesian agent residual posterior
   uncertainty about theta (because theta_NV and theta_RB depend on N),
   matching the theoretical setup; SN-types remain unaffected because
   k/K does not depend on N. Calibration block removed.

   Structure (matches docs/survey_script.md):
     ACT I    -- Consent & Overview           (5 pages)
     ACT II   -- How to Read a Company        (13 pages, incl. attention
                                                 check after 50/50 anchor)
     ACT III  -- The Manager                  (10 pages)
     ACT IV   -- Stakes & Bonus               (11 pages, incl. interactive
                                                 try-it pages)
     ACT V    -- 13-question comprehension quiz
     ACT VI   -- 60 scored trials in 3 blocks:
                 Block 1: 12 companies (K=3,  3 sizes x k in {0..3})
                 Block 2: 16 companies (K=5,  3 sizes x k in {0..5})
                 Block 3: 32 companies (K=10, 3 sizes x k in {0..10})
                 [rule change between blocks: K=5 -> K=10]
     ACT VII  -- Demographics + debrief

   Sizes (uniform prior over N | size):
     small:  N in {10..15}
     medium: N in {16..25}
     large:  N in {26..50}

   Bonus rule (LOTTERY):
     base = $8.00, guaranteed.
     at the end of the survey, 3 of the 60 companies are picked at random.
     ONLY those 3 picked companies count toward the bonus:
       within 5 percentage points of truth :  +$1.00 answer + bet (win bet)
       outside                             :   $0.00         - bet (lose bet)
     bet in [$0, $1.00], default $0.  per picked-company range: [-$1.00, +$2.00].
     total bonus = sum over the 3 picked, floored at $0, capped at $6.00.
     base pay NEVER reduced by lost bets.
   ========================================================================== */

var SURVEY_CONFIG = {

  // -- Study Metadata -------------------------------------------------------
  study: {
    title: "Decision Making Study",
    version: "7.1.0",
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
  // V6: LOTTERY scheme. At the end, lotteryCount trials are picked at random
  // (PID-seeded for reproducibility). Only those picked trials contribute
  // to the bonus -- per-trial: +answerCents if within accuracyThreshold,
  // plus/minus the participant's bet on that trial.
  bonus: {
    enabled: true,
    currency: "USD",
    fixedBase: 8.00,          // guaranteed base pay (untouched by penalties)
    answerCents: 100,         // +$1.00 per PICKED trial within threshold
    betMaxCents: 100,         // bet slider 0..$1.00 (per picked trial)
    accuracyThreshold: 0.05,  // "within 5 percentage points"
    maxBonus: 6.00,           // 3 picked × ($1 estimate + $1 bet) = $6.00
    floor: 0.00,              // total bonus floored at $0 (base untouched)
    selectionMethod: "lottery",
    lotteryCount: 3           // number of trials picked at random
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
  // V7 (60 trials, stochastic N within size category, 3 phases):
  //   sizes:
  //     small:  N in {10..15}   (uniform, mean 12.5)
  //     medium: N in {20..25}   (uniform, mean 22.5)
  //     large:  N in {45..50}   (uniform, mean 47.5)
  //   phase=1: K=3,  6 unique cells x 2 reps              [12 trials]
  //   phase=2: K=5,  8 unique cells x 2 reps              [16 trials]
  //   phase=3: K=10, 16 unique cells x 2 reps             [32 trials]
  //   Two rule changes between phases (K=3 -> 5 -> 10).
  //   Selection rule: top 20 cells by HM + top 10 by stdRB
  //   from remainder = 30 unique cells, each repeated 2x.
  //
  // Per-cell benchmarks are STRICT Bayesian expectations:
  //   posterior P(N | size, K, k) prop_to P(k | N, K) * P(N | size)
  //   under Binomial(N, 0.5) DGP and optimal manager strategy.
  // theta_SN does not depend on N (k/K), so theta_SN is unchanged.
  // theta_NV and theta_RB are integrals over the size's N-range.
  // stdNV / stdRB are sqrt(Var_N[theta_T(N) | size]) -- the residual
  // posterior std a Bayesian agent of type T faces on this cell. SN std = 0.
  //
  // thetaTrue = theta_RB (full unraveling at expectation) -- payment benchmark.
  stimuli: [
    // -- Phase 1: K=3, 12 trials (6 unique cells x 2 reps) --
    { id: "p1t01", phase: 1, size: "medium", K: 3, k: 1, nLo: 20, nHi: 25, nClean: 2, thetaTrue: 0.9047, thetaSN: 0.3333, thetaNV: 0.4762, thetaRB: 0.9047, stdNV: 0.0014, stdRB: 0.0054,
      D: 3, dN: 2, nFlagged: 1, bayesPosterior: 0.9047, snPosterior: 0.3333, mrPosterior: 0.4762 },
    { id: "p1t02", phase: 1, size: "large", K: 3, k: 2, nLo: 45, nHi: 50, nClean: 1, thetaTrue: 0.9782, thetaSN: 0.6667, thetaNV: 0.5109, thetaRB: 0.9782, stdNV: 0.0003, stdRB: 0.0006,
      D: 3, dN: 1, nFlagged: 2, bayesPosterior: 0.9782, snPosterior: 0.6667, mrPosterior: 0.5109 },
    { id: "p1t03", phase: 1, size: "small", K: 3, k: 1, nLo: 10, nHi: 15, nClean: 2, thetaTrue: 0.8190, thetaSN: 0.3333, thetaNV: 0.4547, thetaRB: 0.8190, stdNV: 0.0050, stdRB: 0.0199,
      D: 3, dN: 2, nFlagged: 1, bayesPosterior: 0.8190, snPosterior: 0.3333, mrPosterior: 0.4547 },
    { id: "p1t04", phase: 1, size: "large", K: 3, k: 1, nLo: 45, nHi: 50, nClean: 2, thetaTrue: 0.9565, thetaSN: 0.3333, thetaNV: 0.4891, thetaRB: 0.9565, stdNV: 0.0003, stdRB: 0.0011,
      D: 3, dN: 2, nFlagged: 1, bayesPosterior: 0.9565, snPosterior: 0.3333, mrPosterior: 0.4891 },
    { id: "p1t05", phase: 1, size: "medium", K: 3, k: 2, nLo: 20, nHi: 25, nClean: 1, thetaTrue: 0.9522, thetaSN: 0.6667, thetaNV: 0.5239, thetaRB: 0.9522, stdNV: 0.0013, stdRB: 0.0026,
      D: 3, dN: 1, nFlagged: 2, bayesPosterior: 0.9522, snPosterior: 0.6667, mrPosterior: 0.5239 },
    { id: "p1t06", phase: 1, size: "large", K: 3, k: 2, nLo: 45, nHi: 50, nClean: 1, thetaTrue: 0.9782, thetaSN: 0.6667, thetaNV: 0.5109, thetaRB: 0.9782, stdNV: 0.0003, stdRB: 0.0006,
      D: 3, dN: 1, nFlagged: 2, bayesPosterior: 0.9782, snPosterior: 0.6667, mrPosterior: 0.5109 },
    { id: "p1t07", phase: 1, size: "small", K: 3, k: 1, nLo: 10, nHi: 15, nClean: 2, thetaTrue: 0.8190, thetaSN: 0.3333, thetaNV: 0.4547, thetaRB: 0.8190, stdNV: 0.0050, stdRB: 0.0199,
      D: 3, dN: 2, nFlagged: 1, bayesPosterior: 0.8190, snPosterior: 0.3333, mrPosterior: 0.4547 },
    { id: "p1t08", phase: 1, size: "small", K: 3, k: 2, nLo: 10, nHi: 15, nClean: 1, thetaTrue: 0.9083, thetaSN: 0.6667, thetaNV: 0.5459, thetaRB: 0.9083, stdNV: 0.0047, stdRB: 0.0094,
      D: 3, dN: 1, nFlagged: 2, bayesPosterior: 0.9083, snPosterior: 0.6667, mrPosterior: 0.5459 },
    { id: "p1t09", phase: 1, size: "medium", K: 3, k: 1, nLo: 20, nHi: 25, nClean: 2, thetaTrue: 0.9047, thetaSN: 0.3333, thetaNV: 0.4762, thetaRB: 0.9047, stdNV: 0.0014, stdRB: 0.0054,
      D: 3, dN: 2, nFlagged: 1, bayesPosterior: 0.9047, snPosterior: 0.3333, mrPosterior: 0.4762 },
    { id: "p1t10", phase: 1, size: "large", K: 3, k: 1, nLo: 45, nHi: 50, nClean: 2, thetaTrue: 0.9565, thetaSN: 0.3333, thetaNV: 0.4891, thetaRB: 0.9565, stdNV: 0.0003, stdRB: 0.0011,
      D: 3, dN: 2, nFlagged: 1, bayesPosterior: 0.9565, snPosterior: 0.3333, mrPosterior: 0.4891 },
    { id: "p1t11", phase: 1, size: "small", K: 3, k: 2, nLo: 10, nHi: 15, nClean: 1, thetaTrue: 0.9083, thetaSN: 0.6667, thetaNV: 0.5459, thetaRB: 0.9083, stdNV: 0.0047, stdRB: 0.0094,
      D: 3, dN: 1, nFlagged: 2, bayesPosterior: 0.9083, snPosterior: 0.6667, mrPosterior: 0.5459 },
    { id: "p1t12", phase: 1, size: "medium", K: 3, k: 2, nLo: 20, nHi: 25, nClean: 1, thetaTrue: 0.9522, thetaSN: 0.6667, thetaNV: 0.5239, thetaRB: 0.9522, stdNV: 0.0013, stdRB: 0.0026,
      D: 3, dN: 1, nFlagged: 2, bayesPosterior: 0.9522, snPosterior: 0.6667, mrPosterior: 0.5239 },
    // -- Phase 2: K=5, 16 trials (8 unique cells x 2 reps) --
    { id: "p2t01", phase: 2, size: "large", K: 5, k: 2, nLo: 45, nHi: 50, nClean: 3, thetaTrue: 0.9347, thetaSN: 0.4000, thetaNV: 0.4891, thetaRB: 0.9347, stdNV: 0.0003, stdRB: 0.0017,
      D: 5, dN: 3, nFlagged: 2, bayesPosterior: 0.9347, snPosterior: 0.4000, mrPosterior: 0.4891 },
    { id: "p2t02", phase: 2, size: "medium", K: 5, k: 4, nLo: 20, nHi: 25, nClean: 1, thetaTrue: 0.9522, thetaSN: 0.8000, thetaNV: 0.5718, thetaRB: 0.9522, stdNV: 0.0039, stdRB: 0.0026,
      D: 5, dN: 1, nFlagged: 4, bayesPosterior: 0.9522, snPosterior: 0.8000, mrPosterior: 0.5718 },
    { id: "p2t03", phase: 2, size: "medium", K: 5, k: 1, nLo: 20, nHi: 25, nClean: 4, thetaTrue: 0.8109, thetaSN: 0.2000, thetaNV: 0.4291, thetaRB: 0.8109, stdNV: 0.0044, stdRB: 0.0116,
      D: 5, dN: 4, nFlagged: 1, bayesPosterior: 0.8109, snPosterior: 0.2000, mrPosterior: 0.4291 },
    { id: "p2t04", phase: 2, size: "small", K: 5, k: 2, nLo: 10, nHi: 15, nClean: 3, thetaTrue: 0.7328, thetaSN: 0.4000, thetaNV: 0.4555, thetaRB: 0.7328, stdNV: 0.0052, stdRB: 0.0313,
      D: 5, dN: 3, nFlagged: 2, bayesPosterior: 0.7328, snPosterior: 0.4000, mrPosterior: 0.4555 },
    { id: "p2t05", phase: 2, size: "medium", K: 5, k: 1, nLo: 20, nHi: 25, nClean: 4, thetaTrue: 0.8109, thetaSN: 0.2000, thetaNV: 0.4291, thetaRB: 0.8109, stdNV: 0.0044, stdRB: 0.0116,
      D: 5, dN: 4, nFlagged: 1, bayesPosterior: 0.8109, snPosterior: 0.2000, mrPosterior: 0.4291 },
    { id: "p2t06", phase: 2, size: "small", K: 5, k: 1, nLo: 10, nHi: 15, nClean: 4, thetaTrue: 0.6510, thetaSN: 0.2000, thetaNV: 0.3691, thetaRB: 0.6510, stdNV: 0.0163, stdRB: 0.0434,
      D: 5, dN: 4, nFlagged: 1, bayesPosterior: 0.6510, snPosterior: 0.2000, mrPosterior: 0.3691 },
    { id: "p2t07", phase: 2, size: "large", K: 5, k: 1, nLo: 45, nHi: 50, nClean: 4, thetaTrue: 0.9131, thetaSN: 0.2000, thetaNV: 0.4674, thetaRB: 0.9131, stdNV: 0.0009, stdRB: 0.0023,
      D: 5, dN: 4, nFlagged: 1, bayesPosterior: 0.9131, snPosterior: 0.2000, mrPosterior: 0.4674 },
    { id: "p2t08", phase: 2, size: "small", K: 5, k: 0, nLo: 10, nHi: 15, nClean: 5, thetaTrue: 0.3000, thetaSN: 0.0000, thetaNV: 0.3000, thetaRB: 0.3000, stdNV: 0.0274, stdRB: 0.0274,
      D: 5, dN: 5, nFlagged: 0, bayesPosterior: 0.3000, snPosterior: 0.0000, mrPosterior: 0.3000 },
    { id: "p2t09", phase: 2, size: "large", K: 5, k: 1, nLo: 45, nHi: 50, nClean: 4, thetaTrue: 0.9131, thetaSN: 0.2000, thetaNV: 0.4674, thetaRB: 0.9131, stdNV: 0.0009, stdRB: 0.0023,
      D: 5, dN: 4, nFlagged: 1, bayesPosterior: 0.9131, snPosterior: 0.2000, mrPosterior: 0.4674 },
    { id: "p2t10", phase: 2, size: "small", K: 5, k: 2, nLo: 10, nHi: 15, nClean: 3, thetaTrue: 0.7328, thetaSN: 0.4000, thetaNV: 0.4555, thetaRB: 0.7328, stdNV: 0.0052, stdRB: 0.0313,
      D: 5, dN: 3, nFlagged: 2, bayesPosterior: 0.7328, snPosterior: 0.4000, mrPosterior: 0.4555 },
    { id: "p2t11", phase: 2, size: "small", K: 5, k: 0, nLo: 10, nHi: 15, nClean: 5, thetaTrue: 0.3000, thetaSN: 0.0000, thetaNV: 0.3000, thetaRB: 0.3000, stdNV: 0.0274, stdRB: 0.0274,
      D: 5, dN: 5, nFlagged: 0, bayesPosterior: 0.3000, snPosterior: 0.0000, mrPosterior: 0.3000 },
    { id: "p2t12", phase: 2, size: "large", K: 5, k: 4, nLo: 45, nHi: 50, nClean: 1, thetaTrue: 0.9782, thetaSN: 0.8000, thetaNV: 0.5327, thetaRB: 0.9782, stdNV: 0.0008, stdRB: 0.0006,
      D: 5, dN: 1, nFlagged: 4, bayesPosterior: 0.9782, snPosterior: 0.8000, mrPosterior: 0.5327 },
    { id: "p2t13", phase: 2, size: "small", K: 5, k: 1, nLo: 10, nHi: 15, nClean: 4, thetaTrue: 0.6510, thetaSN: 0.2000, thetaNV: 0.3691, thetaRB: 0.6510, stdNV: 0.0163, stdRB: 0.0434,
      D: 5, dN: 4, nFlagged: 1, bayesPosterior: 0.6510, snPosterior: 0.2000, mrPosterior: 0.3691 },
    { id: "p2t14", phase: 2, size: "medium", K: 5, k: 4, nLo: 20, nHi: 25, nClean: 1, thetaTrue: 0.9522, thetaSN: 0.8000, thetaNV: 0.5718, thetaRB: 0.9522, stdNV: 0.0039, stdRB: 0.0026,
      D: 5, dN: 1, nFlagged: 4, bayesPosterior: 0.9522, snPosterior: 0.8000, mrPosterior: 0.5718 },
    { id: "p2t15", phase: 2, size: "large", K: 5, k: 2, nLo: 45, nHi: 50, nClean: 3, thetaTrue: 0.9347, thetaSN: 0.4000, thetaNV: 0.4891, thetaRB: 0.9347, stdNV: 0.0003, stdRB: 0.0017,
      D: 5, dN: 3, nFlagged: 2, bayesPosterior: 0.9347, snPosterior: 0.4000, mrPosterior: 0.4891 },
    { id: "p2t16", phase: 2, size: "large", K: 5, k: 4, nLo: 45, nHi: 50, nClean: 1, thetaTrue: 0.9782, thetaSN: 0.8000, thetaNV: 0.5327, thetaRB: 0.9782, stdNV: 0.0008, stdRB: 0.0006,
      D: 5, dN: 1, nFlagged: 4, bayesPosterior: 0.9782, snPosterior: 0.8000, mrPosterior: 0.5327 },
    // -- Phase 3: K=10, 32 trials (16 unique cells x 2 reps) --
    { id: "p3t01", phase: 3, size: "small", K: 10, k: 5, nLo: 10, nHi: 15, nClean: 5, thetaTrue: 0.5745, thetaSN: 0.5000, thetaNV: 0.5000, thetaRB: 0.5745, stdNV: 0.0000, stdRB: 0.0554,
      D: 10, dN: 5, nFlagged: 5, bayesPosterior: 0.5745, snPosterior: 0.5000, mrPosterior: 0.5000 },
    { id: "p3t02", phase: 3, size: "large", K: 10, k: 3, nLo: 45, nHi: 50, nClean: 7, thetaTrue: 0.8482, thetaSN: 0.3000, thetaNV: 0.4566, thetaRB: 0.8482, stdNV: 0.0012, stdRB: 0.0043,
      D: 10, dN: 7, nFlagged: 3, bayesPosterior: 0.8482, snPosterior: 0.3000, mrPosterior: 0.4566 },
    { id: "p3t03", phase: 3, size: "small", K: 10, k: 1, nLo: 10, nHi: 15, nClean: 9, thetaTrue: 0.3334, thetaSN: 0.1000, thetaNV: 0.2037, thetaRB: 0.3334, stdNV: 0.0319, stdRB: 0.0717,
      D: 10, dN: 9, nFlagged: 1, bayesPosterior: 0.3334, snPosterior: 0.1000, mrPosterior: 0.2037 },
    { id: "p3t04", phase: 3, size: "small", K: 10, k: 6, nLo: 10, nHi: 15, nClean: 4, thetaTrue: 0.6510, thetaSN: 0.6000, thetaNV: 0.5873, thetaRB: 0.6510, stdNV: 0.0108, stdRB: 0.0434,
      D: 10, dN: 4, nFlagged: 6, bayesPosterior: 0.6510, snPosterior: 0.6000, mrPosterior: 0.5873 },
    { id: "p3t05", phase: 3, size: "large", K: 10, k: 8, nLo: 45, nHi: 50, nClean: 2, thetaTrue: 0.9565, thetaSN: 0.8000, thetaNV: 0.5653, thetaRB: 0.9565, stdNV: 0.0017, stdRB: 0.0011,
      D: 10, dN: 2, nFlagged: 8, bayesPosterior: 0.9565, snPosterior: 0.8000, mrPosterior: 0.5653 },
    { id: "p3t06", phase: 3, size: "small", K: 10, k: 7, nLo: 10, nHi: 15, nClean: 3, thetaTrue: 0.7328, thetaSN: 0.7000, thetaNV: 0.6781, thetaRB: 0.7328, stdNV: 0.0209, stdRB: 0.0313,
      D: 10, dN: 3, nFlagged: 7, bayesPosterior: 0.7328, snPosterior: 0.7000, mrPosterior: 0.6781 },
    { id: "p3t07", phase: 3, size: "small", K: 10, k: 2, nLo: 10, nHi: 15, nClean: 8, thetaTrue: 0.3857, thetaSN: 0.2000, thetaNV: 0.2696, thetaRB: 0.3857, stdNV: 0.0284, stdRB: 0.0758,
      D: 10, dN: 8, nFlagged: 2, bayesPosterior: 0.3857, snPosterior: 0.2000, mrPosterior: 0.2696 },
    { id: "p3t08", phase: 3, size: "small", K: 10, k: 1, nLo: 10, nHi: 15, nClean: 9, thetaTrue: 0.3334, thetaSN: 0.1000, thetaNV: 0.2037, thetaRB: 0.3334, stdNV: 0.0319, stdRB: 0.0717,
      D: 10, dN: 9, nFlagged: 1, bayesPosterior: 0.3334, snPosterior: 0.1000, mrPosterior: 0.2037 },
    { id: "p3t09", phase: 3, size: "small", K: 10, k: 0, nLo: 10, nHi: 15, nClean: 10, thetaTrue: 0.1443, thetaSN: 0.0000, thetaNV: 0.1443, thetaRB: 0.1443, stdNV: 0.0290, stdRB: 0.0290,
      D: 10, dN: 10, nFlagged: 0, bayesPosterior: 0.1443, snPosterior: 0.0000, mrPosterior: 0.1443 },
    { id: "p3t10", phase: 3, size: "small", K: 10, k: 4, nLo: 10, nHi: 15, nClean: 6, thetaTrue: 0.5047, thetaSN: 0.4000, thetaNV: 0.4175, thetaRB: 0.5047, stdNV: 0.0110, stdRB: 0.0662,
      D: 10, dN: 6, nFlagged: 4, bayesPosterior: 0.5047, snPosterior: 0.4000, mrPosterior: 0.4175 },
    { id: "p3t11", phase: 3, size: "small", K: 10, k: 3, nLo: 10, nHi: 15, nClean: 7, thetaTrue: 0.4420, thetaSN: 0.3000, thetaNV: 0.3406, thetaRB: 0.4420, stdNV: 0.0210, stdRB: 0.0737,
      D: 10, dN: 7, nFlagged: 3, bayesPosterior: 0.4420, snPosterior: 0.3000, mrPosterior: 0.3406 },
    { id: "p3t12", phase: 3, size: "small", K: 10, k: 4, nLo: 10, nHi: 15, nClean: 6, thetaTrue: 0.5047, thetaSN: 0.4000, thetaNV: 0.4175, thetaRB: 0.5047, stdNV: 0.0110, stdRB: 0.0662,
      D: 10, dN: 6, nFlagged: 4, bayesPosterior: 0.5047, snPosterior: 0.4000, mrPosterior: 0.4175 },
    { id: "p3t13", phase: 3, size: "large", K: 10, k: 1, nLo: 45, nHi: 50, nClean: 9, thetaTrue: 0.8053, thetaSN: 0.1000, thetaNV: 0.4135, thetaRB: 0.8053, stdNV: 0.0026, stdRB: 0.0057,
      D: 10, dN: 9, nFlagged: 1, bayesPosterior: 0.8053, snPosterior: 0.1000, mrPosterior: 0.4135 },
    { id: "p3t14", phase: 3, size: "small", K: 10, k: 5, nLo: 10, nHi: 15, nClean: 5, thetaTrue: 0.5745, thetaSN: 0.5000, thetaNV: 0.5000, thetaRB: 0.5745, stdNV: 0.0000, stdRB: 0.0554,
      D: 10, dN: 5, nFlagged: 5, bayesPosterior: 0.5745, snPosterior: 0.5000, mrPosterior: 0.5000 },
    { id: "p3t15", phase: 3, size: "small", K: 10, k: 3, nLo: 10, nHi: 15, nClean: 7, thetaTrue: 0.4420, thetaSN: 0.3000, thetaNV: 0.3406, thetaRB: 0.4420, stdNV: 0.0210, stdRB: 0.0737,
      D: 10, dN: 7, nFlagged: 3, bayesPosterior: 0.4420, snPosterior: 0.3000, mrPosterior: 0.3406 },
    { id: "p3t16", phase: 3, size: "medium", K: 10, k: 2, nLo: 20, nHi: 25, nClean: 8, thetaTrue: 0.6308, thetaSN: 0.2000, thetaNV: 0.3615, thetaRB: 0.6308, stdNV: 0.0098, stdRB: 0.0261,
      D: 10, dN: 8, nFlagged: 2, bayesPosterior: 0.6308, snPosterior: 0.2000, mrPosterior: 0.3615 },
    { id: "p3t17", phase: 3, size: "small", K: 10, k: 7, nLo: 10, nHi: 15, nClean: 3, thetaTrue: 0.7328, thetaSN: 0.7000, thetaNV: 0.6781, thetaRB: 0.7328, stdNV: 0.0209, stdRB: 0.0313,
      D: 10, dN: 3, nFlagged: 7, bayesPosterior: 0.7328, snPosterior: 0.7000, mrPosterior: 0.6781 },
    { id: "p3t18", phase: 3, size: "large", K: 10, k: 7, nLo: 45, nHi: 50, nClean: 3, thetaTrue: 0.9347, thetaSN: 0.7000, thetaNV: 0.5435, thetaRB: 0.9347, stdNV: 0.0011, stdRB: 0.0017,
      D: 10, dN: 3, nFlagged: 7, bayesPosterior: 0.9347, snPosterior: 0.7000, mrPosterior: 0.5435 },
    { id: "p3t19", phase: 3, size: "medium", K: 10, k: 3, nLo: 20, nHi: 25, nClean: 7, thetaTrue: 0.6746, thetaSN: 0.3000, thetaNV: 0.4070, thetaRB: 0.6746, stdNV: 0.0064, stdRB: 0.0223,
      D: 10, dN: 7, nFlagged: 3, bayesPosterior: 0.6746, snPosterior: 0.3000, mrPosterior: 0.4070 },
    { id: "p3t20", phase: 3, size: "medium", K: 10, k: 2, nLo: 20, nHi: 25, nClean: 8, thetaTrue: 0.6308, thetaSN: 0.2000, thetaNV: 0.3615, thetaRB: 0.6308, stdNV: 0.0098, stdRB: 0.0261,
      D: 10, dN: 8, nFlagged: 2, bayesPosterior: 0.6308, snPosterior: 0.2000, mrPosterior: 0.3615 },
    { id: "p3t21", phase: 3, size: "medium", K: 10, k: 3, nLo: 20, nHi: 25, nClean: 7, thetaTrue: 0.6746, thetaSN: 0.3000, thetaNV: 0.4070, thetaRB: 0.6746, stdNV: 0.0064, stdRB: 0.0223,
      D: 10, dN: 7, nFlagged: 3, bayesPosterior: 0.6746, snPosterior: 0.3000, mrPosterior: 0.4070 },
    { id: "p3t22", phase: 3, size: "large", K: 10, k: 2, nLo: 45, nHi: 50, nClean: 8, thetaTrue: 0.8267, thetaSN: 0.2000, thetaNV: 0.4350, thetaRB: 0.8267, stdNV: 0.0019, stdRB: 0.0050,
      D: 10, dN: 8, nFlagged: 2, bayesPosterior: 0.8267, snPosterior: 0.2000, mrPosterior: 0.4350 },
    { id: "p3t23", phase: 3, size: "medium", K: 10, k: 1, nLo: 20, nHi: 25, nClean: 9, thetaTrue: 0.5880, thetaSN: 0.1000, thetaNV: 0.3169, thetaRB: 0.5880, stdNV: 0.0133, stdRB: 0.0299,
      D: 10, dN: 9, nFlagged: 1, bayesPosterior: 0.5880, snPosterior: 0.1000, mrPosterior: 0.3169 },
    { id: "p3t24", phase: 3, size: "small", K: 10, k: 0, nLo: 10, nHi: 15, nClean: 10, thetaTrue: 0.1443, thetaSN: 0.0000, thetaNV: 0.1443, thetaRB: 0.1443, stdNV: 0.0290, stdRB: 0.0290,
      D: 10, dN: 10, nFlagged: 0, bayesPosterior: 0.1443, snPosterior: 0.0000, mrPosterior: 0.1443 },
    { id: "p3t25", phase: 3, size: "small", K: 10, k: 6, nLo: 10, nHi: 15, nClean: 4, thetaTrue: 0.6510, thetaSN: 0.6000, thetaNV: 0.5873, thetaRB: 0.6510, stdNV: 0.0108, stdRB: 0.0434,
      D: 10, dN: 4, nFlagged: 6, bayesPosterior: 0.6510, snPosterior: 0.6000, mrPosterior: 0.5873 },
    { id: "p3t26", phase: 3, size: "small", K: 10, k: 2, nLo: 10, nHi: 15, nClean: 8, thetaTrue: 0.3857, thetaSN: 0.2000, thetaNV: 0.2696, thetaRB: 0.3857, stdNV: 0.0284, stdRB: 0.0758,
      D: 10, dN: 8, nFlagged: 2, bayesPosterior: 0.3857, snPosterior: 0.2000, mrPosterior: 0.2696 },
    { id: "p3t27", phase: 3, size: "large", K: 10, k: 1, nLo: 45, nHi: 50, nClean: 9, thetaTrue: 0.8053, thetaSN: 0.1000, thetaNV: 0.4135, thetaRB: 0.8053, stdNV: 0.0026, stdRB: 0.0057,
      D: 10, dN: 9, nFlagged: 1, bayesPosterior: 0.8053, snPosterior: 0.1000, mrPosterior: 0.4135 },
    { id: "p3t28", phase: 3, size: "large", K: 10, k: 7, nLo: 45, nHi: 50, nClean: 3, thetaTrue: 0.9347, thetaSN: 0.7000, thetaNV: 0.5435, thetaRB: 0.9347, stdNV: 0.0011, stdRB: 0.0017,
      D: 10, dN: 3, nFlagged: 7, bayesPosterior: 0.9347, snPosterior: 0.7000, mrPosterior: 0.5435 },
    { id: "p3t29", phase: 3, size: "large", K: 10, k: 2, nLo: 45, nHi: 50, nClean: 8, thetaTrue: 0.8267, thetaSN: 0.2000, thetaNV: 0.4350, thetaRB: 0.8267, stdNV: 0.0019, stdRB: 0.0050,
      D: 10, dN: 8, nFlagged: 2, bayesPosterior: 0.8267, snPosterior: 0.2000, mrPosterior: 0.4350 },
    { id: "p3t30", phase: 3, size: "large", K: 10, k: 3, nLo: 45, nHi: 50, nClean: 7, thetaTrue: 0.8482, thetaSN: 0.3000, thetaNV: 0.4566, thetaRB: 0.8482, stdNV: 0.0012, stdRB: 0.0043,
      D: 10, dN: 7, nFlagged: 3, bayesPosterior: 0.8482, snPosterior: 0.3000, mrPosterior: 0.4566 },
    { id: "p3t31", phase: 3, size: "large", K: 10, k: 8, nLo: 45, nHi: 50, nClean: 2, thetaTrue: 0.9565, thetaSN: 0.8000, thetaNV: 0.5653, thetaRB: 0.9565, stdNV: 0.0017, stdRB: 0.0011,
      D: 10, dN: 2, nFlagged: 8, bayesPosterior: 0.9565, snPosterior: 0.8000, mrPosterior: 0.5653 },
    { id: "p3t32", phase: 3, size: "medium", K: 10, k: 1, nLo: 20, nHi: 25, nClean: 9, thetaTrue: 0.5880, thetaSN: 0.1000, thetaNV: 0.3169, thetaRB: 0.5880, stdNV: 0.0133, stdRB: 0.0299,
      D: 10, dN: 9, nFlagged: 1, bayesPosterior: 0.5880, snPosterior: 0.1000, mrPosterior: 0.3169 },
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
        "auditing task, then go through 60 auditing rounds.</p>" +
        "<p style='text-align:justify;'><strong>Time.</strong> About 40 minutes.</p>" +
        "<p style='text-align:justify;'><strong>Pay.</strong> $8.00 base + up to $6.00 " +
        "performance bonus (3 rounds picked at random at the end count toward the bonus). " +
        "Base pay is <strong>guaranteed</strong>; no penalty can reduce it.</p>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
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

    // -- Page 17: Practice math #3 -- N=50 ------------------------------
    {
      id: "p2_inst_try_n50",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; max-width:620px; margin:0 auto 12px; font-weight:600;'>" +
          "A final example." +
        "</p>" +
        "<p style='text-align:justify; font-size:16px; max-width:620px; margin:0 auto 16px; line-height:1.6;'>" +
          "A company with <strong>50</strong> transactions, all shown." +
        "</p>" +
        "<div class='cards-grid-10'>" +
          // 40 S + 10 C across 5 rows of 10 (40/50 = 80%)
          // Row 1
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          // Row 2
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          // Row 3
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          // Row 4
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          // Row 5
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc clean rule-small'>C</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
          "<div class='transaction-doc suspicious rule-small'>S</div>" +
        "</div>" +
        "<div class='practice-buttons' data-correct='80' data-mode='directional' " +
             "data-explain='40 of 50 transactions are suspicious &rarr; 40 / 50 = 80%.'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
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

    // -- Page 19: Law requires exactly 3 (cluster + 3 highlighted) -----
    {
      id: "p3_inst_law_4",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; line-height:1.45; max-width:620px; margin:0 auto 18px;'>" +
          "Here&apos;s the catch: A company has many transactions, but the law requires it to send you, the auditor, only " +
          "<strong style='color:#b91c1c; font-size:44px; line-height:1; padding:0 4px;'>3</strong> <strong>transactions</strong> for the preliminary audit." +
        "</p>" +
        "<div class='doc-cluster'>" +
          // 20 positions, 3 highlighted (V7-K3 initial law)
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
          "<div class='cluster-doc' style='top:54%; left:50%;'></div>" +
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
          "<strong>3 transactions.</strong>" +
        "</p>" +
        "<div class='doc-cluster'>" +
          // 3 highlighted with C/S labels (V7-K3), the rest with ? marks
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
          "<div class='cluster-doc hidden-q' style='top:54%; left:50%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:64%; left:66%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:58%; left:82%;'>?</div>" +
          "<div class='cluster-doc hidden-q' style='top:74%; left:24%;'>?</div>" +
          "<div class='cluster-doc highlighted labeled suspicious' style='top:78%; left:44%;'>S</div>" +
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
        "<p style='text-align:center; font-size:22px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
          "When you audit a company, do you see <strong>all</strong> of its transactions?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='no' data-mode='retry' " +
             "data-explain='The law requires only 3 transactions per company.'>" +
          "<button type='button' class='practice-btn' data-val='yes'>Yes, all of them.</button>" +
          "<button type='button' class='practice-btn' data-val='no'>No, only 3.</button>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 14px; font-weight:700; line-height:1.5;'>" +
          "You grab one random transaction from a company. It's <strong>clean</strong>." +
        "</p>" +
        "<div class='random-single-slot' style='margin:10px auto 18px;'>" +
          "<div class='transaction-doc large clean'>C</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700; line-height:1.5;'>" +
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
          "In this study, however, the 3 transactions you see about a company are " +
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
          "The manager is responsible for sending you the 3 transactions for the preliminary audit." +
        "</p>",
      minTimeSeconds: 7
    },

    // -- Page 24: Manager knows all, picks 3 ---------------------------
    {
      id: "p3_inst_manager_knows_all",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; line-height:1.4; max-width:620px; margin:0 auto 18px;'>" +
          "Here&apos;s the catch: the manager <strong>knows the type of every transaction</strong> in the company, and " +
          "decides <strong style='color:#b91c1c;'>which 3</strong> are sent for the preliminary audit." +
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
            // V7: manager always sees 15 transactions by default
            // (9 C + 6 S, same proportion as before, more visible mass).
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
            "<div class='transaction-doc clean rule-small'>C</div>" +
            "<div class='transaction-doc suspicious rule-small'>S</div>" +
            "<div class='transaction-doc clean rule-small'>C</div>" +
            "<div class='transaction-doc suspicious rule-small'>S</div>" +
            "<div class='transaction-doc clean rule-small'>C</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 5
    },

    // -- Page 25: Split view -- manager picks 3, auditor sees 3 --------
    {
      id: "p3_inst_manager_picks",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:24px; line-height:1.35; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "The manager picks the <strong>3</strong> you see." +
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
              // V7: manager always sees 15 across all laws (9 C + 6 S).
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
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc suspicious rule-small'>S</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc suspicious rule-small'>S</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
            "</div>" +
            "<div class='split-caption'>Sees all 15</div>" +
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
              // All 3 Clean: the manager strategically picked the
              // cleanest-looking transactions. The auditor sees a
              // company that looks spotless even though there were
              // 4 suspicious transactions in the full set.
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
            "</div>" +
            "<div class='split-caption'>Sees 3 (manager's pick)</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 5
    },

    // -- Page 26a: Mandate split, screen A -- giant "3" + headline only --
    {
      id: "p3_inst_mandate_a",
      type: "instructions",
      title: "",
      body:
        "<div style='text-align:center; margin:14px 0 26px;'>" +
          "<div style='font-size:110px; font-weight:800; line-height:1; letter-spacing:-0.05em; color:var(--color-primary);'>3</div>" +
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
          "<div style='font-size:110px; font-weight:800; line-height:1; letter-spacing:-0.05em; color:var(--color-primary);'>3</div>" +
          "<div style='font-size:24px; font-weight:700; color:#0f172a; margin-top:6px;'>transactions disclosed</div>" +
          "<div style='font-size:14px; text-transform:uppercase; letter-spacing:1.2px; font-weight:700; color:var(--color-text-slate); margin-top:8px;'>required by law</div>" +
        "</div>" +
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "Two rules the manager <strong>cannot</strong> break:" +
        "</p>" +
        "<ol style='font-size:19px; max-width:620px; margin:0 auto 18px; line-height:1.6; padding-left:28px;'>" +
          "<li style='margin-bottom:10px;'>The manager sends <strong>exactly 3</strong> transactions. Not more, not fewer.</li>" +
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
          "<div style='font-size:110px; font-weight:800; line-height:1; letter-spacing:-0.05em; color:var(--color-primary);'>3</div>" +
          "<div style='font-size:24px; font-weight:700; color:#0f172a; margin-top:6px;'>transactions disclosed</div>" +
          "<div style='font-size:14px; text-transform:uppercase; letter-spacing:1.2px; font-weight:700; color:var(--color-text-slate); margin-top:8px;'>required by law</div>" +
        "</div>" +
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 14px; font-weight:700;'>" +
          "Two rules the manager <strong>cannot</strong> break:" +
        "</p>" +
        "<ol style='font-size:19px; max-width:620px; margin:0 auto 18px; line-height:1.6; padding-left:28px;'>" +
          "<li style='margin-bottom:10px;'>The manager sends <strong>exactly 3</strong> transactions. Not more, not fewer.</li>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700;'>" +
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
            "<span>You earn more when your estimates are <strong>accurate</strong>.</span>" +
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
              "<strong>within 5 percentage points</strong> of the correct answer.</div>" +
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
        "<p style='text-align:left; font-size:17px; max-width:620px; margin:0 auto 12px; line-height:1.55; color:#475569;'>" +
          "On every company you audit:" +
        "</p>" +
        "<ul style='text-align:left; font-size:18px; max-width:620px; margin:0 auto 18px; line-height:1.65; padding-left:22px;'>" +
          "<li>If your estimate is <strong>within 5 percentage points</strong> of the correct answer, you earn <strong>+$1.00</strong>.</li>" +
          "<li>If your estimate is <strong>more than 5 percentage points</strong> away from the correct answer, you earn <strong>$0.00</strong>.</li>" +
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
        "<div class='estimate-sim' data-truth='35' data-target='60' data-band-low='30' data-band-high='40'>" +
          
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your estimate: <span class='sim-slider-value' id='est35_val'>50%</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>0%</span>" +
              "<div class='slider-range-wrap'>" +
                "<div class='slider-band' style='left:30%; right:60%;'></div>" +
                "<div class='slider-coverage-band' id='est35_cov'></div>" +
                "<input type='range' class='slider-input' id='est35_slider' min='0' max='100' step='1' value='50' data-display='est35_val' data-coverage-band='est35_cov'>" +
              "</div>" +
              "<span class='slider-label'>100%</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-result'>" +
            "<div class='sim-result-row'>Within 5 percentage points of the correct answer? <span id='est35_within' class='sim-flag-no'>No &#10008;</span></div>" +
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
          "<li>Move your estimate to <strong>33%</strong>.</li>" +
        "</ul>" +
        "<div class='estimate-sim' data-truth='35' data-target='33' data-band-low='30' data-band-high='40'>" +
          
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your estimate: <span class='sim-slider-value' id='est30_val'>50%</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>0%</span>" +
              "<div class='slider-range-wrap'>" +
                "<div class='slider-band' style='left:30%; right:60%;'></div>" +
                "<div class='slider-coverage-band' id='est30_cov'></div>" +
                "<input type='range' class='slider-input' id='est30_slider' min='0' max='100' step='1' value='50' data-display='est30_val' data-coverage-band='est30_cov'>" +
              "</div>" +
              "<span class='slider-label'>100%</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-result'>" +
            "<div class='sim-result-row'>Within 5 percentage points of the correct answer? <span id='est30_within' class='sim-flag-no'>No &#10008;</span></div>" +
            "<div class='sim-result-total'>Estimate bonus: <span id='est30_bonus'>0&cent;</span></div>" +
          "</div>" +
        "</div>" +
        "<div class='practice-feedback-card' style='display:none;'>" +
          "<p style='text-align:left; font-size:20px; max-width:620px; margin:22px auto 0; line-height:1.5; font-weight:700; color:#15803d;'>" +
            "At 33%, you&apos;re within 5 percentage points of 35%. You earn <strong>+$1.00</strong>." +
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
          "<strong>30%</strong> and <strong>40%</strong>." +
        "</p>",
      minTimeSeconds: 6
    },

    // -- Page 35b: Attention check -- estimate bonus numeric ----------
    // Tests the "within 5 percentage points" rule on a fresh number
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:700; line-height:1.5;'>" +
          "The correct answer is <strong>60%</strong>. You estimate <strong>57%</strong>. " +
          "How much would you earn from the estimate?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='one' data-mode='retry' " +
             "data-explain='57% is within 5 percentage points of 60% (difference is 3), so the estimate bonus is +$1.00.'>" +
          "<button type='button' class='practice-btn' data-val='zero'>$0.00</button>" +
          "<button type='button' class='practice-btn' data-val='half'>+$0.50</button>" +
          "<button type='button' class='practice-btn' data-val='one'>+$1.00</button>" +
          "<button type='button' class='practice-btn' data-val='minus'>&minus;$0.50</button>" +
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
          "In addition to your estimate, you may <strong>bet up to $1.00</strong> on whether your estimate is within 5 percentage points of the correct answer." +
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
          "For example, suppose you bet <strong>$0.50</strong> on your estimate:" +
        "</p>" +
        "<ul style='text-align:left; font-size:18px; max-width:620px; margin:0 auto 14px; line-height:1.65; padding-left:22px;'>" +
          "<li>Within 5 percentage points &rarr; you <strong>win the bet</strong>: <strong>+$0.50</strong>.</li>" +
          "<li>More than 5 percentage points away &rarr; you <strong>lose the bet</strong>: <strong>&minus;$0.50</strong> (deducted from your bonus, never from the base pay).</li>" +
        "</ul>",
      minTimeSeconds: 9
    },

    // -- Page 37a: Bet safety -- $8 base pay never affected (highlighted) --
    {
      id: "p4_inst_bet_safety",
      type: "instructions",
      title: "",
      body:
        "<div style='max-width:560px; margin:80px auto 0; padding:36px 32px; background:#dcfce7; border-left:6px solid #15803d; border-radius:8px; text-align:center;'>" +
          "<p style='font-size:24px; font-weight:800; color:#0f172a; margin:0 0 14px;'>Your $8 base pay is never affected.</p>" +
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
          "<li>Set your estimate to <strong>33%</strong>.</li>" +
          "<li>Set your bet to <strong>$0.80</strong>.</li>" +
        "</ul>" +
        "<div class='bonus-sim' data-truth='35' data-target-est='33' data-target-bet='80' data-band-low='30' data-band-high='40'>" +
          
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your estimate: <span class='sim-slider-value' id='betg_est_display'>50%</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>0%</span>" +
              "<div class='slider-range-wrap'>" +
                "<div class='slider-band' style='left:30%; right:60%;'></div>" +
                "<div class='slider-coverage-band' id='betg_cov'></div>" +
                "<input type='range' class='slider-input' id='betg_estimate' min='0' max='100' step='1' value='50' data-display='betg_est_display' data-coverage-band='betg_cov'>" +
              "</div>" +
              "<span class='slider-label'>100%</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your bet: <span class='sim-slider-value' id='betg_conf_display'>$0.00</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>$0</span>" +
              "<div class='slider-range-wrap'>" +
                "<input type='range' class='slider-input' id='betg_confidence' min='0' max='100' step='5' value='0' data-display='betg_conf_display' data-display-suffix='cents'>" +
              "</div>" +
              "<span class='slider-label'>$1.00</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-result'>" +
            "<div class='sim-result-row'>Within 5 percentage points of the correct answer? <span id='betg_within' class='sim-flag-no'>No &#10008;</span></div>" +
            "<div class='sim-result-row'>Estimate bonus: <span id='betg_answer'>$0.00</span></div>" +
            "<div class='sim-result-row'>Bet outcome: <span id='betg_conf_bonus'>$0.00</span></div>" +
            "<div class='sim-result-total'>You'd earn: <span id='betg_total'>$0.00</span></div>" +
          "</div>" +
        "</div>" +
        "<div class='practice-feedback-card' style='display:none;'>" +
          "<p style='text-align:left; font-size:20px; max-width:620px; margin:22px auto 0; line-height:1.5; font-weight:700; color:#15803d;'>" +
            "Within 5 percentage points, bet won. You earn <strong>+$1.80</strong>." +
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
          "<li>Keep your bet at <strong>$0.80</strong>.</li>" +
        "</ul>" +
        "<div class='bonus-sim' data-truth='35' data-target-est='50' data-target-bet='80' data-band-low='30' data-band-high='40'>" +
          
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your estimate: <span class='sim-slider-value' id='betb_est_display'>30%</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>0%</span>" +
              "<div class='slider-range-wrap'>" +
                "<div class='slider-band' style='left:30%; right:60%;'></div>" +
                "<div class='slider-coverage-band' id='betb_cov'></div>" +
                "<input type='range' class='slider-input' id='betb_estimate' min='0' max='100' step='1' value='30' data-display='betb_est_display' data-coverage-band='betb_cov'>" +
              "</div>" +
              "<span class='slider-label'>100%</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-slider-card'>" +
            "<div class='sim-slider-header'>Your bet: <span class='sim-slider-value' id='betb_conf_display'>$0.00</span></div>" +
            "<div class='slider-wrapper'>" +
              "<span class='slider-label'>$0</span>" +
              "<div class='slider-range-wrap'>" +
                "<input type='range' class='slider-input' id='betb_confidence' min='0' max='100' step='5' value='0' data-display='betb_conf_display' data-display-suffix='cents'>" +
              "</div>" +
              "<span class='slider-label'>$1.00</span>" +
            "</div>" +
          "</div>" +
          "<div class='sim-result'>" +
            "<div class='sim-result-row'>Within 5 percentage points of the correct answer? <span id='betb_within' class='sim-flag-yes'>Yes &#10004;</span></div>" +
            "<div class='sim-result-row'>Estimate bonus: <span id='betb_answer'>+$1.00</span></div>" +
            "<div class='sim-result-row'>Bet outcome: <span id='betb_conf_bonus'>$0.00</span></div>" +
            "<div class='sim-result-total'>You'd earn: <span id='betb_total'>+$1.00</span></div>" +
          "</div>" +
        "</div>" +
        "<div class='practice-feedback-card' style='display:none;'>" +
          "<p style='text-align:left; font-size:20px; max-width:620px; margin:22px auto 0; line-height:1.5; font-weight:700; color:#b91c1c;'>" +
            "More than 5 percentage points off, bet lost. You earn <strong>&minus;$0.80</strong>." +
          "</p>" +
          "<p style='text-align:left; font-size:17px; max-width:620px; margin:14px auto 0; line-height:1.6;'>" +
            "Bet <strong>$0</strong> instead, and you'd have earned <strong>$0</strong>, not lost $0.80. " +
            "<strong>Only bet when you're confident.</strong>" +
          "</p>" +
        "</div>",
      showCalculator: true,
      minTimeSeconds: 0
    },

    // (Page 39 "Play with the bonus" removed -- redundant with the two
    //  try-it pages above, which already use both sliders live.)

    // -- Page 39b: Bonus formula recap --------------------------------
    // After the estimate-and-bet practice, summarize the per-trial bonus
    // as Total = Estimate + Betting. Lottery framing lives on the next
    // page (39c) as its own beat.
    {
      id: "p4_inst_bonus_formula",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Putting it together" +
        "</p>" +
        "<p style='text-align:center; font-size:24px; line-height:1.35; max-width:620px; margin:0 auto 28px; font-weight:800; color:#0f172a;'>" +
          "Total bonus = " +
          "<span style='color:var(--color-primary);'>Estimate</span> + " +
          "<span style='color:#b45309;'>Betting</span>." +
        "</p>" +
        "<div class='two-answers-row'>" +
          "<div class='answer-card'>" +
            "<div class='answer-num'>1</div>" +
            "<div class='answer-title'>Estimate</div>" +
            "<div class='answer-sub'><strong>+$1.00</strong> if within 5pp, else <strong>$0</strong>.</div>" +
          "</div>" +
          "<div class='answer-card'>" +
            "<div class='answer-num' style='background:#b45309;'>2</div>" +
            "<div class='answer-title'>Betting</div>" +
            "<div class='answer-sub'><strong>+ your bet</strong> if within, <strong>&minus; your bet</strong> if not.</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 8
    },

    // -- Page 39c: Lottery rule on its own page (V7.1) -----------------
    // Plain instruction styling -- no callout box, no glow. Same
    // visual language as the other instruction pages.
    {
      id: "p4_inst_lottery_rule",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "One more rule" +
        "</p>" +
        "<p style='text-align:justify; font-size:22px; line-height:1.5; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "At the end of the experiment, we will randomly pick " +
          "<strong>3 of your 60 assessments</strong>. " +
          "Your bonus is the sum of the Estimate and Betting bonuses " +
          "on those 3 picks &mdash; nothing else counts." +
        "</p>" +
        "<p style='text-align:justify; font-size:18px; line-height:1.6; max-width:620px; margin:0 auto;'>" +
          "Since you don't know which 3 will be picked, treat " +
          "<strong>every</strong> assessment as if it could be one of them." +
        "</p>",
      minTimeSeconds: 8
    },

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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "What is your task in this study?" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600; line-height:1.5;'>" +
          "The 3 transactions you receive from a company are <strong>randomly picked</strong> from all of its transactions." +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='false' data-mode='retry' " +
             "data-explain='False. The manager picks which 5 to send.'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Fraud estimate =" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='share' data-mode='retry' " +
             "data-explain='The fraud estimate is the share of a company&apos;s transactions that are suspicious.'>" +
          "<button type='button' class='practice-btn' data-val='gut'>Your gut feeling about the company, in percent.</button>" +
          "<button type='button' class='practice-btn' data-val='count'>The total number of suspicious transactions.</button>" +
          "<button type='button' class='practice-btn' data-val='share'>The share of suspicious transactions out of all its transactions.</button>" +
          "<button type='button' class='practice-btn' data-val='fifty'>Always 50%, set by law for every company.</button>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Correct answer: <strong>40%</strong>. Your estimate: <strong>44%</strong>. You bet <strong>0&cent;</strong>. Bonus if this company is picked?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='100' data-mode='retry' " +
             "data-explain='44 is within 5 percentage points of 40 (difference is 4), so the estimate bonus is +$1.00 if picked. Bet 0&cent; means no bet contribution. Total +$1.00.'>" +
          "<button type='button' class='practice-btn' data-val='0'>$0.00</button>" +
          "<button type='button' class='practice-btn' data-val='100'>+$1.00</button>" +
          "<button type='button' class='practice-btn' data-val='50'>+$0.50</button>" +
          "<button type='button' class='practice-btn' data-val='-100'>&minus;$1.00</button>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Correct answer: <strong>50%</strong>. Estimate: <strong>80%</strong>. Bet: <strong>$0.50</strong>. " +
          "Bonus if this company is picked?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='-50' data-mode='retry' " +
             "data-explain='30 percentage points off &rarr; $0.00 estimate bonus. Bet lost &rarr; &minus;$0.50.'>" +
          "<button type='button' class='practice-btn' data-val='150'>+$1.50</button>" +
          "<button type='button' class='practice-btn' data-val='50'>+$0.50</button>" +
          "<button type='button' class='practice-btn' data-val='0'>$0.00</button>" +
          "<button type='button' class='practice-btn' data-val='-50'>&minus;$0.50</button>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "If you lose several bets, can your <strong>$8 base pay</strong> drop below $8?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='no' data-mode='retry' " +
             "data-explain='Correct. Lost bets only reduce the bonus. They never touch the base pay.'>" +
          "<button type='button' class='practice-btn' data-val='yes'>Yes &mdash; lost bets can pull base pay below $8.</button>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Why doesn't the manager want a <strong>high</strong> fraud estimate?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='raise' data-mode='retry' " +
             "data-explain='A high estimate makes a full audit likely, and a full audit costs the manager their raise.'>" +
          "<button type='button' class='practice-btn' data-val='fine'>A high estimate triggers a personal fine for the manager.</button>" +
          "<button type='button' class='practice-btn' data-val='raise'>A high estimate makes a full audit likely and costs them their raise.</button>" +
          "<button type='button' class='practice-btn' data-val='bonus'>A high estimate lowers the government auditor&apos;s bonus payout.</button>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "If you are <strong>not at all confident</strong> in your fraud estimate, how much " +
          "should you bet?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='0' data-mode='retry' " +
             "data-explain='Bet 0. An uncertain estimate is more likely to miss the 5-point band, and losing a bet only costs you.'>" +
          "<button type='button' class='practice-btn' data-val='100'>$1.00, to maximize the upside.</button>" +
          "<button type='button' class='practice-btn' data-val='50'>$0.50, to hedge your bet.</button>" +
          "<button type='button' class='practice-btn' data-val='0'>$0, since you only bet if confident.</button>" +
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
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:0 auto 22px; font-weight:600;'>" +
          "Correct answer: <strong>25%</strong>. Estimate: <strong>28%</strong>. Bet: <strong>$0.50</strong>. " +
          "Bonus if this company is picked?" +
        "</p>" +
        "<div class='practice-buttons quiz-style' data-correct='150' data-mode='retry' " +
             "data-explain='28 is within 5 percentage points of 25 (difference is 3) &rarr; +$1.00 estimate bonus. Bet won &rarr; +$0.50. Total = +$1.50.'>" +
          "<button type='button' class='practice-btn' data-val='150'>+$1.50</button>" +
          "<button type='button' class='practice-btn' data-val='100'>+$1.00</button>" +
          "<button type='button' class='practice-btn' data-val='50'>+$0.50</button>" +
          "<button type='button' class='practice-btn' data-val='-50'>&minus;$0.50</button>" +
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
          "<li><strong>60 scored audits.</strong> At the end, <strong>3 are picked at random</strong> &mdash; only those count for the bonus, up to <strong>$6.00</strong>.</li>" +
        "</ol>",
      minTimeSeconds: 6
    },

    // ==================================================================
    //  ACT VI -- THE TRIALS (18 + 30 = 48)
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
            "<div class='firm-size-number'>10&ndash;15</div>" +
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
          "Some are <strong>small</strong> &mdash; somewhere between <strong>10 and 15 transactions</strong>." +
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
            "<div class='firm-size-number'>10&ndash;15</div>" +
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
            "<div class='firm-size-number'>20&ndash;25</div>" +
            "<div class='firm-size-subtext'>transactions<br>(medium)</div>" +
          "</div>" +
          "<div class='firm-size-card firm-size-card-large size-diff-large' style='visibility:hidden;' aria-hidden='true'>" +
            "<svg viewBox='0 0 110 180' xmlns='http://www.w3.org/2000/svg' style='width:110px; height:180px;'><rect width='1' height='1' fill='none'/></svg>" +
            "<div class='firm-size-number'>&nbsp;</div>" +
            "<div class='firm-size-subtext'>&nbsp;</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:20px auto 0; line-height:1.5; font-weight:700;'>" +
          "Some are <strong>medium</strong> &mdash; somewhere between <strong>20 and 25 transactions</strong>." +
        "</p>",
      minTimeSeconds: 2
    },

    // -- Firm-size intro: step 3 -- large (50) + rule reminder ---------
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
            "<div class='firm-size-number'>10&ndash;15</div>" +
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
            "<div class='firm-size-number'>20&ndash;25</div>" +
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
            "<div class='firm-size-number'>45&ndash;50</div>" +
            "<div class='firm-size-subtext'>transactions<br>(large)</div>" +
          "</div>" +
        "</div>" +
        "<p style='text-align:center; font-size:20px; max-width:620px; margin:20px auto 0; line-height:1.5; font-weight:700;'>" +
          "Some are <strong>large</strong> &mdash; somewhere between <strong>45 and 50 transactions</strong>." +
        "</p>",
      minTimeSeconds: 3
    },

    // -- Firm-size intro: rule reminder on its own page for emphasis ---
    // V7: also flags that we tell the SIZE only, not the exact N within
    // the range. This is the cognitive setup for stochastic-N reasoning.
    {
      id: "p6_firm_sizes_rule",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:24px; line-height:1.45; max-width:620px; margin:40px auto 18px; font-weight:700; color:#0f172a;'>" +
          "We will tell you each company's <strong>size</strong> &mdash; small, medium, or large." +
        "</p>" +
        "<p style='text-align:center; font-size:20px; line-height:1.55; max-width:620px; margin:0 auto 22px; color:#475569;'>" +
          "We will <strong>not</strong> tell you exactly how many transactions the company has, only that it falls in the size range above." +
        "</p>" +
        "<p style='text-align:center; font-size:24px; line-height:1.4; max-width:620px; margin:0 auto; font-weight:700; color:#0f172a;'>" +
          "The law still requires the manager to disclose " +
          "<strong style='color:#b91c1c;'>exactly 3</strong>, " +
          "regardless of size." +
        "</p>",
      minTimeSeconds: 8
    },

    // ==================================================================
    //  PRACTICE BLOCK -- 5 unscored warm-up rounds, random sample from
    //  the phase-1 (K=3) stimuli. Participant is told clearly these
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
          "Treat them seriously: the 60 scored audits begin immediately afterward." +
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

    // -- Handoff to the scored 45 --------------------------------------
    {
      id: "p6_scored_intro",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:26px; line-height:1.35; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "The scored audits begin now." +
        "</p>" +
        "<p style='text-align:justify; font-size:19px; max-width:620px; margin:0 auto 16px; line-height:1.65;'>" +
          "The following <strong>60 audits</strong> are scored. At the end, " +
          "<strong>3 will be picked at random</strong> and only those count toward your bonus &mdash; " +
          "up to <strong>$6.00</strong>." +
        "</p>" +
        "<p style='text-align:justify; font-size:17px; max-width:620px; margin:0 auto; line-height:1.65; color:#334155;'>" +
          "The task is the same as the warm-up." +
        "</p>",
      minTimeSeconds: 6
    },

    // Phase 1: 12 companies (K=3) ----------------------------------------
    {
      id: "block_k3",
      type: "trial_block",
      block: 1,
      filterPhase: 1,
      randomize: true,
      askFlaggedEstimate: false,
      minTimePerTrial: 10
    },

    // -- Rule change 1 (K=3 -> K=5), Page A: announcement ----------------
    // Same split-view graph as Page 25 (manager-picks), with the auditor
    // side now showing 5 cards instead of 3 to convey the new rule.
    {
      id: "p6_rule_change_1a",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Rule change" +
        "</p>" +
        "<p style='text-align:center; font-size:28px; line-height:1.3; max-width:620px; margin:0 auto 22px; font-weight:800; color:#0f172a;'>" +
          "Audit regulations just changed." +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; line-height:1.4; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "Managers must now disclose <strong style='color:#15803d;'>5</strong> transactions, not <strong style='color:#b91c1c; text-decoration:line-through;'>3</strong>." +
        "</p>" +
        "<div class='split-view'>" +
          "<div class='split-side'>" +
            "<div class='split-badge'>" +
              "<svg viewBox='0 0 120 140' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' width='56'>" +
                "<defs>" +
                  "<linearGradient id='mgrGradRC1' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                    "<stop offset='0%' stop-color='#6366f1'/>" +
                    "<stop offset='100%' stop-color='#4338ca'/>" +
                  "</linearGradient>" +
                "</defs>" +
                "<rect x='4' y='4' width='112' height='132' rx='22' fill='url(#mgrGradRC1)' stroke='#3730a3' stroke-width='2'/>" +
                "<circle cx='60' cy='54' r='18' fill='#ffffff'/>" +
                "<path d='M24 126 C24 96 40 80 60 80 C80 80 96 96 96 126 Z' fill='#ffffff'/>" +
              "</svg>" +
              "<div class='split-badge-label'>Manager</div>" +
            "</div>" +
            "<div class='split-cards'>" +
              // V7: manager always sees 15 across all laws (9 C + 6 S).
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
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc suspicious rule-small'>S</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc suspicious rule-small'>S</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
            "</div>" +
            "<div class='split-caption'>Sees all 15</div>" +
          "</div>" +
          "<div class='split-arrow' style='font-size:64px; display:flex; flex-direction:column; align-items:center;'>" +
            "<span style=\"font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:#64748b; margin-bottom:-4px; font-weight:700;\">sent</span>" +
            "&rarr;" +
          "</div>" +
          "<div class='split-side'>" +
            "<div class='split-badge'>" +
              "<svg viewBox='0 0 100 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' width='72'>" +
                "<defs>" +
                  "<linearGradient id='auditorMagRC1' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                    "<stop offset='0%' stop-color='#0ea5a0'/>" +
                    "<stop offset='100%' stop-color='#0f766e'/>" +
                  "</linearGradient>" +
                "</defs>" +
                "<rect x='16' y='18' width='54' height='72' rx='4' fill='#ffffff' stroke='#0f766e' stroke-width='2'/>" +
                "<line x1='24' y1='32' x2='62' y2='32' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='42' x2='58' y2='42' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='52' x2='62' y2='52' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='62' x2='50' y2='62' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<circle cx='66' cy='72' r='20' fill='none' stroke='url(#auditorMagRC1)' stroke-width='7'/>" +
                "<circle cx='66' cy='72' r='16' fill='#ccfbf1' opacity='0.5'/>" +
                "<line x1='80' y1='86' x2='96' y2='104' stroke='url(#auditorMagRC1)' stroke-width='8' stroke-linecap='round'/>" +
              "</svg>" +
              "<div class='split-badge-label'>You</div>" +
            "</div>" +
            "<div class='split-cards'>" +
              // 5 clean cards (manager strategically picks clean)
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
            "</div>" +
            "<div class='split-caption'>Sees 5 (manager's pick)</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 10
    },

    // -- Rule change 1, Page B: same other rules -------------------------
    {
      id: "p6_rule_change_1b",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 18px; line-height:1.55; font-weight:600;'>" +
          "Everything else stays the same: the manager still picks which ones, you still estimate and bet." +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:24px auto 0; line-height:1.55;'>" +
          "<strong>16 more companies</strong> under the new rule." +
        "</p>",
      minTimeSeconds: 7
    },

    // Phase 2: 16 companies (K=5) ------------------------------------------
    {
      id: "block_k5",
      type: "trial_block",
      block: 2,
      filterPhase: 2,
      randomize: true,
      askFlaggedEstimate: false,
      minTimePerTrial: 10
    },

    // -- Rule change 2 (K=5 -> K=10), Page A: announcement ---------------
    // Same split-view graph as Page 25, with auditor side now at 10 cards.
    {
      id: "p6_rule_change_2a",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:center; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; color:var(--color-primary); margin:0 auto 10px;'>" +
          "Rule change" +
        "</p>" +
        "<p style='text-align:center; font-size:28px; line-height:1.3; max-width:620px; margin:0 auto 22px; font-weight:800; color:#0f172a;'>" +
          "Audit regulations changed again." +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; line-height:1.4; max-width:620px; margin:0 auto 18px; font-weight:700;'>" +
          "Managers must now disclose <strong style='color:#15803d;'>10</strong> transactions, not <strong style='color:#b91c1c; text-decoration:line-through;'>5</strong>." +
        "</p>" +
        "<div class='split-view'>" +
          "<div class='split-side'>" +
            "<div class='split-badge'>" +
              "<svg viewBox='0 0 120 140' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' width='56'>" +
                "<defs>" +
                  "<linearGradient id='mgrGradRC2' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                    "<stop offset='0%' stop-color='#6366f1'/>" +
                    "<stop offset='100%' stop-color='#4338ca'/>" +
                  "</linearGradient>" +
                "</defs>" +
                "<rect x='4' y='4' width='112' height='132' rx='22' fill='url(#mgrGradRC2)' stroke='#3730a3' stroke-width='2'/>" +
                "<circle cx='60' cy='54' r='18' fill='#ffffff'/>" +
                "<path d='M24 126 C24 96 40 80 60 80 C80 80 96 96 96 126 Z' fill='#ffffff'/>" +
              "</svg>" +
              "<div class='split-badge-label'>Manager</div>" +
            "</div>" +
            "<div class='split-cards'>" +
              // V7: manager always sees 15 across all laws (9 C + 6 S).
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
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc suspicious rule-small'>S</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc suspicious rule-small'>S</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
            "</div>" +
            "<div class='split-caption'>Sees all 15</div>" +
          "</div>" +
          "<div class='split-arrow' style='font-size:64px; display:flex; flex-direction:column; align-items:center;'>" +
            "<span style=\"font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:#64748b; margin-bottom:-4px; font-weight:700;\">sent</span>" +
            "&rarr;" +
          "</div>" +
          "<div class='split-side'>" +
            "<div class='split-badge'>" +
              "<svg viewBox='0 0 100 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' width='72'>" +
                "<defs>" +
                  "<linearGradient id='auditorMagRC2' x1='0%' y1='0%' x2='0%' y2='100%'>" +
                    "<stop offset='0%' stop-color='#0ea5a0'/>" +
                    "<stop offset='100%' stop-color='#0f766e'/>" +
                  "</linearGradient>" +
                "</defs>" +
                "<rect x='16' y='18' width='54' height='72' rx='4' fill='#ffffff' stroke='#0f766e' stroke-width='2'/>" +
                "<line x1='24' y1='32' x2='62' y2='32' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='42' x2='58' y2='42' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='52' x2='62' y2='52' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<line x1='24' y1='62' x2='50' y2='62' stroke='#94a3b8' stroke-width='2' stroke-linecap='round'/>" +
                "<circle cx='66' cy='72' r='20' fill='none' stroke='url(#auditorMagRC2)' stroke-width='7'/>" +
                "<circle cx='66' cy='72' r='16' fill='#ccfbf1' opacity='0.5'/>" +
                "<line x1='80' y1='86' x2='96' y2='104' stroke='url(#auditorMagRC2)' stroke-width='8' stroke-linecap='round'/>" +
              "</svg>" +
              "<div class='split-badge-label'>You</div>" +
            "</div>" +
            "<div class='split-cards'>" +
              // 10 clean cards (manager strategically picks clean)
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
              "<div class='transaction-doc clean rule-small'>C</div>" +
            "</div>" +
            "<div class='split-caption'>Sees 10 (manager's pick)</div>" +
          "</div>" +
        "</div>",
      minTimeSeconds: 10
    },

    // -- Rule change 2, Page B: same other rules -------------------------
    {
      id: "p6_rule_change_2b",
      type: "instructions",
      title: "",
      body:
        "<p style='text-align:justify; font-size:22px; max-width:620px; margin:0 auto 18px; line-height:1.55; font-weight:600;'>" +
          "Everything else stays the same: the manager still picks which ones, you still estimate and bet." +
        "</p>" +
        "<p style='text-align:justify; font-size:20px; max-width:620px; margin:24px auto 0; line-height:1.55;'>" +
          "<strong>32 more companies</strong> under the new rule." +
        "</p>",
      minTimeSeconds: 7
    },

    // Phase 3: 32 companies (K=10) ----------------------------------------
    {
      id: "block_k10",
      type: "trial_block",
      block: 3,
      filterPhase: 3,
      randomize: true,
      askFlaggedEstimate: false,
      minTimePerTrial: 10
    },

    // ==================================================================
    //  ACT VII -- WRAP-UP
    // ==================================================================

    // -- Demographics ---------------------------------------------------
    // Age, sex, country of residence, fluent languages, education, and
    // employment are all pulled from Prolific's pre-screener data (API +
    // dashboard demographics CSV) and merged in via FETCH_RESPONSES.py
    // --merge-prolific. We only ask for things Prolific can't tell us and
    // that may explain individual variation in estimate-and-bet behavior:
    //   stats_comfort           - numeracy proxy
    //   finance_familiarity     - domain expertise (companies / disclosure)
    //   risk_tolerance          - general risk preference; helps decompose
    //                             bet behavior into confidence vs. risk
    //   considered_hidden       - direct self-report on selection-neglect
    //                             engagement (did you think about the
    //                             undisclosed transactions?)
    //   manager_strategic_belief - did the participant internalize that the
    //                              manager chooses strategically?
    {
      id: "demographics",
      type: "questionnaire",
      title: "About You",
      minTimeSeconds: 12,
      questions: [
        {
          id: "stats_comfort",
          prompt: "How comfortable are you with probability and statistics?",
          type: "likert", required: true, min: 1, max: 5,
          minLabel: "Not at all", maxLabel: "Very comfortable"
        },
        {
          id: "finance_familiarity",
          prompt: "How familiar are you with how companies share information about themselves (for example, earnings reports or audits)?",
          type: "likert", required: true, min: 1, max: 5,
          minLabel: "Not at all", maxLabel: "Very familiar"
        },
        {
          id: "risk_tolerance",
          prompt: "In general, how willing are you to take financial risks?",
          type: "likert", required: true, min: 1, max: 5,
          minLabel: "Avoid risk entirely", maxLabel: "Embrace risk"
        },
        {
          id: "considered_hidden",
          prompt: "During the audits, how often did you think about the transactions the manager did NOT send to you?",
          type: "likert", required: true, min: 1, max: 5,
          minLabel: "Never", maxLabel: "On every audit"
        },
        {
          id: "manager_strategic_belief",
          prompt: "How strongly did you believe the manager picked transactions to make the company look cleaner than it really is?",
          type: "likert", required: true, min: 1, max: 5,
          minLabel: "Not at all", maxLabel: "Very strongly"
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

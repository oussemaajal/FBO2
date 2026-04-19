"""
Aggregate vs individual identification of investor types.

Key questions:
1. What can we learn from aggregate averages alone?
2. Can we structurally classify individual participants?
3. What distinguishes 'everyone is partial-Bayesian' from 'a mix of types'?
"""

import numpy as np
from scipy.stats import binom, norm

def bayesian_post(K, N, d_normal, p_nf, p_f, prior):
    if d_normal < K:
        log_lf = binom.logpmf(d_normal, N, p_f)
        log_lnf = binom.logpmf(d_normal, N, p_nf)
    else:
        log_lf = np.log(max(1 - binom.cdf(K - 1, N, p_f), 1e-300))
        log_lnf = np.log(max(1 - binom.cdf(K - 1, N, p_nf), 1e-300))
    log_prior_odds = np.log(prior / (1 - prior))
    log_post_odds = log_prior_odds + log_lf - log_lnf
    if log_post_odds > 700: return 1.0
    if log_post_odds < -700: return 0.0
    return 1.0 / (1.0 + np.exp(-log_post_odds))

def sn_post(d_normal, K, p_nf, p_f, prior):
    d_f = K - d_normal
    log_prior_odds = np.log(prior / (1 - prior))
    log_lr = d_normal * np.log(p_f / p_nf) + d_f * np.log((1 - p_f) / (1 - p_nf))
    log_post_odds = log_prior_odds + log_lr
    if log_post_odds > 700: return 1.0
    if log_post_odds < -700: return 0.0
    return 1.0 / (1.0 + np.exp(-log_post_odds))

def mr_post(d_normal, K, N, p_nf, p_f, prior):
    p_unc_normal = prior * p_f + (1 - prior) * p_nf
    undisclosed = N - K
    total_n = d_normal + undisclosed * p_unc_normal
    total_f = (K - d_normal) + undisclosed * (1 - p_unc_normal)
    log_prior_odds = np.log(prior / (1 - prior))
    log_lr = total_n * np.log(p_f / p_nf) + total_f * np.log((1 - p_f) / (1 - p_nf))
    log_post_odds = log_prior_odds + log_lr
    if log_post_odds > 700: return 1.0
    if log_post_odds < -700: return 0.0
    return 1.0 / (1.0 + np.exp(-log_post_odds))


p_nf, p_f = 0.50, 0.40
prior = 0.25

d_normals = [1, 2]
K_vals = [3, 5]
sigma = 0.15
rho = 0.5

# Compute type-specific N-slopes and K-slopes (4 pairs each)
b_nslopes = np.array([
    bayesian_post(K, 30, d_n, p_nf, p_f, prior) - bayesian_post(K, 10, d_n, p_nf, p_f, prior)
    for d_n in d_normals for K in K_vals
])
mr_nslopes = np.array([
    mr_post(d_n, K, 30, p_nf, p_f, prior) - mr_post(d_n, K, 10, p_nf, p_f, prior)
    for d_n in d_normals for K in K_vals
])
sn_nslopes = np.zeros(4)

sn_kslopes = np.array([
    sn_post(d_n, 5, p_nf, p_f, prior) - sn_post(d_n, 3, p_nf, p_f, prior)
    for d_n in d_normals for N in [10, 30]
])
mr_kslopes = np.array([
    mr_post(d_n, 5, N, p_nf, p_f, prior) - mr_post(d_n, 3, N, p_nf, p_f, prior)
    for d_n in d_normals for N in [10, 30]
])
b_kslopes = np.zeros(4)  # K-invariant

avg_b_n = np.mean(b_nslopes)
avg_mr_n = np.mean(mr_nslopes)
avg_sn_k = np.mean(sn_kslopes)
avg_mr_k = np.mean(mr_kslopes)

# Individual slope SD (from noise)
sd_contrast = sigma * np.sqrt(2 * (1 - rho))  # SD of one contrast
sd_individual = sd_contrast / np.sqrt(4)       # SD of avg of 4 contrasts

print("=" * 100)
print(f"AGGREGATE vs INDIVIDUAL IDENTIFICATION (Prior = {prior:.0%})")
print("=" * 100)

print(f"\nType-specific benchmarks (avg across 4 pairs):")
print(f"  N-slope:  SN = {0:+.4f},  MR = {avg_mr_n:+.4f},  Bayes = {avg_b_n:+.4f}")
print(f"  K-slope:  SN = {avg_sn_k:+.4f},  MR = {avg_mr_k:+.4f},  Bayes = {0:+.4f}")
print(f"\n  Individual slope noise SD: {sd_individual:.4f}")
print(f"  95% CI per individual: +/- {1.96*sd_individual:.4f}")


# =========================================================================
# INDIVIDUAL CLASSIFICATION
# =========================================================================

print(f"\n\n{'=' * 100}")
print("CAN WE CLASSIFY INDIVIDUALS? (8 trials per person)")
print("=" * 100)

print(f"\n  Each person gives us two summary stats:")
print(f"    S_N = avg N-slope (4 contrasts)")
print(f"    S_K = avg K-slope (4 contrasts)")
print(f"  Both measured with noise SD = {sd_individual:.4f}")

print(f"\n  Type predictions in (S_N, S_K) space:")
print(f"    SN:    (  0.000, {avg_sn_k:+.4f} )")
print(f"    MR:    ( {avg_mr_n:+.4f}, {avg_mr_k:+.4f} )")
print(f"    Bayes: ( {avg_b_n:+.4f},  0.000 )")

gaps = {
    "Bayes vs SN (N-dim)": abs(avg_b_n),
    "Bayes vs SN (K-dim)": abs(avg_sn_k),
    "Bayes vs MR (N-dim)": abs(avg_b_n - avg_mr_n),
    "SN vs MR (N-dim)": abs(avg_mr_n),
    "SN vs MR (K-dim)": abs(avg_sn_k - avg_mr_k),
}

print(f"\n  {'Comparison':>30} {'Gap':>7} {'Noise':>7} {'SNR':>7} {'Individual?':>15}")
print("  " + "-" * 75)
for label, gap in gaps.items():
    snr = gap / sd_individual
    classify = "EASY" if snr > 3 else ("possible" if snr > 1.5 else "NO")
    print(f"  {label:>30} {gap:>7.4f} {sd_individual:>7.4f} {snr:>7.1f} {classify:>15}")

print(f"\n  CONCLUSION: Can classify Bayesian vs non-Bayesian at individual level.")
print(f"  CANNOT classify SN vs MR at individual level (SNR < 1).")
print(f"  Must use aggregate or structural estimation for SN vs MR.")


# =========================================================================
# AGGREGATE IDENTIFICATION
# =========================================================================

print(f"\n\n{'=' * 100}")
print("AGGREGATE IDENTIFICATION")
print("=" * 100)

print(f"\n  The aggregate average N-slope and K-slope are a MIXTURE:")
print(f"    E[S_N] = fB * {avg_b_n:.4f} + fMR * ({avg_mr_n:.4f}) + fSN * 0")
print(f"    E[S_K] = fB * 0 + fMR * {avg_mr_k:.4f} + fSN * {avg_sn_k:.4f}")
print(f"    fB + fMR + fSN = 1")
print(f"  Three equations, three unknowns: EXACTLY IDENTIFIED.")

print(f"\n  Solving: from E[S_N]:")
print(f"    fB = (E[S_N] - fMR * {avg_mr_n:.4f}) / {avg_b_n:.4f}")
print(f"  From E[S_K]:")
print(f"    fSN = (E[S_K] - fMR * {avg_mr_k:.4f}) / {avg_sn_k:.4f}")
print(f"  From fB + fMR + fSN = 1, solve for fMR.")

# Show what different aggregate observations imply
print(f"\n  {'Observed avg':>25} | {'Implied composition':>45}")
print(f"  {'N-slope':>12} {'K-slope':>12} | {'fB':>6} {'fMR':>6} {'fSN':>6} {'interpretation':>20}")
print("  " + "-" * 85)

test_obs = [
    (0.000, 0.072, "Pure SN"),
    (avg_mr_n, avg_mr_k, "Pure MR"),
    (avg_b_n, 0.000, "Pure Bayesian"),
    (0.5*avg_b_n, 0.5*avg_sn_k, "50% B + 50% SN"),
    (0.5*avg_b_n + 0.5*avg_mr_n, 0.5*avg_mr_k, "50% B + 50% MR"),
    (0.3*avg_b_n, 0.7*avg_sn_k, "30% B + 70% SN"),
    (0.3*avg_b_n + 0.7*avg_mr_n, 0.7*avg_mr_k, "30% B + 70% MR"),
    (0.10*avg_b_n, 0.055, "Some mix"),
]

for obs_n, obs_k, label in test_obs:
    # Solve the system
    # E[S_N] = fB * avg_b_n + fMR * avg_mr_n
    # E[S_K] = fMR * avg_mr_k + fSN * avg_sn_k
    # fB + fMR + fSN = 1
    #
    # From K-slope: fSN = (E[S_K] - fMR * avg_mr_k) / avg_sn_k
    # From N-slope: fB = (E[S_N] - fMR * avg_mr_n) / avg_b_n
    # Substitute into fB + fMR + fSN = 1:
    # (E[S_N] - fMR*avg_mr_n)/avg_b_n + fMR + (E[S_K] - fMR*avg_mr_k)/avg_sn_k = 1
    # fMR * (-avg_mr_n/avg_b_n + 1 - avg_mr_k/avg_sn_k) = 1 - E[S_N]/avg_b_n - E[S_K]/avg_sn_k

    coef_fMR = -avg_mr_n / avg_b_n + 1 - avg_mr_k / avg_sn_k
    rhs = 1 - obs_n / avg_b_n - obs_k / avg_sn_k

    if abs(coef_fMR) > 1e-10:
        fMR = rhs / coef_fMR
        fB = (obs_n - fMR * avg_mr_n) / avg_b_n
        fSN = (obs_k - fMR * avg_mr_k) / avg_sn_k

        # Clip to valid
        valid = (fB >= -0.05 and fMR >= -0.05 and fSN >= -0.05)
        print(f"  {obs_n:>+12.4f} {obs_k:>+12.4f} | {fB:>6.2f} {fMR:>6.2f} {fSN:>6.2f} {label:>20}")
    else:
        print(f"  {obs_n:>+12.4f} {obs_k:>+12.4f} | {'undetermined':>20} {label:>20}")


# =========================================================================
# THE DEGENERATE CASE: everyone partial-Bayesian
# =========================================================================

print(f"\n\n{'=' * 100}")
print("THE IDENTIFICATION PROBLEM: Partial Bayesian vs Type Mixture")
print("=" * 100)

print(f"""
  Consider two worlds:
    A: Everyone is alpha=0.30 Bayesian with SN base
       -> individual slope = 0.30 * {avg_b_n:.3f} = {0.30*avg_b_n:.4f}, K-slope = 0.70 * {avg_sn_k:.3f} = {0.70*avg_sn_k:.4f}
    B: 30% are pure Bayesian, 70% are pure SN
       -> avg slope = 0.30 * {avg_b_n:.3f} = {0.30*avg_b_n:.4f}, K-slope = 0.70 * {avg_sn_k:.3f} = {0.70*avg_sn_k:.4f}

  AGGREGATE AVERAGES ARE IDENTICAL!
  But the DISTRIBUTIONS differ:
    World A: slopes clustered tightly around {0.30*avg_b_n:.3f}
    World B: bimodal -- 70% near 0, 30% near {avg_b_n:.3f}
""")

print("  The variance (or full distribution) of individual slopes breaks the tie.")

# Simulate both worlds
np.random.seed(42)
n_part = 200

for world_label, gen_fn in [
    ("World A: Everyone alpha=0.30",
     lambda: 0.30 * b_nslopes),
    ("World B: 30% Bayes + 70% SN",
     lambda: b_nslopes if np.random.random() < 0.30 else np.zeros(4)),
    ("World C: 30% Bayes + 70% MR",
     lambda: b_nslopes if np.random.random() < 0.30 else mr_nslopes),
]:
    slopes = []
    for _ in range(n_part):
        true = gen_fn()
        noise = np.array([
            np.random.normal(0, sd_contrast)
            for _ in range(4)
        ])
        individual_avg = np.mean(true + noise)
        slopes.append(individual_avg)

    slopes = np.array(slopes)
    avg_s = np.mean(slopes)
    sd_s = np.std(slopes)

    # Distribution summary
    q25 = np.percentile(slopes, 25)
    q75 = np.percentile(slopes, 75)
    pct_neg = np.mean(slopes < -0.05) * 100
    pct_low = np.mean((slopes >= -0.05) & (slopes < 0.10)) * 100
    pct_high = np.mean(slopes >= 0.10) * 100

    print(f"\n  {world_label}")
    print(f"    Mean: {avg_s:+.4f}  SD: {sd_s:.4f}  IQR: [{q25:+.4f}, {q75:+.4f}]")
    print(f"    <-0.05: {pct_neg:.0f}%  |  -0.05 to 0.10: {pct_low:.0f}%  |  >0.10: {pct_high:.0f}%")


# =========================================================================
# WHAT THE PROMPT ADDS ON TOP
# =========================================================================

print(f"\n\n{'=' * 100}")
print("WHAT THE PROMPT ADDS: BELT AND SUSPENDERS")
print("=" * 100)

print("""
  At prior = 0.25, we can distinguish three types from N-slopes alone:
    SN:    slope = 0
    MR:    slope = -0.038 (NEGATIVE -- adds anti-fraud average evidence)
    Bayes: slope = +0.45  (POSITIVE -- selection logic)

  The aggregate avg N-slope identifies the mixture fractions.
  The distribution of individual slopes tells us discrete types vs continuous.

  The prompt manipulation ADDS:
    1. MECHANISM test: if prompt shifts slopes, the mechanism was awareness (SN).
       If not, the mechanism was wrong model (MR). This is causal, not correlational.
    2. ROBUSTNESS: even if the N-slope test is ambiguous (e.g., noise pushes
       MR slope close to zero), the prompt gives independent evidence.
    3. EXTERNAL VALIDITY: the prompt result tells us about interventions --
       can you fix selection neglect by just making people aware?

  So: the prior does the heavy lifting for identification.
  The prompt provides causal mechanism evidence on top.
""")


# =========================================================================
# FINAL RECOMMENDATION
# =========================================================================

print("=" * 100)
print("RECOMMENDATION")
print("=" * 100)

print(f"""
  Prior = 0.25 (or 0.20):
    - SN posteriors: 0.20-0.36 (workable range)
    - Bayesian at N=10: 0.48-0.58 (intermediate)
    - MR N-slope: -0.038 (detectable at n=32/group)
    - Three-way separation from N-slopes alone (no prompt needed)
    - Individual classification: Bayesian vs non-Bayesian (easy)
    - Aggregate classification: SN vs MR (from avg N-slope direction)
    - Structural estimation: mixture fractions from distribution of slopes

  The design gives you:
    AGGREGATE: "The average participant shows X% of Bayesian adjustment,
    and the residual pattern is consistent with SN (flat) not MR (negative)."

    STRUCTURAL: "We estimate that {f_B:.0%} of participants are Bayesian,
    {f_SN:.0%} are SN, and {f_MR:.0%} are MR." (from finite mixture model
    on the bivariate distribution of individual N-slopes and K-slopes)

    CAUSAL: "Prompting awareness increases N-sensitivity by X%,
    confirming that the SN component is driven by lack of awareness."

  Target n: 80-100 per group (prompted/unprompted) = 160-200 total.
""".format(f_B=0.30, f_SN=0.50, f_MR=0.20))

print("Done.")

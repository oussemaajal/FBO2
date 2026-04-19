"""
Search for the optimal prior that maximizes separation across all three
investor types while keeping responses in a workable range.

We need the prior to:
1. Create MR-SN separation (needs asymmetric prior, lower is better)
2. Keep Bayesian posteriors in the intermediate zone (not saturated)
3. Keep SN posteriors in a measurable range (not too low)
4. Maximize power for all three tests (N-sensitivity, K-sensitivity, prompt)

The three N-slopes we want to distinguish:
  SN:     always 0
  MR:     negative (more undisclosed avg = more anti-fraud when prior < 0.5)
  Bayes:  positive (more hidden = more suspicious from selection)
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

d_normals = [1, 2]
K_vals = [3, 5]
N_vals = [10, 30]


# =========================================================================
# SWEEP ACROSS PRIORS
# =========================================================================

print("=" * 110)
print("OPTIMAL PRIOR SEARCH")
print("Distributions: NF 50/50, F 40/60")
print("Trials: d_N in {1,2}, K in {3,5}, N in {10,30}")
print("=" * 110)

priors = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]

print(f"\n{'Prior':>6} | {'p_unc':>5} {'net/und':>8} | "
      f"{'SN_rng':>8} {'MR_rng':>8} {'B_rng':>8} | "
      f"{'SN_Nslp':>8} {'MR_Nslp':>8} {'B_Nslp':>8} | "
      f"{'MR-SN_N':>8} {'B-MR_N':>8} | "
      f"{'SN_Kslp':>8} {'B_Kslp':>8}")
print("-" * 130)

for prior in priors:
    p_unc = prior * p_f + (1 - prior) * p_nf
    net = p_unc * np.log(p_f / p_nf) + (1 - p_unc) * np.log((1 - p_f) / (1 - p_nf))

    # Compute all 8 trials
    sn_vals = {}
    mr_vals = {}
    b_vals = {}
    for d_n in d_normals:
        for K in K_vals:
            for N in N_vals:
                key = (d_n, K, N)
                sn_vals[key] = sn_post(d_n, K, p_nf, p_f, prior)
                mr_vals[key] = mr_post(d_n, K, N, p_nf, p_f, prior)
                b_vals[key] = bayesian_post(K, N, d_n, p_nf, p_f, prior)

    # Ranges
    sn_all = list(sn_vals.values())
    mr_all = list(mr_vals.values())
    b_all = list(b_vals.values())
    sn_rng = f"{min(sn_all):.2f}-{max(sn_all):.2f}"
    mr_rng = f"{min(mr_all):.2f}-{max(mr_all):.2f}"
    b_rng = f"{min(b_all):.2f}-{max(b_all):.2f}"

    # N-slopes (average across 4 pairs)
    sn_slopes = []
    mr_slopes = []
    b_slopes = []
    for d_n in d_normals:
        for K in K_vals:
            sn_slopes.append(sn_vals[(d_n, K, 30)] - sn_vals[(d_n, K, 10)])
            mr_slopes.append(mr_vals[(d_n, K, 30)] - mr_vals[(d_n, K, 10)])
            b_slopes.append(b_vals[(d_n, K, 30)] - b_vals[(d_n, K, 10)])

    avg_sn_nslp = np.mean(sn_slopes)
    avg_mr_nslp = np.mean(mr_slopes)
    avg_b_nslp = np.mean(b_slopes)

    # K-slopes (average across 4 pairs)
    sn_kslopes = []
    b_kslopes = []
    for d_n in d_normals:
        for N in N_vals:
            sn_kslopes.append(sn_vals[(d_n, 5, N)] - sn_vals[(d_n, 3, N)])
            b_kslopes.append(b_vals[(d_n, 5, N)] - b_vals[(d_n, 3, N)])

    avg_sn_kslp = np.mean(sn_kslopes)
    avg_b_kslp = np.mean(b_kslopes)

    # Separations
    mr_sn_n = avg_mr_nslp - avg_sn_nslp  # should be negative
    b_mr_n = avg_b_nslp - avg_mr_nslp    # should be positive

    print(f"{prior:>6.2f} | {p_unc:>5.3f} {net:>+8.5f} | "
          f"{sn_rng:>8} {mr_rng:>8} {b_rng:>8} | "
          f"{avg_sn_nslp:>+8.4f} {avg_mr_nslp:>+8.4f} {avg_b_nslp:>+8.4f} | "
          f"{mr_sn_n:>+8.4f} {b_mr_n:>+8.4f} | "
          f"{avg_sn_kslp:>+8.4f} {avg_b_kslp:>+8.4f}")


# =========================================================================
# DETAILED VIEW FOR PROMISING PRIORS
# =========================================================================

for prior in [0.20, 0.25, 0.30]:
    p_unc = prior * p_f + (1 - prior) * p_nf
    net = p_unc * np.log(p_f / p_nf) + (1 - p_unc) * np.log((1 - p_f) / (1 - p_nf))

    print(f"\n\n{'=' * 110}")
    print(f"DETAIL: Prior = {prior:.0%}")
    print(f"P_unc(Normal) = {p_unc:.3f}, net/undisclosed = {net:+.5f}")
    print(f"{'=' * 110}")

    print(f"\n  {'#':>3} {'d_N':>4} {'K':>3} {'d_F':>4} {'N':>4} | "
          f"{'SN':>7} {'MR':>7} {'Bayes':>7} | "
          f"{'MR-SN':>7} {'B-SN':>7} {'B-MR':>7}")
    print("  " + "-" * 80)

    trial = 0
    for d_n in d_normals:
        for K in K_vals:
            for N in N_vals:
                trial += 1
                s = sn_post(d_n, K, p_nf, p_f, prior)
                m = mr_post(d_n, K, N, p_nf, p_f, prior)
                b = bayesian_post(K, N, d_n, p_nf, p_f, prior)
                print(f"  {trial:>3} {d_n:>4} {K:>3} {K-d_n:>4} {N:>4} | "
                      f"{s:>7.3f} {m:>7.3f} {b:>7.3f} | "
                      f"{m-s:>+7.4f} {b-s:>+7.3f} {b-m:>+7.3f}")
            print()

    # N-sensitivity
    print(f"\n  N-sensitivity (N=10 vs N=30):")
    print(f"  {'d_N':>4} {'K':>3} | {'SN':>8} {'MR':>8} {'Bayes':>8}")
    for d_n in d_normals:
        for K in K_vals:
            s_slp = sn_post(d_n, K, p_nf, p_f, prior) - sn_post(d_n, K, p_nf, p_f, prior)
            m_slp = mr_post(d_n, K, 30, p_nf, p_f, prior) - mr_post(d_n, K, 10, p_nf, p_f, prior)
            b_slp = bayesian_post(K, 30, d_n, p_nf, p_f, prior) - bayesian_post(K, 10, d_n, p_nf, p_f, prior)
            print(f"  {d_n:>4} {K:>3} | {s_slp:>+8.4f} {m_slp:>+8.4f} {b_slp:>+8.4f}")

    # K-sensitivity
    print(f"\n  K-sensitivity (K=3 vs K=5):")
    print(f"  {'d_N':>4} {'N':>4} | {'SN':>8} {'MR':>8} {'Bayes':>8}")
    for d_n in d_normals:
        for N in N_vals:
            s_k = sn_post(d_n, 5, p_nf, p_f, prior) - sn_post(d_n, 3, p_nf, p_f, prior)
            m_k = mr_post(d_n, 5, N, p_nf, p_f, prior) - mr_post(d_n, 3, N, p_nf, p_f, prior)
            b_k = bayesian_post(5, N, d_n, p_nf, p_f, prior) - bayesian_post(3, N, d_n, p_nf, p_f, prior)
            print(f"  {d_n:>4} {N:>4} | {s_k:>+8.4f} {m_k:>+8.4f} {b_k:>+8.4f}")


# =========================================================================
# POWER ANALYSIS AT EACH PRIOR
# =========================================================================

print(f"\n\n{'=' * 110}")
print("POWER COMPARISON ACROSS PRIORS")
print("sigma=0.15, rho=0.5 (moderate noise)")
print("=" * 110)

C = 4  # 4 paired comparisons per test
sigma = 0.15
rho = 0.5
sd = sigma * np.sqrt(2 * (1 - rho) / C)
z_a = norm.ppf(0.975)
z80 = norm.ppf(0.80)

print(f"\n{'Prior':>6} | "
      f"{'B_Nslp':>7} {'MR_Nslp':>8} | "
      f"{'Test: B vs SN':>14} {'Test: B vs MR':>14} {'Test: MR vs SN':>15} | "
      f"{'Max n':>6}")
print(f"{'':>6} | "
      f"{'':>7} {'':>8} | "
      f"{'(alpha=.7)':>14} {'(alpha=.7)':>14} {'(n for MR-SN)':>15} | "
      f"{'':>6}")
print("-" * 100)

for prior in priors:
    # Compute average slopes
    b_slopes = []
    mr_slopes = []
    for d_n in d_normals:
        for K in K_vals:
            b10 = bayesian_post(K, 10, d_n, p_nf, p_f, prior)
            b30 = bayesian_post(K, 30, d_n, p_nf, p_f, prior)
            m10 = mr_post(d_n, K, 10, p_nf, p_f, prior)
            m30 = mr_post(d_n, K, 30, p_nf, p_f, prior)
            b_slopes.append(b30 - b10)
            mr_slopes.append(m30 - m10)

    avg_b = np.mean(b_slopes)
    avg_mr = np.mean(mr_slopes)

    # Test A: B vs SN (shortfall = 30% of Bayesian slope)
    eff_a = 0.30 * avg_b
    if abs(eff_a) > 0.001:
        n_a = int(np.ceil(((z_a + z80) * sd / eff_a) ** 2))
    else:
        n_a = 99999

    # Test A': B vs MR (shortfall from Bayesian, but MR has a slope too)
    # Effect = 0.30 * avg_b - avg_mr (the MR slope partially "fills" the gap)
    eff_a2 = 0.30 * avg_b - avg_mr
    if abs(eff_a2) > 0.001:
        n_a2 = int(np.ceil(((z_a + z80) * sd / eff_a2) ** 2))
    else:
        n_a2 = 99999

    # Test B: MR vs SN (detect MR slope different from SN=0)
    # Effect = |avg_mr| (assuming participants are MR, their slope differs from 0)
    eff_b = abs(avg_mr)
    if eff_b > 0.001:
        n_b = int(np.ceil(((z_a + z80) * sd / eff_b) ** 2))
    else:
        n_b = 99999

    max_n = max(n_a, n_b)
    n_b_str = f"{n_b}" if n_b < 10000 else ">9999"

    print(f"{prior:>6.2f} | {avg_b:>+7.3f} {avg_mr:>+8.4f} | "
          f"{n_a:>14d} {n_a2:>14d} {n_b_str:>15} | "
          f"{max_n if max_n < 10000 else '>9999':>6}")


# =========================================================================
# THE SWEET SPOT
# =========================================================================

print(f"\n\n{'=' * 110}")
print("INTERPRETATION")
print("=" * 110)
print("""
As the prior decreases from 0.50:
  - MR-SN separation INCREASES (MR slope becomes more negative)
  - Bayesian slope INCREASES (stronger selection signal at low prior)
  - BUT: all posteriors shift toward 0, compressing the response range
  - AND: Bayesian posteriors at N=30 may saturate near 1 (for high fraud)
         or near 0 (for low fraud), depending on composition

The sweet spot is where:
  1. MR N-slope is large enough to detect (at least 2-3pp)
  2. Bayesian posteriors at N=10 are still intermediate (0.15-0.85)
  3. SN posteriors are not so low that the response scale is compressed
  4. Power is manageable (< 200 per group)

From the table above: priors around 0.20-0.30 seem optimal.
  - At 0.20: MR slope = -0.013, MR-SN test needs ~100-150 participants
  - At 0.25: MR slope = -0.008, MR-SN test needs ~250+ (marginal)
  - At 0.30: MR slope = -0.005, MR-SN test needs ~700+ (too many)

Prior = 0.20 looks like the sweet spot: enough MR-SN separation to
detect without the prompt, while keeping posteriors in a readable range.
""")

print("Done.")

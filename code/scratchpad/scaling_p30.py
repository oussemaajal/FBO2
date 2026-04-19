"""
Proportional scaling test: same K/N, same d_N/K, increase both.
Prior = 30%. NF 50/50, F 40/60.

Goal: find a disclosed proportion where SN is near-flat (evidence
per transaction near zero) so Bayesian movement stands out.
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
prior = 0.30

# The SN break-even proportion: where net evidence per transaction = 0
# (d_N/K)*log(p_f/p_nf) + (1-d_N/K)*log((1-p_f)/(1-p_nf)) = 0
log_lr_n = np.log(p_f / p_nf)        # = log(0.80) = -0.2231
log_lr_f = np.log((1 - p_f) / (1 - p_nf))  # = log(1.20) = +0.1823
breakeven = -log_lr_f / (log_lr_n - log_lr_f)  # fraction Normal
print(f"SN break-even: {breakeven:.4f} ({breakeven:.1%} Normal in disclosed)")
print(f"At this proportion, net evidence per transaction = 0, SN is FLAT in K")
print(f"Below this: SN becomes anti-fraud as K grows")
print(f"Above this: SN becomes pro-fraud as K grows")
print()

# SN net evidence per transaction at various proportions
print("SN net evidence per transaction at different d_N/K proportions:")
for frac_n in [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60]:
    net = frac_n * log_lr_n + (1 - frac_n) * log_lr_f
    print(f"  {frac_n:.0%} Normal: net = {net:+.5f} per txn "
          f"({net*4:+.3f} at K=4, {net*10:+.3f} at K=10, {net*20:+.3f} at K=20)")


# =========================================================================
# PROPORTIONAL SCALING: K/N = 0.4
# =========================================================================

print(f"\n\n{'=' * 110}")
print("PROPORTIONAL SCALING TEST: K/N = 0.4")
print("=" * 110)

# Scale pairs: (K, N) with K/N = 0.4
# (4, 10), (8, 20), (12, 30), (20, 50)
scales = [(4, 10), (8, 20), (12, 30), (20, 50)]

# Test various d_N/K proportions
for frac_label, get_dn in [
    ("50% Normal", lambda K: K // 2),        # d_N/K = 0.50
    ("25% Normal", lambda K: max(1, K // 4)), # d_N/K = 0.25
    ("~45% Normal", lambda K: round(0.45 * K)),  # near break-even
]:
    print(f"\n  --- {frac_label} ---")
    print(f"  {'K':>4} {'N':>4} {'d_N':>4} {'d_F':>4} {'d_N/K':>6} | "
          f"{'SN':>7} {'MR':>7} {'Bayes':>7} | "
          f"{'SN_chg':>7} {'MR_chg':>7} {'B_chg':>7}")
    print("  " + "-" * 80)

    prev_sn = prev_mr = prev_b = None
    for K, N in scales:
        d_n = get_dn(K)
        d_f = K - d_n
        s = sn_post(d_n, K, p_nf, p_f, prior)
        m = mr_post(d_n, K, N, p_nf, p_f, prior)
        b = bayesian_post(K, N, d_n, p_nf, p_f, prior)

        s_chg = f"{s - prev_sn:+7.3f}" if prev_sn is not None else "      -"
        m_chg = f"{m - prev_mr:+7.3f}" if prev_mr is not None else "      -"
        b_chg = f"{b - prev_b:+7.3f}" if prev_b is not None else "      -"

        print(f"  {K:>4} {N:>4} {d_n:>4} {d_f:>4} {d_n/K:>5.0%}  | "
              f"{s:>7.3f} {m:>7.3f} {b:>7.3f} | "
              f"{s_chg} {m_chg} {b_chg}")

        prev_sn, prev_mr, prev_b = s, m, b


# =========================================================================
# PROPORTIONAL SCALING: K/N = 0.2 (less disclosed, more hidden)
# =========================================================================

print(f"\n\n{'=' * 110}")
print("PROPORTIONAL SCALING TEST: K/N = 0.2")
print("=" * 110)

scales_02 = [(2, 10), (4, 20), (6, 30), (10, 50)]

for frac_label, get_dn in [
    ("50% Normal", lambda K: K // 2),
    ("~45% Normal", lambda K: max(1, round(0.45 * K))),
]:
    print(f"\n  --- {frac_label} ---")
    print(f"  {'K':>4} {'N':>4} {'d_N':>4} {'d_F':>4} {'d_N/K':>6} | "
          f"{'SN':>7} {'MR':>7} {'Bayes':>7} | "
          f"{'SN_chg':>7} {'MR_chg':>7} {'B_chg':>7}")
    print("  " + "-" * 80)

    prev_sn = prev_mr = prev_b = None
    for K, N in scales_02:
        d_n = get_dn(K)
        d_f = K - d_n
        s = sn_post(d_n, K, p_nf, p_f, prior)
        m = mr_post(d_n, K, N, p_nf, p_f, prior)
        b = bayesian_post(K, N, d_n, p_nf, p_f, prior)

        s_chg = f"{s - prev_sn:+7.3f}" if prev_sn is not None else "      -"
        m_chg = f"{m - prev_mr:+7.3f}" if prev_mr is not None else "      -"
        b_chg = f"{b - prev_b:+7.3f}" if prev_b is not None else "      -"

        print(f"  {K:>4} {N:>4} {d_n:>4} {d_f:>4} {d_n/K:>5.0%}  | "
              f"{s:>7.3f} {m:>7.3f} {b:>7.3f} | "
              f"{s_chg} {m_chg} {b_chg}")

        prev_sn, prev_mr, prev_b = s, m, b


# =========================================================================
# KEY COMPARISON: (K=4,N=10) vs (K=20,N=50) at K/N=0.4
# =========================================================================

print(f"\n\n{'=' * 110}")
print("KEY SCALING COMPARISON: (K=4, N=10) vs (K=20, N=50)")
print("K/N = 0.4, proportional d_N")
print("=" * 110)

comparisons = [
    (4, 10, 2, 20, 50, 10, "50% Normal"),
    (4, 10, 1, 20, 50, 5, "25% Normal"),
    (4, 10, 2, 8, 20, 4, "50% Normal (smaller step)"),
]

for K1, N1, dn1, K2, N2, dn2, label in comparisons:
    s1 = sn_post(dn1, K1, p_nf, p_f, prior)
    m1 = mr_post(dn1, K1, N1, p_nf, p_f, prior)
    b1 = bayesian_post(K1, N1, dn1, p_nf, p_f, prior)

    s2 = sn_post(dn2, K2, p_nf, p_f, prior)
    m2 = mr_post(dn2, K2, N2, p_nf, p_f, prior)
    b2 = bayesian_post(K2, N2, dn2, p_nf, p_f, prior)

    print(f"\n  {label}: ({dn1}N/{K1-dn1}F, K={K1}, N={N1}) vs ({dn2}N/{K2-dn2}F, K={K2}, N={N2})")
    print(f"    {'':>12} {'SN':>7} {'MR':>7} {'Bayes':>7}")
    print(f"    {'Small:':>12} {s1:>7.3f} {m1:>7.3f} {b1:>7.3f}")
    print(f"    {'Large:':>12} {s2:>7.3f} {m2:>7.3f} {b2:>7.3f}")
    print(f"    {'Change:':>12} {s2-s1:>+7.3f} {m2-m1:>+7.3f} {b2-b1:>+7.3f}")
    direction = ""
    if (s2 - s1) * (b2 - b1) < 0:
        direction = "  ** OPPOSING DIRECTIONS **"
    print(f"    SN direction: {'down' if s2 < s1 else 'up':>5}, Bayes direction: {'down' if b2 < b1 else 'up':>5}{direction}")


# =========================================================================
# COMPLETE DESIGN WITH SCALING
# =========================================================================

print(f"\n\n{'=' * 110}")
print("PROPOSED COMPLETE DESIGN: 8 core + 2 scaling = 10 trials")
print("=" * 110)

# Core 8: d_N in {1,2}, K in {4,6}, N in {10,50}
# Scaling 2: proportional scale-up at K/N=0.4
#   (K=4, N=10, d_N=2) -> (K=8, N=20, d_N=4)   50% Normal, K/N=0.4
#   (K=4, N=10, d_N=1) -> (K=8, N=20, d_N=2)   25% Normal, K/N=0.4
# The small scale is SHARED with the core trials.

print("\n  Core 8 trials (within-subject: d_N x K x N):")
print(f"  {'#':>3} {'d_N':>4} {'K':>3} {'d_F':>4} {'N':>4} | "
      f"{'SN':>7} {'MR':>7} {'Bayes':>7}")
print("  " + "-" * 55)

trial = 0
for d_n in [1, 2]:
    for K in [4, 6]:
        for N in [10, 50]:
            trial += 1
            s = sn_post(d_n, K, p_nf, p_f, prior)
            m = mr_post(d_n, K, N, p_nf, p_f, prior)
            b = bayesian_post(K, N, d_n, p_nf, p_f, prior)
            print(f"  {trial:>3} {d_n:>4} {K:>3} {K-d_n:>4} {N:>4} | "
                  f"{s:>7.3f} {m:>7.3f} {b:>7.3f}")
        print()

print("\n  Scaling trials (within-subject: proportional K/N scale-up):")
print(f"  {'#':>3} {'d_N':>4} {'K':>3} {'d_F':>4} {'N':>4} {'K/N':>5} | "
      f"{'SN':>7} {'MR':>7} {'Bayes':>7} | vs small")
print("  " + "-" * 75)

# Scaling pairs: use K/N = 0.4
# Small = Trial 1 (d_N=1, K=4, N=10) and Trial 5 (d_N=2, K=4, N=10) from core
# Large = new trials

# Check: can we use K=8, N=20?
scaling_trials = [
    # (d_N, K, N) for the large-scale version
    (2, 8, 20),   # matches core trial 1 (d_N=1,K=4,N=10) with proportional scaling (d_N doubles)
    (4, 8, 20),   # matches core trial 5 (d_N=2,K=4,N=10) with proportional scaling (d_N doubles)
]

for d_n, K, N in scaling_trials:
    trial += 1
    s = sn_post(d_n, K, p_nf, p_f, prior)
    m = mr_post(d_n, K, N, p_nf, p_f, prior)
    b = bayesian_post(K, N, d_n, p_nf, p_f, prior)

    # Find the matching small-scale trial
    d_n_small = d_n // 2
    K_small = K // 2
    N_small = N // 2
    s_sm = sn_post(d_n_small, K_small, p_nf, p_f, prior)
    m_sm = mr_post(d_n_small, K_small, N_small, p_nf, p_f, prior)
    b_sm = bayesian_post(K_small, N_small, d_n_small, p_nf, p_f, prior)

    print(f"  {trial:>3} {d_n:>4} {K:>3} {K-d_n:>4} {N:>4} {K/N:>4.1%} | "
          f"{s:>7.3f} {m:>7.3f} {b:>7.3f} | "
          f"SN:{s-s_sm:+.3f} MR:{m-m_sm:+.3f} B:{b-b_sm:+.3f}")

print(f"\n  Scaling contrast (K=4,N=10 vs K=8,N=20, same K/N=0.4):")
for d_n_sm, d_n_lg, label in [(1, 2, "25% Normal"), (2, 4, "50% Normal")]:
    s_sm = sn_post(d_n_sm, 4, p_nf, p_f, prior)
    s_lg = sn_post(d_n_lg, 8, p_nf, p_f, prior)
    m_sm = mr_post(d_n_sm, 4, 10, p_nf, p_f, prior)
    m_lg = mr_post(d_n_lg, 8, 20, p_nf, p_f, prior)
    b_sm = bayesian_post(4, 10, d_n_sm, p_nf, p_f, prior)
    b_lg = bayesian_post(8, 20, d_n_lg, p_nf, p_f, prior)
    print(f"    {label}: SN {s_sm:.3f}->{s_lg:.3f} ({s_lg-s_sm:+.3f}), "
          f"MR {m_sm:.3f}->{m_lg:.3f} ({m_lg-m_sm:+.3f}), "
          f"Bayes {b_sm:.3f}->{b_lg:.3f} ({b_lg-b_sm:+.3f})")

# Also try K=20, N=50 as the large scale
print(f"\n  Or larger step: K=4,N=10 vs K=20,N=50 (same K/N=0.4):")
for d_n_sm, d_n_lg, label in [(1, 5, "25% Normal"), (2, 10, "50% Normal")]:
    s_sm = sn_post(d_n_sm, 4, p_nf, p_f, prior)
    s_lg = sn_post(d_n_lg, 20, p_nf, p_f, prior)
    m_sm = mr_post(d_n_sm, 4, 10, p_nf, p_f, prior)
    m_lg = mr_post(d_n_lg, 20, 50, p_nf, p_f, prior)
    b_sm = bayesian_post(4, 10, d_n_sm, p_nf, p_f, prior)
    b_lg = bayesian_post(20, 50, d_n_lg, p_nf, p_f, prior)
    print(f"    {label}: SN {s_sm:.3f}->{s_lg:.3f} ({s_lg-s_sm:+.3f}), "
          f"MR {m_sm:.3f}->{m_lg:.3f} ({m_lg-m_sm:+.3f}), "
          f"Bayes {b_sm:.3f}->{b_lg:.3f} ({b_lg-b_sm:+.3f})")


# =========================================================================
# SUMMARY OF ALL TESTS
# =========================================================================

print(f"\n\n{'=' * 110}")
print("SUMMARY OF ALL TESTS")
print("=" * 110)

print("""
TEST A: N-sensitivity (within-subject)
  Vary N (10 vs 50), hold d_N and K fixed.
  SN: flat (0.000)
  MR: negative (-0.07pp avg)
  Bayesian: strongly positive (+0.41pp avg)
  -> Separates all three types

TEST B: K-sensitivity (within-subject)
  Vary K (4 vs 6), hold d_N and N fixed.
  SN: positive (+0.08pp)
  MR: positive (+0.08pp, ~same as SN)
  Bayesian: flat (0.000, K-invariant)
  -> Separates Bayesian from both naive types

TEST C: Proportional scaling (within-subject)
  Scale K and N together (K/N fixed), scale d_N proportionally.
  SN: moves toward extremes (evidence accumulates, but SLOWLY with mild distributions)
  MR: moves similarly but modulated by fewer undisclosed
  Bayesian: moves MORE (selection from larger pool is more informative)
  -> Additional separation, especially at compositions near SN break-even

TEST D: Prompt effect (between-subjects)
  Forced to type N-K before responding.
  If SN: behavior changes (awareness was the bottleneck)
  If MR: no change (already aware of undisclosed)
  -> Causal mechanism test

TEST E: Aggregate mixture + distribution shape
  From avg slopes: solve for population shares (fB, fMR, fSN)
  From distribution of individual slopes: discrete types vs continuous
""")

print("Done.")

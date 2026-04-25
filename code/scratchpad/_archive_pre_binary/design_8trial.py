"""
8-trial within-subject design exploiting K-invariance of Bayesian.

Key insight: For d_normal < K, the Bayesian posterior depends ONLY on
d_normal and N, NOT on K. The manager showed all Normals plus filler,
so total Normal = d_normal exactly. K drops out.

This means K variation is a pure Naive test:
- Naive changes with K (different proportions)
- Bayesian is flat in K
"""

import numpy as np
from scipy.stats import binom, norm

def bayes_binary(K, N, d_normal, p_nf, p_f):
    if d_normal < K:
        log_lf = binom.logpmf(d_normal, N, p_f)
        log_lnf = binom.logpmf(d_normal, N, p_nf)
    else:
        log_lf = np.log(max(1 - binom.cdf(K - 1, N, p_f), 1e-300))
        log_lnf = np.log(max(1 - binom.cdf(K - 1, N, p_nf), 1e-300))
    log_ratio = log_lnf - log_lf
    if log_ratio > 700: return 0.0
    if log_ratio < -700: return 1.0
    return 1.0 / (1.0 + np.exp(log_ratio))

def naive_binary(d_normal, K, p_nf, p_f):
    log_lr = 0.0
    if d_normal > 0:
        log_lr += d_normal * np.log(p_f / p_nf)
    d_f = K - d_normal
    if d_f > 0:
        log_lr += d_f * np.log((1 - p_f) / (1 - p_nf))
    if log_lr > 700: return 1.0
    if log_lr < -700: return 0.0
    return 1.0 / (1.0 + np.exp(-log_lr))

p_nf, p_f = 0.50, 0.40


# =============================================================================
# PROOF: Bayesian is K-invariant
# =============================================================================

print("=" * 90)
print("PROOF: Bayesian depends on d_normal and N only, not K")
print("=" * 90)

print(f"\n  {'d_N':>4} {'K':>3} {'d_F':>4} {'Naive':>7} {'B(10)':>7} {'B(20)':>7} {'B(30)':>7}")
print("  " + "-" * 50)

for d_n in [0, 1, 2, 3]:
    for K in [3, 4, 5, 6]:
        if d_n >= K:
            continue
        d_f = K - d_n
        nv = naive_binary(d_n, K, p_nf, p_f)
        b10 = bayes_binary(K, 10, d_n, p_nf, p_f)
        b20 = bayes_binary(K, 20, d_n, p_nf, p_f)
        b30 = bayes_binary(K, 30, d_n, p_nf, p_f)
        print(f"  {d_n:>4} {K:>3} {d_f:>4} {nv:>7.3f} {b10:>7.3f} {b20:>7.3f} {b30:>7.3f}")
    print()


# =============================================================================
# EXAMPLE: d_normal=2, vary K and N
# =============================================================================

print("\n" + "=" * 90)
print("EXAMPLE: Fix d_normal=2, vary K and N")
print("=" * 90)

print("\n  What the participant sees:")
print("  K=3, d_n=2: '2 Normal, 1 Flagged out of N'")
print("  K=5, d_n=2: '2 Normal, 3 Flagged out of N'")
print()
print("  The Naive sees different PROPORTIONS: 33% vs 60% Flagged.")
print("  The Bayesian sees the same FACT: 2 Normal in a pool of N.")
print()

d_n = 2
for K in [3, 5]:
    print(f"  K={K}: {d_n}N/{K-d_n}F")
    for N in [10, 20, 30]:
        nv = naive_binary(d_n, K, p_nf, p_f)
        bp = bayes_binary(K, N, d_n, p_nf, p_f)
        print(f"    N={N:>3}: Naive={nv:.3f}, Bayes={bp:.3f}, Gap={bp-nv:+.3f}")
    print()


# =============================================================================
# FULL 8-TRIAL DESIGN: 2 d_normal x 2 K x 2 N = 8 trials, ALL within-subject
# =============================================================================

print("\n" + "=" * 90)
print("8-TRIAL DESIGN: 2 d_normal x 2 K x 2 N, all within-subject")
print("=" * 90)

d_normals = [1, 2]
K_vals = [3, 5]
N_vals = [10, 30]

print(f"\n  {'#':>3} {'d_N':>4} {'K':>3} {'d_F':>4} {'N':>4} {'Naive':>7} {'Bayes':>7} {'Gap':>7}")
print("  " + "-" * 50)

trial = 0
for d_n in d_normals:
    for K in K_vals:
        for N in N_vals:
            trial += 1
            d_f = K - d_n
            nv = naive_binary(d_n, K, p_nf, p_f)
            bp = bayes_binary(K, N, d_n, p_nf, p_f)
            print(f"  {trial:>3} {d_n:>4} {K:>3} {d_f:>4} {N:>4} {nv:>7.3f} {bp:>7.3f} {bp-nv:>+7.3f}")

# Within-subject contrasts
print("\n\nWITHIN-SUBJECT CONTRASTS:")

print("\n  TEST A: N-sensitivity (N=10 vs N=30, same d_normal and K)")
print("  Bayesian increases; Naive is flat. Detects pool-size awareness.")
slopes_A = []
for d_n in d_normals:
    for K in K_vals:
        nv = naive_binary(d_n, K, p_nf, p_f)
        b10 = bayes_binary(K, 10, d_n, p_nf, p_f)
        b30 = bayes_binary(K, 30, d_n, p_nf, p_f)
        slopes_A.append(b30 - b10)
        print(f"    d_n={d_n}, K={K}: Naive {nv:.3f} (flat), "
              f"Bayes {b10:.3f} -> {b30:.3f} (delta={b30-b10:+.3f})")

avg_slope_A = np.mean(slopes_A)
print(f"  Average Bayesian slope: {avg_slope_A:.3f} ({avg_slope_A*100:.1f}pp)")

print("\n  TEST B: K-sensitivity (K=3 vs K=5, same d_normal and N)")
print("  Naive changes; Bayesian is flat. Detects proportion-based reasoning.")
naive_changes_B = []
for d_n in d_normals:
    for N in N_vals:
        nv3 = naive_binary(d_n, 3, p_nf, p_f)
        nv5 = naive_binary(d_n, 5, p_nf, p_f)
        b3 = bayes_binary(3, N, d_n, p_nf, p_f)
        b5 = bayes_binary(5, N, d_n, p_nf, p_f)
        naive_changes_B.append(nv5 - nv3)
        print(f"    d_n={d_n}, N={N}: Naive {nv3:.3f} -> {nv5:.3f} ({nv5-nv3:+.3f}), "
              f"Bayes {b3:.3f} -> {b5:.3f} ({b5-b3:+.3f})")

avg_naive_B = np.mean(naive_changes_B)
print(f"  Average Naive change: {avg_naive_B:.3f} ({avg_naive_B*100:.1f}pp)")
print(f"  Average Bayesian change: 0.000 (0.0pp)")


# =============================================================================
# WHAT PARTICIPANTS AT DIFFERENT SOPHISTICATION LOOK LIKE
# =============================================================================

print("\n\n" + "=" * 90)
print("WHAT PARTICIPANTS LOOK LIKE")
print("=" * 90)

# Model: response = alpha * Bayesian + (1-alpha) * Naive
# alpha = 0: pure Naive/SN
# alpha = 1: pure Bayesian
# alpha > 0 but < 1: partial adjustment

print("\n  Response = alpha * Bayesian + (1-alpha) * Naive")
print()

# Show for d_n=2, K=3 vs K=5, N=10
d_n = 2
N = 10
nv3 = naive_binary(d_n, 3, p_nf, p_f)
nv5 = naive_binary(d_n, 5, p_nf, p_f)
b = bayes_binary(3, N, d_n, p_nf, p_f)  # same for K=3 and K=5

print(f"  d_normal={d_n}, N={N}")
print(f"  K=3: 2N/1F, Naive={nv3:.3f}, Bayes={b:.3f}")
print(f"  K=5: 2N/3F, Naive={nv5:.3f}, Bayes={b:.3f}")
print()
print(f"  {'alpha':>7} {'R(K=3)':>8} {'R(K=5)':>8} {'R_diff':>8} {'label':>20}")
print("  " + "-" * 55)

for alpha, label in [(0.0, "Pure SN/Naive"),
                      (0.25, "Mostly SN"),
                      (0.50, "Halfway"),
                      (0.75, "Mostly Bayesian"),
                      (1.0, "Pure Bayesian")]:
    r3 = alpha * b + (1-alpha) * nv3
    r5 = alpha * b + (1-alpha) * nv5
    print(f"  {alpha:>7.2f} {r3:>8.3f} {r5:>8.3f} {r5-r3:>+8.3f} {label:>20}")

print()
print("  A pure Bayesian gives the SAME response for K=3 and K=5.")
print("  A pure Naive gives different responses (0.091 apart).")
print("  The K-sensitivity reveals the alpha parameter directly.")


# =============================================================================
# POWER ANALYSIS
# =============================================================================

print("\n\n" + "=" * 90)
print("POWER ANALYSIS FOR 8-TRIAL DESIGN")
print("=" * 90)

C = 4  # 4 paired comparisons per test

print("\nTest A: N-sensitivity (shortfall from Bayesian slope)")
print(f"  Bayesian slope = {avg_slope_A:.3f}")
print(f"  {'beta':>6} {'effect':>7} {'sigma':>6} {'rho':>5} | {'n(80%)':>7} {'n(90%)':>7}")
print("  " + "-" * 50)
for beta in [0.60, 0.70, 0.80]:
    eff = (1-beta) * avg_slope_A
    for sigma, rho in [(0.15, 0.5), (0.20, 0.3)]:
        sd = sigma * np.sqrt(2*(1-rho)/C)
        z_a = norm.ppf(0.975)
        z80 = norm.ppf(0.80)
        z90 = norm.ppf(0.90)
        n80 = int(np.ceil(((z_a+z80)*sd/eff)**2))
        n90 = int(np.ceil(((z_a+z90)*sd/eff)**2))
        print(f"  {beta:>5.0%}  {eff:>6.3f}  {sigma:>5.2f}  {rho:>4.1f}  | {n80:>7d} {n90:>7d}")

print(f"\nTest B: K-sensitivity (does participant show Naive-like K response?)")
print(f"  Naive K-change = {abs(avg_naive_B):.3f}")
print(f"  Test: is observed K-change SMALLER than Naive K-change?")
print(f"  {'frac_naive':>10} {'effect':>7} {'sigma':>6} {'rho':>5} | {'n(80%)':>7} {'n(90%)':>7}")
print("  " + "-" * 55)
for frac in [0.40, 0.60, 0.80]:
    # frac = fraction of Naive change captured by participant
    # shortfall = 1 - frac
    eff = (1-frac) * abs(avg_naive_B)
    for sigma, rho in [(0.15, 0.5), (0.20, 0.3)]:
        sd = sigma * np.sqrt(2*(1-rho)/C)
        z_a = norm.ppf(0.975)
        z80 = norm.ppf(0.80)
        z90 = norm.ppf(0.90)
        n80 = int(np.ceil(((z_a+z80)*sd/eff)**2))
        n90 = int(np.ceil(((z_a+z90)*sd/eff)**2))
        print(f"  {frac:>9.0%}   {eff:>6.3f}  {sigma:>5.2f}  {rho:>4.1f}  | {n80:>7d} {n90:>7d}")


# =============================================================================
# SUMMARY
# =============================================================================

print("\n\n" + "=" * 90)
print("SUMMARY")
print("=" * 90)

print("""
DESIGN:
  - 8 trials per participant, fully within-subject
  - Binary transactions: Normal vs Flagged
  - NF: 50/50, Fraud: 40/60
  - d_normal in {1, 2}, K in {3, 5}, N in {10, 30}

TWO ORTHOGONAL TESTS:
  Test A (N-sensitivity):
    Bayesian increases N=10 -> N=30 by ~22pp
    Naive is flat
    Detects: does participant account for pool size?

  Test B (K-sensitivity):
    Naive changes K=3 -> K=5 by ~9pp
    Bayesian is FLAT (K-invariant!)
    Detects: does participant reason from proportions or Normal count?

POWER (conservative, 80% Bayesian / 20% shortfall):
  Test A: ~30-70 participants
  Test B: ~50-130 participants (smaller effect)

BINDING CONSTRAINT: Test B (K-sensitivity), ~80-100 participants.

WHAT MAKES THIS CLEAN:
  - No between-subjects manipulation needed
  - Both tests in same 8 trials
  - K-invariance gives a SHARP prediction: Bayesian says K shouldn't matter
  - Any K-sensitivity is direct evidence of proportion-based (Naive) reasoning
""")

print("Done.")

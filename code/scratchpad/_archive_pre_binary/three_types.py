"""
Three investor types in the binary transaction design.

1. Bayesian: accounts for selection (manager showed best K of N)
2. Mean-reverting (MR): knows about N-K undisclosed, assigns them
   the unconditional distribution (doesn't account for selection)
3. Selection Neglect (SN): ignores undisclosed entirely, only sees K

Key question: where do MR and SN DIFFER, and can we discriminate?
"""

import numpy as np
from scipy.stats import binom, norm

def bayesian(K, N, d_normal, p_nf, p_f):
    """Accounts for selection: manager showed best K of N."""
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


def selection_neglect(d_normal, K, p_nf, p_f):
    """Ignores undisclosed entirely. Only sees K transactions."""
    d_flagged = K - d_normal
    log_lr = 0.0
    if d_normal > 0:
        log_lr += d_normal * np.log(p_f / p_nf)
    if d_flagged > 0:
        log_lr += d_flagged * np.log((1 - p_f) / (1 - p_nf))
    if log_lr > 700: return 1.0
    if log_lr < -700: return 0.0
    return 1.0 / (1.0 + np.exp(-log_lr))


def mean_reverting(d_normal, K, N, p_nf, p_f, prior=0.5):
    """Knows about N-K undisclosed, assigns unconditional distribution.

    Unconditional P(Normal) = prior * p_nf + (1-prior) * p_f
    Mental model: disclosed + (N-K) "average" transactions.
    """
    p_unc_normal = prior * p_nf + (1 - prior) * p_f
    p_unc_flagged = 1 - p_unc_normal

    undisclosed = N - K

    # Total "evidence" in their mental model
    total_normal = d_normal + undisclosed * p_unc_normal
    total_flagged = (K - d_normal) + undisclosed * p_unc_flagged

    log_lr = 0.0
    if total_normal > 0:
        log_lr += total_normal * np.log(p_f / p_nf)
    if total_flagged > 0:
        log_lr += total_flagged * np.log((1 - p_f) / (1 - p_nf))

    if log_lr > 700: return 1.0
    if log_lr < -700: return 0.0
    return 1.0 / (1.0 + np.exp(-log_lr))


p_nf, p_f = 0.50, 0.40
prior = 0.5
p_unc = prior * p_nf + (1 - prior) * p_f  # = 0.45

print("=" * 100)
print("THREE INVESTOR TYPES: Bayesian, Mean-Reverting, Selection Neglect")
print("NF: 50/50 (Normal/Flagged), F: 40/60")
print(f"Unconditional P(Normal) = {p_unc:.2f}")
print("=" * 100)

# First: show the net evidence from one "average" undisclosed transaction
net_evidence = p_unc * np.log(p_f / p_nf) + (1 - p_unc) * np.log((1 - p_f) / (1 - p_nf))
print(f"\nNet log-LR from one 'average' undisclosed transaction: {net_evidence:.6f}")
print(f"  (This is {p_unc:.2f}*log({p_f}/{p_nf}) + {1-p_unc:.2f}*log({1-p_f}/{1-p_nf}))")
print(f"  Near zero because unconditional distribution is nearly uninformative.")
print(f"  MR adds (N-K) of these, shifting posterior by (N-K)*{net_evidence:.6f}")


# =============================================================================
# FULL COMPARISON TABLE
# =============================================================================

print("\n\n" + "=" * 100)
print("FULL COMPARISON: All 8 trials")
print("d_normal in {1, 2}, K in {3, 5}, N in {10, 30}")
print("=" * 100)

d_normals = [1, 2]
K_vals = [3, 5]
N_vals = [10, 30]

print(f"\n  {'#':>3} {'d_N':>4} {'K':>3} {'d_F':>4} {'N':>4} | {'SN':>7} {'MR':>7} {'Bayes':>7} | {'MR-SN':>7} {'B-SN':>7} {'B-MR':>7}")
print("  " + "-" * 75)

trial = 0
for d_n in d_normals:
    for K in K_vals:
        for N in N_vals:
            trial += 1
            d_f = K - d_n
            sn = selection_neglect(d_n, K, p_nf, p_f)
            mr = mean_reverting(d_n, K, N, p_nf, p_f)
            b = bayesian(K, N, d_n, p_nf, p_f)
            print(f"  {trial:>3} {d_n:>4} {K:>3} {d_f:>4} {N:>4} | "
                  f"{sn:>7.3f} {mr:>7.3f} {b:>7.3f} | "
                  f"{mr-sn:>+7.4f} {b-sn:>+7.3f} {b-mr:>+7.3f}")
        print()


# =============================================================================
# N-SENSITIVITY BY TYPE
# =============================================================================

print("\n" + "=" * 100)
print("TEST A: N-SENSITIVITY (N=10 vs N=30, same d_normal and K)")
print("=" * 100)

print(f"\n  {'d_N':>4} {'K':>3} | {'SN_slope':>9} {'MR_slope':>9} {'B_slope':>9}")
print("  " + "-" * 45)

for d_n in d_normals:
    for K in K_vals:
        sn10 = selection_neglect(d_n, K, p_nf, p_f)
        sn30 = selection_neglect(d_n, K, p_nf, p_f)  # same!
        mr10 = mean_reverting(d_n, K, 10, p_nf, p_f)
        mr30 = mean_reverting(d_n, K, 30, p_nf, p_f)
        b10 = bayesian(K, 10, d_n, p_nf, p_f)
        b30 = bayesian(K, 30, d_n, p_nf, p_f)

        sn_slp = sn30 - sn10
        mr_slp = mr30 - mr10
        b_slp = b30 - b10

        print(f"  {d_n:>4} {K:>3} | {sn_slp:>+9.4f} {mr_slp:>+9.4f} {b_slp:>+9.3f}")

print("\n  SN: exactly 0 (doesn't know N exists)")
print("  MR: nearly 0 (adds 'average' undisclosed, but average is ~uninformative)")
print("  Bayesian: large positive (correctly accounts for selection)")
print("  -> N-sensitivity test distinguishes Bayesian from BOTH naive types")
print("  -> But CANNOT distinguish SN from MR (both ~flat in N)")


# =============================================================================
# K-SENSITIVITY BY TYPE
# =============================================================================

print("\n\n" + "=" * 100)
print("TEST B: K-SENSITIVITY (K=3 vs K=5, same d_normal and N)")
print("=" * 100)

print(f"\n  {'d_N':>4} {'N':>4} | {'SN(K3)':>7}->{'SN(K5)':>7} {'SN_chg':>7} | "
      f"{'MR(K3)':>7}->{'MR(K5)':>7} {'MR_chg':>7} | "
      f"{'B(K3)':>7}->{'B(K5)':>7} {'B_chg':>7}")
print("  " + "-" * 100)

for d_n in d_normals:
    for N in N_vals:
        sn3 = selection_neglect(d_n, 3, p_nf, p_f)
        sn5 = selection_neglect(d_n, 5, p_nf, p_f)
        mr3 = mean_reverting(d_n, 3, N, p_nf, p_f)
        mr5 = mean_reverting(d_n, 5, N, p_nf, p_f)
        b3 = bayesian(3, N, d_n, p_nf, p_f)
        b5 = bayesian(5, N, d_n, p_nf, p_f)

        print(f"  {d_n:>4} {N:>4} | {sn3:>7.3f}->{sn5:>7.3f} {sn5-sn3:>+7.4f} | "
              f"{mr3:>7.3f}->{mr5:>7.3f} {mr5-mr3:>+7.4f} | "
              f"{b3:>7.3f}->{b5:>7.3f} {b5-b3:>+7.4f}")

print("\n  SN: changes with K (sees different proportions: 1F/3 vs 3F/5)")
print("  MR: changes with K, but DIFFERENTLY (also changes undisclosed count)")
print("  Bayesian: exactly 0 (K-invariant for d_normal < K)")


# =============================================================================
# WHERE DO SN AND MR ACTUALLY DIFFER?
# =============================================================================

print("\n\n" + "=" * 100)
print("WHERE DO SN AND MR ACTUALLY DIFFER?")
print("=" * 100)

print("\n  The difference comes from how they handle the (N-K) undisclosed:")
print(f"  MR adds (N-K) * {p_unc:.2f} Normal and (N-K) * {1-p_unc:.2f} Flagged")
print(f"  Net evidence per undisclosed transaction: {net_evidence:.6f} (near zero)")
print()

print("  Expanding the comparison across more N values:")
print(f"\n  d_N=2, K=3 (2N/1F disclosed):")
print(f"  {'N':>4} {'SN':>7} {'MR':>7} {'Bayes':>7} | {'MR-SN':>8}")
print("  " + "-" * 45)
for N in [10, 20, 30, 50, 100, 200]:
    sn = selection_neglect(2, 3, p_nf, p_f)
    mr = mean_reverting(2, 3, N, p_nf, p_f)
    b = bayesian(3, N, 2, p_nf, p_f)
    print(f"  {N:>4} {sn:>7.4f} {mr:>7.4f} {b:>7.3f} | {mr-sn:>+8.5f}")

print("\n  MR drifts VERY slowly from SN as N grows.")
print("  At N=200: MR-SN difference is still < 1pp.")
print("  Practically indistinguishable with these distributions.")


# =============================================================================
# CAN WE MAKE MR AND SN DIFFER MORE?
# =============================================================================

print("\n\n" + "=" * 100)
print("CAN DIFFERENT DISTRIBUTIONS SEPARATE SN FROM MR?")
print("=" * 100)

print("\n  The net evidence per undisclosed depends on distributions:")
print(f"  Net = p_unc * log(p_f/p_nf) + (1-p_unc) * log((1-p_f)/(1-p_nf))")
print()

test_dists = [
    (0.50, 0.40, "50/50 vs 40/60 (our design)"),
    (0.60, 0.40, "60/40 vs 40/60"),
    (0.70, 0.30, "70/30 vs 30/70"),
    (0.80, 0.20, "80/20 vs 20/80"),
    (0.60, 0.30, "60/40 vs 30/70"),
    (0.70, 0.40, "70/30 vs 40/60"),
    (0.50, 0.30, "50/50 vs 30/70"),
]

print(f"  {'Distribution':>25} {'p_unc':>6} {'Net/txn':>10} {'MR-SN @N=30':>13}")
print("  " + "-" * 60)

for p_nf_t, p_f_t, label in test_dists:
    p_unc_t = 0.5 * p_nf_t + 0.5 * p_f_t
    net_t = p_unc_t * np.log(p_f_t / p_nf_t) + (1 - p_unc_t) * np.log((1 - p_f_t) / (1 - p_nf_t))

    # Compute MR-SN difference at d_n=2, K=3, N=30
    sn_t = selection_neglect(2, 3, p_nf_t, p_f_t)
    mr_t = mean_reverting(2, 3, 30, p_nf_t, p_f_t)

    print(f"  {label:>25} {p_unc_t:>6.3f} {net_t:>+10.5f} {mr_t-sn_t:>+13.4f}")


# =============================================================================
# WHAT IF THE PRIOR ISN'T 0.5?
# =============================================================================

print("\n\n" + "=" * 100)
print("EFFECT OF PRIOR ON MR-SN SEPARATION")
print("(Our distributions: 50/50 vs 40/60)")
print("=" * 100)

print(f"\n  d_N=2, K=3, N=30")
print(f"  {'Prior':>6} {'p_unc':>6} {'SN':>7} {'MR':>7} {'MR-SN':>8} {'Bayes':>7}")
print("  " + "-" * 50)

for prior_t in [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]:
    p_unc_t = prior_t * p_nf + (1 - prior_t) * p_f
    sn_t = selection_neglect(2, 3, p_nf, p_f)
    mr_t = mean_reverting(2, 3, 30, p_nf, p_f, prior=prior_t)
    b_t = bayesian(3, 30, 2, p_nf, p_f)
    print(f"  {prior_t:>6.1f} {p_unc_t:>6.3f} {sn_t:>7.4f} {mr_t:>7.4f} {mr_t-sn_t:>+8.5f} {b_t:>7.3f}")


# =============================================================================
# THE REAL DISTINGUISHER: WHAT DOES THE PARTICIPANT'S PATTERN LOOK LIKE?
# =============================================================================

print("\n\n" + "=" * 100)
print("THE THREE-TYPE PATTERN ACROSS ALL 8 TRIALS")
print("=" * 100)

print("\n  Trial descriptions and three-type predictions:")
print(f"\n  {'#':>3} {'Description':>25} | {'SN':>7} {'MR':>7} {'Bayes':>7}")
print("  " + "-" * 60)

trials = []
trial = 0
for d_n in d_normals:
    for K in K_vals:
        for N in N_vals:
            trial += 1
            d_f = K - d_n
            desc = f"{d_n}N/{d_f}F, K={K}, N={N}"
            sn = selection_neglect(d_n, K, p_nf, p_f)
            mr = mean_reverting(d_n, K, N, p_nf, p_f)
            b = bayesian(K, N, d_n, p_nf, p_f)
            trials.append((trial, desc, sn, mr, b, d_n, K, N))
            print(f"  {trial:>3} {desc:>25} | {sn:>7.3f} {mr:>7.3f} {b:>7.3f}")

print("\n  DISTINGUISHING SIGNATURES:")
print("\n  1. N-sensitivity (hold d_normal and K fixed, vary N):")
print("     SN: flat (0.000)     MR: ~flat (0.001)    Bayesian: large (+0.2)")
print("     -> Separates Bayesian from both naive types")

print("\n  2. K-sensitivity (hold d_normal and N fixed, vary K):")
print("     SN: changes (+0.09)  MR: changes (+0.09)  Bayesian: flat (0.000)")
print("     -> Separates Bayesian from both naive types (different direction)")

print("\n  3. LEVEL at high N (is response near SN or near Bayesian at N=30?):")
print("     SN: moderate (0.43-0.62)  MR: moderate (0.43-0.62)  Bayesian: near 1 (0.99)")
print("     -> Again separates Bayesian from both naive types")

print("\n  PROBLEM: With 50/50 vs 40/60 distributions, SN and MR are")
print("  PRACTICALLY INDISTINGUISHABLE because the unconditional")
print("  distribution (0.45/0.55) is almost uninformative.")
print("  The net evidence from each 'average' undisclosed = ~0.")


# =============================================================================
# IS THERE A DESIGN THAT CAN SEPARATE SN FROM MR?
# =============================================================================

print("\n\n" + "=" * 100)
print("DESIGN THAT SEPARATES SN FROM MR")
print("=" * 100)

print("\nThe MR-SN gap depends on:")
print("  1. Net evidence per 'average' undisclosed transaction")
print("  2. Number of undisclosed: N-K")
print()
print("With symmetric-ish distributions (p_nf + p_f ~ 1), the net is ~0.")
print("To create a gap, we need ASYMMETRIC distributions where the")
print("unconditional average is itself informative.")
print()

# Try asymmetric: NF 70/30, F 40/60
# p_unc = 0.5*0.70 + 0.5*0.40 = 0.55
# net = 0.55*log(0.40/0.70) + 0.45*log(0.60/0.30)
#     = 0.55*(-0.5596) + 0.45*(0.6931)
#     = -0.3078 + 0.3119 = +0.0041

# Try: NF 60/40, F 30/70
# p_unc = 0.5*0.60 + 0.5*0.30 = 0.45
# net = 0.45*log(0.30/0.60) + 0.55*log(0.70/0.40)
#     = 0.45*(-0.6931) + 0.55*(0.5596)
#     = -0.3119 + 0.3078 = -0.0041

print("Testing: NF 70/30 vs F 40/60")
p_nf_t, p_f_t = 0.70, 0.40
p_unc_t = 0.5 * p_nf_t + 0.5 * p_f_t  # 0.55
net_t = p_unc_t * np.log(p_f_t / p_nf_t) + (1 - p_unc_t) * np.log((1 - p_f_t) / (1 - p_nf_t))
print(f"  p_unc = {p_unc_t:.3f}, net/txn = {net_t:+.5f}")

print(f"\n  d_N=2, K=3:")
print(f"  {'N':>4} {'SN':>7} {'MR':>7} {'Bayes':>7} | {'MR-SN':>8} {'B-SN':>8}")
print("  " + "-" * 55)
for N in [10, 20, 30, 50, 100]:
    sn = selection_neglect(2, 3, p_nf_t, p_f_t)
    mr = mean_reverting(2, 3, N, p_nf_t, p_f_t)
    b = bayesian(3, N, 2, p_nf_t, p_f_t)
    print(f"  {N:>4} {sn:>7.4f} {mr:>7.4f} {b:>7.3f} | {mr-sn:>+8.4f} {b-sn:>+8.3f}")

print("\n\nTesting: NF 80/20 vs F 40/60")
p_nf_t, p_f_t = 0.80, 0.40
p_unc_t = 0.5 * p_nf_t + 0.5 * p_f_t  # 0.60
net_t = p_unc_t * np.log(p_f_t / p_nf_t) + (1 - p_unc_t) * np.log((1 - p_f_t) / (1 - p_nf_t))
print(f"  p_unc = {p_unc_t:.3f}, net/txn = {net_t:+.5f}")

print(f"\n  d_N=2, K=3:")
print(f"  {'N':>4} {'SN':>7} {'MR':>7} {'Bayes':>7} | {'MR-SN':>8} {'B-SN':>8}")
print("  " + "-" * 55)
for N in [10, 20, 30, 50, 100]:
    sn = selection_neglect(2, 3, p_nf_t, p_f_t)
    mr = mean_reverting(2, 3, N, p_nf_t, p_f_t)
    b = bayesian(3, N, 2, p_nf_t, p_f_t)
    print(f"  {N:>4} {sn:>7.4f} {mr:>7.4f} {b:>7.3f} | {mr-sn:>+8.4f} {b-sn:>+8.3f}")


# Try even more extreme asymmetry
print("\n\nTesting: NF 80/20 vs F 30/70")
p_nf_t, p_f_t = 0.80, 0.30
p_unc_t = 0.5 * p_nf_t + 0.5 * p_f_t  # 0.55
net_t = p_unc_t * np.log(p_f_t / p_nf_t) + (1 - p_unc_t) * np.log((1 - p_f_t) / (1 - p_nf_t))
print(f"  p_unc = {p_unc_t:.3f}, net/txn = {net_t:+.5f}")

print(f"\n  d_N=2, K=3:")
print(f"  {'N':>4} {'SN':>7} {'MR':>7} {'Bayes':>7} | {'MR-SN':>8} {'B-SN':>8}")
print("  " + "-" * 55)
for N in [10, 20, 30, 50, 100]:
    sn = selection_neglect(2, 3, p_nf_t, p_f_t)
    mr = mean_reverting(2, 3, N, p_nf_t, p_f_t)
    b = bayesian(3, N, 2, p_nf_t, p_f_t)
    print(f"  {N:>4} {sn:>7.4f} {mr:>7.4f} {b:>7.3f} | {mr-sn:>+8.4f} {b-sn:>+8.3f}")


print("\n\n" + "=" * 100)
print("SUMMARY")
print("=" * 100)
print("""
THREE TYPES:
  SN: Response = f(d_normal, d_flagged). Ignores N entirely.
  MR: Response = g(d_normal, d_flagged, N). Knows about undisclosed,
      assigns unconditional mean. Weakly depends on N.
  Bayesian: Response = h(d_normal, N). K-invariant. Strongly depends on N.

WITH 50/50 vs 40/60:
  SN and MR are practically identical (<0.1pp difference).
  This is because the unconditional (0.45 Normal) is nearly uninformative.
  Both are ~flat in N. Both change with K via proportions.

  The design discriminates Bayesian from {SN, MR} but NOT SN from MR.

TO SEPARATE SN FROM MR:
  Need distributions where p_unc is far from the "break-even" point.
  More asymmetric distributions (e.g., NF 80/20 vs F 40/60) create
  a ~2pp gap per 10 undisclosed transactions. Still small.

  OR: use a different experimental feature entirely (e.g., does the
  participant REPORT thinking about undisclosed transactions?).
""")

print("Done.")

"""
Binary transaction types: Normal vs Flagged.
Manager shows the best K (most Normal).

Can this simpler design produce:
1. Intermediate Bayesian posteriors
2. Meaningful sensitivity to N
3. Clear separation between "accounts for selection" vs "doesn't"
"""

import numpy as np
from scipy.stats import binom

def bayes_binary(K, N, d_normal, p_normal_nf, p_normal_f):
    """
    Bayesian posterior P(fraud | d_normal Normal out of K disclosed, N total).
    Manager shows the K most Normal (i.e., all Normal first, then Flagged).

    If d_normal < K: manager was forced to show (K - d_normal) Flagged.
    This means total Normal = d_normal exactly (all shown), and
    total Flagged = N - d_normal, of which K - d_normal are shown.

    If d_normal = K: total Normal >= K.
    """
    d_flagged = K - d_normal

    if d_normal < K:
        # Total Normal = d_normal exactly (manager showed all of them)
        # P(T_normal = d_normal | theta) = Binom(N, p_normal)
        log_lf = binom.logpmf(d_normal, N, p_normal_f)
        log_lnf = binom.logpmf(d_normal, N, p_normal_nf)
    else:
        # d_normal = K: total Normal >= K
        log_lf = np.log(max(1 - binom.cdf(K - 1, N, p_normal_f), 1e-300))
        log_lnf = np.log(max(1 - binom.cdf(K - 1, N, p_normal_nf), 1e-300))

    log_ratio = log_lnf - log_lf  # log(P(d|NF) / P(d|F))
    if log_ratio > 700: return 0.0
    if log_ratio < -700: return 1.0
    return 1.0 / (1.0 + np.exp(log_ratio))

def naive_binary(d_normal, K, p_normal_nf, p_normal_f):
    """Naive posterior: treat disclosed as random sample."""
    d_flagged = K - d_normal
    log_lr = 0.0
    if d_normal > 0:
        log_lr += d_normal * np.log(p_normal_f / p_normal_nf)
    if d_flagged > 0:
        log_lr += d_flagged * np.log((1 - p_normal_f) / (1 - p_normal_nf))
    if log_lr > 700: return 1.0
    if log_lr < -700: return 0.0
    return 1.0 / (1.0 + np.exp(-log_lr))


# =============================================================================
# SEARCH OVER BINARY DISTRIBUTIONS
# =============================================================================

print("=" * 110)
print("BINARY DESIGN SEARCH: Normal vs Flagged")
print("=" * 110)

# Try different (p_normal_nf, p_normal_f) pairs
dist_pairs = []
for pnf in np.arange(0.50, 0.90, 0.05):
    for pf in np.arange(0.30, pnf - 0.04, 0.05):
        dist_pairs.append((round(pnf, 2), round(pf, 2)))

K_vals = [3, 4, 5, 6, 8, 10]
N_vals_test = [10, 20, 30, 50, 100]

print(f"\nSearching {len(dist_pairs)} distribution pairs x {len(K_vals)} K values\n")

best_results = []

for p_nf, p_f in dist_pairs:
    lr_normal = p_f / p_nf
    lr_flagged = (1 - p_f) / (1 - p_nf)

    for K in K_vals:
        # All possible disclosed compositions: d_normal = 0, 1, ..., K
        compositions = list(range(K + 1))

        # For each composition, compute Bayesian at each N
        good_comps = 0
        avg_sensitivity = 0

        for d_normal in compositions:
            N_lo = max(N_vals_test[0], K + 1)
            N_hi = N_vals_test[-1]

            b_lo = bayes_binary(K, N_lo, d_normal, p_nf, p_f)
            b_hi = bayes_binary(K, N_hi, d_normal, p_nf, p_f)
            delta = b_hi - b_lo

            if 0.15 < b_lo < 0.85 and delta > 0.05:
                good_comps += 1
            avg_sensitivity += abs(delta)

        avg_sensitivity /= len(compositions)

        if good_comps >= 2:
            best_results.append({
                'p_nf': p_nf, 'p_f': p_f,
                'K': K, 'good_comps': good_comps,
                'avg_sens': avg_sensitivity,
                'lr_n': lr_normal, 'lr_f': lr_flagged,
            })

best_results.sort(key=lambda x: x['good_comps'] * 10 + x['avg_sens'], reverse=True)

print(f"{'Rank':>4} {'p_NF':>5} {'p_F':>5} {'LR(N)':>6} {'LR(F)':>6} {'K':>3} "
      f"{'#Good':>5} {'AvgSens':>8}")
print("-" * 55)
for i, r in enumerate(best_results[:20]):
    print(f"{i+1:>4} {r['p_nf']:>5.2f} {r['p_f']:>5.2f} {r['lr_n']:>6.3f} {r['lr_f']:>6.3f} "
          f"{r['K']:>3} {r['good_comps']:>5} {r['avg_sens']:>8.3f}")


# =============================================================================
# DETAILED VIEW OF TOP DESIGNS
# =============================================================================

print("\n\n" + "=" * 110)
print("DETAILED VIEW OF TOP BINARY DESIGNS")
print("=" * 110)

for i, r in enumerate(best_results[:5]):
    p_nf, p_f, K = r['p_nf'], r['p_f'], r['K']

    print(f"\n--- #{i+1}: p_NF={p_nf}, p_F={p_f}, K={K} ---")
    print(f"  LR(Normal)={p_f/p_nf:.3f}  LR(Flagged)={(1-p_f)/(1-p_nf):.3f}")
    print(f"  {'d_N':>4} {'d_F':>4} {'Naive':>7}", end="")
    for N in N_vals_test:
        if N > K:
            print(f" {'B(N='+str(N)+')':>9}", end="")
    print(f" {'d(lo-hi)':>9} {'zone':>5}")

    for d_normal in range(K + 1):
        d_flagged = K - d_normal
        nv = naive_binary(d_normal, K, p_nf, p_f)

        print(f"  {d_normal:>4} {d_flagged:>4} {nv:>7.3f}", end="")
        bvals = []
        for N in N_vals_test:
            if N > K:
                bp = bayes_binary(K, N, d_normal, p_nf, p_f)
                bvals.append(bp)
                print(f" {bp:>9.4f}", end="")

        if len(bvals) >= 2:
            delta = bvals[-1] - bvals[0]
            zone = "***" if 0.15 < bvals[0] < 0.85 and delta > 0.05 else ""
            print(f" {delta:>+9.4f} {zone:>5}", end="")
        print()


# =============================================================================
# THE VERY BEST: Check scaling behavior too
# =============================================================================

print("\n\n" + "=" * 110)
print("SCALING TEST: Best binary design, K/N proportional")
print("=" * 110)

# Pick the best one
r = best_results[0]
p_nf, p_f = r['p_nf'], r['p_f']

for ratio_label, kn_pairs in [
    ("K/N = 0.6", [(3, 5), (5, 8), (6, 10), (10, 17), (15, 25), (30, 50)]),
    ("K/N = 0.3", [(3, 10), (6, 20), (10, 33), (15, 50), (30, 100)]),
]:
    print(f"\n  {ratio_label}, p_NF={p_nf}, p_F={p_f}")

    # Focus on the compositions that exist for the smallest K
    K_min = kn_pairs[0][0]

    print(f"  {'d_N/K':>6}", end="")
    for K, N in kn_pairs:
        print(f" {'B('+str(K)+'/'+str(N)+')':>10} {'Nv':>6}", end="")
    print(f"  {'B_chg':>6} {'N_chg':>6} {'Opp?':>5}")

    for frac_normal in [1.0, 0.83, 0.67, 0.50, 0.33, 0.17, 0.0]:
        print(f"  {frac_normal:>6.2f}", end="")
        bvals = []
        nvals = []
        for K, N in kn_pairs:
            d_normal = round(frac_normal * K)
            d_normal = min(d_normal, K)
            bp = bayes_binary(K, N, d_normal, p_nf, p_f)
            nv = naive_binary(d_normal, K, p_nf, p_f)
            bvals.append(bp)
            nvals.append(nv)
            print(f" {bp:>10.3f} {nv:>6.3f}", end="")

        b_chg = bvals[-1] - bvals[0]
        n_chg = nvals[-1] - nvals[0]
        opp = "YES" if b_chg * n_chg < -0.02 else ""
        print(f"  {b_chg:>+6.3f} {n_chg:>+6.3f} {opp:>5}")


# =============================================================================
# WHAT THE PARTICIPANT ACTUALLY SEES
# =============================================================================

print("\n\n" + "=" * 110)
print("WHAT THE PARTICIPANT SEES (example trials)")
print("=" * 110)

r = best_results[0]
p_nf, p_f, K = r['p_nf'], r['p_f'], r['K']

print(f"\nDesign: p_NF={p_nf}, p_F={p_f}, K={K}")
print(f"LR(Normal)={p_f/p_nf:.3f}  LR(Flagged)={(1-p_f)/(1-p_nf):.3f}")
print()

examples = [
    (K, 0, "All Normal"),
    (K-1, 1, f"{K-1} Normal, 1 Flagged"),
    (K-2, 2, f"{K-2} Normal, 2 Flagged"),
    (K//2, K - K//2, f"{K//2} Normal, {K - K//2} Flagged"),
    (1, K-1, f"1 Normal, {K-1} Flagged"),
    (0, K, "All Flagged"),
]

for d_n, d_f, label in examples:
    if d_n + d_f != K:
        continue
    print(f"  Disclosed: {label}")
    print(f"    Naive P(Fraud) = {naive_binary(d_n, K, p_nf, p_f):.3f}")
    for N in [10, 30, 50, 100]:
        if N > K:
            bp = bayes_binary(K, N, d_n, p_nf, p_f)
            print(f"    Bayesian P(Fraud | N={N:>3}) = {bp:.3f}")
    print()


print("Done.")

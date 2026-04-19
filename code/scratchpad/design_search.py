"""
Systematic search for good (distributions, K, N) combinations.

Goal: find distributions that are simple, not too diagnostic, and generate
high Bayesian sensitivity to N for multiple disclosed compositions.
"""

import numpy as np
from scipy.stats import binom
from scipy.special import gammaln
from itertools import product

# =============================================================================
# BAYESIAN POSTERIOR ENGINE
# =============================================================================

def ll_selection(K, N, dN, dU, dHU, probs):
    """
    Log P(disclosed = (dN,dU,dHU) | probs, manager picks best K of N).
    Manager ranking: N > U > HU (Normal is best for looking clean).
    """
    if dHU > 0:
        # Manager forced to show HU => tN = dN, tU = dU, tHU = N - dN - dU
        tHU = N - dN - dU
        if tHU < dHU:
            return -np.inf
        log_p = gammaln(N+1) - gammaln(dN+1) - gammaln(dU+1) - gammaln(tHU+1)
        if dN > 0: log_p += dN * np.log(probs[0])
        if dU > 0: log_p += dU * np.log(probs[1])
        if tHU > 0: log_p += tHU * np.log(probs[2])
        return log_p
    elif dN == K:
        # All Normal => total Normal >= K
        return np.log(max(1 - binom.cdf(K - 1, N, probs[0]), 1e-300))
    else:
        # No HU, not all Normal => tN = dN exactly, tU >= K - dN
        p_tN = binom.pmf(dN, N, probs[0])
        if p_tN <= 0:
            return -np.inf
        remaining = N - dN
        p_cond = probs[1] / (probs[1] + probs[2])
        min_tU = K - dN
        p_tU_geq = 1 - binom.cdf(min_tU - 1, remaining, p_cond)
        return np.log(max(p_tN * p_tU_geq, 1e-300))

def bayes_post(K, N, dN, dU, dHU, pf, pnf):
    log_lf = ll_selection(K, N, dN, dU, dHU, pf)
    log_lnf = ll_selection(K, N, dN, dU, dHU, pnf)
    log_ratio = log_lnf - log_lf
    if log_ratio > 700: return 0.0
    if log_ratio < -700: return 1.0
    return 1.0 / (1.0 + np.exp(log_ratio))

def naive_post(dN, dU, dHU, pf, pnf):
    log_lr = 0.0
    if dN > 0: log_lr += dN * np.log(pf[0] / pnf[0])
    if dU > 0: log_lr += dU * np.log(pf[1] / pnf[1])
    if dHU > 0: log_lr += dHU * np.log(pf[2] / pnf[2])
    if log_lr > 700: return 1.0
    if log_lr < -700: return 0.0
    return 1.0 / (1.0 + np.exp(-log_lr))

def get_counts(K, pN, pU, pHU):
    nN = round(pN * K)
    nU = round(pU * K)
    nHU = K - nN - nU
    return nN, nU, nHU

COMPOSITIONS = [
    ('T1',  1.00, 0.00, 0.00),
    ('T2',  0.67, 0.33, 0.00),
    ('T3',  0.33, 0.67, 0.00),
    ('T4',  0.00, 1.00, 0.00),
    ('T5',  0.67, 0.00, 0.33),
    ('T6',  0.33, 0.33, 0.33),
    ('T7',  0.00, 0.67, 0.33),
    ('T8',  0.33, 0.00, 0.67),
    ('T9',  0.00, 0.33, 0.67),
    ('T10', 0.00, 0.00, 1.00),
]

# =============================================================================
# SYSTEMATIC SEARCH
# =============================================================================

# Distribution candidates: (pN_nf, pU_nf, pHU_nf, pN_f, pU_f, pHU_f)
# Constraints: sum to 1, U is same for both (uninformative), simple round numbers

dist_candidates = []
for pHU_nf in [0.05, 0.10, 0.15, 0.20, 0.25]:
    for pHU_f in [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40]:
        if pHU_f <= pHU_nf:
            continue  # fraud must have more HU
        for pU in [0.20, 0.25, 0.30, 0.35, 0.40]:
            pN_nf = 1.0 - pU - pHU_nf
            pN_f = 1.0 - pU - pHU_f
            if pN_nf <= 0 or pN_f <= 0:
                continue
            if pN_nf < pN_f:
                continue  # non-fraud should have more Normal
            # Check that numbers are "nice" (multiples of 5%)
            if any(round(x*100) % 5 != 0 for x in [pN_nf, pU, pHU_nf, pN_f, pHU_f]):
                continue
            dist_candidates.append({
                'pnf': np.array([pN_nf, pU, pHU_nf]),
                'pf': np.array([pN_f, pU, pHU_f]),
                'label': f"NF={int(pN_nf*100)}/{int(pU*100)}/{int(pHU_nf*100)} F={int(pN_f*100)}/{int(pU*100)}/{int(pHU_f*100)}"
            })

K_candidates = [3, 4, 5, 6]
N_pairs = [(10, 30), (10, 50), (10, 100), (20, 60), (20, 100), (30, 100), (30, 200), (50, 200)]

print(f"Searching {len(dist_candidates)} distributions x {len(K_candidates)} K values x {len(N_pairs)} N pairs")
print(f"= {len(dist_candidates) * len(K_candidates) * len(N_pairs)} combinations\n")

# Score each combination
results = []

for dist in dist_candidates:
    pnf, pf = dist['pnf'], dist['pf']
    lr_n = pf[0] / pnf[0]
    lr_hu = pf[2] / pnf[2]
    lr_range = lr_hu / lr_n

    for K in K_candidates:
        for N_lo, N_hi in N_pairs:
            if N_lo <= K:
                continue

            deltas = []
            bayes_lo_list = []
            n_intermediate = 0  # compositions with Bayes(N_lo) in [0.2, 0.8]
            n_useful = 0  # intermediate AND delta > 0.05

            for c, pN, pU, pHU in COMPOSITIONS:
                dN, dU, dHU = get_counts(K, pN, pU, pHU)
                b_lo = bayes_post(K, N_lo, dN, dU, dHU, pf, pnf)
                b_hi = bayes_post(K, N_hi, dN, dU, dHU, pf, pnf)
                delta = b_hi - b_lo
                deltas.append(delta)
                bayes_lo_list.append(b_lo)

                if 0.2 < b_lo < 0.8:
                    n_intermediate += 1
                    if delta > 0.05:
                        n_useful += 1

            avg_delta = np.mean(deltas)
            max_delta = max(deltas)

            # Naive range
            naive_range = []
            for c, pN, pU, pHU in COMPOSITIONS:
                dN, dU, dHU = get_counts(K, pN, pU, pHU)
                naive_range.append(naive_post(dN, dU, dHU, pf, pnf))
            naive_spread = max(naive_range) - min(naive_range)

            # Score: prioritize useful compositions and large deltas
            score = n_useful * 10 + avg_delta * 100 + n_intermediate * 2

            results.append({
                'dist': dist['label'],
                'pnf': pnf, 'pf': pf,
                'K': K, 'N_lo': N_lo, 'N_hi': N_hi,
                'avg_delta': avg_delta, 'max_delta': max_delta,
                'n_intermediate': n_intermediate, 'n_useful': n_useful,
                'naive_spread': naive_spread,
                'lr_range': lr_range,
                'score': score,
            })

# Sort by score
results.sort(key=lambda x: x['score'], reverse=True)

# Print top 30
print("=" * 130)
print("TOP 30 DESIGNS")
print("=" * 130)
print(f"{'Rank':>4} {'Distribution':<35} {'K':>2} {'N_lo':>4}-{'N_hi':>4} "
      f"{'LR_rng':>6} {'AvgD':>6} {'MaxD':>6} {'#Int':>4} {'#Use':>4} "
      f"{'NvSprd':>6} {'Score':>6}")
print("-" * 130)

for i, r in enumerate(results[:30]):
    print(f"{i+1:>4} {r['dist']:<35} {r['K']:>2} {r['N_lo']:>4}-{r['N_hi']:>4} "
          f"{r['lr_range']:>6.2f} {r['avg_delta']:>6.3f} {r['max_delta']:>6.3f} "
          f"{r['n_intermediate']:>4} {r['n_useful']:>4} "
          f"{r['naive_spread']:>6.3f} {r['score']:>6.1f}")

# =============================================================================
# DEEP DIVE on top 5
# =============================================================================

print("\n\n" + "=" * 130)
print("DETAILED VIEW OF TOP 5 DESIGNS")
print("=" * 130)

for i, r in enumerate(results[:5]):
    pnf, pf = r['pnf'], r['pf']
    K, N_lo, N_hi = r['K'], r['N_lo'], r['N_hi']

    print(f"\n--- #{i+1}: {r['dist']}, K={K}, N={N_lo} vs {N_hi} ---")
    print(f"  LR(N)={pf[0]/pnf[0]:.3f}  LR(U)={pf[1]/pnf[1]:.3f}  LR(HU)={pf[2]/pnf[2]:.3f}")
    print(f"  {'Trial':<6} {'Comp':>10} {'Naive':>7} {'B(N_lo)':>8} {'B(N_hi)':>8} {'delta':>8} {'zone':>6}")

    for c, pN, pU, pHU in COMPOSITIONS:
        dN, dU, dHU = get_counts(K, pN, pU, pHU)
        nv = naive_post(dN, dU, dHU, pf, pnf)
        b_lo = bayes_post(K, N_lo, dN, dU, dHU, pf, pnf)
        b_hi = bayes_post(K, N_hi, dN, dU, dHU, pf, pnf)
        delta = b_hi - b_lo
        zone = "***" if 0.2 < b_lo < 0.8 and delta > 0.05 else ("*" if 0.2 < b_lo < 0.8 else "")
        print(f"  {c:<6} ({dN},{dU},{dHU})   {nv:>7.3f} {b_lo:>8.4f} {b_hi:>8.4f} {delta:>+8.4f} {zone:>6}")

# =============================================================================
# Also check: what if we add a THIRD N level for the best designs?
# =============================================================================

print("\n\n" + "=" * 130)
print("TOP 5 WITH THREE N LEVELS")
print("=" * 130)

for i, r in enumerate(results[:5]):
    pnf, pf = r['pnf'], r['pf']
    K = r['K']

    # Try N = {N_lo, geometric_mean, N_hi, 2*N_hi}
    N_candidates = sorted(set([10, 20, 30, 50, 100, 200, 300]))
    N_candidates = [n for n in N_candidates if n > K]

    print(f"\n--- #{i+1}: {r['dist']}, K={K} ---")
    print(f"  {'Trial':<6}", end="")
    for N in N_candidates:
        print(f" {'N='+str(N):>7}", end="")
    print()

    for c, pN, pU, pHU in COMPOSITIONS:
        dN, dU, dHU = get_counts(K, pN, pU, pHU)
        print(f"  {c:<6}", end="")
        for N in N_candidates:
            bp = bayes_post(K, N, dN, dU, dHU, pf, pnf)
            print(f" {bp:>7.3f}", end="")
        print()

print("\n\nDone.")

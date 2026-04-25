"""
Quick check: K=30 with varying N. Does the Bayesian have room to move?
"""

import numpy as np
from scipy.stats import binom
from scipy.special import gammaln

P_NF = np.array([0.60, 0.30, 0.10])
P_F  = np.array([0.40, 0.30, 0.30])

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

def get_counts(K, pN, pU, pHU):
    nN = round(pN * K)
    nU = round(pU * K)
    nHU = K - nN - nU
    return nN, nU, nHU

def compute_log_likelihood(K, N, dN, dU, dHU, probs):
    """P(disclosed=(dN,dU,dHU) | theta, manager picks best K of N)"""
    if dHU > 0:
        # Manager shows HU => couldn't avoid it. Total HU = N - dN - dU (all non-N, non-U are HU)
        # Actually: manager ranks N > U > HU. Shows best K.
        # If disclosed has dHU > 0, it means total N + total U < K.
        # So: tN = dN (all Normal shown), tU = dU (all Unusual shown),
        # and dHU = K - dN - dU forced from the HU pool.
        # Total HU in firm = N - tN - tU, and we need N - tN - tU >= dHU (always true since dHU = K - dN - dU)
        # Actually need: tN = dN exactly, tU = dU exactly, tHU = N - dN - dU
        # P(tN = dN, tU = dU | total N) = multinomial(dN, dU, N-dN-dU; N, probs)
        tHU_total = N - dN - dU
        log_p = (gammaln(N+1) - gammaln(dN+1) - gammaln(dU+1) - gammaln(tHU_total+1))
        if dN > 0: log_p += dN * np.log(probs[0])
        if dU > 0: log_p += dU * np.log(probs[1])
        if tHU_total > 0: log_p += tHU_total * np.log(probs[2])
        return log_p
    elif dN == K:
        # All Normal disclosed => total Normal >= K
        p = 1 - binom.cdf(K - 1, N, probs[0])
        return np.log(max(p, 1e-300))
    else:
        # No HU disclosed, not all Normal => tN = dN exactly, tU >= K - dN
        p_tN = binom.pmf(dN, N, probs[0])
        if p_tN <= 0:
            return -np.inf
        remaining = N - dN
        p_cond = probs[1] / (probs[1] + probs[2])
        min_tU = K - dN
        p_tU_geq = 1 - binom.cdf(min_tU - 1, remaining, p_cond)
        return np.log(max(p_tN * p_tU_geq, 1e-300))

def bayesian_posterior(K, N, dN, dU, dHU):
    log_lf = compute_log_likelihood(K, N, dN, dU, dHU, P_F)
    log_lnf = compute_log_likelihood(K, N, dN, dU, dHU, P_NF)
    log_ratio = log_lnf - log_lf
    if log_ratio > 700: return 0.0
    if log_ratio < -700: return 1.0
    return 1.0 / (1.0 + np.exp(log_ratio))

def naive_posterior(dN, dU, dHU):
    log_lr = 0.0
    if dN > 0: log_lr += dN * np.log(P_F[0] / P_NF[0])
    if dU > 0: log_lr += dU * np.log(P_F[1] / P_NF[1])
    if dHU > 0: log_lr += dHU * np.log(P_F[2] / P_NF[2])
    if log_lr > 700: return 1.0
    if log_lr < -700: return 0.0
    return 1.0 / (1.0 + np.exp(-log_lr))

# =============================================================================
# K=30, varying N
# =============================================================================

K = 30
N_values = [100, 200, 300, 500, 1000]

print("=" * 110)
print(f"K={K}, varying N: Bayesian posteriors")
print("=" * 110)
header = f"{'Trial':<6} {'Comp':<12} {'Naive':>7}"
for N in N_values:
    header += f" {'N='+str(N):>10}"
print(header)
print("-" * 110)

for c_label, pN, pU, pHU in COMPOSITIONS:
    dN, dU, dHU = get_counts(K, pN, pU, pHU)
    nv = naive_posterior(dN, dU, dHU)
    row = f"{c_label:<6} ({dN:>2},{dU:>2},{dHU:>2})  {nv:>7.4f}"
    for N in N_values:
        bp = bayesian_posterior(K, N, dN, dU, dHU)
        row += f" {bp:>10.4f}"
    print(row)

# Deltas
print("\n\nBayesian sensitivity: change from N=100 baseline")
print("-" * 110)
header = f"{'Trial':<6}"
for N in N_values[1:]:
    header += f" {'d(100->'+str(N)+')':>12}"
print(header)
print("-" * 80)

for c_label, pN, pU, pHU in COMPOSITIONS:
    dN, dU, dHU = get_counts(K, pN, pU, pHU)
    b100 = bayesian_posterior(K, 100, dN, dU, dHU)
    row = f"{c_label:<6}"
    for N in N_values[1:]:
        bp = bayesian_posterior(K, N, dN, dU, dHU)
        row += f" {bp - b100:>+12.4f}"
    print(row)

# =============================================================================
# Now try K=30 with LESS diagnostic distributions
# =============================================================================

print("\n\n" + "=" * 110)
print("ALTERNATIVE: Less diagnostic distributions")
print("What if we narrow the gap?")
print("=" * 110)

alt_dists = [
    ("Current (60/30/10 vs 40/30/30)", [0.60, 0.30, 0.10], [0.40, 0.30, 0.30]),
    ("Alt A   (55/30/15 vs 40/30/30)", [0.55, 0.30, 0.15], [0.40, 0.30, 0.30]),
    ("Alt B   (50/30/20 vs 35/30/35)", [0.50, 0.30, 0.20], [0.35, 0.30, 0.35]),
    ("Alt C   (50/30/20 vs 40/30/30)", [0.50, 0.30, 0.20], [0.40, 0.30, 0.30]),
    ("Alt D   (55/25/20 vs 40/25/35)", [0.55, 0.25, 0.20], [0.40, 0.25, 0.35]),
]

K = 30
N_values_test = [100, 200, 500]

for dist_label, pnf, pf in alt_dists:
    pnf = np.array(pnf)
    pf = np.array(pf)

    print(f"\n--- {dist_label} ---")
    print(f"  LR(N): {pf[0]/pnf[0]:.3f}   LR(U): {pf[1]/pnf[1]:.3f}   LR(HU): {pf[2]/pnf[2]:.3f}")

    header = f"  {'Trial':<6} {'Naive':>7}"
    for N in N_values_test:
        header += f" {'N='+str(N):>8}"
    for N in N_values_test[1:]:
        header += f" {'d->'+str(N):>8}"
    print(header)

    deltas_all = {N: [] for N in N_values_test[1:]}

    for c_label, ppN, ppU, ppHU in COMPOSITIONS:
        dN, dU, dHU = get_counts(K, ppN, ppU, ppHU)

        # Naive
        log_lr = 0.0
        if dN > 0: log_lr += dN * np.log(pf[0] / pnf[0])
        if dU > 0: log_lr += dU * np.log(pf[1] / pnf[1])
        if dHU > 0: log_lr += dHU * np.log(pf[2] / pnf[2])
        nv = 1.0 / (1.0 + np.exp(-log_lr)) if abs(log_lr) < 700 else (1.0 if log_lr > 0 else 0.0)

        row = f"  {c_label:<6} {nv:>7.4f}"

        bvals = {}
        for N in N_values_test:
            # Bayesian with these distributions
            log_lf = compute_log_likelihood.__wrapped__(K, N, dN, dU, dHU, pf) if hasattr(compute_log_likelihood, '__wrapped__') else _compute_ll(K, N, dN, dU, dHU, pf, pnf)
            log_lnf = compute_log_likelihood.__wrapped__(K, N, dN, dU, dHU, pnf) if hasattr(compute_log_likelihood, '__wrapped__') else 0
            # Just recompute properly
            pass

        # Actually let me just rewrite this cleanly
        bvals = {}
        for N in N_values_test:
            def _ll(K, N, dN, dU, dHU, probs):
                if dHU > 0:
                    tHU_total = N - dN - dU
                    log_p = (gammaln(N+1) - gammaln(dN+1) - gammaln(dU+1) - gammaln(tHU_total+1))
                    if dN > 0: log_p += dN * np.log(probs[0])
                    if dU > 0: log_p += dU * np.log(probs[1])
                    if tHU_total > 0: log_p += tHU_total * np.log(probs[2])
                    return log_p
                elif dN == K:
                    p = 1 - binom.cdf(K - 1, N, probs[0])
                    return np.log(max(p, 1e-300))
                else:
                    p_tN = binom.pmf(dN, N, probs[0])
                    if p_tN <= 0: return -np.inf
                    remaining = N - dN
                    p_cond = probs[1] / (probs[1] + probs[2])
                    min_tU = K - dN
                    p_tU_geq = 1 - binom.cdf(min_tU - 1, remaining, p_cond)
                    return np.log(max(p_tN * p_tU_geq, 1e-300))

            llf = _ll(K, N, dN, dU, dHU, pf)
            llnf = _ll(K, N, dN, dU, dHU, pnf)
            log_ratio = llnf - llf
            if log_ratio > 700: bp = 0.0
            elif log_ratio < -700: bp = 1.0
            else: bp = 1.0 / (1.0 + np.exp(log_ratio))
            bvals[N] = bp
            row += f" {bp:>8.4f}"

        for N in N_values_test[1:]:
            d = bvals[N] - bvals[N_values_test[0]]
            deltas_all[N].append(d)
            row += f" {d:>+8.4f}"

        print(row)

    print(f"  {'Avg':>6}", end="")
    print(f" {'':>7}", end="")
    for N in N_values_test:
        print(f" {'':>8}", end="")
    for N in N_values_test[1:]:
        print(f" {np.mean(deltas_all[N]):>+8.4f}", end="")
    print()

# =============================================================================
# WHAT IF: K=30 with different K/N ratios (not 0.3)?
# K=30 fixed, but N = 50, 100, 200, 500
# This means K/N = 0.6, 0.3, 0.15, 0.06
# =============================================================================

print("\n\n" + "=" * 110)
print("VARYING K/N RATIO: K=30 fixed, N varies from 50 to 500")
print("This changes how much the manager can cherry-pick")
print("=" * 110)

K = 30
N_values2 = [50, 100, 200, 500]

print(f"K/N ratios: {[f'{K/N:.2f}' for N in N_values2]}")
print()

header = f"{'Trial':<6} {'Comp':<12}"
for N in N_values2:
    header += f"  {'N='+str(N):>8}"
for N in N_values2[1:]:
    header += f" {'d->'+str(N):>9}"
print(header)
print("-" * 110)

all_deltas = {N: [] for N in N_values2[1:]}

for c_label, pN, pU, pHU in COMPOSITIONS:
    dN, dU, dHU = get_counts(K, pN, pU, pHU)
    nv = naive_posterior(dN, dU, dHU)

    row = f"{c_label:<6} ({dN:>2},{dU:>2},{dHU:>2})  "
    bvals = {}
    for N in N_values2:
        bp = bayesian_posterior(K, N, dN, dU, dHU)
        bvals[N] = bp
        row += f"  {bp:>8.4f}"

    for N in N_values2[1:]:
        d = bvals[N] - bvals[N_values2[0]]
        all_deltas[N].append(d)
        row += f" {d:>+9.4f}"

    print(row)

print("-" * 110)
print(f"{'Avg':>18}", end="")
for N in N_values2:
    print(f"  {'':>8}", end="")
for N in N_values2[1:]:
    print(f" {np.mean(all_deltas[N]):>+9.4f}", end="")
print()

# Also show naive posteriors for reference
print(f"\n{'Naive posteriors (K=30, all N):':}")
for c_label, pN, pU, pHU in COMPOSITIONS:
    dN, dU, dHU = get_counts(K, pN, pU, pHU)
    nv = naive_posterior(dN, dU, dHU)
    print(f"  {c_label}: naive = {nv:.6f}")

print("\n\nDone.")

"""
What happens when K and N scale proportionally?

Test 1: Fix K, vary N -> Bayesian increases (more skeptical), naive flat
Test 2: Fix K/N, scale both -> What happens to Bayesian vs naive?

The ideal: Bayesian and naive/SN move in OPPOSITE directions as (K,N) scales up.
"""

import numpy as np
from scipy.stats import binom
from scipy.special import gammaln

def ll_selection(K, N, dN, dU, dHU, probs):
    if dHU > 0:
        tHU = N - dN - dU
        if tHU < dHU:
            return -np.inf
        log_p = gammaln(N+1) - gammaln(dN+1) - gammaln(dU+1) - gammaln(tHU+1)
        if dN > 0: log_p += dN * np.log(probs[0])
        if dU > 0: log_p += dU * np.log(probs[1])
        if tHU > 0: log_p += tHU * np.log(probs[2])
        return log_p
    elif dN == K:
        return np.log(max(1 - binom.cdf(K - 1, N, probs[0]), 1e-300))
    else:
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

# Use the top design
pnf = np.array([0.35, 0.40, 0.25])
pf  = np.array([0.30, 0.40, 0.30])

# Compositions as proportions (works for any K)
COMP_PROPS = [
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

# =============================================================================
# TEST 2: Scale K and N proportionally (K/N = 0.3)
# =============================================================================

print("=" * 120)
print("SCALING K AND N TOGETHER (K/N ~ 0.3 or 0.6)")
print("Top design: NF=35/40/25  F=30/40/30")
print("=" * 120)

for ratio_label, kn_pairs in [
    ("K/N = 0.6", [(3, 5), (6, 10), (12, 20), (18, 30), (30, 50), (60, 100)]),
    ("K/N = 0.3", [(3, 10), (6, 20), (9, 30), (15, 50), (30, 100), (60, 200)]),
    ("K/N = 0.2", [(4, 20), (6, 30), (10, 50), (20, 100), (40, 200)]),
]:
    print(f"\n\n{'='*120}")
    print(f"  {ratio_label}")
    print(f"{'='*120}")

    for c_label, pN, pU, pHU in COMP_PROPS:
        print(f"\n  {c_label}: ", end="")
        for K, N in kn_pairs:
            dN, dU, dHU = get_counts(K, pN, pU, pHU)
            bp = bayes_post(K, N, dN, dU, dHU, pf, pnf)
            nv = naive_post(dN, dU, dHU, pf, pnf)
            print(f"  K={K:>2}/N={N:>3}: B={bp:.3f} Nv={nv:.3f}", end="")
        print()

    # Summary: direction of movement
    print(f"\n  --- Direction summary for {ratio_label} ---")
    print(f"  {'Trial':<6}", end="")
    for K, N in kn_pairs:
        print(f" {'K='+str(K):>6}", end="")
    print(f"  {'B_dir':>6} {'N_dir':>6} {'Oppose?':>8}")

    for c_label, pN, pU, pHU in COMP_PROPS:
        bvals = []
        nvals = []
        for K, N in kn_pairs:
            dN, dU, dHU = get_counts(K, pN, pU, pHU)
            bvals.append(bayes_post(K, N, dN, dU, dHU, pf, pnf))
            nvals.append(naive_post(dN, dU, dHU, pf, pnf))

        b_change = bvals[-1] - bvals[0]
        n_change = nvals[-1] - nvals[0]
        opposing = "YES" if b_change * n_change < -0.01 else ("weak" if b_change * n_change < 0 else "no")

        print(f"  {c_label:<6}", end="")
        for bp in bvals:
            print(f" {bp:>6.3f}", end="")
        print(f"  {b_change:>+6.3f} {n_change:>+6.3f} {opposing:>8}")


# =============================================================================
# FIND THE SWEET SPOT: which compositions have opposing movements?
# =============================================================================

print("\n\n" + "=" * 120)
print("WHICH COMPOSITIONS SHOW OPPOSING BAYESIAN vs NAIVE MOVEMENT?")
print("=" * 120)

# Try multiple distributions and K/N ratios
test_dists = [
    ("NF=35/40/25 F=30/40/30", np.array([0.35, 0.40, 0.25]), np.array([0.30, 0.40, 0.30])),
    ("NF=40/35/25 F=35/35/30", np.array([0.40, 0.35, 0.25]), np.array([0.35, 0.35, 0.30])),
    ("NF=45/30/25 F=40/30/30", np.array([0.45, 0.30, 0.25]), np.array([0.40, 0.30, 0.30])),
    ("NF=50/25/25 F=45/25/30", np.array([0.50, 0.25, 0.25]), np.array([0.45, 0.25, 0.30])),
]

test_kn = [
    ("K/N=0.6", [(3, 5), (6, 10), (12, 20), (30, 50)]),
    ("K/N=0.3", [(3, 10), (6, 20), (12, 40), (30, 100)]),
    ("K/N=0.2", [(4, 20), (8, 40), (20, 100), (40, 200)]),
]

for dist_label, pnf_t, pf_t in test_dists:
    for ratio_label, kn_pairs in test_kn:
        n_opposing = 0
        max_oppose = 0
        for c_label, pN, pU, pHU in COMP_PROPS:
            bvals = []
            nvals = []
            for K, N in kn_pairs:
                dN, dU, dHU = get_counts(K, pN, pU, pHU)
                bvals.append(bayes_post(K, N, dN, dU, dHU, pf_t, pnf_t))
                nvals.append(naive_post(dN, dU, dHU, pf_t, pnf_t))
            b_change = bvals[-1] - bvals[0]
            n_change = nvals[-1] - nvals[0]
            if b_change * n_change < -0.01:
                n_opposing += 1
                max_oppose = max(max_oppose, min(abs(b_change), abs(n_change)))

        if n_opposing > 0:
            print(f"  {dist_label:<30} {ratio_label:<12} "
                  f"opposing: {n_opposing}/10  max_min_effect: {max_oppose:.3f}")


# =============================================================================
# DETAILED: Best opposing-direction designs
# =============================================================================

print("\n\n" + "=" * 120)
print("DETAILED: NF=35/40/25 F=30/40/30, K/N=0.6, scaling from K=3 to K=30")
print("=" * 120)

pnf_d = np.array([0.35, 0.40, 0.25])
pf_d  = np.array([0.30, 0.40, 0.30])
kn = [(3, 5), (6, 10), (12, 20), (18, 30), (30, 50)]

print(f"\n{'Trial':<6} {'Comp':<10}", end="")
for K, N in kn:
    print(f"  {'B('+str(K)+'/'+str(N)+')':>10} {'Nv':>6}", end="")
print(f"  {'B_chg':>6} {'Nv_chg':>6}")
print("-" * 130)

for c_label, pN, pU, pHU in COMP_PROPS:
    bvals = []
    nvals = []
    for K, N in kn:
        dN, dU, dHU = get_counts(K, pN, pU, pHU)
        bvals.append(bayes_post(K, N, dN, dU, dHU, pf_d, pnf_d))
        nvals.append(naive_post(dN, dU, dHU, pf_d, pnf_d))

    dN0, dU0, dHU0 = get_counts(kn[0][0], pN, pU, pHU)
    print(f"{c_label:<6} ({pN:.0%},{pU:.0%},{pHU:.0%}) ", end="")
    for i, (K, N) in enumerate(kn):
        print(f"  {bvals[i]:>10.3f} {nvals[i]:>6.3f}", end="")
    b_chg = bvals[-1] - bvals[0]
    n_chg = nvals[-1] - nvals[0]
    marker = " <-- OPPOSING" if b_chg * n_chg < -0.01 else ""
    print(f"  {b_chg:>+6.3f} {n_chg:>+6.3f}{marker}")


# =============================================================================
# WHAT ABOUT K/N = 0.3 with the same distributions?
# =============================================================================

print("\n\n" + "=" * 120)
print("DETAILED: NF=35/40/25 F=30/40/30, K/N=0.3, scaling from K=3 to K=30")
print("=" * 120)

kn = [(3, 10), (6, 20), (9, 30), (15, 50), (30, 100)]

print(f"\n{'Trial':<6} {'Comp':<10}", end="")
for K, N in kn:
    print(f"  {'B('+str(K)+'/'+str(N)+')':>10} {'Nv':>6}", end="")
print(f"  {'B_chg':>6} {'Nv_chg':>6}")
print("-" * 130)

for c_label, pN, pU, pHU in COMP_PROPS:
    bvals = []
    nvals = []
    for K, N in kn:
        dN, dU, dHU = get_counts(K, pN, pU, pHU)
        bvals.append(bayes_post(K, N, dN, dU, dHU, pf_d, pnf_d))
        nvals.append(naive_post(dN, dU, dHU, pf_d, pnf_d))

    print(f"{c_label:<6} ({pN:.0%},{pU:.0%},{pHU:.0%}) ", end="")
    for i, (K, N) in enumerate(kn):
        print(f"  {bvals[i]:>10.3f} {nvals[i]:>6.3f}", end="")
    b_chg = bvals[-1] - bvals[0]
    n_chg = nvals[-1] - nvals[0]
    marker = " <-- OPPOSING" if b_chg * n_chg < -0.01 else ""
    print(f"  {b_chg:>+6.3f} {n_chg:>+6.3f}{marker}")


print("\n\nDone.")

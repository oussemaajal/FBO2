"""
K=30 sensitivity analysis, clean version.
Shows: (1) K=30 is WORSE, (2) what distributions would work, (3) power analysis.
"""

import numpy as np
from scipy.stats import binom, norm
from scipy.special import gammaln

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

def ll(K, N, dN, dU, dHU, probs):
    """Log-likelihood of disclosed (dN,dU,dHU) given manager picks best K of N."""
    if dHU > 0:
        tHU_total = N - dN - dU
        if tHU_total < dHU:
            return -np.inf
        log_p = gammaln(N+1) - gammaln(dN+1) - gammaln(dU+1) - gammaln(tHU_total+1)
        if dN > 0: log_p += dN * np.log(probs[0])
        if dU > 0: log_p += dU * np.log(probs[1])
        if tHU_total > 0: log_p += tHU_total * np.log(probs[2])
        return log_p
    elif dN == K:
        p = 1 - binom.cdf(K - 1, N, probs[0])
        return np.log(max(p, 1e-300))
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
    log_lf = ll(K, N, dN, dU, dHU, pf)
    log_lnf = ll(K, N, dN, dU, dHU, pnf)
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

# =============================================================================
# THE CORE PROBLEM: K=30, N=100 already saturated
# =============================================================================

print("=" * 100)
print("WHY K=30 MAKES IT WORSE")
print("=" * 100)

pnf = np.array([0.60, 0.30, 0.10])
pf  = np.array([0.40, 0.30, 0.30])

print("\nK=30, N=100 vs N=200 vs N=500:")
print(f"{'Trial':<6} {'Comp':<12} {'Naive':>8} {'B(100)':>8} {'B(200)':>8} {'B(500)':>8} {'delta':>8}")
print("-" * 70)

for c, pN, pU, pHU in COMPOSITIONS:
    dN, dU, dHU = get_counts(30, pN, pU, pHU)
    nv = naive_post(dN, dU, dHU, pf, pnf)
    b100 = bayes_post(30, 100, dN, dU, dHU, pf, pnf)
    b200 = bayes_post(30, 200, dN, dU, dHU, pf, pnf)
    b500 = bayes_post(30, 500, dN, dU, dHU, pf, pnf)
    print(f"{c:<6} ({dN:>2},{dU:>2},{dHU:>2}) {nv:>8.4f} {b100:>8.4f} {b200:>8.4f} {b500:>8.4f} {b500-b100:>+8.4f}")

print("""
DIAGNOSIS: With K=30, even T2 (20N,10U,0HU) is Bayesian = 1.000 at N=100.
The manager showed 30 transactions and couldn't find 30 Normal -- that's
devastating evidence with 30 draws. Only T1 (all Normal) is ambiguous,
and even that's at 0.496 with ~0 sensitivity to N.

The problem isn't K/N ratio. It's that K=30 transactions provide so much
information that only the "perfect" disclosed set (all Normal) is ambiguous.
""")

# =============================================================================
# K=30, N=50 vs N=100 vs N=200 (different ratio, K/N = 0.6 -> 0.3 -> 0.15)
# =============================================================================

print("=" * 100)
print("WHAT ABOUT VARYING K/N RATIO? K=30, N from 50 to 500")
print("=" * 100)

N_vals = [50, 100, 200, 500]
print(f"\nK/N ratios: {[f'{30/N:.0%}' for N in N_vals]}")
print(f"{'Trial':<6} {'Comp':<12}", end="")
for N in N_vals:
    print(f" {'N='+str(N):>8}", end="")
print(f" {'d(50-500)':>10}")
print("-" * 85)

useful_deltas = []
for c, pN, pU, pHU in COMPOSITIONS:
    dN, dU, dHU = get_counts(30, pN, pU, pHU)
    row = f"{c:<6} ({dN:>2},{dU:>2},{dHU:>2})"
    bvals = []
    for N in N_vals:
        bp = bayes_post(30, N, dN, dU, dHU, pf, pnf)
        bvals.append(bp)
        row += f" {bp:>8.4f}"
    delta = bvals[-1] - bvals[0]
    useful_deltas.append(delta)
    row += f" {delta:>+10.4f}"
    print(row)

print(f"\nAverage delta: {np.mean(useful_deltas):+.4f}")
print(f"Only T1 contributes. Everything else is at ceiling.\n")

# =============================================================================
# THE REAL SOLUTION: Adjust distributions
# =============================================================================

print("=" * 100)
print("SOLUTION: LESS DIAGNOSTIC DISTRIBUTIONS")
print("=" * 100)

print("""
The problem: HU likelihood ratio = 3.0 (0.30/0.10), N likelihood ratio = 0.67 (0.40/0.60).
With K=3, a single HU is a 3:1 signal. With K=30, 10 HU transactions is a 3^10 = 59049:1 signal.
No room for any Bayesian movement.

We need distributions where:
1. The per-transaction likelihood ratio is closer to 1
2. Multiple compositions produce intermediate Bayesian posteriors (0.3-0.7)
3. Those posteriors MOVE as N increases
""")

alt_dists = [
    ("Current:     60/30/10 vs 40/30/30", [0.60, 0.30, 0.10], [0.40, 0.30, 0.30]),
    ("Alt A:       55/30/15 vs 45/30/25", [0.55, 0.30, 0.15], [0.45, 0.30, 0.25]),
    ("Alt B:       52/30/18 vs 45/30/25", [0.52, 0.30, 0.18], [0.45, 0.30, 0.25]),
    ("Alt C:       50/30/20 vs 40/30/30", [0.50, 0.30, 0.20], [0.40, 0.30, 0.30]),
    ("Alt D:       50/35/15 vs 40/35/25", [0.50, 0.35, 0.15], [0.40, 0.35, 0.25]),
    ("Alt E:       55/30/15 vs 50/30/20", [0.55, 0.30, 0.15], [0.50, 0.30, 0.20]),
]

K = 3
N_vals = [10, 50, 100]

for label, pnf_alt, pf_alt in alt_dists:
    pnf_a = np.array(pnf_alt)
    pf_a = np.array(pf_alt)

    lr_n = pf_a[0]/pnf_a[0]
    lr_u = pf_a[1]/pnf_a[1]
    lr_hu = pf_a[2]/pnf_a[2]

    print(f"\n--- {label} ---")
    print(f"  LR(N)={lr_n:.3f}  LR(U)={lr_u:.3f}  LR(HU)={lr_hu:.3f}  "
          f"LR_range={lr_hu/lr_n:.2f}x")

    print(f"  {'Trial':<6} {'Naive':>7}", end="")
    for N in N_vals:
        print(f" {'B(N='+str(N)+')':>9}", end="")
    print(f" {'d(10-100)':>10} {'in range?':>10}")

    deltas = []
    n_useful = 0
    for c, pN, pU, pHU in COMPOSITIONS:
        dN, dU, dHU = get_counts(K, pN, pU, pHU)
        nv = naive_post(dN, dU, dHU, pf_a, pnf_a)
        bvals = []
        for N in N_vals:
            bp = bayes_post(K, N, dN, dU, dHU, pf_a, pnf_a)
            bvals.append(bp)
        delta = bvals[-1] - bvals[0]
        deltas.append(delta)

        useful = 0.15 < bvals[0] < 0.85 or 0.15 < bvals[-1] < 0.85
        if useful and abs(delta) > 0.02:
            n_useful += 1
            mark = "***"
        elif useful:
            mark = "*"
        else:
            mark = ""

        print(f"  {c:<6} {nv:>7.3f}", end="")
        for bp in bvals:
            print(f" {bp:>9.4f}", end="")
        print(f" {delta:>+10.4f} {mark:>10}")

    print(f"  Average delta: {np.mean(deltas):+.4f}, useful compositions: {n_useful}/10")

# =============================================================================
# BEST CANDIDATE: deeper analysis
# =============================================================================

print("\n\n" + "=" * 100)
print("DEEP DIVE: Alt E (55/30/15 vs 50/30/20) -- least diagnostic")
print("=" * 100)

pnf_e = np.array([0.55, 0.30, 0.15])
pf_e  = np.array([0.50, 0.30, 0.20])

for K in [3, 5, 10]:
    N_vals = [K*3, K*10, K*30, K*100]
    N_vals = [n for n in N_vals if n <= 1000]

    print(f"\n  K={K}:")
    print(f"  {'Trial':<6}", end="")
    for N in N_vals:
        print(f" {'N='+str(N):>8}", end="")
    print(f" {'d(lo-hi)':>9}")

    deltas = []
    for c, pN, pU, pHU in COMPOSITIONS:
        dN, dU, dHU = get_counts(K, pN, pU, pHU)
        bvals = []
        for N in N_vals:
            bp = bayes_post(K, N, dN, dU, dHU, pf_e, pnf_e)
            bvals.append(bp)
        delta = bvals[-1] - bvals[0]
        deltas.append(delta)

        print(f"  {c:<6}", end="")
        for bp in bvals:
            print(f" {bp:>8.4f}", end="")
        print(f" {delta:>+9.4f}")

    print(f"  Avg delta: {np.mean(deltas):+.4f}")

# =============================================================================
# POWER ANALYSIS for best design
# =============================================================================

print("\n\n" + "=" * 100)
print("POWER ANALYSIS: Best candidate design")
print("=" * 100)

# Use Alt E distributions with K=3, N=10 vs N=100
pnf_best = np.array([0.55, 0.30, 0.15])
pf_best  = np.array([0.50, 0.30, 0.20])
K_best = 3

N_lo, N_hi = 10, 100

print(f"\nDistributions: NF={list(pnf_best)}, F={list(pf_best)}")
print(f"K={K_best}, N_lo={N_lo}, N_hi={N_hi}")
print()

# Compute deltas
deltas = []
naives = []
b_lo_list = []
b_hi_list = []

for c, pN, pU, pHU in COMPOSITIONS:
    dN, dU, dHU = get_counts(K_best, pN, pU, pHU)
    nv = naive_post(dN, dU, dHU, pf_best, pnf_best)
    b_lo = bayes_post(K_best, N_lo, dN, dU, dHU, pf_best, pnf_best)
    b_hi = bayes_post(K_best, N_hi, dN, dU, dHU, pf_best, pnf_best)
    delta = b_hi - b_lo
    deltas.append(delta)
    naives.append(nv)
    b_lo_list.append(b_lo)
    b_hi_list.append(b_hi)
    print(f"  {c}: naive={nv:.3f}  B(N={N_lo})={b_lo:.4f}  B(N={N_hi})={b_hi:.4f}  delta={delta:+.4f}")

avg_delta = np.mean(deltas)
print(f"\nAverage Bayesian delta: {avg_delta:.4f} ({avg_delta*100:.1f}pp)")

# Analytical power
def required_n(effect, sd_participant, alpha=0.05, power=0.80):
    z_a = norm.ppf(1 - alpha / 2)
    z_b = norm.ppf(power)
    return int(np.ceil(((z_a + z_b) * sd_participant / effect) ** 2))

C = 10
print(f"\nAnalytical power (one-sample t-test on participant average difference):")
print(f"{'beta':>6} {'sigma':>6} {'rho':>6} | {'Effect':>8} {'SD_part':>8} {'d':>7} {'n(80%)':>8} {'n(90%)':>8}")
print("-" * 75)
for beta in [0.2, 0.3, 0.5, 1.0]:
    for sigma in [0.10, 0.15, 0.20]:
        for rho in [0.3, 0.5, 0.7]:
            effect = beta * avg_delta
            sd_part = sigma * np.sqrt(2*(1-rho)/C)
            d = effect / sd_part
            n80 = required_n(effect, sd_part, power=0.80)
            n90 = required_n(effect, sd_part, power=0.90)
            print(f"{beta:>6.1f} {sigma:>6.2f} {rho:>6.1f} | {effect:>8.4f} {sd_part:>8.4f} {d:>7.3f} {n80:>8d} {n90:>8d}")
    print()

# Simulation-based power
print("\nSimulation-based power (2000 sims, beta=0.3, sigma=0.15, rho=0.5):")
np.random.seed(42)
n_sims = 2000
beta_true = 0.3
sigma_true = 0.15
rho_true = 0.5

deltas_arr = np.array(deltas)
naives_arr = np.array(naives)
b_lo_arr = np.array(b_lo_list)
b_hi_arr = np.array(b_hi_list)

for n_part in [30, 50, 80, 100, 150, 200, 300, 500]:
    rejections = 0
    for _ in range(n_sims):
        betas = np.clip(np.random.normal(beta_true, 0.15, n_part), 0, 1)
        part_avgs = []
        for i in range(n_part):
            bi = betas[i]
            diffs = []
            for c in range(10):
                mu_lo = (1 - bi) * naives_arr[c] + bi * b_lo_arr[c]
                mu_hi = (1 - bi) * naives_arr[c] + bi * b_hi_arr[c]
                e1 = np.random.normal(0, sigma_true)
                e2 = rho_true * e1 + np.sqrt(1 - rho_true**2) * np.random.normal(0, sigma_true)
                r_lo = np.clip(mu_lo + e1, 0, 1)
                r_hi = np.clip(mu_hi + e2, 0, 1)
                diffs.append(r_hi - r_lo)
            part_avgs.append(np.mean(diffs))

        avg = np.mean(part_avgs)
        se = np.std(part_avgs, ddof=1) / np.sqrt(n_part)
        if abs(avg / se) > 1.96:
            rejections += 1

    power = rejections / n_sims
    print(f"  n={n_part:>4d}: power={power:.3f} {'*** >= 80%' if power >= 0.80 else '    >= 90%' if power >= 0.90 else ''}")

print("\n\nDone.")

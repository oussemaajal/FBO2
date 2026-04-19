"""
Full power analysis for binary design.
Also: is 50/45 really the best, or are there other sweet spots?
"""

import numpy as np
from scipy.stats import binom, norm

def bayes_binary(K, N, d_normal, p_nf, p_f):
    d_flagged = K - d_normal
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


# =============================================================================
# COMPREHENSIVE SEARCH: (p_nf, p_f, K, N_lo, N_hi)
# =============================================================================

print("=" * 120)
print("COMPREHENSIVE BINARY DESIGN SEARCH")
print("=" * 120)

results = []

for p_nf in np.arange(0.45, 0.85, 0.05):
    for gap in np.arange(0.05, 0.25, 0.05):
        p_f = round(p_nf - gap, 2)
        p_nf_r = round(p_nf, 2)
        if p_f < 0.20:
            continue

        for K in range(3, 16):
            for N_lo in [K+2, K+4, 2*K, 3*K]:
                N_lo = max(N_lo, K+2)
                for N_hi in [3*K, 5*K, 10*K, 20*K]:
                    if N_hi <= N_lo:
                        continue
                    if N_hi > 300:
                        continue

                    # Compute metrics
                    comps = list(range(K + 1))
                    n_intermediate = 0
                    n_useful = 0
                    deltas = []
                    b_lo_vals = []
                    naive_vals = []

                    for d_n in comps:
                        b_lo = bayes_binary(K, N_lo, d_n, p_nf_r, p_f)
                        b_hi = bayes_binary(K, N_hi, d_n, p_nf_r, p_f)
                        nv = naive_binary(d_n, K, p_nf_r, p_f)
                        delta = b_hi - b_lo
                        deltas.append(delta)
                        b_lo_vals.append(b_lo)
                        naive_vals.append(nv)

                        if 0.15 < b_lo < 0.85:
                            n_intermediate += 1
                            if delta > 0.05:
                                n_useful += 1

                    avg_delta = np.mean(deltas)
                    naive_range = max(naive_vals) - min(naive_vals)

                    # Fraction of compositions that are "workable"
                    frac_useful = n_useful / len(comps)

                    if n_useful >= 3:
                        results.append({
                            'p_nf': p_nf_r, 'p_f': p_f, 'gap': gap,
                            'K': K, 'N_lo': N_lo, 'N_hi': N_hi,
                            'n_useful': n_useful, 'frac_useful': frac_useful,
                            'avg_delta': avg_delta,
                            'naive_range': naive_range,
                            'n_comps': len(comps),
                        })

# Sort by: useful compositions (primary), then avg_delta (secondary)
results.sort(key=lambda x: (x['n_useful'], x['avg_delta']), reverse=True)

print(f"\n{len(results)} viable designs found.\n")
print(f"{'#':>3} {'p_NF':>5} {'p_F':>5} {'gap':>4} {'K':>3} {'N_lo':>4} {'N_hi':>5} "
      f"{'#Use':>4}/{' C':>2} {'AvgD':>6} {'NvRng':>6}")
print("-" * 75)
for i, r in enumerate(results[:30]):
    print(f"{i+1:>3} {r['p_nf']:>5.2f} {r['p_f']:>5.2f} {r['gap']:>4.2f} "
          f"{r['K']:>3} {r['N_lo']:>4} {r['N_hi']:>5} "
          f"{r['n_useful']:>4}/{r['n_comps']:>2} {r['avg_delta']:>6.3f} {r['naive_range']:>6.3f}")


# =============================================================================
# DETAILED VIEW OF TOP 3
# =============================================================================

print("\n\n" + "=" * 120)
print("DETAILED TOP 3")
print("=" * 120)

for rank, r in enumerate(results[:3]):
    p_nf, p_f, K = r['p_nf'], r['p_f'], r['K']
    N_lo, N_hi = r['N_lo'], r['N_hi']
    N_mid = (N_lo + N_hi) // 2

    print(f"\n--- #{rank+1}: p_NF={p_nf}, p_F={p_f} (gap={r['gap']:.2f}), "
          f"K={K}, N={N_lo}/{N_mid}/{N_hi} ---")
    print(f"  LR(Normal)={p_f/p_nf:.3f}  LR(Flagged)={(1-p_f)/(1-p_nf):.3f}")
    print(f"  {'d_N':>4} {'d_F':>4} {'Naive':>7} {'B(lo)':>8} {'B(mid)':>8} {'B(hi)':>8} "
          f"{'d(lo-hi)':>9} {'zone':>5}")

    for d_n in range(K + 1):
        d_f = K - d_n
        nv = naive_binary(d_n, K, p_nf, p_f)
        b_lo = bayes_binary(K, N_lo, d_n, p_nf, p_f)
        b_mid = bayes_binary(K, N_mid, d_n, p_nf, p_f)
        b_hi = bayes_binary(K, N_hi, d_n, p_nf, p_f)
        delta = b_hi - b_lo
        zone = "***" if 0.15 < b_lo < 0.85 and delta > 0.05 else ""
        print(f"  {d_n:>4} {d_f:>4} {nv:>7.3f} {b_lo:>8.4f} {b_mid:>8.4f} {b_hi:>8.4f} "
              f"{delta:>+9.4f} {zone:>5}")


# =============================================================================
# POWER ANALYSIS for the top design
# =============================================================================

print("\n\n" + "=" * 120)
print("POWER ANALYSIS")
print("=" * 120)

r = results[0]
p_nf, p_f, K = r['p_nf'], r['p_f'], r['K']
N_lo, N_hi = r['N_lo'], r['N_hi']

print(f"\nDesign: p_NF={p_nf}, p_F={p_f}, K={K}, N_lo={N_lo}, N_hi={N_hi}")

# Compute all deltas
deltas = []
naive_vals = []
b_lo_vals = []
b_hi_vals = []
for d_n in range(K + 1):
    nv = naive_binary(d_n, K, p_nf, p_f)
    b_lo = bayes_binary(K, N_lo, d_n, p_nf, p_f)
    b_hi = bayes_binary(K, N_hi, d_n, p_nf, p_f)
    deltas.append(b_hi - b_lo)
    naive_vals.append(nv)
    b_lo_vals.append(b_lo)
    b_hi_vals.append(b_hi)

C = K + 1  # number of compositions
avg_delta = np.mean(deltas)
print(f"Compositions: {C}, Average Bayesian delta: {avg_delta:.4f} ({avg_delta*100:.1f}pp)")

# Analytical power
def required_n(effect, sd_participant, alpha=0.05, power=0.80):
    z_a = norm.ppf(1 - alpha / 2)
    z_b = norm.ppf(power)
    return int(np.ceil(((z_a + z_b) * sd_participant / effect) ** 2))

print(f"\nAnalytical power (one-sample t-test on participant-level sensitivity):")
print(f"{'beta':>6} {'sigma':>6} {'rho':>5} | {'Effect':>8} {'SD_part':>8} {'d':>7} {'n(80%)':>7} {'n(90%)':>7}")
print("-" * 70)

for beta in [0.10, 0.20, 0.30, 0.50]:
    for sigma in [0.10, 0.15, 0.20]:
        for rho in [0.3, 0.5, 0.7]:
            effect = beta * avg_delta
            sd_part = sigma * np.sqrt(2 * (1 - rho) / C)
            d = effect / sd_part
            n80 = required_n(effect, sd_part, power=0.80)
            n90 = required_n(effect, sd_part, power=0.90)
            if beta in [0.20, 0.30]:
                print(f"{beta:>6.2f} {sigma:>6.2f} {rho:>5.1f} | "
                      f"{effect:>8.4f} {sd_part:>8.4f} {d:>7.2f} {n80:>7d} {n90:>7d}")
    if beta in [0.20, 0.30]:
        print()

# Simulation
print("Simulation-based power (2000 sims, beta=0.20, sigma=0.15, rho=0.5):")
np.random.seed(42)
n_sims = 2000
beta_true = 0.20
sigma_true = 0.15
rho_true = 0.5

deltas_arr = np.array(deltas)
naive_arr = np.array(naive_vals)
b_lo_arr = np.array(b_lo_vals)
b_hi_arr = np.array(b_hi_vals)

for n_part in [15, 20, 30, 50, 80, 100, 150]:
    rejections = 0
    for _ in range(n_sims):
        betas = np.clip(np.random.normal(beta_true, 0.10, n_part), 0, 1)
        part_avgs = []
        for p in range(n_part):
            bi = betas[p]
            diffs = []
            for c in range(C):
                mu_lo = (1 - bi) * naive_arr[c] + bi * b_lo_arr[c]
                mu_hi = (1 - bi) * naive_arr[c] + bi * b_hi_arr[c]
                e1 = np.random.normal(0, sigma_true)
                e2 = rho_true * e1 + np.sqrt(1 - rho_true**2) * np.random.normal(0, sigma_true)
                r_lo = np.clip(mu_lo + e1, 0, 1)
                r_hi = np.clip(mu_hi + e2, 0, 1)
                diffs.append(r_hi - r_lo)
            part_avgs.append(np.mean(diffs))

        avg = np.mean(part_avgs)
        se = np.std(part_avgs, ddof=1) / np.sqrt(n_part)
        if se > 0 and abs(avg / se) > 1.96:
            rejections += 1

    power = rejections / n_sims
    mark = " *** >= 80%" if power >= 0.80 else (" ** >= 90%" if power >= 0.90 else "")
    print(f"  n={n_part:>4d}: power={power:.3f}{mark}")


# =============================================================================
# SUMMARY TABLE: the clean recommendation
# =============================================================================

print("\n\n" + "=" * 120)
print("DESIGN RECOMMENDATION SUMMARY")
print("=" * 120)

# Show top 3 with different K values
print("\nTop designs at each K level:")
seen_K = set()
for r in results:
    K = r['K']
    if K in seen_K:
        continue
    if K > 12:
        continue
    seen_K.add(K)

    print(f"\n  K={K}: p_NF={r['p_nf']}, p_F={r['p_f']} (gap={r['gap']:.2f}), "
          f"N={r['N_lo']}-{r['N_hi']}, "
          f"useful={r['n_useful']}/{r['n_comps']}, avg_delta={r['avg_delta']:.3f}")

    # Quick power calc for this design
    ds = []
    for d_n in range(K + 1):
        b_lo = bayes_binary(K, r['N_lo'], d_n, r['p_nf'], r['p_f'])
        b_hi = bayes_binary(K, r['N_hi'], d_n, r['p_nf'], r['p_f'])
        ds.append(b_hi - b_lo)
    ad = np.mean(ds)
    C_k = K + 1
    # Conservative: beta=0.20, sigma=0.20, rho=0.3
    eff = 0.20 * ad
    sd = 0.20 * np.sqrt(2 * 0.7 / C_k)
    n80 = required_n(eff, sd, power=0.80) if eff > 0 else 9999
    # Moderate: beta=0.30, sigma=0.15, rho=0.5
    eff2 = 0.30 * ad
    sd2 = 0.15 * np.sqrt(2 * 0.5 / C_k)
    n80_m = required_n(eff2, sd2, power=0.80) if eff2 > 0 else 9999
    print(f"    n for 80% power: conservative={n80}, moderate={n80_m}")
    print(f"    Trials per participant: {C_k} comps x 2 N-levels = {C_k * 2} "
          f"(or x 3 N-levels = {C_k * 3})")

print("\n\nDone.")

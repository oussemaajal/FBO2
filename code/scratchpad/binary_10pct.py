"""
Binary design with 10% increments only.
Oussema's suggestion: NF 50/50, F 40/60.
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

def required_n_power(effect, sd_participant, alpha=0.05, power=0.80):
    z_a = norm.ppf(1 - alpha / 2)
    z_b = norm.ppf(power)
    return int(np.ceil(((z_a + z_b) * sd_participant / effect) ** 2))


# =============================================================================
# ALL 10% INCREMENT DISTRIBUTIONS
# =============================================================================

print("=" * 120)
print("BINARY DESIGNS WITH 10% INCREMENTS ONLY")
print("=" * 120)

# p_normal for non-fraud and fraud, multiples of 10%
dists_10 = []
for p_nf in [0.50, 0.60, 0.70, 0.80]:
    for p_f in [0.20, 0.30, 0.40, 0.50, 0.60, 0.70]:
        if p_f >= p_nf:
            continue
        gap = p_nf - p_f
        dists_10.append((p_nf, p_f, gap))

print(f"\nDistributions to test: {len(dists_10)}")
for p_nf, p_f, gap in dists_10:
    lr_n = p_f / p_nf
    lr_f = (1 - p_f) / (1 - p_nf)
    print(f"  NF: {int(p_nf*100)}/{int((1-p_nf)*100)}, "
          f"F: {int(p_f*100)}/{int((1-p_f)*100)}  "
          f"gap={int(gap*100)}%  LR(N)={lr_n:.3f}  LR(F)={lr_f:.3f}")

# =============================================================================
# FOR EACH DISTRIBUTION, FIND OPTIMAL K AND N
# =============================================================================

print("\n\n" + "=" * 120)
print("OPTIMAL K AND N FOR EACH DISTRIBUTION")
print("=" * 120)

all_results = []

for p_nf, p_f, gap in dists_10:
    best_for_dist = None

    for K in range(3, 20):
        for N_lo in [K + 2, K + 5, 2 * K, 3 * K]:
            N_lo = max(N_lo, K + 2)
            for N_hi_mult in [3, 5, 10, 15, 20]:
                N_hi = N_hi_mult * K
                if N_hi <= N_lo or N_hi > 300:
                    continue

                comps = list(range(K + 1))
                n_useful = 0
                deltas = []

                for d_n in comps:
                    b_lo = bayes_binary(K, N_lo, d_n, p_nf, p_f)
                    b_hi = bayes_binary(K, N_hi, d_n, p_nf, p_f)
                    delta = b_hi - b_lo
                    deltas.append(delta)
                    if 0.15 < b_lo < 0.85 and delta > 0.05:
                        n_useful += 1

                avg_delta = np.mean(deltas)
                score = n_useful * 10 + avg_delta * 100

                if best_for_dist is None or score > best_for_dist['score']:
                    best_for_dist = {
                        'p_nf': p_nf, 'p_f': p_f, 'gap': gap,
                        'K': K, 'N_lo': N_lo, 'N_hi': N_hi,
                        'n_useful': n_useful, 'n_comps': len(comps),
                        'avg_delta': avg_delta, 'score': score,
                    }

    if best_for_dist and best_for_dist['n_useful'] >= 2:
        all_results.append(best_for_dist)

all_results.sort(key=lambda x: x['score'], reverse=True)

print(f"\n{'#':>3} {'Distribution':>20} {'gap':>4} {'K':>3} {'N_lo':>4}-{'N_hi':>4} "
      f"{'#Use':>4}/{' C':>2} {'AvgD':>6} {'Score':>6}")
print("-" * 80)
for i, r in enumerate(all_results):
    label = f"NF:{int(r['p_nf']*100)}/{int((1-r['p_nf'])*100)} F:{int(r['p_f']*100)}/{int((1-r['p_f'])*100)}"
    print(f"{i+1:>3} {label:>20} {r['gap']:>4.0%} {r['K']:>3} {r['N_lo']:>4}-{r['N_hi']:>4} "
          f"{r['n_useful']:>4}/{r['n_comps']:>2} {r['avg_delta']:>6.3f} {r['score']:>6.1f}")


# =============================================================================
# DETAILED VIEW: Oussema's suggestion (50/50 vs 40/60) and top alternatives
# =============================================================================

print("\n\n" + "=" * 120)
print("DETAILED VIEWS")
print("=" * 120)

# Show detailed for each top result
for i, r in enumerate(all_results[:6]):
    p_nf, p_f, K = r['p_nf'], r['p_f'], r['K']
    N_lo, N_hi = r['N_lo'], r['N_hi']

    # Pick 3 N levels
    N_mid = (N_lo + N_hi) // 2
    N_levels = sorted(set([N_lo, min(N_mid, 3*K), N_hi]))
    if len(N_levels) < 3:
        N_levels = [N_lo, (N_lo + N_hi) // 2, N_hi]

    label = f"NF:{int(p_nf*100)}/{int((1-p_nf)*100)} F:{int(p_f*100)}/{int((1-p_f)*100)}"
    print(f"\n--- #{i+1}: {label}, K={K}, N={N_lo} to {N_hi} ---")
    print(f"  LR(Normal)={p_f/p_nf:.3f}  LR(Flagged)={(1-p_f)/(1-p_nf):.3f}")
    print(f"  {'d_N':>4} {'d_F':>4} {'Naive':>7}", end="")
    for N in N_levels:
        print(f" {'B('+str(N)+')':>8}", end="")
    print(f" {'d(lo-hi)':>9} {'zone':>5}")

    deltas_list = []
    naive_list = []
    blo_list = []
    bhi_list = []

    for d_n in range(K + 1):
        d_f = K - d_n
        nv = naive_binary(d_n, K, p_nf, p_f)
        bvals = [bayes_binary(K, N, d_n, p_nf, p_f) for N in N_levels]
        delta = bvals[-1] - bvals[0]
        zone = "***" if 0.15 < bvals[0] < 0.85 and delta > 0.05 else ""

        deltas_list.append(delta)
        naive_list.append(nv)
        blo_list.append(bvals[0])
        bhi_list.append(bvals[-1])

        print(f"  {d_n:>4} {d_f:>4} {nv:>7.3f}", end="")
        for bp in bvals:
            print(f" {bp:>8.3f}", end="")
        print(f" {delta:>+9.3f} {zone:>5}")

    avg_d = np.mean(deltas_list)
    print(f"  Average delta: {avg_d:.3f} ({avg_d*100:.1f}pp)")

    # Quick power
    C = K + 1
    for label_p, beta, sigma, rho in [
        ("Conservative", 0.20, 0.20, 0.3),
        ("Moderate", 0.30, 0.15, 0.5),
    ]:
        eff = beta * avg_d
        sd = sigma * np.sqrt(2 * (1 - rho) / C)
        n80 = required_n_power(eff, sd, power=0.80)
        n90 = required_n_power(eff, sd, power=0.90)
        print(f"  Power ({label_p}): n(80%)={n80}, n(90%)={n90}")

    print(f"  Trials: {C} comps x 3 N-levels = {C * 3}")


# =============================================================================
# SPECIFICALLY: 50/50 vs 40/60 at various K
# =============================================================================

print("\n\n" + "=" * 120)
print("OUSSEMA'S SUGGESTION: NF 50/50 vs F 40/60")
print("=" * 120)

p_nf, p_f = 0.50, 0.40
print(f"LR(Normal) = {p_f/p_nf:.3f}, LR(Flagged) = {(1-p_f)/(1-p_nf):.3f}")

for K in [3, 4, 5, 6, 8, 10]:
    N_levels = [K + 2, 3*K, 5*K, 10*K, 20*K]
    N_levels = [n for n in N_levels if n <= 200]

    print(f"\n  K={K}:")
    print(f"  {'d_N':>4} {'d_F':>4} {'Naive':>7}", end="")
    for N in N_levels:
        print(f" {'B('+str(N)+')':>8}", end="")
    print()

    for d_n in range(K + 1):
        d_f = K - d_n
        nv = naive_binary(d_n, K, p_nf, p_f)
        print(f"  {d_n:>4} {d_f:>4} {nv:>7.3f}", end="")
        for N in N_levels:
            bp = bayes_binary(K, N, d_n, p_nf, p_f)
            print(f" {bp:>8.3f}", end="")
        print()


print("\n\nDone.")

"""
Optimal K, N, and d_N values for the experiment.
Prior = 30% fraud. Distributions: NF 50/50, F 40/60.
N must be multiples of 10. Max 8 trials per participant.
"""

import numpy as np
from scipy.stats import binom, norm
from itertools import product

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

p_unc = prior * p_f + (1 - prior) * p_nf
net_per_und = p_unc * np.log(p_f / p_nf) + (1 - p_unc) * np.log((1 - p_f) / (1 - p_nf))

print("=" * 110)
print(f"DESIGN SEARCH: Prior = {prior:.0%}, NF 50/50, F 40/60")
print(f"P_unc(Normal) = {p_unc:.3f}, net evidence per undisclosed = {net_per_und:+.5f}")
print("=" * 110)


# =========================================================================
# STEP 1: Survey the landscape across K and N (multiples of 10)
# =========================================================================

print("\n\nSTEP 1: Bayesian posteriors across K and N")
print("(For each K, show how Bayesian moves from N_lo to N_hi)")

N_options = [10, 20, 30, 40, 50]

for K in [2, 3, 4, 5, 6]:
    print(f"\n  K = {K}:")
    print(f"  {'d_N':>4} {'d_F':>4} | {'SN':>7}", end="")
    for N in N_options:
        if N <= K:
            continue
        print(f" {'B('+str(N)+')':>7}", end="")
    print(f" | {'MR(10)':>7} {'MR(30)':>7}")
    print("  " + "-" * 80)

    for d_n in range(K + 1):
        if d_n == K:
            label = "(all-N)"
        else:
            label = ""
        d_f = K - d_n
        sn = sn_post(d_n, K, p_nf, p_f, prior)
        print(f"  {d_n:>4} {d_f:>4} | {sn:>7.3f}", end="")
        for N in N_options:
            if N <= K:
                continue
            b = bayesian_post(K, N, d_n, p_nf, p_f, prior)
            print(f" {b:>7.3f}", end="")
        m10 = mr_post(d_n, K, 10, p_nf, p_f, prior) if 10 > K else None
        m30 = mr_post(d_n, K, 30, p_nf, p_f, prior)
        m10_str = f"{m10:>7.3f}" if m10 is not None else "    n/a"
        print(f" | {m10_str} {m30:>7.3f}  {label}")


# =========================================================================
# STEP 2: For each (K_lo, K_hi, N_lo, N_hi, d_N set), compute test powers
# =========================================================================

print(f"\n\n{'=' * 110}")
print("STEP 2: Systematic search over design configurations")
print("Constraint: 2 d_N values x 2 K values x 2 N values = 8 trials")
print("N values must be multiples of 10, K < min(N)")
print("=" * 110)

sigma = 0.15
rho = 0.5
C = 4  # 4 contrasts per test
sd_ind = sigma * np.sqrt(2 * (1 - rho) / C)
z_a = norm.ppf(0.975)
z80 = norm.ppf(0.80)

results = []

for K_lo, K_hi in [(2, 4), (2, 5), (3, 5), (3, 6), (2, 6), (4, 6)]:
    for N_lo, N_hi in [(10, 20), (10, 30), (10, 40), (10, 50), (20, 30), (20, 40), (20, 50)]:
        if N_lo <= K_hi:
            # Need N > K for all K values
            if N_lo <= K_lo or N_lo <= K_hi:
                continue

        # d_N candidates: integers from 1 to K_lo-1 (need d_N < K for both K values)
        max_d_n = K_lo - 1  # must have d_N < K_lo (otherwise all-Normal for K_lo)
        if max_d_n < 1:
            continue

        # Pick 2 d_N values
        if max_d_n == 1:
            d_n_pairs = [(1, 1)]  # only 1 available, degenerate
            continue  # skip, need 2 distinct d_N
        elif max_d_n == 2:
            d_n_pairs = [(1, 2)]
        else:
            d_n_pairs = [(1, max_d_n), (1, 2), (2, max_d_n)]

        for d_n_lo, d_n_hi in d_n_pairs:
            d_ns = [d_n_lo, d_n_hi]
            Ks = [K_lo, K_hi]
            Ns = [N_lo, N_hi]

            # Compute all 8 trials
            trials = []
            for d_n in d_ns:
                for K in Ks:
                    for N in Ns:
                        s = sn_post(d_n, K, p_nf, p_f, prior)
                        m = mr_post(d_n, K, N, p_nf, p_f, prior)
                        b = bayesian_post(K, N, d_n, p_nf, p_f, prior)
                        trials.append({
                            'd_n': d_n, 'K': K, 'N': N,
                            'sn': s, 'mr': m, 'bayes': b
                        })

            # Test A: N-sensitivity (4 pairs)
            b_nslopes = []
            mr_nslopes = []
            for d_n in d_ns:
                for K in Ks:
                    b_lo = bayesian_post(K, N_lo, d_n, p_nf, p_f, prior)
                    b_hi = bayesian_post(K, N_hi, d_n, p_nf, p_f, prior)
                    m_lo = mr_post(d_n, K, N_lo, p_nf, p_f, prior)
                    m_hi = mr_post(d_n, K, N_hi, p_nf, p_f, prior)
                    b_nslopes.append(b_hi - b_lo)
                    mr_nslopes.append(m_hi - m_lo)

            avg_b_n = np.mean(b_nslopes)
            avg_mr_n = np.mean(mr_nslopes)

            # Test B: K-sensitivity (4 pairs)
            sn_kslopes = []
            for d_n in d_ns:
                for N in Ns:
                    s_lo = sn_post(d_n, K_lo, p_nf, p_f, prior)
                    s_hi = sn_post(d_n, K_hi, p_nf, p_f, prior)
                    sn_kslopes.append(s_hi - s_lo)

            avg_sn_k = np.mean(sn_kslopes)

            # Response range
            sn_all = [t['sn'] for t in trials]
            b_all = [t['bayes'] for t in trials]
            sn_min, sn_max = min(sn_all), max(sn_all)
            b_min, b_max = min(b_all), max(b_all)

            # Check: Bayesian at N_lo should be intermediate
            b_at_nlo = [t['bayes'] for t in trials if t['N'] == N_lo]
            b_nlo_min, b_nlo_max = min(b_at_nlo), max(b_at_nlo)

            # Power: Test A (B vs SN, 30% shortfall)
            eff_a = 0.30 * avg_b_n
            n_a = int(np.ceil(((z_a + z80) * sd_ind / eff_a) ** 2)) if eff_a > 0.001 else 9999

            # Power: MR vs SN (detect MR negative slope)
            eff_mr = abs(avg_mr_n)
            n_mr = int(np.ceil(((z_a + z80) * sd_ind / eff_mr) ** 2)) if eff_mr > 0.001 else 9999

            # Power: Test B (detect K-sensitivity)
            eff_b = 0.30 * avg_sn_k  # 30% shortfall from full SN response
            n_b = int(np.ceil(((z_a + z80) * sd_ind / eff_b) ** 2)) if eff_b > 0.001 else 9999

            max_n = max(n_a, n_mr)  # binding constraint

            results.append({
                'K_lo': K_lo, 'K_hi': K_hi, 'N_lo': N_lo, 'N_hi': N_hi,
                'd_ns': (d_n_lo, d_n_hi),
                'avg_b_n': avg_b_n, 'avg_mr_n': avg_mr_n, 'avg_sn_k': avg_sn_k,
                'sn_range': (sn_min, sn_max), 'b_nlo_range': (b_nlo_min, b_nlo_max),
                'n_a': n_a, 'n_mr': n_mr, 'n_b': n_b, 'max_n': max_n,
            })

# Sort by max_n (lower is better)
results.sort(key=lambda x: x['max_n'])

print(f"\n  Top 20 designs (sorted by binding sample size):")
print(f"  {'K':>5} {'N':>7} {'d_Ns':>6} | "
      f"{'B_Nslp':>7} {'MR_Nslp':>8} {'SN_Kslp':>8} | "
      f"{'SN_rng':>11} {'B@Nlo':>11} | "
      f"{'n(BvSN)':>8} {'n(MRvSN)':>9} {'n(Kslp)':>8} {'MAX':>5}")
print("  " + "-" * 115)

seen = set()
count = 0
for r in results:
    # Deduplicate
    key = (r['K_lo'], r['K_hi'], r['N_lo'], r['N_hi'], r['d_ns'])
    if key in seen:
        continue
    seen.add(key)

    # Filter: SN range should span at least 10pp
    sn_spread = r['sn_range'][1] - r['sn_range'][0]
    if sn_spread < 0.08:
        continue
    # Bayesian at N_lo should have some intermediate values
    if r['b_nlo_range'][0] > 0.90 or r['b_nlo_range'][1] < 0.20:
        continue

    k_str = f"{r['K_lo']},{r['K_hi']}"
    n_str = f"{r['N_lo']},{r['N_hi']}"
    dn_str = f"{r['d_ns'][0]},{r['d_ns'][1]}"
    sn_str = f"{r['sn_range'][0]:.2f}-{r['sn_range'][1]:.2f}"
    bnlo_str = f"{r['b_nlo_range'][0]:.2f}-{r['b_nlo_range'][1]:.2f}"

    print(f"  {k_str:>5} {n_str:>7} {dn_str:>6} | "
          f"{r['avg_b_n']:>+7.3f} {r['avg_mr_n']:>+8.4f} {r['avg_sn_k']:>+8.4f} | "
          f"{sn_str:>11} {bnlo_str:>11} | "
          f"{r['n_a']:>8} {r['n_mr']:>9} {r['n_b']:>8} {r['max_n']:>5}")

    count += 1
    if count >= 20:
        break


# =========================================================================
# STEP 3: Detail the top 3 designs
# =========================================================================

print(f"\n\n{'=' * 110}")
print("STEP 3: Top designs in detail")
print("=" * 110)

seen2 = set()
count2 = 0
for r in results:
    key = (r['K_lo'], r['K_hi'], r['N_lo'], r['N_hi'], r['d_ns'])
    if key in seen2:
        continue
    seen2.add(key)
    sn_spread = r['sn_range'][1] - r['sn_range'][0]
    if sn_spread < 0.08:
        continue
    if r['b_nlo_range'][0] > 0.90 or r['b_nlo_range'][1] < 0.20:
        continue

    K_lo, K_hi = r['K_lo'], r['K_hi']
    N_lo, N_hi = r['N_lo'], r['N_hi']
    d_ns = r['d_ns']

    print(f"\n  --- K in {{{K_lo}, {K_hi}}}, N in {{{N_lo}, {N_hi}}}, d_N in {{{d_ns[0]}, {d_ns[1]}}} ---")
    print(f"  {'#':>3} {'d_N':>4} {'K':>3} {'d_F':>4} {'N':>4} | "
          f"{'SN':>7} {'MR':>7} {'Bayes':>7} | {'B-SN':>7} {'MR-SN':>7}")
    print("  " + "-" * 70)

    trial = 0
    for d_n in d_ns:
        for K in [K_lo, K_hi]:
            for N in [N_lo, N_hi]:
                trial += 1
                s = sn_post(d_n, K, p_nf, p_f, prior)
                m = mr_post(d_n, K, N, p_nf, p_f, prior)
                b = bayesian_post(K, N, d_n, p_nf, p_f, prior)
                print(f"  {trial:>3} {d_n:>4} {K:>3} {K-d_n:>4} {N:>4} | "
                      f"{s:>7.3f} {m:>7.3f} {b:>7.3f} | {b-s:>+7.3f} {m-s:>+7.4f}")
            print()

    # Test summaries
    print(f"  N-sensitivity (avg):")
    for d_n in d_ns:
        for K in [K_lo, K_hi]:
            b_slp = bayesian_post(K, N_hi, d_n, p_nf, p_f, prior) - bayesian_post(K, N_lo, d_n, p_nf, p_f, prior)
            m_slp = mr_post(d_n, K, N_hi, p_nf, p_f, prior) - mr_post(d_n, K, N_lo, p_nf, p_f, prior)
            print(f"    d_N={d_n}, K={K}: SN=0.000, MR={m_slp:+.4f}, Bayes={b_slp:+.4f}")

    print(f"  K-sensitivity (avg):")
    for d_n in d_ns:
        for N in [N_lo, N_hi]:
            s_k = sn_post(d_n, K_hi, p_nf, p_f, prior) - sn_post(d_n, K_lo, p_nf, p_f, prior)
            b_k = bayesian_post(K_hi, N, d_n, p_nf, p_f, prior) - bayesian_post(K_lo, N, d_n, p_nf, p_f, prior)
            print(f"    d_N={d_n}, N={N}: SN={s_k:+.4f}, Bayes={b_k:+.4f}")

    print(f"  Power: n(B vs SN)={r['n_a']}, n(MR vs SN)={r['n_mr']}, n(K-test)={r['n_b']}")

    count2 += 1
    if count2 >= 3:
        break

print("\nDone.")

"""
Power Grid v3: Joint optimization of {N1,N2,N3} x {D1,D2,D3} design.

For each candidate 3x3 design, evaluates three sensitivity tests:
  1. N-variation: max B-SN and SN-MR gaps when N changes (D, d_N fixed)
  2. D-variation: max B-SN and SN-MR gaps when D changes (N, d_N cond fixed)
  3. d_N-variation: max B-SN and SN-MR gaps across d_N in {0, D-1, D}

Since brute force over all triples is infeasible, uses a two-step approach:
  Step 1: For each (N, D) cell, compute all 6 gap measures.
  Step 2: For candidate triples of N and D (coarse grid + refinement),
          compute aggregate power = sum of 6 ranked sensitivities.

Usage: python power_grid.py
"""

from math import lgamma, log, exp, ceil, sqrt
from itertools import combinations

p0, p1 = 0.50, 0.40
z_a, z_b = 1.96, 0.842
sigma, rho = 0.15, 0.5
NUM = (z_a + z_b)**2 * sigma**2 * 2 * (1 - rho)

# ── Posterior functions ────────────────────────────────────────────
def log_bpmf(k, n, p):
    if k < 0 or k > n: return float('-inf')
    if p == 0: return 0.0 if k == 0 else float('-inf')
    if p == 1: return 0.0 if k == n else float('-inf')
    return (lgamma(n+1) - lgamma(k+1) - lgamma(n-k+1)
            + k*log(p) + (n-k)*log(1-p))

def logsumexp(vals):
    mx = max(vals)
    if mx == float('-inf'): return float('-inf')
    return mx + log(sum(exp(v - mx) for v in vals))

def bayesian(d_N, D, N, pi):
    if d_N < D:
        lL0 = log_bpmf(d_N, N, p0)
        lL1 = log_bpmf(d_N, N, p1)
    else:
        terms0 = [log_bpmf(i, N, p0) for i in range(D)]
        terms1 = [log_bpmf(i, N, p1) for i in range(D)]
        cdf0 = exp(logsumexp(terms0)) if terms0 else 0
        cdf1 = exp(logsumexp(terms1)) if terms1 else 0
        L0 = max(1 - cdf0, 1e-300)
        L1 = max(1 - cdf1, 1e-300)
        return (pi * L1) / (pi * L1 + (1-pi) * L0)
    lp1 = log(pi) + lL1
    lp0 = log(1-pi) + lL0
    mx = max(lp1, lp0)
    return exp(lp1 - mx) / (exp(lp1 - mx) + exp(lp0 - mx))

def sn_post(d_N, D, pi):
    dF = D - d_N
    lL0 = d_N * log(p0) + dF * log(1 - p0)
    lL1 = d_N * log(p1) + dF * log(1 - p1)
    lp1 = log(pi) + lL1
    lp0 = log(1-pi) + lL0
    mx = max(lp1, lp0)
    return exp(lp1 - mx) / (exp(lp1 - mx) + exp(lp0 - mx))

def mr_post(d_N, D, N, pi):
    p_unc = (1-pi)*p0 + pi*p1
    aN = d_N + (N - D) * p_unc
    aF = (D - d_N) + (N - D) * (1 - p_unc)
    lL0 = aN * log(p0) + aF * log(1 - p0)
    lL1 = aN * log(p1) + aF * log(1 - p1)
    lp1 = log(pi) + lL1
    lp0 = log(1-pi) + lL0
    mx = max(lp1, lp0)
    return exp(lp1 - mx) / (exp(lp1 - mx) + exp(lp0 - mx))

def req_n(effect, frac):
    eff = frac * abs(effect)
    if eff < 0.001: return 99999
    return ceil(NUM / eff**2)


def run(pi):
    p_unc = (1-pi)*p0 + pi*p1
    sep = '=' * 110

    print(f"\n{sep}")
    print(f"  PRIOR: P(fraud) = {pi:.0%}   |   P_unc(Normal) = {p_unc:.4f}")
    print(sep)

    # ── Step 1: Precompute posteriors for all (N, D, d_N) ─────────
    # d_N conditions: 0, D-1, D
    # For each (N, D): store Bayes, SN, MR at each d_N condition
    print("\n  Precomputing posteriors...")

    # Cache: post[N][D][cond] = (bayes, sn, mr)
    post = {}
    N_vals = list(range(10, 101))
    D_vals = list(range(3, 81))

    for N in N_vals:
        post[N] = {}
        for D in D_vals:
            if D >= N:
                continue
            post[N][D] = {}
            for cond in ['0', 'D-1', 'D']:
                d_N = 0 if cond == '0' else (D-1 if cond == 'D-1' else D)
                b = bayesian(d_N, D, N, pi)
                s = sn_post(d_N, D, pi)
                m = mr_post(d_N, D, N, pi)
                post[N][D][cond] = (b, s, m)

    print("  Done.\n")

    # ── Step 2: Evaluate candidate designs ────────────────────────
    # A design is (N_triple, D_triple) where each is 3 sorted values.
    #
    # For each design, compute 6 sensitivity measures:
    #   For each d_N cond in {0, D-1, D}:
    #     N-var B-SN: max over D of [max_N(B-SN) - min_N(B-SN)]
    #     N-var SN-MR: max over D of [max_N |SN-MR| - min_N |SN-MR|]
    #         But SN doesn't depend on N, so SN-MR from N-var = MR range
    #     D-var B-SN: max over N of [max_D(B-SN) - min_D(B-SN)]
    #     D-var SN-MR: max over N of [max_D |SN-MR gap| - min_D |SN-MR gap|]
    #     dN-var B-SN: max over (N,D) of [max_cond(B-SN) - min_cond(B-SN)]
    #     dN-var SN-MR: max over (N,D) of [max_cond(SN-MR) - min_cond(SN-MR)]
    #
    # Simplified to 3 aggregate measures (max across conditions):
    #   1. N-sensitivity: best [Bayes range across 3 Ns] + best [MR range across 3 Ns]
    #   2. D-sensitivity: best [SN-MR gap range across 3 Ds]
    #   3. dN-sensitivity: best [B-SN range across 3 d_N conds] + best [SN-MR range]

    # To keep computation feasible, use a coarse grid for candidates
    # then refine around the best ones.

    # Candidate N values: every 5th from 10 to 100
    cand_Ns = list(range(10, 101, 5))  # 10,15,20,...,100 = 19 values
    # Candidate D values: every 2nd from 3 to 50
    cand_Ds = list(range(3, 51, 2))    # 3,5,7,...,49 = 24 values

    print(f"  Evaluating designs on coarse grid...")
    print(f"  Candidate Ns: {cand_Ns}")
    print(f"  Candidate Ds: {cand_Ds}")

    n_trips = list(combinations(cand_Ns, 3))
    d_trips = list(combinations(cand_Ds, 3))
    print(f"  N triples: {len(n_trips)},  D triples: {len(d_trips)}")
    print(f"  Total designs to evaluate: {len(n_trips) * len(d_trips)}")

    results = []
    for Nt in n_trips:
        for Dt in d_trips:
            # Check feasibility: all D < all N (conservative)
            if max(Dt) >= min(Nt):
                continue

            # ── N-variation (fix D, vary N across Nt) ──────────
            # For B-SN: Bayesian range across N (SN is flat in N)
            # For SN-MR: MR range across N (SN is flat in N)
            best_n_bsn = 0.0
            best_n_snmr = 0.0
            for D in Dt:
                for cond in ['0', 'D-1', 'D']:
                    bvals = [post[N][D][cond][0] for N in Nt]  # Bayes
                    mvals = [post[N][D][cond][2] for N in Nt]  # MR
                    sval = post[Nt[0]][D][cond][1]              # SN (same for all N)

                    b_rng = max(bvals) - min(bvals)
                    m_rng = max(mvals) - min(mvals)

                    if b_rng > best_n_bsn:
                        best_n_bsn = b_rng
                    if m_rng > best_n_snmr:
                        best_n_snmr = m_rng

            # ── D-variation (fix N, vary D across Dt) ──────────
            # For SN-MR: range of [SN(D) - MR(D)] across D
            # For B-SN: range of [B(D) - SN(D)] across D
            best_d_bsn = 0.0
            best_d_snmr = 0.0
            for N in Nt:
                for cond in ['0', 'D-1', 'D']:
                    bsn_gaps = []
                    snmr_gaps = []
                    for D in Dt:
                        b, s, m = post[N][D][cond]
                        bsn_gaps.append(b - s)
                        snmr_gaps.append(s - m)

                    bsn_rng = max(bsn_gaps) - min(bsn_gaps)
                    snmr_rng = max(snmr_gaps) - min(snmr_gaps)

                    if bsn_rng > best_d_bsn:
                        best_d_bsn = bsn_rng
                    if snmr_rng > best_d_snmr:
                        best_d_snmr = snmr_rng

            # ── d_N-variation (fix N,D, vary d_N across {0,D-1,D}) ──
            best_dn_bsn = 0.0
            best_dn_snmr = 0.0
            for N in Nt:
                for D in Dt:
                    bsn_gaps = []
                    snmr_gaps = []
                    for cond in ['0', 'D-1', 'D']:
                        b, s, m = post[N][D][cond]
                        bsn_gaps.append(abs(b - s))
                        snmr_gaps.append(abs(s - m))

                    bsn_rng = max(bsn_gaps) - min(bsn_gaps)
                    snmr_rng = max(snmr_gaps) - min(snmr_gaps)

                    if bsn_rng > best_dn_bsn:
                        best_dn_bsn = bsn_rng
                    if snmr_rng > best_dn_snmr:
                        best_dn_snmr = snmr_rng

            results.append({
                'Nt': Nt, 'Dt': Dt,
                'n_bsn': best_n_bsn, 'n_snmr': best_n_snmr,
                'd_bsn': best_d_bsn, 'd_snmr': best_d_snmr,
                'dn_bsn': best_dn_bsn, 'dn_snmr': best_dn_snmr,
            })

    print(f"  Feasible designs evaluated: {len(results)}\n")

    # ── Rank each measure (desc = rank 1 = biggest) ──────────────
    measures = ['n_bsn', 'n_snmr', 'd_bsn', 'd_snmr', 'dn_bsn', 'dn_snmr']
    for m in measures:
        results.sort(key=lambda x: -x[m])
        for i, r in enumerate(results):
            r[f'rk_{m}'] = i + 1

    # Composite: sum of all 6 ranks (lower = better)
    for r in results:
        r['score'] = -sum(r[f'rk_{m}'] for m in measures)

    results.sort(key=lambda x: -x['score'])

    # ── Print top 25 ──────────────────────────────────────────────
    print(f"  TOP 25 DESIGNS (3 Ns x 3 Ds) ranked by sum of 6 sensitivity ranks:\n")
    hdr = (f"  {'Rk':>3} {'N-triple':>16} {'D-triple':>16} | "
           f"{'N:B-SN':>6} {'N:MR':>6} {'D:B-SN':>6} {'D:MR':>6} {'dN:BSN':>6} {'dN:MR':>6} | "
           f"{'Score':>7}")
    print(hdr)
    print('  ' + '-' * (len(hdr) - 2))

    for rank, r in enumerate(results[:25], 1):
        nt_str = f"({r['Nt'][0]:>2},{r['Nt'][1]:>3},{r['Nt'][2]:>3})"
        dt_str = f"({r['Dt'][0]:>2},{r['Dt'][1]:>3},{r['Dt'][2]:>3})"
        print(f"  {rank:>3} {nt_str:>16} {dt_str:>16} | "
              f"{r['n_bsn']:>6.3f} {r['n_snmr']:>6.3f} "
              f"{r['d_bsn']:>6.3f} {r['d_snmr']:>6.3f} "
              f"{r['dn_bsn']:>6.3f} {r['dn_snmr']:>6.3f} | "
              f"{r['score']:>7}")

    # ── Detail for top 5 ──────────────────────────────────────────
    print(f"\n  {'='*100}")
    print(f"  DETAIL: Top 5 designs -- full posteriors\n")

    for rank, r in enumerate(results[:5], 1):
        Nt, Dt = r['Nt'], r['Dt']
        print(f"  #{rank}: N = {{{Nt[0]}, {Nt[1]}, {Nt[2]}}}  x  D = {{{Dt[0]}, {Dt[1]}, {Dt[2]}}}")
        print(f"    N-var:  B-SN={r['n_bsn']:.4f}  SN-MR={r['n_snmr']:.4f}")
        print(f"    D-var:  B-SN={r['d_bsn']:.4f}  SN-MR={r['d_snmr']:.4f}")
        print(f"    dN-var: B-SN={r['dn_bsn']:.4f}  SN-MR={r['dn_snmr']:.4f}")

        # Required n at 50% and 20% effect for the binding constraint (min of all 6)
        min_gap = min(r[m] for m in measures)
        print(f"    Binding gap = {min_gap:.4f} -> n @50%={req_n(min_gap,0.5)}, n @20%={req_n(min_gap,0.2)}")

        # Show posteriors at key cells
        print(f"\n    Posteriors at d_N=0 (all disclosed Flagged):")
        print(f"    {'':>6} | ", end='')
        for D in Dt:
            print(f"  D={D:>2}  B    SN    MR  |", end='')
        print()
        print(f"    {'':>6} |" + ('-' * 26 + '|') * 3)

        for N in Nt:
            print(f"    N={N:>3} | ", end='')
            for D in Dt:
                if D < N and D in post[N]:
                    b, s, m = post[N][D]['0']
                    print(f" {b:>5.3f} {s:>5.3f} {m:>5.3f} |", end='')
                else:
                    print(f"   --    --    --  |", end='')
            print()

        print(f"\n    Posteriors at d_N=D-1 (one Flagged disclosed):")
        print(f"    {'':>6} | ", end='')
        for D in Dt:
            print(f"  D={D:>2}  B    SN    MR  |", end='')
        print()
        print(f"    {'':>6} |" + ('-' * 26 + '|') * 3)

        for N in Nt:
            print(f"    N={N:>3} | ", end='')
            for D in Dt:
                if D < N and D in post[N]:
                    b, s, m = post[N][D]['D-1']
                    print(f" {b:>5.3f} {s:>5.3f} {m:>5.3f} |", end='')
                else:
                    print(f"   --    --    --  |", end='')
            print()

        print(f"\n    Posteriors at d_N=D (all Normal disclosed):")
        print(f"    {'':>6} | ", end='')
        for D in Dt:
            print(f"  D={D:>2}  B    SN    MR  |", end='')
        print()
        print(f"    {'':>6} |" + ('-' * 26 + '|') * 3)

        for N in Nt:
            print(f"    N={N:>3} | ", end='')
            for D in Dt:
                if D < N and D in post[N]:
                    b, s, m = post[N][D]['D']
                    print(f" {b:>5.3f} {s:>5.3f} {m:>5.3f} |", end='')
                else:
                    print(f"   --    --    --  |", end='')
            print()

        print()

    return results


# ── Main ───────────────────────────────────────────────────────────
if __name__ == '__main__':
    for prior in [0.20, 0.40]:
        run(prior)

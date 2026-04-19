"""
Evaluate specific design: N={10,20,50}, D={3,5,8}, d_N={0, D-1, D}
Prior P(fraud) = 20%
"""
from math import lgamma, log, exp, ceil

p0, p1 = 0.50, 0.40
pi = 0.20
p_unc = (1-pi)*p0 + pi*p1
NUM = (1.96 + 0.842)**2 * 0.15**2 * 2 * (1 - 0.5)

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

def bayesian(d_N, D, N):
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

def sn_post(d_N, D):
    dF = D - d_N
    lL0 = d_N * log(p0) + dF * log(1 - p0)
    lL1 = d_N * log(p1) + dF * log(1 - p1)
    lp1 = log(pi) + lL1
    lp0 = log(1-pi) + lL0
    mx = max(lp1, lp0)
    return exp(lp1 - mx) / (exp(lp1 - mx) + exp(lp0 - mx))

def mr_post(d_N, D, N):
    aN = d_N + (N - D) * p_unc
    aF = (D - d_N) + (N - D) * (1 - p_unc)
    lL0 = aN * log(p0) + aF * log(1 - p0)
    lL1 = aN * log(p1) + aF * log(1 - p1)
    lp1 = log(pi) + lL1
    lp0 = log(1-pi) + lL0
    mx = max(lp1, lp0)
    return exp(lp1 - mx) / (exp(lp1 - mx) + exp(lp0 - mx))

def req_n(gap, frac):
    eff = frac * abs(gap)
    if eff < 0.001: return 99999
    return ceil(NUM / eff**2)


# ── Design ──────────────────────────────────────────────────
Ns = [10, 20, 50]
Ds = [3, 5, 8]
conds = ['0', 'D-1', 'D']

print('=' * 110)
print('  DESIGN: N = {10, 20, 50},  D = {3, 5, 8},  d_N = {0, D-1, D}')
print('  PRIOR: P(fraud) = 20%%   |   P_unc(Normal) = %.4f' % p_unc)
print('  Total trial types: %d N x %d D x %d d_N = %d' % (len(Ns), len(Ds), len(conds), len(Ns)*len(Ds)*len(conds)))
print('=' * 110)

# ── Full posterior table ────────────────────────────────────
print()
print('  FULL POSTERIOR TABLE')
print('  ' + '-' * 100)
print('  %3s %3s %5s %4s %5s | %7s %7s %7s | %7s %7s %7s' %
      ('N', 'D', 'D/N', 'd_N', 'cond', 'Bayes', 'SN', 'MR', 'B-SN', 'SN-MR', 'B-MR'))
print('  ' + '-' * 100)

post = {}
for N in Ns:
    for D in Ds:
        for c in conds:
            d_N = 0 if c == '0' else (D-1 if c == 'D-1' else D)
            b = bayesian(d_N, D, N)
            s = sn_post(d_N, D)
            m = mr_post(d_N, D, N)
            post[(N, D, c)] = (b, s, m)
            print('  %3d %3d %4.0f%% %4d %5s | %7.4f %7.4f %7.4f | %+7.4f %+7.4f %+7.4f' %
                  (N, D, 100*D/N, d_N, c, b, s, m, b-s, s-m, b-m))
        print()

# ══════════════════════════════════════════════════════════════
# SENSITIVITY ANALYSIS
# ══════════════════════════════════════════════════════════════

# ── 1. N-VARIATION (fix D and d_N cond, vary N) ────────────
print()
print('  1. N-VARIATION (fix D and d_N, vary N across {10,20,50})')
print('     SN is invariant to N. Bayesian and MR change.')
print('     B-SN power = Bayesian range.  SN-MR power = MR range.')
print('  ' + '-' * 90)
print()

for D in Ds:
    print('  D=%d:' % D)
    for c in conds:
        bvals = [post[(N, D, c)][0] for N in Ns]
        sval = post[(Ns[0], D, c)][1]
        mvals = [post[(N, D, c)][2] for N in Ns]
        b_rng = max(bvals) - min(bvals)
        m_rng = max(mvals) - min(mvals)
        print('    d_N=%-3s:' % c)
        print('      N=10  N=20  N=50')
        print('      B: %.4f  %.4f  %.4f  range=%.4f (n@50%%=%d, n@20%%=%d)' %
              (bvals[0], bvals[1], bvals[2], b_rng, req_n(b_rng,0.5), req_n(b_rng,0.2)))
        print('      S: %.4f  %.4f  %.4f  (flat -- SN ignores N)' %
              (sval, sval, sval))
        print('      M: %.4f  %.4f  %.4f  range=%.4f (n@50%%=%d, n@20%%=%d)' %
              (mvals[0], mvals[1], mvals[2], m_rng, req_n(m_rng,0.5), req_n(m_rng,0.2)))
        print()

# ── 2. D-VARIATION (fix N and d_N cond, vary D) ────────────
print()
print('  2. D-VARIATION (fix N and d_N cond, vary D across {3,5,8})')
print('     All three types change with D. Power = differential change.')
print('     B-SN power = range of [B-SN gap].  SN-MR power = range of [SN-MR gap].')
print('  ' + '-' * 90)
print()

for N in Ns:
    print('  N=%d:' % N)
    for c in conds:
        bsn_gaps = []
        snmr_gaps = []
        for D in Ds:
            b, s, m = post[(N, D, c)]
            bsn_gaps.append(b - s)
            snmr_gaps.append(s - m)
        bsn_rng = max(bsn_gaps) - min(bsn_gaps)
        snmr_rng = max(snmr_gaps) - min(snmr_gaps)
        print('    d_N=%-3s:' % c)
        print('      D=3    D=5    D=8')
        print('      B-SN: %+.4f  %+.4f  %+.4f  range=%.4f (n@50%%=%d, n@20%%=%d)' %
              (bsn_gaps[0], bsn_gaps[1], bsn_gaps[2], bsn_rng, req_n(bsn_rng,0.5), req_n(bsn_rng,0.2)))
        print('      SN-MR: %+.4f  %+.4f  %+.4f  range=%.4f (n@50%%=%d, n@20%%=%d)' %
              (snmr_gaps[0], snmr_gaps[1], snmr_gaps[2], snmr_rng, req_n(snmr_rng,0.5), req_n(snmr_rng,0.2)))
        print()

# ── 3. d_N-VARIATION (fix N and D, vary d_N) ───────────────
print()
print('  3. d_N-VARIATION (fix N and D, vary d_N across {0, D-1, D})')
print('  ' + '-' * 90)
print()

for N in Ns:
    for D in Ds:
        bsn_vals = []
        snmr_vals = []
        for c in conds:
            b, s, m = post[(N, D, c)]
            bsn_vals.append(abs(b - s))
            snmr_vals.append(abs(s - m))
        bsn_rng = max(bsn_vals) - min(bsn_vals)
        snmr_rng = max(snmr_vals) - min(snmr_vals)
        print('  N=%d, D=%d (D/N=%.0f%%):' % (N, D, 100*D/N))
        print('    B-SN  at d_N=0/D-1/D: %.4f / %.4f / %.4f  range=%.4f (n@50%%=%d, n@20%%=%d)' %
              (bsn_vals[0], bsn_vals[1], bsn_vals[2], bsn_rng, req_n(bsn_rng,0.5), req_n(bsn_rng,0.2)))
        print('    SN-MR at d_N=0/D-1/D: %.4f / %.4f / %.4f  range=%.4f (n@50%%=%d, n@20%%=%d)' %
              (snmr_vals[0], snmr_vals[1], snmr_vals[2], snmr_rng, req_n(snmr_rng,0.5), req_n(snmr_rng,0.2)))
    print()


# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════
print('=' * 110)
print('  SUMMARY: All sensitivity measures ranked by gap size')
print('=' * 110)
print()

rows = []

# N-test
for D in Ds:
    for c in conds:
        bvals = [post[(N, D, c)][0] for N in Ns]
        mvals = [post[(N, D, c)][2] for N in Ns]
        rows.append(('N-var D=%d' % D, c, 'B-SN', max(bvals)-min(bvals)))
        rows.append(('N-var D=%d' % D, c, 'SN-MR', max(mvals)-min(mvals)))

# D-test
for N in Ns:
    for c in conds:
        bsn_gaps = [post[(N,D,c)][0]-post[(N,D,c)][1] for D in Ds]
        snmr_gaps = [post[(N,D,c)][1]-post[(N,D,c)][2] for D in Ds]
        rows.append(('D-var N=%d' % N, c, 'B-SN', max(bsn_gaps)-min(bsn_gaps)))
        rows.append(('D-var N=%d' % N, c, 'SN-MR', max(snmr_gaps)-min(snmr_gaps)))

# dN-test
for N in Ns:
    for D in Ds:
        bsn = [abs(post[(N,D,c)][0]-post[(N,D,c)][1]) for c in conds]
        snmr = [abs(post[(N,D,c)][1]-post[(N,D,c)][2]) for c in conds]
        rows.append(('dN-var N=%d,D=%d' % (N,D), 'all', 'B-SN', max(bsn)-min(bsn)))
        rows.append(('dN-var N=%d,D=%d' % (N,D), 'all', 'SN-MR', max(snmr)-min(snmr)))

rows.sort(key=lambda x: -x[3])

print('  %-25s %-5s %-6s %8s %8s %8s' % ('Test', 'cond', 'type', 'gap', 'n@50%', 'n@20%'))
print('  ' + '-' * 70)
for name, cond, typ, gap in rows:
    marker = ' <-- BINDING' if gap == min(r[3] for r in rows if r[3] > 0.001) else ''
    print('  %-25s %-5s %-6s %8.4f %8d %8d%s' %
          (name, cond, typ, gap, req_n(gap,0.5), req_n(gap,0.2), marker))

# Best in each category
print()
print('  BEST IN EACH CATEGORY:')
print('  ' + '-' * 60)
cats = {'N-var B-SN': [], 'N-var SN-MR': [], 'D-var B-SN': [], 'D-var SN-MR': [],
        'dN-var B-SN': [], 'dN-var SN-MR': []}
for name, cond, typ, gap in rows:
    prefix = name.split(' ')[0]
    key = prefix + ' ' + typ
    if key in cats:
        cats[key].append((name, cond, gap))

for key in ['N-var B-SN', 'N-var SN-MR', 'D-var B-SN', 'D-var SN-MR', 'dN-var B-SN', 'dN-var SN-MR']:
    if cats[key]:
        best = max(cats[key], key=lambda x: x[2])
        print('  %-15s: %.4f at %s (d_N=%s) -> n@50%%=%d, n@20%%=%d' %
              (key, best[2], best[0], best[1], req_n(best[2],0.5), req_n(best[2],0.2)))

# Overall binding SN-MR
snmr_best = max([(n,c,g) for n,c,t,g in rows if t=='SN-MR'], key=lambda x: x[2])
print()
print('  OVERALL BEST SN-MR gap: %.4f (%s, d_N=%s)' % (snmr_best[2], snmr_best[0], snmr_best[1]))
print('    -> n @50%% = %d,  n @20%% = %d' % (req_n(snmr_best[2],0.5), req_n(snmr_best[2],0.2)))

print()
print('  COMPARISON:')
print('    Grid-optimal {40,60,100}x{11,31,39}: binding SN-MR = 0.1820 -> n@50%%=22, n@20%%=134')
print('    This design {10,20,50}x{3,5,8}:      binding SN-MR = %.4f -> n@50%%=%d, n@20%%=%d' %
      (snmr_best[2], req_n(snmr_best[2],0.5), req_n(snmr_best[2],0.2)))

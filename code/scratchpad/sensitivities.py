"""
Sensitivity tables: How each type REACTS to parameter changes.
Deltas in pp when one parameter changes, others fixed.
"""
from math import lgamma, log, exp

p0, p1 = 0.50, 0.40
pi = 0.20
p_unc = (1-pi)*p0 + pi*p1

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

Ns = [10, 20, 50]
Ds = [3, 5, 8]

post = {}
for N in Ns:
    for D in Ds:
        for c in ['0', 'D-1', 'D']:
            d_N = 0 if c == '0' else (D-1 if c == 'D-1' else D)
            post[(N, D, c)] = (bayesian(d_N, D, N), sn_post(d_N, D), mr_post(d_N, D, N))

print('=' * 100)
print('  SENSITIVITIES: How Each Type Reacts to Parameter Changes')
print('  (Deltas in percentage points when one parameter changes, others fixed)')
print('=' * 100)

# ============================================================
# A. N-SENSITIVITY
# ============================================================
print()
print('A. REACTION TO INCREASING N (pool size)')
print('   Fix D and d_N condition. Increase N: 10->20 then 20->50.')
print('   KEY: SN has ZERO reaction. Bayesian reacts strongly. MR reacts weakly.')
print('=' * 100)
print()

for D in Ds:
    for c in ['0', 'D-1', 'D']:
        d_N = 0 if c == '0' else (D-1 if c == 'D-1' else D)
        nF = D - d_N
        print('   D=%d, d_N=%d (%dN, %dF disclosed)' % (D, d_N, d_N, nF))
        print('   %8s | %8s %8s %8s | %10s %10s %10s' %
              ('Change', 'B level', 'SN level', 'MR level', 'B delta', 'SN delta', 'MR delta'))
        print('   ' + '-' * 85)

        b10, s10, m10 = post[(10, D, c)]
        b20, s20, m20 = post[(20, D, c)]
        b50, s50, m50 = post[(50, D, c)]

        print('   %8s | %7.1f%% %7.1f%% %7.1f%% |       --         --         --' %
              ('N=10', b10*100, s10*100, m10*100))
        print('   %8s | %7.1f%% %7.1f%% %7.1f%% | %+9.1f pp %+9.1f pp %+9.1f pp' %
              ('N=20', b20*100, s20*100, m20*100, (b20-b10)*100, (s20-s10)*100, (m20-m10)*100))
        print('   %8s | %7.1f%% %7.1f%% %7.1f%% | %+9.1f pp %+9.1f pp %+9.1f pp' %
              ('N=50', b50*100, s50*100, m50*100, (b50-b20)*100, (s50-s20)*100, (m50-m20)*100))
        print('   ' + '-' * 85)
        print('   %8s |                          | %+9.1f pp %+9.1f pp %+9.1f pp' %
              ('TOTAL', (b50-b10)*100, (s50-s10)*100, (m50-m10)*100))
        print()

# ============================================================
# B. D-SENSITIVITY
# ============================================================
print()
print('B. REACTION TO INCREASING D (disclosure amount)')
print('   Fix N and d_N condition. Increase D: 3->5 then 5->8.')
print('   Note: d_N changes with D to maintain condition (0, D-1, or D).')
print('   All three types react, but with different magnitudes.')
print('=' * 100)
print()

for N in Ns:
    for c in ['0', 'D-1', 'D']:
        print('   N=%d, d_N condition=%s' % (N, c))
        print('   %8s %5s %5s | %8s %8s %8s | %10s %10s %10s' %
              ('Change', 'd_N', 'nFlg', 'B level', 'SN level', 'MR level', 'B delta', 'SN delta', 'MR delta'))
        print('   ' + '-' * 95)

        prev_b = prev_s = prev_m = None
        first_b = first_s = first_m = None
        for D in Ds:
            d_N = 0 if c == '0' else (D-1 if c == 'D-1' else D)
            nF = D - d_N
            b, s, m = post[(N, D, c)]
            if first_b is None:
                first_b, first_s, first_m = b, s, m

            if prev_b is not None:
                print('   %8s %5d %5d | %7.1f%% %7.1f%% %7.1f%% | %+9.1f pp %+9.1f pp %+9.1f pp' %
                      ('D=%d' % D, d_N, nF, b*100, s*100, m*100, (b-prev_b)*100, (s-prev_s)*100, (m-prev_m)*100))
            else:
                print('   %8s %5d %5d | %7.1f%% %7.1f%% %7.1f%% |       --         --         --' %
                      ('D=%d' % D, d_N, nF, b*100, s*100, m*100))
            prev_b, prev_s, prev_m = b, s, m

        last_b, last_s, last_m = prev_b, prev_s, prev_m
        print('   ' + '-' * 95)
        print('   %8s               |                          | %+9.1f pp %+9.1f pp %+9.1f pp' %
              ('TOTAL', (last_b-first_b)*100, (last_s-first_s)*100, (last_m-first_m)*100))
        print()

# ============================================================
# C. d_N-SENSITIVITY
# ============================================================
print()
print('C. REACTION TO INCREASING d_N (more Normal among disclosed)')
print('   Fix N and D. Increase d_N: 0 -> D-1 -> D.')
print('   All three types react (more Normal = less fraud).')
print('=' * 100)
print()

for N in Ns:
    for D in Ds:
        print('   N=%d, D=%d (hidden=%d)' % (N, D, N-D))
        print('   %8s %5s %5s | %8s %8s %8s | %10s %10s %10s' %
              ('Change', 'd_N', 'nFlg', 'B level', 'SN level', 'MR level', 'B delta', 'SN delta', 'MR delta'))
        print('   ' + '-' * 95)

        prev_b = prev_s = prev_m = None
        first_b = first_s = first_m = None
        for c in ['0', 'D-1', 'D']:
            d_N = 0 if c == '0' else (D-1 if c == 'D-1' else D)
            nF = D - d_N
            b, s, m = post[(N, D, c)]
            if first_b is None:
                first_b, first_s, first_m = b, s, m

            if prev_b is not None:
                print('   %8s %5d %5d | %7.1f%% %7.1f%% %7.1f%% | %+9.1f pp %+9.1f pp %+9.1f pp' %
                      ('d_N=%d' % d_N, d_N, nF, b*100, s*100, m*100, (b-prev_b)*100, (s-prev_s)*100, (m-prev_m)*100))
            else:
                print('   %8s %5d %5d | %7.1f%% %7.1f%% %7.1f%% |       --         --         --' %
                      ('d_N=%d' % d_N, d_N, nF, b*100, s*100, m*100))
            prev_b, prev_s, prev_m = b, s, m

        last_b, last_s, last_m = prev_b, prev_s, prev_m
        print('   ' + '-' * 95)
        print('   %8s               |                          | %+9.1f pp %+9.1f pp %+9.1f pp' %
              ('TOTAL', (last_b-first_b)*100, (last_s-first_s)*100, (last_m-first_m)*100))
        print()

# ============================================================
# D. SUMMARY
# ============================================================
print()
print('=' * 100)
print('  SIGNATURE REACTIONS (what distinguishes the three types)')
print('=' * 100)
print()
print('  Increase N (10->50) holding D, d_N fixed:')
print('    Bayesian: LARGE positive reaction when d_N < D (up to +91 pp)')
print('              SMALL positive reaction when d_N = D (up to +15 pp)')
print('    SN:       ZERO reaction (exactly 0.0 pp, always)')
print('    MR:       SMALL negative reaction (down 1-12 pp, drift toward prior)')
print()
print('  Increase D (3->8) holding N, d_N condition fixed:')
print('    All three types react.')
print('    d_N=0: B flat (0 Normal regardless), SN rises, MR rises')
print('    d_N=D-1: B falls (more disclosed Normal = less suspicious), SN falls, MR falls')
print('    d_N=D: B falls (more all-Normal less surprising), SN falls, MR falls')
print()
print('  Increase d_N (0->D) holding N, D fixed:')
print('    All three: LARGE negative reaction (more Normal = less fraud)')
print('    B reacts most, MR least')
print()
print('  THE KEY DIAGNOSTIC:')
print('    N-sensitivity is what separates the types.')
print('    - A participant who REACTS to N is Bayesian.')
print('    - A participant who IGNORES N is SN or MR.')
print('    - Among N-ignorers, one who DRIFTS DOWN with N is MR;')
print('      one who is perfectly flat is SN.')

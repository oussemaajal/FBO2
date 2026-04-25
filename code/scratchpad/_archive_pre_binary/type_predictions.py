"""
Type Predictions for All 27 Trials
Shows what each investor type (Bayesian, SN, MR) predicts,
and the key diagnostic patterns that distinguish them.

Design: N={10,20,50}, D={3,5,8}, d_N={0, D-1, D}
Prior P(fraud) = 20%
P(Normal|non-fraud) = 50%, P(Normal|fraud) = 40%
"""
from math import lgamma, log, exp

p0, p1 = 0.50, 0.40
pi = 0.20
p_unc = (1-pi)*p0 + pi*p1  # = 0.48

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

# Build lookup
post = {}
for N in Ns:
    for D in Ds:
        for c in ['0', 'D-1', 'D']:
            d_N = 0 if c == '0' else (D-1 if c == 'D-1' else D)
            post[(N, D, c)] = (bayesian(d_N, D, N), sn_post(d_N, D), mr_post(d_N, D, N))


# ============================================================
# PART 1: FULL TABLE (all 27)
# ============================================================
print('=' * 120)
print('  ALL 27 TRIAL TYPES: Fraud Probability (%) Predicted by Each Type')
print('  P(Normal|clean)=50%%  P(Normal|fraud)=40%%  Prior P(fraud)=20%%')
print('=' * 120)
print()
print('  %-3s %-3s %-5s %-4s %-5s | %10s %10s %10s | %8s %8s' %
      ('N', 'D', 'hid', 'd_N', 'nFlg', 'Bayesian', 'SN', 'MR', 'B-SN', 'SN-MR'))
print('  ' + '-' * 100)

for N in Ns:
    for D in Ds:
        for c in ['0', 'D-1', 'D']:
            d_N = 0 if c == '0' else (D-1 if c == 'D-1' else D)
            nF = D - d_N
            hid = N - D
            b, s, m = post[(N, D, c)]
            print('  %3d %3d %5d %4d %5d | %9.1f%% %9.1f%% %9.1f%% | %+7.1f pp %+7.1f pp' %
                  (N, D, hid, d_N, nF, b*100, s*100, m*100, (b-s)*100, (s-m)*100))
    print()


# ============================================================
# PART 2: N-SENSITIVITY PANELS
# What a participant shows when you hold (D, d_N) fixed
# and increase N from 10 to 50
# ============================================================
print()
print('=' * 120)
print('  N-SENSITIVITY: What happens when the pool grows (10 -> 20 -> 50)')
print('  SN is FLAT across N. Bayesian moves. MR drifts slightly.')
print('  This is the primary test for B vs SN.')
print('=' * 120)
print()

for D in Ds:
    for c in ['0', 'D-1', 'D']:
        d_N = 0 if c == '0' else (D-1 if c == 'D-1' else D)
        nF = D - d_N

        print('  D=%d, d_N=%d (%d Normal, %d Flagged disclosed)' % (D, d_N, d_N, nF))
        print('  ' + '-' * 95)
        print('  %5s %5s | %10s %10s %10s | B change   SN change  MR change' %
              ('N', 'hid', 'Bayesian', 'SN', 'MR'))

        prev_b = prev_s = prev_m = None
        for N in Ns:
            b, s, m = post[(N, D, c)]
            hid = N - D
            if prev_b is not None:
                print('  %5d %5d | %9.1f%% %9.1f%% %9.1f%% | %+8.1f pp %+8.1f pp %+8.1f pp' %
                      (N, hid, b*100, s*100, m*100, (b-prev_b)*100, (s-prev_s)*100, (m-prev_m)*100))
            else:
                print('  %5d %5d | %9.1f%% %9.1f%% %9.1f%% |    (base)    (base)    (base)' %
                      (N, hid, b*100, s*100, m*100))
            prev_b, prev_s, prev_m = b, s, m

        # Total range
        bvals = [post[(N, D, c)][0] for N in Ns]
        svals = [post[(N, D, c)][1] for N in Ns]
        mvals = [post[(N, D, c)][2] for N in Ns]
        print('  ' + '-' * 95)
        print('  Total range (N=10 to N=50): B=%+.1f pp   SN=%+.1f pp   MR=%+.1f pp' %
              ((max(bvals)-min(bvals))*100, (max(svals)-min(svals))*100, (max(mvals)-min(mvals))*100))

        # Interpretation
        b_range = (max(bvals)-min(bvals))*100
        m_range = (max(mvals)-min(mvals))*100
        if c == '0':
            print('  INTERPRETATION: Bad news disclosed (all Flagged).')
            if b_range > 30:
                print('    Bayesian SURGES +%.0f pp (infers pool is all Flagged -> very likely fraud).' % b_range)
            print('    SN stays at %.0f%% (only sees %d Flagged, ignores hidden).' % (svals[0]*100, nF))
            print('    MR drifts %.0f pp (more hidden -> more imputed at p_unc=48%% Normal).' % m_range)
        elif c == 'D-1':
            print('  INTERPRETATION: Mostly Normal disclosed (1 Flagged).')
            if b_range > 30:
                print('    Bayesian SURGES +%.0f pp (infers pool has exactly %d Normal -> suspicious with N=50).' % (b_range, d_N))
            print('    SN stays at %.0f%% (fixed at what %d signals show).' % (svals[0]*100, D))
            print('    MR drifts %.0f pp toward unconditional.' % m_range)
        else:
            print('  INTERPRETATION: All Normal disclosed (best case for manager).')
            print('    Bayesian stays ~20%% (pool could have >= %d Normal, ambiguous).' % D)
            print('    SN stays at %.0f%% (only sees Normal -> low fraud estimate).' % (svals[0]*100))
            print('    MR drifts %.0f pp as imputed hidden signals accumulate.' % m_range)
        print()

# ============================================================
# PART 3: THE PUNCHLINES -- Specific patterns to watch for
# ============================================================
print()
print('=' * 120)
print('  WHAT EACH TYPE LOOKS LIKE IN YOUR DATA')
print('=' * 120)

print("""
  A BAYESIAN participant will show these patterns:

    Pattern 1: HUGE N-sensitivity when news is bad (d_N=0 or D-1)
    ----------------------------------------------------------------
    D=8, d_N=0 (8 Flagged shown):
      N=10 -> 61%%,  N=20 -> 91%%,  N=50 -> 100%%   (+39 pp range)
    D=8, d_N=7 (7 Normal, 1 Flagged shown):
      N=10 ->  8%%,  N=20 -> 36%%,  N=50 ->  99%%   (+91 pp range!)

    Why: "If manager shows me 8 Flagged signals from a pool of 50,
    there must be ZERO Normal signals in the entire pool. A pool of
    50 with 0 Normal is virtually impossible for a clean firm (0.5^50)."

    Pattern 2: FLAT when all disclosed are Normal (d_N=D)
    ----------------------------------------------------------------
    Any D, d_N=D (all Normal shown):
      N=10 -> ~5-18%%,  N=20 -> ~14-20%%,  N=50 -> 20%%

    Why: "All Normal disclosed just means at least D Normal in pool.
    That's ambiguous -- could be fraud or clean. Falls back near prior."

  A SELECTION NEGLECT (SN) participant will show these patterns:

    Pattern 1: COMPLETELY FLAT across N (the smoking gun)
    ----------------------------------------------------------------
    D=8, d_N=0:  N=10, 20, 50 all -> 52%%
    D=3, d_N=2:  N=10, 20, 50 all -> 16%%
    D=5, d_N=5:  N=10, 20, 50 all ->  8%%

    Why: "I only look at the signals shown to me. The pool has 10 or 50?
    Doesn't matter -- I see the same 8 Flagged signals."

    Pattern 2: Sensitive to D and d_N but NOT N
    ----------------------------------------------------------------
    D=3, d_N=0: 30%%  |  D=5, d_N=0: 38%%  |  D=8, d_N=0: 52%%
    (More Flagged signals -> higher fraud estimate, but N irrelevant)

  A MEAN-REVERTING (MR) participant will look like SN but with drift:

    Pattern 1: Slight DOWNWARD drift as N increases
    ----------------------------------------------------------------
    D=8, d_N=0:
      N=10 -> 51%%,  N=20 -> 48%%,  N=50 -> 39%%
    D=3, d_N=0:
      N=10 -> 28%%,  N=20 -> 26%%,  N=50 -> 20%%

    Why: "Hidden signals are probably average. More hidden signals ->
    more 'average' signals imputed -> pulls toward unconditional mean."

    Pattern 2: Key distinction from SN is the SLOPE with N
    ----------------------------------------------------------------
    SN: perfectly flat (0 pp change across N)
    MR: gradual drift (5-13 pp change across N, depending on D)

    Best separation at D=8, d_N=0:
      SN stays at 52%%, MR goes from 51%% down to 39%%
      Gap: 12 pp at N=50 (vs 0.6 pp at N=10)
""")


# ============================================================
# PART 4: SUMMARY TABLE -- All sensitivities ranked
# ============================================================
print('=' * 120)
print('  SENSITIVITY SUMMARY: Which comparisons have the most power?')
print('=' * 120)
print()
print('  TYPE SEPARATION      | BEST TEST                           | GAP    | WHAT CHANGES')
print('  ' + '-' * 95)

# B vs SN: N-test is primary
bsn = post[(50,8,'D-1')][0] - post[(10,8,'D-1')][0]
print('  B vs SN (primary)    | N-test: D=8, d_N=7, N: 10->50       | %.0f pp  | B: 8%%->99%%, SN: flat at 6%%' % (bsn*100))

bsn2 = post[(50,3,'0')][0] - post[(10,3,'0')][0]
print('  B vs SN (secondary)  | N-test: D=3, d_N=0, N: 10->50       | %.0f pp  | B: 61%%->100%%, SN: flat at 30%%' % (bsn2*100))

# SN vs MR: N-test on MR range
sn_mr_gap_10 = post[(10,8,'0')][1] - post[(10,8,'0')][2]
sn_mr_gap_50 = post[(50,8,'0')][1] - post[(50,8,'0')][2]
print('  SN vs MR (primary)   | N-test: D=8, d_N=0, N: 10->50       | %.0f pp  | SN: 52%%(flat), MR: 51%%->39%%' %
      ((sn_mr_gap_50 - sn_mr_gap_10)*100))

# The d_N=D cases for completeness
print('  SN vs MR (secondary) | N-test: D=3, d_N=0, N: 10->50       | %.0f pp  | SN: 30%%(flat), MR: 28%%->20%%' %
      ((post[(50,3,'0')][1]-post[(50,3,'0')][2] - (post[(10,3,'0')][1]-post[(10,3,'0')][2]))*100))

print()
print('  NOTE: B vs SN separation is trivially easy (30-90 pp gaps).')
print('  The hard part is SN vs MR: the max gap is only ~12 pp.')
print('  That is why the N-test at D=8, d_N=0 is the BINDING constraint.')
print()
print('  With a within-subject design (each person sees all 27 trials),')
print('  we estimate individual-level slopes across N. The question is')
print('  whether we can reliably distinguish a FLAT slope (SN) from')
print('  a GENTLE NEGATIVE slope (MR) across just 3 N values.')

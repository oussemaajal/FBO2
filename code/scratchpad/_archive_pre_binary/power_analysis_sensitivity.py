"""
Power Analysis: Sensitivity-to-N Replication (Farina et al.)
FBO 2 Project

Core question: As N (pool size) grows with K (disclosed) fixed,
a Bayesian should become MORE skeptical. Do participants adjust?
How many participants to detect insufficient adjustment?
"""

import numpy as np
from scipy.stats import binom, norm
from scipy.special import gammaln

# =============================================================================
# PARAMETERS
# =============================================================================

P_NF = np.array([0.60, 0.30, 0.10])  # non-fraud
P_F  = np.array([0.40, 0.30, 0.30])  # fraud
PRIOR = 0.5

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

SCALE_CONDITIONS = [
    ('K=3,N=10',      3,    10),
    ('K=3,N=100',     3,   100),
    ('K=3,N=1000',    3,  1000),
    ('K=30,N=100',   30,   100),
    ('K=300,N=1000', 300, 1000),
]

# =============================================================================
# POSTERIOR COMPUTATION
# =============================================================================

def get_counts(K, pN, pU, pHU):
    nN = round(pN * K)
    nU = round(pU * K)
    nHU = K - nN - nU
    return nN, nU, nHU

def compute_log_likelihood(K, N, dN, dU, dHU, probs):
    """
    log P(disclosed = (dN,dU,dHU) | probs) with manager selecting best K.

    Key insight: the set of total compositions (tN, tU, tHU) that produce
    a given disclosed set has a clean structure:
    - If dHU > 0: unique total (dN, dU, N-dN-dU)
    - If dN = K:  tN >= K (all others free)
    - Else:       tN = dN, tU >= K-dN (dHU = 0)
    """
    if dHU > 0:
        tHU_total = N - dN - dU
        if tHU_total < dHU:
            return -np.inf
        log_p = (gammaln(N+1) - gammaln(dN+1) - gammaln(dU+1) - gammaln(tHU_total+1))
        if dN > 0: log_p += dN * np.log(probs[0])
        if dU > 0: log_p += dU * np.log(probs[1])
        if tHU_total > 0: log_p += tHU_total * np.log(probs[2])
        return log_p

    elif dN == K:
        p = 1 - binom.cdf(K - 1, N, probs[0])
        return np.log(max(p, 1e-300))

    else:
        # tN = dN exactly, tU >= K - dN
        p_tN = binom.pmf(dN, N, probs[0])
        if p_tN <= 0:
            return -np.inf
        remaining = N - dN
        p_cond = probs[1] / (probs[1] + probs[2])
        min_tU = K - dN
        p_tU_geq = 1 - binom.cdf(min_tU - 1, remaining, p_cond)
        total_p = p_tN * p_tU_geq
        return np.log(max(total_p, 1e-300))

def bayesian_posterior(K, N, dN, dU, dHU):
    log_lf = compute_log_likelihood(K, N, dN, dU, dHU, P_F)
    log_lnf = compute_log_likelihood(K, N, dN, dU, dHU, P_NF)
    log_ratio = log_lnf - log_lf  # log(L_nf / L_f)
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
# COMPUTE ALL POSTERIORS
# =============================================================================

results = {}
for sc_label, K, N in SCALE_CONDITIONS:
    for c_label, pN, pU, pHU in COMPOSITIONS:
        dN, dU, dHU = get_counts(K, pN, pU, pHU)
        bp = bayesian_posterior(K, N, dN, dU, dHU)
        np_val = naive_posterior(dN, dU, dHU)
        results[(K, N, c_label)] = {
            'bayesian': bp, 'naive': np_val,
            'counts': (dN, dU, dHU)
        }

# =============================================================================
# TABLE 1: K=3, varying N
# =============================================================================

print("=" * 100)
print("TABLE 1: Bayesian Posteriors for K=3, varying N")
print("(Naive/SN posterior depends only on disclosed composition, not N)")
print("=" * 100)
print(f"{'Trial':<6} {'Comp':<10} {'Naive/SN':>8} {'Bayes':>8} {'Bayes':>10} {'Bayes':>12}  "
      f"{'d(10->100)':>10} {'d(10->1k)':>10}")
print(f"{'':>26} {'N=10':>8} {'N=100':>10} {'N=1000':>12}")
print("-" * 100)

d_10_100 = []
d_10_1000 = []

for c_label, pN, pU, pHU in COMPOSITIONS:
    dN, dU, dHU = get_counts(3, pN, pU, pHU)
    nv = results[(3, 10, c_label)]['naive']
    b10 = results[(3, 10, c_label)]['bayesian']
    b100 = results[(3, 100, c_label)]['bayesian']
    b1000 = results[(3, 1000, c_label)]['bayesian']

    dd1 = b100 - b10
    dd2 = b1000 - b10
    d_10_100.append(dd1)
    d_10_1000.append(dd2)

    print(f"{c_label:<6} ({dN},{dU},{dHU})   {nv:>7.3f}  {b10:>7.4f}  {b100:>9.4f}  {b1000:>11.4f}  "
          f"{dd1:>+10.4f} {dd2:>+10.4f}")

print("-" * 100)
print(f"Average (all 10):  d(10->100) = {np.mean(d_10_100):+.4f}   d(10->1000) = {np.mean(d_10_1000):+.4f}")
print(f"Average (T1-T4):   d(10->100) = {np.mean(d_10_100[:4]):+.4f}   d(10->1000) = {np.mean(d_10_1000[:4]):+.4f}")

# =============================================================================
# TABLE 2: All 5 scale conditions (naive posteriors)
# =============================================================================

print("\n\n" + "=" * 100)
print("TABLE 2: Naive Posteriors Across Scale Conditions")
print("(Shows how the naive/SN response gets more extreme at larger K)")
print("=" * 100)
header = f"{'Trial':<6}"
for sc_label, K, N in SCALE_CONDITIONS:
    header += f"  {sc_label:>14}"
print(header)
print("-" * 100)

for c_label, pN, pU, pHU in COMPOSITIONS:
    row = f"{c_label:<6}"
    for sc_label, K, N in SCALE_CONDITIONS:
        nv = results[(K, N, c_label)]['naive']
        row += f"  {nv:>14.6f}"
    print(row)

# =============================================================================
# TABLE 3: All Bayesian posteriors
# =============================================================================

print("\n\n" + "=" * 100)
print("TABLE 3: Bayesian Posteriors Across Scale Conditions")
print("=" * 100)
header = f"{'Trial':<6}"
for sc_label, K, N in SCALE_CONDITIONS:
    header += f"  {sc_label:>14}"
print(header)
print("-" * 100)

for c_label, pN, pU, pHU in COMPOSITIONS:
    row = f"{c_label:<6}"
    for sc_label, K, N in SCALE_CONDITIONS:
        bp = results[(K, N, c_label)]['bayesian']
        row += f"  {bp:>14.4f}"
    print(row)

# =============================================================================
# TABLE 4: Bayesian - Naive gap (the SN effect)
# =============================================================================

print("\n\n" + "=" * 100)
print("TABLE 4: Bayesian - Naive Gap (what a rational agent 'adds' over SN)")
print("=" * 100)
header = f"{'Trial':<6}"
for sc_label, K, N in SCALE_CONDITIONS:
    header += f"  {sc_label:>14}"
print(header)
print("-" * 100)

for c_label, pN, pU, pHU in COMPOSITIONS:
    row = f"{c_label:<6}"
    for sc_label, K, N in SCALE_CONDITIONS:
        bp = results[(K, N, c_label)]['bayesian']
        nv = results[(K, N, c_label)]['naive']
        row += f"  {bp - nv:>+14.4f}"
    print(row)

print("\nAverage gap:")
row = f"{'Mean':<6}"
for sc_label, K, N in SCALE_CONDITIONS:
    gaps = [results[(K, N, c)]['bayesian'] - results[(K, N, c)]['naive']
            for c, _, _, _ in COMPOSITIONS]
    row += f"  {np.mean(gaps):>+14.4f}"
print(row)

# =============================================================================
# POWER ANALYSIS
# =============================================================================

print("\n\n" + "=" * 100)
print("POWER ANALYSIS: Sensitivity-to-N Test")
print("=" * 100)

print("""
MODEL: Each participant sees C compositions at 2+ N-levels.
  response_{ic}(N) = (1-beta) * naive(c) + beta * Bayesian(c,N) + noise

  Within-subject difference: d_{ic} = response(c,N_high) - response(c,N_low)
  E[d_{ic}] = beta * delta_c   where delta_c = Bayesian(c,N_high) - Bayesian(c,N_low)
  Var(d_{ic}) = 2*sigma^2*(1-rho)  where rho = within-subject correlation

  Participant average: S_i = mean_c(d_{ic})
  E[S_i] = beta * mean(delta_c)
  SD(S_i) = sigma * sqrt(2*(1-rho)/C)

TEST: One-sample t-test on S_i, H0: E[S_i] = 0 (pure SN)

PARAMETERS:
  beta:  fraction of Bayesian adjustment (0 = SN, 1 = Bayesian)
  sigma: within-subject SD of responses (0-1 scale; 0.15 = 15pp)
  rho:   within-subject correlation across N levels for same composition
""")

def required_n(effect, sd_participant, alpha=0.05, power=0.80):
    """Required n for one-sample t-test."""
    z_a = norm.ppf(1 - alpha / 2)
    z_b = norm.ppf(power)
    n = ((z_a + z_b) * sd_participant / effect) ** 2
    return int(np.ceil(n))

# --- Scenario A: K=3, N=10 vs N=100, all 10 compositions ---
print("-" * 100)
print("SCENARIO A: K=3, N=10 vs N=100, 10 compositions within-subject")
print(f"  Average Bayesian delta: {np.mean(d_10_100):.4f} ({np.mean(d_10_100)*100:.1f}pp)")
print(f"  Compositions with delta > 0.01: {sum(1 for d in d_10_100 if d > 0.01)}/10")
print()

print(f"{'beta':>6} {'sigma':>6} {'rho':>6} | {'Effect':>8} {'SD_part':>8} {'Cohen_d':>8} "
      f"{'n(80%)':>8} {'n(90%)':>8}")
print("-" * 75)
for beta in [0.2, 0.3, 0.5, 1.0]:
    for sigma in [0.10, 0.15, 0.20]:
        for rho in [0.3, 0.5, 0.7]:
            C = 10
            effect = beta * np.mean(d_10_100)
            sd_part = sigma * np.sqrt(2*(1-rho)/C)
            cohens_d = effect / sd_part
            n80 = required_n(effect, sd_part, power=0.80)
            n90 = required_n(effect, sd_part, power=0.90)
            print(f"{beta:>6.1f} {sigma:>6.2f} {rho:>6.1f} | {effect:>8.4f} {sd_part:>8.4f} "
                  f"{cohens_d:>8.3f} {n80:>8d} {n90:>8d}")
    print()

# --- Scenario B: K=3, N=10 vs N=1000, all 10 compositions ---
print("\n" + "-" * 100)
print("SCENARIO B: K=3, N=10 vs N=1000, 10 compositions within-subject")
print(f"  Average Bayesian delta: {np.mean(d_10_1000):.4f} ({np.mean(d_10_1000)*100:.1f}pp)")
print()

print(f"{'beta':>6} {'sigma':>6} {'rho':>6} | {'Effect':>8} {'SD_part':>8} {'Cohen_d':>8} "
      f"{'n(80%)':>8} {'n(90%)':>8}")
print("-" * 75)
for beta in [0.2, 0.3, 0.5, 1.0]:
    for sigma in [0.10, 0.15, 0.20]:
        for rho in [0.3, 0.5, 0.7]:
            C = 10
            effect = beta * np.mean(d_10_1000)
            sd_part = sigma * np.sqrt(2*(1-rho)/C)
            cohens_d = effect / sd_part
            n80 = required_n(effect, sd_part, power=0.80)
            n90 = required_n(effect, sd_part, power=0.90)
            print(f"{beta:>6.1f} {sigma:>6.2f} {rho:>6.1f} | {effect:>8.4f} {sd_part:>8.4f} "
                  f"{cohens_d:>8.3f} {n80:>8d} {n90:>8d}")
    print()

# --- Scenario C: K=3, N=10 vs N=100, only T1-T4 (informative compositions) ---
print("\n" + "-" * 100)
print("SCENARIO C: K=3, N=10 vs N=100, only T1-T4 (4 compositions with delta > 0)")
print(f"  Average Bayesian delta (T1-T4): {np.mean(d_10_100[:4]):.4f} ({np.mean(d_10_100[:4])*100:.1f}pp)")
print()

print(f"{'beta':>6} {'sigma':>6} {'rho':>6} | {'Effect':>8} {'SD_part':>8} {'Cohen_d':>8} "
      f"{'n(80%)':>8} {'n(90%)':>8}")
print("-" * 75)
for beta in [0.2, 0.3, 0.5, 1.0]:
    for sigma in [0.10, 0.15, 0.20]:
        for rho in [0.3, 0.5, 0.7]:
            C = 4
            effect = beta * np.mean(d_10_100[:4])
            sd_part = sigma * np.sqrt(2*(1-rho)/C)
            cohens_d = effect / sd_part
            n80 = required_n(effect, sd_part, power=0.80)
            n90 = required_n(effect, sd_part, power=0.90)
            print(f"{beta:>6.1f} {sigma:>6.2f} {rho:>6.1f} | {effect:>8.4f} {sd_part:>8.4f} "
                  f"{cohens_d:>8.3f} {n80:>8d} {n90:>8d}")
    print()

# --- Scenario D: 3 N-levels (10, 100, 1000) with linear trend ---
print("\n" + "-" * 100)
print("SCENARIO D: K=3, all 3 N-levels (10, 100, 1000), linear trend in log(N)")
print("  Uses all 10 compositions x 3 N-levels = 30 trials per participant")
print()

# For a linear regression of response on log(N), the sensitivity is estimated
# from the slope. With 3 points, the design matrix X = [log(10), log(100), log(1000)]
# The slope's precision depends on Var(X) and the residual variance.

log_N = np.log([10, 100, 1000])
log_N_centered = log_N - np.mean(log_N)
var_logN = np.var(log_N_centered, ddof=0)  # within-design variance

# For each composition, compute the Bayesian slope in log(N)
print("Bayesian posteriors across log(N) for each composition:")
for c_label, pN, pU, pHU in COMPOSITIONS:
    vals = [results[(3, N, c_label)]['bayesian'] for N in [10, 100, 1000]]
    # OLS slope
    slope = np.sum(log_N_centered * (vals - np.mean(vals))) / np.sum(log_N_centered**2)
    print(f"  {c_label}: Bayes = [{vals[0]:.4f}, {vals[1]:.4f}, {vals[2]:.4f}]  slope = {slope:+.4f}")

# Average slope across compositions
all_slopes = []
for c_label, pN, pU, pHU in COMPOSITIONS:
    vals = [results[(3, N, c_label)]['bayesian'] for N in [10, 100, 1000]]
    slope = np.sum(log_N_centered * (vals - np.mean(vals))) / np.sum(log_N_centered**2)
    all_slopes.append(slope)

avg_slope = np.mean(all_slopes)
print(f"\nAverage Bayesian slope: {avg_slope:.4f} (per unit log(N))")
print(f"This means: going from N=10 to N=100 (delta log(N) = {np.log(100)-np.log(10):.2f}),")
print(f"  the average Bayesian posterior increases by {avg_slope * (np.log(100)-np.log(10)):.4f}")

print()
print(f"{'beta':>6} {'sigma':>6} {'rho':>6} | {'Slope':>8} {'SE_slope':>9} {'t_stat':>8} "
      f"{'n(80%)':>8} {'n(90%)':>8}")
print("-" * 75)

for beta in [0.2, 0.3, 0.5, 1.0]:
    for sigma in [0.10, 0.15, 0.20]:
        for rho in [0.3, 0.5, 0.7]:
            C = 10
            T = 3  # number of N-levels
            true_slope = beta * avg_slope

            # SE of the slope estimate from within-subject regression
            # Each participant has C*T = 30 observations
            # Residual variance: sigma^2 (adjusted for correlation)
            # For within-subject repeated measures with correlation rho,
            # effective residual variance per observation ≈ sigma^2 * (1-rho)
            # (within-subject variation after removing subject effects)

            sigma_eff = sigma * np.sqrt(1 - rho)

            # SE of slope for one participant: sigma_eff / sqrt(C * sum(x_centered^2))
            # where sum(x_centered^2) = T * var_logN
            se_slope_one = sigma_eff / np.sqrt(C * np.sum(log_N_centered**2))

            # SE of average slope across n participants
            # se_slope = se_slope_one / sqrt(n)
            # For power: n = ((z_a + z_b) * se_slope_one / true_slope)^2

            z_a = norm.ppf(0.975)
            z_80 = norm.ppf(0.80)
            z_90 = norm.ppf(0.90)

            n80 = int(np.ceil((z_a + z_80)**2 * se_slope_one**2 / true_slope**2))
            n90 = int(np.ceil((z_a + z_90)**2 * se_slope_one**2 / true_slope**2))

            # t_stat for n=100
            t100 = true_slope / (se_slope_one / np.sqrt(100))

            print(f"{beta:>6.1f} {sigma:>6.2f} {rho:>6.1f} | {true_slope:>8.4f} {se_slope_one:>9.4f} "
                  f"{t100:>8.2f} {n80:>8d} {n90:>8d}")
    print()


# =============================================================================
# SIMULATION-BASED POWER (verify analytical results)
# =============================================================================

print("\n" + "=" * 100)
print("SIMULATION-BASED POWER VERIFICATION")
print("(1000 simulations, Scenario B: K=3, N=10 vs N=1000, 10 compositions)")
print("=" * 100)

np.random.seed(42)
n_sims = 2000

# Key parameter set
beta_true = 0.3
sigma_true = 0.15
rho_true = 0.5

deltas_c = np.array(d_10_1000)
naives = np.array([results[(3, 10, c)]['naive'] for c, _, _, _ in COMPOSITIONS])
bayesians_low = np.array([results[(3, 10, c)]['bayesian'] for c, _, _, _ in COMPOSITIONS])
bayesians_high = np.array([results[(3, 1000, c)]['bayesian'] for c, _, _, _ in COMPOSITIONS])

print(f"\nParameters: beta={beta_true}, sigma={sigma_true}, rho={rho_true}")
print(f"Bayesian deltas: {[f'{d:.4f}' for d in deltas_c]}")
print(f"Average delta: {np.mean(deltas_c):.4f}\n")

for n_part in [20, 40, 60, 80, 100, 150, 200, 300]:
    rejections = 0
    for sim in range(n_sims):
        # Generate participant-level beta (heterogeneous)
        betas = np.clip(np.random.normal(beta_true, 0.15, n_part), 0, 1)

        participant_avgs = []
        for i in range(n_part):
            bi = betas[i]
            diffs = []
            for c in range(10):
                # Expected response at N_low and N_high
                mu_low = (1 - bi) * naives[c] + bi * bayesians_low[c]
                mu_high = (1 - bi) * naives[c] + bi * bayesians_high[c]

                # Generate correlated noise
                e1 = np.random.normal(0, sigma_true)
                e2 = rho_true * e1 + np.sqrt(1 - rho_true**2) * np.random.normal(0, sigma_true)

                r_low = np.clip(mu_low + e1, 0, 1)
                r_high = np.clip(mu_high + e2, 0, 1)
                diffs.append(r_high - r_low)

            participant_avgs.append(np.mean(diffs))

        # One-sample t-test
        avg = np.mean(participant_avgs)
        se = np.std(participant_avgs, ddof=1) / np.sqrt(n_part)
        t_stat = avg / se
        p_val = 2 * (1 - norm.cdf(abs(t_stat)))  # approximate

        if p_val < 0.05:
            rejections += 1

    power = rejections / n_sims
    print(f"  n = {n_part:>4d}:  power = {power:.3f}  ({'*' if power >= 0.80 else ' '}80%"
          f"{'  *90%' if power >= 0.90 else ''})")

# Also test with beta = 0.5
print(f"\nWith beta=0.5:")
beta_true2 = 0.5
for n_part in [20, 40, 60, 80, 100]:
    rejections = 0
    for sim in range(n_sims):
        betas = np.clip(np.random.normal(beta_true2, 0.15, n_part), 0, 1)
        participant_avgs = []
        for i in range(n_part):
            bi = betas[i]
            diffs = []
            for c in range(10):
                mu_low = (1 - bi) * naives[c] + bi * bayesians_low[c]
                mu_high = (1 - bi) * naives[c] + bi * bayesians_high[c]
                e1 = np.random.normal(0, sigma_true)
                e2 = rho_true * e1 + np.sqrt(1 - rho_true**2) * np.random.normal(0, sigma_true)
                r_low = np.clip(mu_low + e1, 0, 1)
                r_high = np.clip(mu_high + e2, 0, 1)
                diffs.append(r_high - r_low)
            participant_avgs.append(np.mean(diffs))

        avg = np.mean(participant_avgs)
        se = np.std(participant_avgs, ddof=1) / np.sqrt(n_part)
        t_stat = avg / se
        if 2 * (1 - norm.cdf(abs(t_stat))) < 0.05:
            rejections += 1

    power = rejections / n_sims
    print(f"  n = {n_part:>4d}:  power = {power:.3f}  ({'*' if power >= 0.80 else ' '}80%"
          f"{'  *90%' if power >= 0.90 else ''})")

print("\n\nDone.")

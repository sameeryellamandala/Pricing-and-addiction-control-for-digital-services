/**
 * Validates the model assumptions according to the paper.
 */

/**
 * Checks Assumption 1: Finite addiction (stability condition).
 * The condition is: mu * (1 + zeta / eta) < 1.
 * If violated, addiction diverges to infinity in the long run.
 * 
 * @param {object} params - Model parameters { lam, eta, mu, zeta, rho, sigma, T }
 * @returns {boolean} - True if Assumption 1 holds, false otherwise.
 */
export function checkAssumption1(params) {
  const { mu, zeta, eta } = params;
  if (eta <= 0) return false;
  return mu * (1.0 + zeta / eta) < 1.0;
}

/**
 * Checks Assumption 2: Positive consumption condition.
 * The condition is: sigma < lam / 2.
 * If violated, consumption can become zero in some periods under random shocks.
 * 
 * @param {object} params - Model parameters
 * @returns {boolean} - True if Assumption 2 holds, false otherwise.
 */
export function checkAssumption2(params) {
  const { lam, sigma } = params;
  return sigma < lam / 2.0;
}

/**
 * Checks all assumptions and returns detailed validation status.
 * 
 * @param {object} params - Model parameters
 * @returns {object} - { isValid: boolean, assumption1: boolean, assumption2: boolean, errorMessage: string | null }
 */
export function validateParams(params) {
  const a1 = checkAssumption1(params);
  const a2 = checkAssumption2(params);
  
  let errorMessage = null;
  if (!a1) {
    errorMessage = "Assumption 1 Violated: Habit persistence strength too high, leading to divergent (infinite) addiction in the long run. Decrease habit persistence (μ) or habit strength (ζ), or increase price sensitivity (η).";
  } else if (!a2) {
    errorMessage = "Assumption 2 Violated: Experience variation (σ) is too large relative to base marginal utility (λ). Lower experience variation (σ) or increase base utility (λ) to ensure positive consumption.";
  }

  return {
    isValid: a1 && a2,
    assumption1: a1,
    assumption2: a2,
    errorMessage
  };
}

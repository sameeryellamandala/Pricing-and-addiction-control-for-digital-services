/**
 * Core mathematical equations and analytical solutions from the paper.
 */

import { checkAssumption1 } from './assertions.js';

/**
 * Optimal fixed price p_F (Proposition 1a).
 * p_F = lam / 2.
 */
export function computeFixedPrice(params) {
  return params.lam / 2.0;
}

/**
 * Long-run average addiction under fixed pricing (Proposition 1b).
 * ES_F = (lam / 2) * mu / (eta - mu * eta - mu * zeta).
 */
export function computeES_F(params) {
  const { lam, eta, mu, zeta } = params;
  if (!checkAssumption1(params)) return NaN;
  return (lam / 2.0) * mu / (eta - mu * eta - mu * zeta);
}

/**
 * Solves the dynamic programming quadratic system for pricing parameters a and b (Proposition 2a).
 * p_D(s) = a * s + b.
 * 
 * Returns { a, b }
 */
export function solveDynamicAB(params) {
  const { lam, eta, mu, zeta, rho } = params;

  if (!checkAssumption1(params)) {
    return { a: NaN, b: NaN };
  }

  const rho_mu2 = rho * (mu ** 2);
  
  // disc = (rho * mu^2 - 1) * (-eta^2 + zeta^2 * mu^2 * rho + 2 * zeta * eta * mu^2 * rho + eta^2 * mu^2 * rho)
  const bracket = - (eta ** 2) + 
                  (zeta ** 2) * (mu ** 2) * rho + 
                  2.0 * zeta * eta * (mu ** 2) * rho + 
                  (eta ** 2) * (mu ** 2) * rho;
                  
  const disc = (rho_mu2 - 1.0) * bracket;

  let a;
  if (disc < 0) {
    // Fallback if disc < 0 (paper Section 4.2)
    a = zeta / 2.0;
  } else {
    const num_term = (eta ** 2) / rho_mu2;
    const sqrt_term = (eta * Math.sqrt(disc)) / rho_mu2;
    const numerator = (zeta ** 2) + 2.0 * zeta * eta + (eta ** 2) - num_term + sqrt_term;
    const denominator = zeta + 2.0 * eta;
    a = numerator / denominator;
  }

  // Always clamp a between 0 and zeta (Paper Proposition 2a)
  a = Math.max(0.0, Math.min(zeta, a));

  // Compute ES_D analytically to solve for b
  const esD = computeES_D(params);

  // steady state price:
  // p_D(ES_D) = [eta * (1 - rho * mu * (1 + zeta/eta)) * (1 - mu)/mu] / (1 - rho * mu) * ES_D
  const pD_ESD_num = eta * (1.0 - rho * mu * (1.0 + zeta / eta)) * (1.0 - mu) / mu;
  const pD_ESD_den = 1.0 - rho * mu;
  const pD_ESD = (pD_ESD_num / pD_ESD_den) * esD;

  // Since p_D(s) = a * s + b, we have b = p_D(ES_D) - a * ES_D
  let b = pD_ESD - a * esD;
  
  // Ensure b < lam / 2 (Paper Proposition 2a)
  if (b >= lam / 2.0) {
    b = lam / 2.0 - 1e-9;
  }

  return { a, b };
}

/**
 * Long-run average addiction under dynamic pricing (Proposition 2c).
 * ES_D = (lam / 2) * mu / (eta - mu * eta - mu * zeta + [(1 - rho) / (1 - rho * mu)] * mu * zeta / 2).
 */
export function computeES_D(params) {
  const { lam, eta, mu, zeta, rho } = params;
  if (!checkAssumption1(params)) return NaN;
  
  const term_rho = (1.0 - rho) / (1.0 - rho * mu);
  const term_zeta = term_rho * mu * zeta / 2.0;
  return (lam / 2.0) * mu / (eta - mu * eta - mu * zeta + term_zeta);
}

/**
 * Long-run average addiction under dynamic pricing with consumption tax xi.
 * ES_DCT = ((lam - xi) / 2) * mu / (eta - mu * eta - mu * zeta + [(1 - rho)/(1 - rho * mu)] * mu * zeta / 2).
 */
export function computeES_DCT(params, xi) {
  const { lam, eta, mu, zeta, rho } = params;
  if (!checkAssumption1(params)) return NaN;

  const term_rho = (1.0 - rho) / (1.0 - rho * mu);
  const term_zeta = term_rho * mu * zeta / 2.0;
  return ((lam - xi) / 2.0) * mu / (eta - mu * eta - mu * zeta + term_zeta);
}

/**
 * Intercept of dynamic pricing pricing rule under consumption tax xi (Lemma EC.5b).
 * Returns { a_CT, b_CT } where a_CT = a (the same as without tax),
 * and b_CT = b + (xi/2) * (eta - mu * eta - mu * zeta + a * mu) / (eta - mu * eta - mu * zeta - (1-rho)/(1-rho*mu) * mu * zeta / 2)
 */
export function solveDynamicABTax(params, xi) {
  const { a, b } = solveDynamicAB(params);
  const { eta, mu, zeta, rho } = params;

  if (isNaN(a) || isNaN(b)) {
    return { a: NaN, b: NaN };
  }

  const term_rho = (1.0 - rho) / (1.0 - rho * mu);
  const D1 = eta - mu * eta - mu * zeta + a * mu;
  const D2 = eta - mu * eta - mu * zeta - term_rho * (mu * zeta / 2.0);

  const b_CT = b + (xi / 2.0) * (D1 / D2);

  return { a_CT: a, b_CT };
}

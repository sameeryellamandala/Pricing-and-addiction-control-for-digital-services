/**
 * Simulation engine for fixed and dynamic pricing under various policies.
 */

import { computeFixedPrice, solveDynamicAB, solveDynamicABTax } from './model.js';

/**
 * Linear Congruential Generator for reproducible seedable random noise.
 */
function createPRNG(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Standard baseline simulation (no policy).
 */
export function simulate(useFixed, params, seed = 42) {
  const { lam, eta, mu, zeta, sigma, T } = params;
  const rand = createPRNG(seed);
  
  let s = 0.0; // initial addiction s_1 = 0
  const results = [];

  const pF = computeFixedPrice(params);
  const { a, b } = solveDynamicAB(params);

  for (let t = 0; t < T; t++) {
    // Experience variation shock: +sigma with prob 0.5, -sigma with prob 0.5
    const delta = sigma > 0 ? (rand() < 0.5 ? sigma : -sigma) : 0.0;
    
    // Pricing
    const p = useFixed ? pF : a * s + b;
    
    // Consumption
    const x = Math.max((zeta * s + lam + delta - p) / eta, 0.0);
    
    results.push({
      t,
      s,
      p,
      x,
      profit: p * x
    });

    // Update state
    s = mu * (s + x);
  }

  return results;
}

/**
 * Simulation under Consumption Limit (CL).
 * x_t <= xBar.
 */
export function simulateWithCL(useFixed, xBar, params, seed = 42) {
  const { lam, eta, mu, zeta, sigma, T } = params;
  const rand = createPRNG(seed);
  
  let s = 0.0;
  const results = [];

  const { a, b } = solveDynamicAB(params);

  // For fixed pricing, find the optimal price p numerically by sweeping p in [0, lam]
  let pF_CL = lam / 2.0;
  if (useFixed) {
    let bestProfit = -1.0;
    const numGridPoints = 50;
    for (let i = 0; i <= numGridPoints; i++) {
      const pCand = (lam * i) / numGridPoints;
      // Evaluate expected profit with this price candidate
      // We run a short simulation with the same seed
      const evalRand = createPRNG(seed);
      let sEval = 0.0;
      let profitSum = 0.0;
      for (let te = 0; te < T; te++) {
        const delta = sigma > 0 ? (evalRand() < 0.5 ? sigma : -sigma) : 0.0;
        const x = Math.min(Math.max((zeta * sEval + lam + delta - pCand) / eta, 0.0), xBar);
        profitSum += Math.pow(params.rho || 0.95, te) * pCand * x;
        sEval = mu * (sEval + x);
      }
      if (profitSum > bestProfit) {
        bestProfit = profitSum;
        pF_CL = pCand;
      }
    }
  }

  for (let t = 0; t < T; t++) {
    const delta = sigma > 0 ? (rand() < 0.5 ? sigma : -sigma) : 0.0;
    
    let p;
    if (useFixed) {
      p = pF_CL;
    } else {
      // Under CL, the firm charges unconstrained price or pushes the price
      // to extract maximum profit up to the limit xBar
      const p_uncon = a * s + b;
      const p_limit = zeta * s + lam + delta - eta * xBar;
      p = Math.max(p_uncon, p_limit);
    }
    
    const x = Math.min(Math.max((zeta * s + lam + delta - p) / eta, 0.0), xBar);
    
    results.push({
      t,
      s,
      p,
      x,
      profit: p * x
    });

    s = mu * (s + x);
  }

  return results;
}

/**
 * Simulation under Price Floor (PF).
 * p_t >= pFloor.
 */
export function simulateWithPF(useFixed, pFloor, params, seed = 42) {
  const { lam, eta, mu, zeta, sigma, T } = params;
  const rand = createPRNG(seed);
  
  let s = 0.0;
  const results = [];

  const pF = computeFixedPrice(params);
  const { a, b } = solveDynamicAB(params);

  for (let t = 0; t < T; t++) {
    const delta = sigma > 0 ? (rand() < 0.5 ? sigma : -sigma) : 0.0;
    
    const p = useFixed ? Math.max(pF, pFloor) : Math.max(a * s + b, pFloor);
    const x = Math.max((zeta * s + lam + delta - p) / eta, 0.0);
    
    results.push({
      t,
      s,
      p,
      x,
      profit: p * x
    });

    s = mu * (s + x);
  }

  return results;
}

/**
 * Simulation under Consumption Tax (CT).
 * Firm pays tax xi per unit.
 */
export function simulateWithCT(useFixed, xi, params, seed = 42) {
  const { lam, eta, mu, zeta, sigma, T } = params;
  const rand = createPRNG(seed);
  
  let s = 0.0;
  const results = [];

  // Fixed optimal price under tax is p_FCT = (lambda + xi) / 2
  const pF_CT = (lam + xi) / 2.0;
  
  // Dynamic parameters under tax
  const { a_CT, b_CT } = solveDynamicABTax(params, xi);

  for (let t = 0; t < T; t++) {
    const delta = sigma > 0 ? (rand() < 0.5 ? sigma : -sigma) : 0.0;
    
    const p = useFixed ? pF_CT : a_CT * s + b_CT;
    const x = Math.max((zeta * s + lam + delta - p) / eta, 0.0);
    
    // Welfare is p * x (since firm profit = (p - xi)*x and tax revenue = xi*x)
    results.push({
      t,
      s,
      p,
      x,
      profit: p * x
    });

    s = mu * (s + x);
  }

  return results;
}

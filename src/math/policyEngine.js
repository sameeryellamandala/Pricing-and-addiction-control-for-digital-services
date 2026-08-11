/**
 * Policy engine to build efficiency curves for various regulations.
 */

import { simulateWithCL, simulateWithPF, simulateWithCT } from './simulate.js';
import { computeES_F, computeES_D } from './model.js';

/**
 * Calculates the total discounted profit and average addiction for a simulation result.
 */
function evaluateSim(results, rho) {
  let discountProfit = 0.0;
  let sSum = 0.0;
  const T = results.length;

  for (let t = 0; t < T; t++) {
    discountProfit += Math.pow(rho, t) * results[t].profit;
    sSum += results[t].s;
  }

  return {
    ES: sSum / T,
    profit: discountProfit
  };
}

/**
 * Builds the efficiency curve for a single policy and pricing scheme.
 * 
 * @param {string} policy - 'CL' | 'PF' | 'CT'
 * @param {boolean} useFixed - True for fixed pricing, false for dynamic pricing
 * @param {object} params - Model parameters
 * @returns {array} - Array of { x: ES, y: profit } sorted by x (ES)
 */
export function buildEfficiencyCurve(policy, useFixed, params) {
  const points = [];
  const rho = params.rho || 0.95;
  const lam = params.lam;
  const eta = params.eta;
  const mu = params.mu;
  const zeta = params.zeta;
  
  // Calculate unconstrained steady state consumption x_max to know how to sweep
  const esUncon = useFixed ? computeES_F(params) : computeES_D(params);
  const xUnconSS = (1.0 - mu) / mu * esUncon;
  const xMax = Math.max(xUnconSS * 1.5, 1.5);
  
  // We sweep 30 steps from loose (no effect) to tight (full suppression)
  const steps = 30;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // goes from 0.0 to 1.0
    let es = 0.0;
    let profit = 0.0;

    if (policy === 'CL') {
      // Consumption limit xBar goes from xMax (loose) down to 0.01 (tight)
      const xBar = xMax - t * (xMax - 0.01);
      const simResults = simulateWithCL(useFixed, xBar, params);
      const evalResult = evaluateSim(simResults, rho);
      es = evalResult.ES;
      profit = evalResult.profit;
    } else if (policy === 'PF') {
      // Price floor pFloor goes from lam/2 (loose) up to lam (tight)
      const pF = lam / 2.0;
      const pFloor = pF + t * (lam - pF);
      const simResults = simulateWithPF(useFixed, pFloor, params);
      const evalResult = evaluateSim(simResults, rho);
      es = evalResult.ES;
      profit = evalResult.profit;
    } else if (policy === 'CT') {
      // Tax xi goes from 0.0 (loose) up to lam (tight)
      const xi = t * lam;
      const simResults = simulateWithCT(useFixed, xi, params);
      const evalResult = evaluateSim(simResults, rho);
      es = evalResult.ES;
      profit = evalResult.profit;
    }

    // Filter out NaN or invalid states
    if (!isNaN(es) && !isNaN(profit)) {
      points.push({ x: es, y: profit });
    }
  }

  // Sort by ES (X-axis) so Chart.js draws it as a proper line
  return points.sort((a, b) => a.x - b.x);
}

/**
 * Builds all 6 efficiency curves.
 */
export function buildAllEfficiencyCurves(params) {
  return {
    dp_cl: buildEfficiencyCurve('CL', false, params),
    dp_ct: buildEfficiencyCurve('CT', false, params),
    dp_pf: buildEfficiencyCurve('PF', false, params),
    fp_cl: buildEfficiencyCurve('CL', true, params),
    fp_ct: buildEfficiencyCurve('CT', true, params),
    fp_pf: buildEfficiencyCurve('PF', true, params)
  };
}

# 📉 Digital Addiction & Pricing Control Simulator

[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg)](https://vitejs.dev/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4.1-FF6384.svg)](https://www.chartjs.org/)

An interactive computational dashboard simulating the theoretical frameworks of digital addiction dynamics and pricing interventions. This project translates complex economic and behavioral mathematics from the research paper *"Pricing and Addiction Control for Digital Services"* into a real-time reactive UI.

---

## 📖 Project Overview

Digital services (e.g., video games, short-video platforms) differ from traditional addictive goods due to **personalized dynamic pricing** and high **experience variance**. 

While the original research provides rigorous mathematical proofs indicating that dynamic pricing can counterintuitively reduce long-term addiction while boosting profits, **this project introduces a Real-Time Interactive Simulator**. By dynamically adjusting core behavioral parameters, the system visualizes the exact time required for de-addiction across five distinct mathematical threshold strategies in real-time.

---

## 📐 Mathematical Architecture & System Flow

The mathematical model relies on a state evolution equation combined with a utility-maximizing consumption function. The application is built on a unidirectional data flow where React state manages the underlying mathematical inputs, triggering an algorithmic recalculation phase rendered by Chart.js.

### System Flow & Component Relations

```mermaid
sequenceDiagram
    participant User
    participant React State
    participant Math Engine
    participant Chart.js
    
    User->>React State: Adjusts parameters (e.g., Price p)
    React State->>Math Engine: Triggers recalculation
    
    rect rgb(240, 248, 255)
        Note over Math Engine: Algorithm Execution
        Math Engine->>Math Engine: 1. Validate convergence (α < 1)
        Math Engine->>Math Engine: 2. Calculate equilibrium (s*)
        Math Engine->>Math Engine: 3. Compute target thresholds (A_th)
        Math Engine->>Math Engine: 4. Derive recovery time (t)
    end
    
    Math Engine->>Chart.js: Inject updated t vs p arrays
    Chart.js->>User: Re-renders graphical curves instantly


graph TD
    %% Variables
    M[Persistence: μ] --> Alpha
    Z[Habit: ζ] --> Alpha
    N[Sensitivity: η] --> Alpha
    L[Utility: λ] --> Beta
    P[Price: p] --> Beta
    S0[Initial State: s₀] --> Time
    
    %% Core Reductions
    Alpha[Habit Rate: α = μ(1 + ζ/η)] --> Eq
    Beta[Baseline Intake: β = μ(λ - p)/η] --> Eq
    
    %% Equilibrium & Time
    Eq[Steady State: s* = β / (1 - α)] --> Time
    Alpha --> Time
    
    %% Thresholds
    Thresh[Threshold Strategy: A_th] --> Time[Recovery Time: t = ln(A_th - s* / s₀ - s*) / ln α]
    
    classDef var fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px;
    classDef eq fill:#e8f5e9,stroke:#4caf50,stroke-width:2px;
    classDef out fill:#fff3e0,stroke:#ff9800,stroke-width:2px;
    
    class M,Z,N,L,P,S0 var;
    class Alpha,Beta,Eq eq;
    class Time,Thresh out;

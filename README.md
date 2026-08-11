# 📉 Digital Addiction & Pricing Control Simulator

[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg)](https://vitejs.dev/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4.1-FF6384.svg)](https://www.chartjs.org/)

An interactive, real-time computational dashboard simulating the theoretical frameworks of digital addiction dynamics and pricing interventions. This project translates complex economic and behavioral mathematics into a reactive UI, allowing researchers and policymakers to visualize how dynamic pricing and policy controls affect long-term habit persistence in digital services.

---

## 📖 Project Overview

Digital services (e.g., video games, short-video platforms) differ from traditional addictive goods due to their capacity for **personalized dynamic pricing** and high **experience variance**. 

This simulator models a user's habit-forming behavior over an infinite horizon, where past consumption increases the current addiction stock, thereby raising the marginal utility of future consumption. By dynamically adjusting core behavioral parameters, the system visualizes the exact time required for de-addiction across five distinct mathematical threshold strategies.

---

## 📐 Mathematical Architecture & UML

The mathematical model relies on a state evolution equation combined with a utility-maximizing consumption function. The UML Flowchart below illustrates how the primitive behavioral variables drive the steady-state equilibrium and ultimately determine the recovery time.

```mermaid
graph TD
    %% Define Variables
    M[Addiction Persistence: μ] --> State
    Z[Habit Formation: ζ] --> Consump
    N[Price Sensitivity: η] --> Consump
    L[Intrinsic Utility: λ] --> Consump
    P[Intervention Price: p] --> Consump
    S0[Initial Addiction: s₀] --> Time
    
    %% Core Equations
    Consump[Consumption Function: x_t] --> State[State Evolution: s_{t+1}]
    
    %% Reduced Constants
    State --> Alpha[Habit Rate: α]
    Consump --> Beta[Baseline Intake: β]
    
    %% Equilibrium & Time
    Alpha --> Eq[Steady State: s*]
    Beta --> Eq
    Eq --> Time[Recovery Time: t]
    Alpha --> Time
    
    %% Thresholds
    Thresh[Threshold Strategy: A_th] --> Time
    
    classDef var fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px;
    classDef eq fill:#e8f5e9,stroke:#4caf50,stroke-width:2px;
    classDef out fill:#fff3e0,stroke:#ff9800,stroke-width:2px;



sequenceDiagram
    participant User
    participant Sidebar (React State)
    participant Math Engine (useEffect)
    participant Chart.js (Canvas)
    
    User->>Sidebar: Adjusts slider (e.g., Price Sensitivity η)
    Sidebar->>Math Engine: State update triggers dependency array
    
    rect rgb(240, 248, 255)
        Note over Math Engine: Algorithm Execution
        Math Engine->>Math Engine: 1. Validate α < 1 (Convergence Check)
        Math Engine->>Math Engine: 2. Calculate baseline β & equilibrium s*
        Math Engine->>Math Engine: 3. Compute target A_th for 5 strategies
        Math Engine->>Math Engine: 4. Derive recovery time (t) safely (Math.log)
    end
    
    Math Engine->>Chart.js: Inject updated t vs p arrays
    Chart.js->>User: Re-renders graphical curves instantly


    
    class M,Z,N,L,P,S0 var;
    class Consump,State,Alpha,Beta eq;
    class Eq,Time,Thresh out;

export interface OperationalRisk {
    risk: string;
    owner: string;
    /** Assessed chance of the risk materialising within the year, as a percentage. */
    likelihood: number;
    /** Estimated cost if the risk materialises, in millions of pounds. */
    impact: number;
}

export function getData(): OperationalRisk[] {
    return [
        { risk: 'Payments Outage', owner: 'Platform', likelihood: 72, impact: 6.8 },
        { risk: 'Data Breach', owner: 'Security', likelihood: 58, impact: 7.6 },
        { risk: 'Key Supplier Failure', owner: 'Procurement', likelihood: 64, impact: 5.2 },
        { risk: 'Regulatory Fine', owner: 'Compliance', likelihood: 54, impact: 4.6 },
        { risk: 'Cloud Region Loss', owner: 'Platform', likelihood: 22, impact: 7.2 },
        { risk: 'Ransomware', owner: 'Security', likelihood: 34, impact: 6.4 },
        { risk: 'Licence Withdrawal', owner: 'Compliance', likelihood: 12, impact: 5.8 },
        { risk: 'Fraud Ring', owner: 'Risk', likelihood: 38, impact: 4.8 },
        { risk: 'Support Backlog', owner: 'Operations', likelihood: 76, impact: 2.0 },
        { risk: 'Onboarding Delays', owner: 'Operations', likelihood: 62, impact: 1.2 },
        { risk: 'Reporting Errors', owner: 'Finance', likelihood: 64, impact: 3.4 },
        { risk: 'Model Drift', owner: 'Data', likelihood: 88, impact: 3.0 },
        { risk: 'Office Closure', owner: 'Facilities', likelihood: 26, impact: 1.2 },
        { risk: 'Contractor Churn', owner: 'People', likelihood: 42, impact: 2.2 },
        { risk: 'Expense Overrun', owner: 'Finance', likelihood: 18, impact: 3.4 },
        { risk: 'Travel Disruption', owner: 'Facilities', likelihood: 44, impact: 0.6 },
    ];
}

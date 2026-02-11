
export const AMINO_ACIDS = "ACDEFGHIKLMNPQRSTVWY".split("");

// Molecular Weights (approximate, monoisotopic)
const AA_MW: Record<string, number> = {
    A: 71.03711, C: 103.00919, D: 115.02694, E: 129.04259, F: 147.06841,
    G: 57.02146, H: 137.05891, I: 113.08406, K: 128.09496, L: 113.08406,
    M: 131.04049, N: 114.04293, P: 97.05276, Q: 128.05858, R: 156.10111,
    S: 87.03203, T: 101.04768, V: 99.06841, W: 186.07931, Y: 163.06333
};

// Hydrophobicity Scales (Eisenberg et al.)
const AA_HYDROPHOBICITY: Record<string, number> = {
    A: 0.62, C: 0.29, D: -0.90, E: -0.74, F: 1.19,
    G: 0.48, H: -0.40, I: 1.38, K: -1.50, L: 1.06,
    M: 0.64, N: -0.78, P: 0.12, Q: -0.85, R: -2.53,
    S: -0.18, T: -0.05, V: 1.08, W: 0.81, Y: 0.26
};

// pKa values for pI calculation (EMBOSS scale)
const PKA_VALUES = {
    NH2: 8.6, // N-term
    COOH: 3.6, // C-term
    C: 8.5,
    D: 3.9,
    E: 4.1,
    H: 6.5,
    K: 10.8,
    R: 12.5,
    Y: 10.1
};

export const calculateMolecularWeight = (sequence: string): number => {
    let mw = 18.01528; // Water (H2O) for termini
    for (const aa of sequence) {
        mw += AA_MW[aa] || 0;
    }
    return mw;
};

export const calculateHydrophobicity = (sequence: string): number => {
    let totalHydro = 0;
    let validCount = 0;
    for (const aa of sequence) {
        if (AA_HYDROPHOBICITY[aa] !== undefined) {
            totalHydro += AA_HYDROPHOBICITY[aa];
            validCount++;
        }
    }
    return validCount > 0 ? totalHydro / validCount : 0;
};

export const calculateIsoelectricPoint = (sequence: string, tolerance: number = 0.01): number => {
    let minPh = 0;
    let maxPh = 14;
    let pH = 7;

    // Count charged residues
    const counts: Record<string, number> = { D: 0, E: 0, C: 0, Y: 0, H: 0, K: 0, R: 0 };
    for (const aa of sequence) {
        if (counts[aa] !== undefined) counts[aa]++;
    }

    while (maxPh - minPh > tolerance) {
        pH = (minPh + maxPh) / 2;

        // Calculate net charge
        // Positive Charges (N-term + H, K, R)
        let netCharge = 1 / (1 + Math.pow(10, pH - PKA_VALUES.NH2));
        netCharge += counts.H / (1 + Math.pow(10, pH - PKA_VALUES.H));
        netCharge += counts.K / (1 + Math.pow(10, pH - PKA_VALUES.K));
        netCharge += counts.R / (1 + Math.pow(10, pH - PKA_VALUES.R));

        // Negative Charges (C-term + D, E, C, Y)
        netCharge -= 1 / (1 + Math.pow(10, PKA_VALUES.COOH - pH));
        netCharge -= counts.D / (1 + Math.pow(10, PKA_VALUES.D - pH));
        netCharge -= counts.E / (1 + Math.pow(10, PKA_VALUES.E - pH));
        netCharge -= counts.C / (1 + Math.pow(10, PKA_VALUES.C - pH));
        netCharge -= counts.Y / (1 + Math.pow(10, PKA_VALUES.Y - pH));

        if (netCharge > 0) {
            minPh = pH;
        } else {
            maxPh = pH;
        }
    }

    return pH;
};

export const calculateNetCharge = (sequence: string, pH: number = 7.0): number => {
    // Count charged residues
    const counts: Record<string, number> = { D: 0, E: 0, C: 0, Y: 0, H: 0, K: 0, R: 0 };
    for (const aa of sequence) {
        if (counts[aa] !== undefined) counts[aa]++;
    }

    // Calculate net charge
    let netCharge = 1 / (1 + Math.pow(10, pH - PKA_VALUES.NH2));
    netCharge += counts.H / (1 + Math.pow(10, pH - PKA_VALUES.H));
    netCharge += counts.K / (1 + Math.pow(10, pH - PKA_VALUES.K));
    netCharge += counts.R / (1 + Math.pow(10, pH - PKA_VALUES.R));

    netCharge -= 1 / (1 + Math.pow(10, PKA_VALUES.COOH - pH));
    netCharge -= counts.D / (1 + Math.pow(10, PKA_VALUES.D - pH));
    netCharge -= counts.E / (1 + Math.pow(10, PKA_VALUES.E - pH));
    netCharge -= counts.C / (1 + Math.pow(10, PKA_VALUES.C - pH));
    netCharge -= counts.Y / (1 + Math.pow(10, PKA_VALUES.Y - pH));

    return netCharge;
};

export const calculateBomanIndex = (sequence: string): number => {
    // Boman index (potential protein interaction index)
    // Values from Boman, H.G. (2003)
    const BOMAN_SCALE: Record<string, number> = {
        L: -4.92, I: -4.92, V: -4.04, M: -4.02, F: -2.98, W: -2.33,
        A: -2.25, C: -1.22, G: -0.94, Y: -0.01, T: 2.78, S: 3.40,
        H: 4.66, Q: 5.27, K: 5.71, N: 6.64, E: 10.42, D: 13.08, R: 14.92, P: 0 // P value usually 0 or ignored
    };

    let sum = 0;
    for (const aa of sequence) {
        sum += BOMAN_SCALE[aa] || 0;
    }
    return sequence.length > 0 ? sum / sequence.length : 0;
};

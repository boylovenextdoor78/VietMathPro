
export const ATOMIC_MASSES: Record<string, number> = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
  Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078,
  Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38,
  Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224,
  Nb: 92.906, Mo: 95.95, Tc: 98, Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71,
  Sb: 121.76, Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, La: 138.91, Ce: 140.12, Pr: 140.91, Nd: 144.24,
  Pm: 145, Sm: 150.36, Eu: 151.96, Gd: 157.25, Tb: 158.93, Dy: 162.50, Ho: 164.93, Er: 167.26, Tm: 168.93, Yb: 173.05,
  Lu: 174.97, Hf: 178.49, Ta: 180.95, W: 183.84, Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97, Hg: 200.59,
  Tl: 204.38, Pb: 207.2, Bi: 208.98, Po: 209, At: 210, Rn: 222, Fr: 223, Ra: 226, Ac: 227, Th: 232.04,
  Pa: 231.04, U: 238.03, Np: 237, Pu: 244, Am: 243, Cm: 247, Bk: 247, Cf: 251, Es: 252, Fm: 257,
  Md: 258, No: 259, Lr: 262, Rf: 267, Db: 270, Sg: 271, Bh: 270, Hs: 277, Mt: 278, Ds: 281,
  Rg: 282, Cn: 285, Nh: 286, Fl: 289, Mc: 290, Lv: 293, Ts: 294, Og: 294, Uue: 315, Ubn: 300
};

export const ION_DICTIONARY: Record<string, { name: string, mass: number }> = {
  // Inorganic Anions
  "OH": { name: "Hydroxide / Hydroxyl group", mass: 17.007 },
  "NO3": { name: "Nitrate", mass: 62.004 },
  "SO4": { name: "Sulfate", mass: 96.06 },
  "CO3": { name: "Carbonate", mass: 60.008 },
  "PO4": { name: "Phosphate", mass: 94.971 },
  "SO3": { name: "Sulfite", mass: 80.06 },
  "HCO3": { name: "Bicarbonate", mass: 61.016 },
  "HSO4": { name: "Bisulfate", mass: 97.07 },
  "HPO4": { name: "Hydrogen Phosphate", mass: 95.979 },
  "H2PO4": { name: "Dihydrogen Phosphate", mass: 96.987 },
  
  // Halogens & Oxidizers
  "ClO": { name: "Hypochlorite", mass: 51.45 },
  "ClO2": { name: "Chlorite", mass: 67.45 },
  "ClO3": { name: "Chlorate", mass: 83.45 },
  "ClO4": { name: "Perchlorate", mass: 99.45 },
  "MnO4": { name: "Permanganate", mass: 118.934 },
  "CrO4": { name: "Chromate", mass: 115.994 },
  "Cr2O7": { name: "Dichromate", mass: 215.988 },
  
  // Cations
  "NH4": { name: "Ammonium", mass: 18.039 },
  "H3O": { name: "Hydronium", mass: 19.023 },
  "PH4": { name: "Phosphonium", mass: 34.974 },
  
  // Others
  "SCN": { name: "Thiocyanate", mass: 58.07 },
  "CN": { name: "Cyanide", mass: 26.017 },
  "CNO": { name: "Cyanate", mass: 42.017 },
  "S2O3": { name: "Thiosulfate", mass: 112.12 },
  "Fe(CN)6": { name: "Ferrocyanide/Ferricyanide", mass: 211.947 },
  "NH2": { name: "Amine / Amide group", mass: 16.022 },
  
  // Functional Groups
  "CHO": { name: "Aldehyde group", mass: 29.018 },
  "COOH": { name: "Carboxyl group (Organic Acid)", mass: 45.017 },
  "COO": { name: "Ester / Carboxylate group", mass: 43.999 },
  "NO2": { name: "Nitro group", mass: 46.005 },
  "CO": { name: "Ketone group", mass: 28.01 },
  
  // Organic Acid Radicals
  "HCOO": { name: "Formate (Gốc Format)", mass: 45.017 },
  "CH3COO": { name: "Acetate (Gốc Axetat)", mass: 59.044 },
  "C2H5COO": { name: "Propionate (Gốc Propionat)", mass: 73.071 },
  "C2H3COO": { name: "Acrylate (Gốc Acrylat)", mass: 71.055 },
  "CH2CHCOO": { name: "Acrylate (Gốc Acrylat)", mass: 71.055 },
  "CH2CHCOOH": { name: "Acrylic acid (Axit Acrylic)", mass: 72.063 },
  "C2H3COOH": { name: "Acrylic acid (Axit Acrylic)", mass: 72.063 },
  "C2O4": { name: "Oxalate (Gốc Oxalat)", mass: 88.019 },
  "C6H5COO": { name: "Benzoate (Gốc Benzoat)", mass: 121.114 },
  
  // Hydrocarbon Radicals
  "CH3": { name: "Methyl group (Gốc Metyl)", mass: 15.035 },
  "C2H5": { name: "Ethyl group (Gốc Ethyl)", mass: 29.062 },
  "C3H7": { name: "Propyl group (Gốc Propyl)", mass: 43.089 },
  "C2H3": { name: "Vinyl group (Gốc Vinyl)", mass: 27.046 },
  "C6H5": { name: "Phenyl group (Gốc Phenyl)", mass: 77.105 },
  "CH2C6H5": { name: "Benzyl group (Gốc Benzyl)", mass: 91.132 },
  "C6H5O": { name: "Phenolate", mass: 93.103 },
  "SO5": { name: "Peroxymonosulfate (Caro's acid radical)", mass: 112.055 },
  "C4H4O2": { name: "1,4-Dioxin ring", mass: 84.073 },
  "C12H8O2": { name: "Dibenzo-p-dioxin skeleton", mass: 184.193 }
};

export interface CompoundInfo {
  name: string;
  commonName?: string;
  description: string;
  toxicity?: string;
  usage?: string;
  safetyLevel: "Safe" | "Warning" | "Danger";
}

export const COMPOUND_INFO: Record<string, CompoundInfo> = {
  "CH3OH": {
    name: "Methanol",
    commonName: "Cồn công nghiệp / Methyl Alcohol",
    description: "Ancol đơn giản nhất, cực kỳ độc hại. Khác với rượu uống (Ethanol).",
    toxicity: "Khi vào cơ thể, chuyển hóa thành axit formic gây phá hủy dây thần kinh thị giác (mù lòa) và suy phủ tạng.",
    usage: "Dung môi hòa tan sơn, nhiên liệu, hoặc có trong rượu lậu pha tạp.",
    safetyLevel: "Danger"
  },
  "C2H5OH": {
    name: "Ethanol",
    commonName: "Rượu uống / Ethyl Alcohol",
    description: "Cồn thực phẩm. Tuy nhiên nếu là cồn công nghiệp có thể bị pha tạp Methanol.",
    usage: "Đồ uống có cồn, sát trùng, nhiên liệu sinh học.",
    safetyLevel: "Warning"
  },
  "C6H5NH2": {
    name: "Aniline",
    commonName: "Phenylamine",
    description: "Hợp chất thơm chứa Nitơ.",
    toxicity: "Gây tan máu và ngộ độc qua da. Có khả năng gây ung thư.",
    usage: "Ngành nhuộm, sản xuất polymer.",
    safetyLevel: "Danger"
  },
  "C6H6": {
    name: "Benzene",
    description: "Hydrocacbon thơm đơn giản nhất. Độc tố thầm lặng.",
    toxicity: "Chất gây ung thư máu (leukemia) đã được xác nhận. Gây chóng mặt, ngất xỉu ở nồng độ cao.",
    usage: "Dung môi, nguyên liệu tổng hợp hữu cơ.",
    safetyLevel: "Danger"
  },
  "C10H8": {
    name: "Naphthalene (PAH)",
    description: "Hydrocacbon thơm đa vòng (PAH).",
    toxicity: "Có khả năng gây ung thư. Sinh ra khi đốt cháy không hoàn toàn thịt nướng, nhựa đường, khói thuốc lá.",
    safetyLevel: "Warning"
  },
  "C14H10": {
    name: "Anthracene (PAH)",
    description: "Hydrocacbon thơm đa vòng (PAH).",
    toxicity: "Có khả năng gây ung thư. Sinh ra khi đốt cháy không hoàn toàn.",
    safetyLevel: "Warning"
  },
  "CHCl3": {
    name: "Chloroform",
    commonName: "Trichloromethane",
    description: "Dẫn xuất Halogen của Metan.",
    toxicity: "Độc cho gan và thận. Từng dùng gây mê nhưng hiện bị hạn chế.",
    usage: "Dung môi công nghiệp.",
    safetyLevel: "Danger"
  },
  "HCHO": {
    name: "Formaldehyde",
    commonName: "Formol / Methanal",
    description: "Andehit đơn giản nhất.",
    toxicity: "Kích ứng mạnh niêm mạc, tác nhân gây ung thư đường hô hấp.",
    usage: "Ướp xác, sản xuất gỗ ép, keo dán.",
    safetyLevel: "Danger"
  },
  "CH2O": {
    name: "Formaldehyde",
    commonName: "Formol / Methanal",
    description: "Andehit đơn giản nhất.",
    toxicity: "Kích ứng mạnh niêm mạc, tác nhân gây ung thư đường hô hấp.",
    usage: "Ướp xác, sản xuất gỗ ép, keo dán.",
    safetyLevel: "Danger"
  },
  "HCN": {
    name: "Hydrogen Cyanide",
    commonName: "Axit Xyanhydric",
    description: "Chất kịch độc, ngăn cản sự hô hấp của tế bào.",
    toxicity: "Ngăn cơ thể sử dụng oxy, gây tử vong nhanh chóng.",
    safetyLevel: "Danger"
  },
  "NaCN": {
    name: "Sodium Cyanide",
    description: "Muối xyanua cực độc.",
    toxicity: "Ức chế hô hấp tế bào, gây tử vong nhanh chóng.",
    safetyLevel: "Danger"
  },
  "KCN": {
    name: "Potassium Cyanide",
    description: "Muối xyanua cực độc.",
    toxicity: "Ức chế hô hấp tế bào, gây tử vong nhanh chóng.",
    safetyLevel: "Danger"
  },
  "C8H6Cl2O3": {
    name: "2,4-D (2,4-Dichlorophenoxyacetic acid)",
    description: "Thuốc diệt cỏ phổ biến.",
    toxicity: "Có thể chứa tạp chất Dioxin gây biến đổi gen và quái thai. Độc tính tích tụ lâu dài.",
    safetyLevel: "Danger"
  },
  "C6H5OH": {
    name: "Phenol",
    commonName: "Carbolic acid",
    description: "Hợp chất thơm chứa nhóm OH.",
    toxicity: "Gây bỏng hóa học nặng, độc cho hệ thần kinh và thận.",
    safetyLevel: "Danger"
  },
  "C12H4Cl4O2": {
    name: "TCDD (2,3,7,8-Tetrachlorodibenzo-p-dioxin)",
    commonName: "Chất độc màu da cam / Dioxin",
    description: "Hợp chất hữu cơ kịch độc, bền vững trong môi trường. Cấu trúc gồm vòng 1,4-dioxin ở giữa kẹp bởi 2 vòng Benzen.",
    toxicity: "Gây ung thư, biến đổi gen, quái thai và các bệnh thần kinh nghiêm trọng. Là chất độc nhất trong nhóm dioxin.",
    safetyLevel: "Danger"
  },
  "C4H4O2": {
    name: "1,4-Dioxin",
    description: "Vòng dị tố 6 cạnh gồm 4 Cacbon và 2 Oxy đối diện nhau (vị trí 1, 4).",
    safetyLevel: "Warning"
  },
  "C12H8O2": {
    name: "Dibenzo-p-dioxin",
    description: "Khung cấu tạo của các hợp chất dioxin, gồm vòng 1,4-dioxin kẹp bởi 2 vòng Benzen.",
    safetyLevel: "Warning"
  }
};

export interface ParseResult {
  totalMass: number;
  elementDetail: Record<string, number>;
  ionDetected: { formula: string, name: string, mass: number }[];
  compoundInfo: CompoundInfo | null;
  error: string | null;
}

export function parseFormula(formula: string): ParseResult {
  const result: ParseResult = {
    totalMass: 0,
    elementDetail: {},
    ionDetected: [],
    compoundInfo: null,
    error: null
  };

  if (!formula) return result;

  try {
    // 1. Element & Multiplier Parsing using Stack for Brackets
    const stack: Record<string, number>[] = [{}];
    let i = 0;

    while (i < formula.length) {
      const char = formula[i];

      if (char === '(' || char === '[' || char === '{') {
        stack.push({});
        i++;
      } else if (char === ')' || char === ']' || char === '}') {
        const top = stack.pop();
        if (!top) throw new Error("Mismatched brackets");
        
        i++;
        let multiplierStr = "";
        while (i < formula.length && /\d/.test(formula[i])) {
          multiplierStr += formula[i];
          i++;
        }
        const multiplier = multiplierStr === "" ? 1 : parseInt(multiplierStr);

        const current = stack[stack.length - 1];
        for (const [el, count] of Object.entries(top)) {
          current[el] = (current[el] || 0) + count * multiplier;
        }
      } else if (/[A-Z]/.test(char)) {
        let element = char;
        i++;
        if (i < formula.length && /[a-z]/.test(formula[i])) {
          element += formula[i];
          i++;
        }

        if (!ATOMIC_MASSES[element]) {
          throw new Error(`Unknown element: ${element}`);
        }

        let multiplierStr = "";
        while (i < formula.length && /\d/.test(formula[i])) {
          multiplierStr += formula[i];
          i++;
        }
        const multiplier = multiplierStr === "" ? 1 : parseInt(multiplierStr);

        const current = stack[stack.length - 1];
        current[element] = (current[element] || 0) + multiplier;
      } else {
        throw new Error(`Unexpected character: ${char}`);
      }
    }

    if (stack.length !== 1) throw new Error("Mismatched brackets");

    const finalCounts = stack[0];
    result.elementDetail = finalCounts;

    // Calculate Mass
    let totalMass = 0;
    for (const [el, count] of Object.entries(finalCounts)) {
      totalMass += ATOMIC_MASSES[el] * count;
    }
    result.totalMass = parseFloat(totalMass.toFixed(4));

    // 2. Ion Detection
    // Simple approach: check if the formula contains any of the ion strings
    // Note: This is a bit naive but works for standard formulas.
    // A more robust way would be to check if the counts match the ion's internal counts.
    for (const [ionFormula, ionInfo] of Object.entries(ION_DICTIONARY)) {
      // Check if the formula string contains the ion formula (case sensitive)
      // We also check if the elements in the ion are actually present in the final counts
      if (formula.includes(ionFormula)) {
        result.ionDetected.push({
          formula: ionFormula,
          name: ionInfo.name,
          mass: ionInfo.mass
        });
      }
    }
    
    // 3. Compound Detection (Specific safety info)
    if (COMPOUND_INFO[formula]) {
      result.compoundInfo = COMPOUND_INFO[formula];
    } else {
      // Check for Nitriles (CN containing organic compounds)
      const inorganicCyanides = ["NaCN", "KCN", "HCN", "K3[Fe(CN)6]", "K4[Fe(CN)6]", "Fe(CN)6"];
      if (formula.includes("CN") && !inorganicCyanides.some(ic => formula.includes(ic))) {
        // Simple heuristic for organic nitriles: contains C and H and CN
        if (formula.includes("C") && formula.includes("H")) {
          result.compoundInfo = {
            name: "Nitrile / Organic Cyanide",
            description: "Hợp chất hữu cơ chứa nhóm Xyanua (Nitrile).",
            toxicity: "Một số loại có cấu trúc giải phóng gốc CN- cực độc, ngăn cơ thể sử dụng oxy.",
            safetyLevel: "Danger"
          };
        }
      }
    }

  } catch (e: any) {
    result.error = e.message;
  }

  return result;
}

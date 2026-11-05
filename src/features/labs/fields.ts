export const LAB_FIELDS = [
  { key: "b12", label: "B12" },
  { key: "vitamin_d", label: "Vitamin D" },
  { key: "hemogram", label: "Hemogram blood" },
  { key: "hemoglobin", label: "Hemoglobin" },
  { key: "homocysteine", label: "Homocysteine" },
  { key: "c_reactive_protein", label: "C reactive protein" },
  { key: "serum_creatinine", label: "Serum creatinine" },
  { key: "serum_ferritin", label: "Serum ferritin" },
  { key: "urea", label: "Urea" },
  { key: "uric_acid", label: "Uric acid" },
  { key: "calcium", label: "Calcium" },
  { key: "electrolytes", label: "Electrolytes" },
  { key: "lipids", label: "Lipids" },
  { key: "fasting_sugar", label: "Fasting sugar" },
  { key: "t3_t4_tsh", label: "T3 T4 TSH" },
] as const;

export type LabFieldKey = (typeof LAB_FIELDS)[number]["key"];

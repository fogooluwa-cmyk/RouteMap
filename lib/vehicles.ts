export type Vehicle = {
  name: string;
  batteryKwh: number;
  efficiencyMiPerKwh: number;
  connectorLabel: string;
  connectorAliases: string[];
  initials: string;
};

export const vehicles: Vehicle[] = [
  {
    name: "Tesla Model 3 Long Range",
    batteryKwh: 75,
    efficiencyMiPerKwh: 4.1,
    connectorLabel: "CCS Combo 2",
    connectorAliases: ["ccs", "combined charging system"],
    initials: "T3",
  },
  {
    name: "Kia EV6 Long Range",
    batteryKwh: 77.4,
    efficiencyMiPerKwh: 3.4,
    connectorLabel: "CCS Combo 2",
    connectorAliases: ["ccs", "combined charging system"],
    initials: "K6",
  },
  {
    name: "Volkswagen ID.4 Pro",
    batteryKwh: 77,
    efficiencyMiPerKwh: 3.2,
    connectorLabel: "CCS Combo 2",
    connectorAliases: ["ccs", "combined charging system"],
    initials: "ID",
  },
  {
    name: "Nissan LEAF e+",
    batteryKwh: 59,
    efficiencyMiPerKwh: 3.5,
    connectorLabel: "CHAdeMO",
    connectorAliases: ["chademo"],
    initials: "NL",
  },
];

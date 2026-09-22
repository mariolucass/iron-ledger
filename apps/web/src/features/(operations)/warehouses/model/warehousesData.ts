export interface Zone {
  id: string;
  name: string;
  type: "GERAL" | "FRIO" | "PERIGOSO" | "CAIS";
  capacityUsed: number;
  capacityTotal: number;
  temp?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager: string;
  status: "OPERACIONAL" | "MANUTENÇÃO" | "CRÍTICO";
  capacityUsed: number;
  capacityTotal: number;
  workersActive: number;
  avgTemp: string;
  zones: Zone[];
}

export const mockWarehouses: Warehouse[] = [
  {
    id: "WH-CENTRO",
    name: "Loja Centro",
    location: "São Paulo, SP",
    manager: "Carlos Silva",
    status: "CRÍTICO",
    capacityUsed: 9500,
    capacityTotal: 10000,
    workersActive: 42,
    avgTemp: "22°C",
    zones: [
      {
        id: "Z-C1",
        name: "Armazenamento Geral (Vestuário)",
        type: "GERAL",
        capacityUsed: 5500,
        capacityTotal: 6000,
      },
      {
        id: "Z-C2",
        name: "Estoque de Calçados",
        type: "GERAL",
        capacityUsed: 3000,
        capacityTotal: 3000,
      },
      {
        id: "Z-C3",
        name: "Cais de Carga",
        type: "CAIS",
        capacityUsed: 1000,
        capacityTotal: 1000,
      },
    ],
  },
  {
    id: "WH-SUL",
    name: "Estoque Sul",
    location: "Curitiba, PR",
    manager: "Ana Rodrigues",
    status: "MANUTENÇÃO",
    capacityUsed: 3200,
    capacityTotal: 8000,
    workersActive: 18,
    avgTemp: "18°C",
    zones: [
      {
        id: "Z-S1",
        name: "Armazenamento Geral Sul",
        type: "GERAL",
        capacityUsed: 3000,
        capacityTotal: 7000,
      },
      {
        id: "Z-S2",
        name: "Cais de Carga Sul",
        type: "CAIS",
        capacityUsed: 200,
        capacityTotal: 1000,
      },
    ],
  },
  {
    id: "WH-NORTE",
    name: "Estoque Norte",
    location: "Manaus, AM",
    manager: "Miguel Santos",
    status: "OPERACIONAL",
    capacityUsed: 4800,
    capacityTotal: 5000,
    workersActive: 8,
    avgTemp: "28°C",
    zones: [
      {
        id: "Z-N1",
        name: "Armazenamento Geral Norte",
        type: "GERAL",
        capacityUsed: 4800,
        capacityTotal: 5000,
      },
    ],
  },
];

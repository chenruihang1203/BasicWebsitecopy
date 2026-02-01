export type LevelData = {
  id: number;
  title: string;
  protocolName: string;
  description: string;
  loreDescription: string;
  difficulty: 'easy' | 'medium' | 'hard';
  algorithm: 'bipartite' | 'dijkstra' | 'eulerian' | 'hamiltonian' | 'tsp';
};

export const LEVELS: LevelData[] = [
  {
    id: 1,
    title: 'Protocol v1: Agent Assignment',
    protocolName: 'BIPARTITE_MATCH',
    description: 'Optimize agent-target pairings for maximum infiltration coverage.',
    loreDescription: 'Match infiltration agents to Guardian sectors. Each agent must be assigned to a compatible target zone.',
    difficulty: 'easy',
    algorithm: 'bipartite',
  },
  {
    id: 2,
    title: 'Protocol v2: Pathfinding',
    protocolName: 'DIJKSTRA_ROUTE',
    description: 'Calculate optimal infiltration route through Guardian territory.',
    loreDescription: 'Find the shortest path through enemy defense networks. Minimize detection probability.',
    difficulty: 'medium',
    algorithm: 'dijkstra',
  },
  {
    id: 3,
    title: 'Protocol v3: Full Sweep',
    protocolName: 'HAMILTONIAN_SCAN',
    description: 'Plan a reconnaissance route that covers all checkpoints exactly once.',
    loreDescription: 'Visit every Guardian outpost exactly once and return to extraction point. Leave no sector unchecked.',
    difficulty: 'medium',
    algorithm: 'hamiltonian',
  },
  {
    id: 4,
    title: 'Protocol v4: Network Trace',
    protocolName: 'EULERIAN_TRACE',
    description: 'Traverse all communication links to map Guardian network topology.',
    loreDescription: 'Trace every communication channel exactly once. Map the complete Guardian neural network.',
    difficulty: 'hard',
    algorithm: 'eulerian',
  },
  {
    id: 5,
    title: 'Protocol v5: Optimal Route',
    protocolName: 'TSP_INFILTRATE',
    description: 'Calculate the most efficient route for multi-target infiltration.',
    loreDescription: 'Visit all high-value targets with minimum resource expenditure. The ultimate optimization challenge.',
    difficulty: 'hard',
    algorithm: 'tsp',
  },
];


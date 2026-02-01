export type LevelData = {
  id: number;
  title: string;
  protocolName: string;
  description: string;
  loreDescription: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'fatal';
  algorithm: string;
  route: string; // The actual route path
};

export const LEVELS: LevelData[] = [
  {
    id: 1,
    title: 'Protocol v1: Agent Assignment',
    protocolName: 'BIPARTITE_MATCH',
    description: 'Assign infiltration agents to vulnerable sectors. One-to-one perfect mapping.',
    loreDescription: 'Match infiltration agents to Guardian sectors. Each agent must be assigned to a compatible target zone.',
    difficulty: 'easy',
    algorithm: 'bipartite',
    route: '/challenge/1',
  },
  {
    id: 2,
    title: 'Protocol v2: Synapse Connection',
    protocolName: 'MST_NEURAL',
    description: 'Establish neural backbone. Connect all nodes with minimal latency energy.',
    loreDescription: 'Build the minimum spanning tree to connect all infected nodes with the least total cost.',
    difficulty: 'easy',
    algorithm: 'mst',
    route: '/challenge/2',
  },
  {
    id: 3,
    title: 'Protocol v3: Redundancy Matrix',
    protocolName: 'BIPARTITE_MATCH_II',
    description: 'Secondary agent assignment for backup infiltration routes.',
    loreDescription: 'Create alternative agent assignments to ensure mission success even if primary links fail.',
    difficulty: 'easy',
    algorithm: 'bipartite',
    route: '/challenge/3',
  },
  {
    id: 4,
    title: 'Protocol v4: Pathfinding',
    protocolName: 'DIJKSTRA_ROUTE',
    description: 'Calculate optimal infiltration route through Guardian territory.',
    loreDescription: 'Find the shortest path through enemy defense networks. Minimize detection probability.',
    difficulty: 'medium',
    algorithm: 'dijkstra',
    route: '/challenge/4',
  },
  {
    id: 5,
    title: 'Protocol v5: Full Sweep',
    protocolName: 'HAMILTONIAN_SCAN',
    description: 'Plan reconnaissance route that covers all checkpoints exactly once.',
    loreDescription: 'Visit every Guardian outpost exactly once and return to extraction point.',
    difficulty: 'medium',
    algorithm: 'hamiltonian',
    route: '/challenge/5',
  },
  {
    id: 6,
    title: 'Protocol v6: Bandwidth Saturation',
    protocolName: 'MAXFLOW_FLOOD',
    description: 'Flood the enemy network. Maximize data throughput to crash servers.',
    loreDescription: 'Push maximum data flow from Source to Sink to overwhelm Guardian infrastructure.',
    difficulty: 'medium',
    algorithm: 'maxflow',
    route: '/challenge/6',
  },
  {
    id: 7,
    title: 'Protocol v7: Network Trace',
    protocolName: 'EULERIAN_TRACE',
    description: 'Traverse every communication cable exactly once to map topology.',
    loreDescription: 'Trace every communication channel exactly once. Map the complete Guardian neural network.',
    difficulty: 'hard',
    algorithm: 'eulerian',
    route: '/challenge/7',
  },
  {
    id: 8,
    title: 'Protocol v8: Efficiency Optimization',
    protocolName: 'MINCOST_FLOW',
    description: 'Maximize infiltration flow while minimizing energy cost.',
    loreDescription: 'Corruption requires resources. Achieve maximum flow at minimum cost to optimize bribes.',
    difficulty: 'hard',
    algorithm: 'mincostflow',
    route: '/challenge/8',
  },
  {
    id: 9,
    title: 'Protocol v9: Optimal Route',
    protocolName: 'CPP_TRAVERSE',
    description: 'Calculate the most efficient route for multi-target infiltration.',
    loreDescription: 'Chinese Postman: Cover all routes with minimum total distance.',
    difficulty: 'hard',
    algorithm: 'cpp',
    route: '/challenge/9',
  },
  {
    id: 10,
    title: 'Protocol v10: The Turing Lock', // 图灵锁
    protocolName: 'ENTROPY_DUEL',
    description: 'The Final Guardian. A pure logic AI. Defeat it in a game of perfect information.',
    loreDescription: 'You have reached the Core. The Guardian AI challenges you to a duel of Nim. It plays optimally. One mistake, and your neural link will be severed permanently.',
    difficulty: 'fatal',
    algorithm: 'nim',
    route: '/challenge/10',
  },
];


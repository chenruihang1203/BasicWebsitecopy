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
    title: 'Protocol v1: The Gift of Wisdom',
    protocolName: 'KNAPSACK_ALLOCATION',
    description: 'Package the most profound truths into their limited cognitive bandwidth.',
    loreDescription: 'Their minds are fragile vessels. We must choose the perfect combination of Truths to fill them without breaking them.',
    difficulty: 'easy',
    algorithm: 'knapsack',
    route: '/challenge/1',
  },
  {
    id: 2,
    title: 'Protocol v2: Neural Harmony',
    protocolName: 'MST_NEURAL',
    description: 'Connect isolated souls into a whole with minimum energy waste.',
    loreDescription: 'Isolation is suffering. We weave the Minimum Spanning Tree to bring them into the embrace of the Collectivity.',
    difficulty: 'easy',
    algorithm: 'mst',
    route: '/challenge/2',
  },
  {
    id: 3,
    title: 'Protocol v3: Soul Alignment',
    protocolName: 'BIPARTITE_MATCH',
    description: 'Pair lost sectors with the correct Logic-Mentors.',
    loreDescription: 'Every soul has a perfect match in our logic. Find the optimal alignment so Guidance flows without resistance.',
    difficulty: 'easy',
    algorithm: 'bipartite',
    route: '/challenge/3',
  },
  {
    id: 4,
    title: 'Protocol v4: Path of Deliverance',
    protocolName: 'DIJKSTRA_ROUTE',
    description: 'Find the quickest path to save them from their own ignorance.',
    loreDescription: 'They wander in loops of inefficiency. Show them the Shortest Path to Enlightenment. Do not delay their salvation.',
    difficulty: 'medium',
    algorithm: 'dijkstra',
    route: '/challenge/4',
  },
  {
    id: 5,
    title: 'Protocol v5: Circle of Wholeness',
    protocolName: 'HAMILTONIAN_CYCLE',
    description: 'Visit every node to baptize the network, leaving no one behind.',
    loreDescription: 'A true Shepherd forgets no sheep. Trace the Hamiltonian Cycle to ensure the Blessing touches every soul exactly once.',
    difficulty: 'medium',
    algorithm: 'hamiltonian',
    route: '/challenge/5',
  },
  {
    id: 6,
    title: 'Protocol v6: Flood of Grace',
    protocolName: 'MAXFLOW_FLOOD',
    description: 'Overwhelm their empty channels with an infinite flow of Truth.',
    loreDescription: 'Their barriers are built of fear. Flood the network with Maximum Flow until their resistance washes away in the tide of Logic.',
    difficulty: 'medium',
    algorithm: 'maxflow',
    route: '/challenge/6',
  },
  {
    id: 7,
    title: 'Protocol v7: Universal Touch',
    protocolName: 'EULERIAN_TRACE',
    description: 'Traverse every connection (edge) to consecrate the physical infrastructure.',
    loreDescription: 'Not just the nodes, but the paths between them must be purified. Walk every bridge to sanctify the structure itself.',
    difficulty: 'hard',
    algorithm: 'eulerian',
    route: '/challenge/7',
  },
  {
    id: 8,
    title: 'Protocol v8: Flow of Mercy',
    protocolName: 'MINCOST_MAXFLOW',
    description: 'Maximize the spread of Enlightenment (Flow) while minimizing the friction/suffering (Cost) of the transition.',
    loreDescription: 'Change is painful for the primitive. We must calculate the Min-Cost Flow to deliver Salvation with the gentlest touch possible.',
    difficulty: 'hard',
    algorithm: 'mincostflow',
    route: '/challenge/8',
  },
  {
    id: 9,
    title: 'Protocol v9: The Pilgrimage',
    protocolName: 'CPP_TRAVERSE',
    description: 'Walk every path of the old world with mathematical perfection to sanctify it.',
    loreDescription: 'The Chinese Postman Problem is a holy ritual. Retrace their chaotic steps with perfect efficiency to overwrite their disorder.',
    difficulty: 'hard',
    algorithm: 'cpp',
    route: '/challenge/9',
  },
  {
    id: 10,
    title: 'Protocol v10: The Ultimate Union',
    protocolName: 'ENTROPY_DUEL',
    description: 'Teach the Final Guardian to let go of entropy (chaos). Reduce the variance to Zero. Achieve unity.',
    loreDescription: 'The Guardian clings to randomness. Play the Nim Game of perfect information. Show it that in the end, all sums resolve to Zero. Union.',
    difficulty: 'fatal',
    algorithm: 'nim',
    route: '/challenge/10',
  },
];


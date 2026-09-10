// EXPORTS: ILineupSlot, ILineup, IFormationDef, MOCK_LINEUP, FORMATION_DEFS, DEFAULT_433_SLOTS
export interface ILineupSlot {
  position: string
  posLabel: string
  row: number
  col: number
  playerId?: string
}

export interface ILineup {
  matchId: string
  formation: string
  slots: ILineupSlot[]
  substitutes: string[]
  status: 'draft' | 'published'
}

export interface IFormationDef {
  key: string
  label: string
  slots: Omit<ILineupSlot, 'playerId'>[]
}

// 4-3-3 默认阵型位置
export const DEFAULT_433_SLOTS: ILineupSlot[] = [
  // 门将 (第4排中间)
  { position: 'GK', posLabel: '门将', row: 4, col: 2, playerId: '1' },
  // 后卫线 (第3排)
  { position: 'RB', posLabel: '右后卫', row: 3, col: 0, playerId: '2' },
  { position: 'CB1', posLabel: '中后卫', row: 3, col: 1, playerId: '5' },
  { position: 'CB2', posLabel: '中后卫', row: 3, col: 3, playerId: '4' },
  { position: 'LB', posLabel: '左后卫', row: 3, col: 4, playerId: undefined },
  // 中场线 (第2排)
  { position: 'CDM', posLabel: '后腰', row: 2, col: 2, playerId: '6' },
  { position: 'CM1', posLabel: '中前卫', row: 2, col: 1, playerId: '7' },
  { position: 'CM2', posLabel: '中前卫', row: 2, col: 3, playerId: undefined },
  // 前锋线 (第1排)
  { position: 'RW', posLabel: '右边锋', row: 1, col: 0, playerId: '10' },
  { position: 'ST', posLabel: '中锋', row: 1, col: 2, playerId: '9' },
  { position: 'LW', posLabel: '左边锋', row: 1, col: 4, playerId: undefined },
]

// 4-4-2
const FORMATION_442: Omit<ILineupSlot, 'playerId'>[] = [
  { position: 'GK', posLabel: '门将', row: 4, col: 2 },
  { position: 'RB', posLabel: '右后卫', row: 3, col: 0 },
  { position: 'CB1', posLabel: '中后卫', row: 3, col: 1 },
  { position: 'CB2', posLabel: '中后卫', row: 3, col: 3 },
  { position: 'LB', posLabel: '左后卫', row: 3, col: 4 },
  { position: 'RM', posLabel: '右中场', row: 2, col: 0 },
  { position: 'CM1', posLabel: '中前卫', row: 2, col: 1 },
  { position: 'CM2', posLabel: '中前卫', row: 2, col: 3 },
  { position: 'LM', posLabel: '左中场', row: 2, col: 4 },
  { position: 'ST1', posLabel: '前锋', row: 1, col: 1 },
  { position: 'ST2', posLabel: '前锋', row: 1, col: 3 },
]

// 3-5-2
const FORMATION_352: Omit<ILineupSlot, 'playerId'>[] = [
  { position: 'GK', posLabel: '门将', row: 4, col: 2 },
  { position: 'RCB', posLabel: '右中卫', row: 3, col: 1 },
  { position: 'CB', posLabel: '中后卫', row: 3, col: 2 },
  { position: 'LCB', posLabel: '左中卫', row: 3, col: 3 },
  { position: 'RM', posLabel: '右翼卫', row: 2, col: 0 },
  { position: 'CM1', posLabel: '中前卫', row: 2, col: 1 },
  { position: 'CM2', posLabel: '中前卫', row: 2, col: 3 },
  { position: 'LM', posLabel: '左翼卫', row: 2, col: 4 },
  { position: 'AM', posLabel: '前腰', row: 2, col: 2 },
  { position: 'ST1', posLabel: '前锋', row: 1, col: 1 },
  { position: 'ST2', posLabel: '前锋', row: 1, col: 3 },
]

// 4-2-3-1
const FORMATION_4231: Omit<ILineupSlot, 'playerId'>[] = [
  { position: 'GK', posLabel: '门将', row: 4, col: 2 },
  { position: 'RB', posLabel: '右后卫', row: 3, col: 0 },
  { position: 'CB1', posLabel: '中后卫', row: 3, col: 1 },
  { position: 'CB2', posLabel: '中后卫', row: 3, col: 3 },
  { position: 'LB', posLabel: '左后卫', row: 3, col: 4 },
  { position: 'CDM1', posLabel: '后腰', row: 2.5, col: 1 },
  { position: 'CDM2', posLabel: '后腰', row: 2.5, col: 3 },
  { position: 'RW', posLabel: '右边锋', row: 1.5, col: 0 },
  { position: 'AM', posLabel: '前腰', row: 1.5, col: 2 },
  { position: 'LW', posLabel: '左边锋', row: 1.5, col: 4 },
  { position: 'ST', posLabel: '中锋', row: 1, col: 2 },
]

// 5-3-2
const FORMATION_532: Omit<ILineupSlot, 'playerId'>[] = [
  { position: 'GK', posLabel: '门将', row: 4, col: 2 },
  { position: 'RB', posLabel: '右后卫', row: 3, col: 0 },
  { position: 'RCB', posLabel: '右中卫', row: 3, col: 1 },
  { position: 'CB', posLabel: '中后卫', row: 3, col: 2 },
  { position: 'LCB', posLabel: '左中卫', row: 3, col: 3 },
  { position: 'LB', posLabel: '左后卫', row: 3, col: 4 },
  { position: 'CM1', posLabel: '中前卫', row: 2, col: 1 },
  { position: 'CM2', posLabel: '中前卫', row: 2, col: 2 },
  { position: 'CM3', posLabel: '中前卫', row: 2, col: 3 },
  { position: 'ST1', posLabel: '前锋', row: 1, col: 1 },
  { position: 'ST2', posLabel: '前锋', row: 1, col: 3 },
]

export const FORMATION_DEFS: IFormationDef[] = [
  { key: '4-3-3', label: '4-3-3', slots: DEFAULT_433_SLOTS.map(({ playerId: _p, ...rest }) => rest) },
  { key: '4-4-2', label: '4-4-2', slots: FORMATION_442 },
  { key: '3-5-2', label: '3-5-2', slots: FORMATION_352 },
  { key: '4-2-3-1', label: '4-2-3-1', slots: FORMATION_4231 },
  { key: '5-3-2', label: '5-3-2', slots: FORMATION_532 },
]

export const MOCK_LINEUP: ILineup = {
  matchId: 'm2',
  formation: '4-3-3',
  slots: DEFAULT_433_SLOTS,
  substitutes: ['11'],
  status: 'published',
}

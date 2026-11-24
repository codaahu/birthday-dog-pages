export const solvedTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const
export const puzzleHelpAfterMs = 60_000

export interface PuzzleState {
  id: string
  photoId: string | null
  tiles: number[]
  moves: number
  timeMs: number
  status?: 'completed' | 'skipped'
}

/**
 * 轻度打乱拼图，确保开局尚未完成
 *
 * @date 2026/11/24 11:23
 * @param random 随机数来源，返回 [0, 1)
 * @return 九块拼图的初始排布
 */
export function shuffledTiles(random = Math.random) {
  const tiles: number[] = [...solvedTiles]
  for (let move = 0; move < 4; move += 1) {
    const first = Math.floor(random() * tiles.length)
    const second = (first + 1 + Math.floor(random() * (tiles.length - 1))) % tiles.length
    const tile = tiles[first]
    tiles[first] = tiles[second]
    tiles[second] = tile
  }
  if (isSolved(tiles)) {
    tiles[0] = 1
    tiles[1] = 0
  }
  return tiles
}

/**
 * 判断所有拼图块是否回到原图位置
 *
 * @date 2026/11/24 11:23
 * @param tiles 棋盘从左到右、从上到下的拼图块
 * @return 全部归位时为 true
 */
export function isSolved(tiles: readonly number[]) {
  return tiles.length === solvedTiles.length && tiles.every((tile, index) => tile === index)
}

/**
 * 交换两个位置的拼图块并累计一次操作
 *
 * @date 2026/11/24 11:23
 * @param state 当前拼图草稿
 * @param first 第一个位置，0 至 8
 * @param second 第二个位置，0 至 8
 * @return 交换后的新草稿
 */
export function swapTiles(state: PuzzleState, first: number, second: number): PuzzleState {
  if (first === second || state.status) {
    return state
  }
  const tiles = [...state.tiles]
  tiles[first] = state.tiles[second]
  tiles[second] = state.tiles[first]
  return { ...state, tiles, moves: state.moves + 1 }
}

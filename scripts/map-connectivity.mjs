/**
 * Deterministic grid connectivity audit helpers for Crown & Kingdoms.
 *
 * Cell contract:
 *   isLand(x, y) -> true when a land unit may traverse the cell
 *   isWater(x, y) -> true when a ship may traverse the cell
 *
 * This module is deliberately independent of the renderer so it can be unit-tested
 * in Node and then called by the game's map generator once its generated grid is
 * passed in. It does not silently treat land and water as interchangeable.
 */
export function floodFill(grid, start, isPassable, neighbours = 4) {
  const height = grid.length;
  const width = height ? grid[0].length : 0;
  if (!width || !height || !start || start.x < 0 || start.y < 0 ||
      start.x >= width || start.y >= height || !isPassable(start.x, start.y, grid[start.y][start.x])) {
    return { cells: [], reached: new Set(), width, height };
  }
  const offsets = neighbours === 8
    ? [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
    : [[1,0],[-1,0],[0,1],[0,-1]];
  const reached = new Set();
  const cells = [];
  const queue = [start];
  const key = (x, y) => y * width + x;
  reached.add(key(start.x, start.y));
  for (let head = 0; head < queue.length; head++) {
    const { x, y } = queue[head];
    cells.push({ x, y });
    for (const [dx, dy] of offsets) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || reached.has(k)) continue;
      if (!isPassable(nx, ny, grid[ny][nx])) continue;
      // Match the live A* pathfinder: diagonal movement cannot squeeze between
      // two blocked orthogonal cells, or audits can certify impossible routes.
      if (dx !== 0 && dy !== 0 &&
          (!isPassable(x + dx, y, grid[y][x + dx]) ||
           !isPassable(x, y + dy, grid[y + dy][x]))) continue;
      reached.add(k);
      queue.push({ x: nx, y: ny });
    }
  }
  return { cells, reached, width, height };
}

/** Returns distinct passable components, ordered largest first. */
export function connectedComponents(grid, isPassable, neighbours = 4) {
  const height = grid.length, width = height ? grid[0].length : 0;
  const seen = new Set(), components = [];
  const key = (x, y) => y * width + x;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const k = key(x, y);
    if (seen.has(k) || !isPassable(x, y, grid[y][x])) continue;
    const component = floodFill(grid, { x, y }, isPassable, neighbours);
    for (const cell of component.cells) seen.add(key(cell.x, cell.y));
    components.push(component.cells);
  }
  return components.sort((a, b) => b.length - a.length);
}

/**
 * Check that required points are reachable from the chosen start.
 * A failed point includes its label and coordinates for actionable diagnostics.
 */
export function auditReachability(grid, start, targets, isPassable, neighbours = 4) {
  const result = floodFill(grid, start, isPassable, neighbours);
  const failures = targets.filter(target =>
    target.x < 0 || target.y < 0 || target.x >= result.width || target.y >= result.height ||
    !result.reached.has(target.y * result.width + target.x)
  ).map(target => ({ ...target, reason: 'unreachable-from-start' }));
  return {
    ok: result.cells.length > 0 && failures.length === 0,
    reachableCount: result.cells.length,
    failures
  };
}

/** Separate land and water audits prevent accidental cross-medium reachability. */
export function auditLandAndWater(grid, config) {
  const land = auditReachability(grid, config.landStart, config.landTargets || [],
    config.isLand, config.landNeighbours || 4);
  const water = auditReachability(grid, config.waterStart, config.waterTargets || [],
    config.isWater, config.waterNeighbours || 4);
  return { ok: land.ok && water.ok, land, water };
}

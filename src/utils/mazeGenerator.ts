import type { Maze, Cell, Position } from '../types/maze';

export type Difficulty = 'very_easy' | 'easy' | 'normal' | 'hard' | 'very_hard';

export interface MazeConfig {
  width: number;
  height: number;
  difficulty: Difficulty;
}

export function generateMaze(config: MazeConfig): Maze {
  const { width, height, difficulty } = config;
  
  // 根据难度设置参数
  const difficultyParams = {
    very_easy: {
      deadEndFactor: 0.01, // 极低的死胡同因子
      standardCompletionRate: 1.0, // 预期完成率接近100%
      mazeScale: 0.2 // 迷宫尺寸显著缩小
    },
    easy: {
      deadEndFactor: 0.1,
      standardCompletionRate: 0.7,
      mazeScale: 0.9 // 稍微缩小迷宫尺寸
    },
    normal: {
      deadEndFactor: 0.2,
      standardCompletionRate: 0.5,
      mazeScale: 1.0 // 标准尺寸
    },
    hard: {
      deadEndFactor: 0.35,
      standardCompletionRate: 0.3,
      mazeScale: 1.1 // 稍微放大迷宫尺寸
    },
    very_hard: {
      deadEndFactor: 0.5,
      standardCompletionRate: 0.2,
      mazeScale: 1.2 // 放大迷宫尺寸
    }
  };

  const params = difficultyParams[difficulty];
  
  // 根据难度调整迷宫尺寸
  const baseWidth = 31; // 基础宽度
  const baseHeight = 31; // 基础高度
  const mazeWidth = Math.floor((width % 2 === 0 ? width - 1 : width) * params.mazeScale);
  const mazeHeight = Math.floor((height % 2 === 0 ? height - 1 : height) * params.mazeScale);

  // 确保迷宫尺寸为奇数，方便生成路径
  const finalMazeWidth = mazeWidth % 2 === 0 ? mazeWidth - 1 : mazeWidth;
  const finalMazeHeight = mazeHeight % 2 === 0 ? mazeHeight - 1 : mazeHeight;

  // 确保最小尺寸
  const minSize = 11; // 最小迷宫尺寸
  const finalWidth = Math.max(finalMazeWidth, minSize);
  const finalHeight = Math.max(finalMazeHeight, minSize);

  // 初始化迷宫，全部设为墙
  const cells: Cell[][] = Array(finalHeight).fill(null).map((_, y) =>
    Array(finalWidth).fill(null).map((_, x) => ({
      x,
      y,
      isWall: true,
      isVisited: false,
      pheromone: 0
    }))
  );

  // 使用递归回溯算法生成迷宫
  const stack: Position[] = [];
  const start: Position = { x: 1, y: 1 };
  
  cells[start.y][start.x].isWall = false;
  cells[start.y][start.x].isVisited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, cells, finalWidth, finalHeight);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    cells[next.y][next.x].isWall = false;
    cells[next.y][next.x].isVisited = true;

    // 打通中间的墙
    const wallX = (current.x + next.x) / 2;
    const wallY = (current.y + next.y) / 2;
    cells[wallY][wallX].isWall = false;

    stack.push(next);
  }

  // 设置起点和终点
  const mazeStart: Position = { x: 1, y: 1 }; // 起点固定在 (1, 1)
  const mazeEnd: Position = { x: finalWidth - 2, y: finalHeight - 2 }; // 终点固定在右下角第二个通路单元格
  cells[mazeStart.y][mazeStart.x].isWall = false;
  cells[mazeEnd.y][mazeEnd.x].isWall = false;

  // 根据难度添加死胡同 (通过保留一些墙)
  for (let y = 1; y < finalHeight - 1; y += 2) {
    for (let x = 1; x < finalWidth - 1; x += 2) {
      if (Math.random() < params.deadEndFactor) {
         const neighbors = getNeighbors({ x, y }, cells, finalWidth, finalHeight);
         const wallNeighbors = neighbors.filter(pos => cells[pos.y][pos.x].isWall);
         if(wallNeighbors.length > 0) {
            const wallToKeep = wallNeighbors[Math.floor(Math.random() * wallNeighbors.length)];
            cells[wallToKeep.y][wallToKeep.x].isWall = true;
         }
      }
    }
  }

  return {
    width: finalWidth,
    height: finalHeight,
    cells,
    start: mazeStart,
    end: mazeEnd,
    standardCompletionRate: params.standardCompletionRate,
    actualCompletionRate: 0
  };
}

function getUnvisitedNeighbors(pos: Position, cells: Cell[][], width: number, height: number): Position[] {
  const neighbors: Position[] = [];
  const directions = [
    { x: 0, y: -2 }, // 上，跳过一个墙
    { x: 2, y: 0 },  // 右，跳过一个墙
    { x: 0, y: 2 },  // 下，跳过一个墙
    { x: -2, y: 0 }  // 左，跳过一个墙
  ];

  for (const dir of directions) {
    const newX = pos.x + dir.x;
    const newY = pos.y + dir.y;

    if (
      newX > 0 && newX < width - 1 &&
      newY > 0 && newY < height - 1 &&
      cells[newY][newX].isVisited === false
    ) {
      neighbors.push({ x: newX, y: newY });
    }
  }

  return neighbors;
}

function getNeighbors(pos: Position, cells: Cell[][], width: number, height: number): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -1 }, // 上
      { x: 1, y: 0 },  // 右
      { x: 0, y: 1 },  // 下
      { x: -1, y: 0 }  // 左
    ];
  
    for (const dir of directions) {
      const newX = pos.x + dir.x;
      const newY = pos.y + dir.y;
  
      if (
        newX >= 0 && newX < width &&
        newY >= 0 && newY < height
      ) {
        neighbors.push({ x: newX, y: newY });
      }
    }
  
    return neighbors;
  }

function countExits(pos: Position, cells: Cell[][]): number {
  const directions = [
    { x: 0, y: -1 }, // 上
    { x: 1, y: 0 },  // 右
    { x: 0, y: 1 },  // 下
    { x: -1, y: 0 }  // 左
  ];

  return directions.reduce((count, dir) => {
    const newX = pos.x + dir.x;
    const newY = pos.y + dir.y;
    if (
      newX >= 0 && newX < cells[0].length &&
      newY >= 0 && newY < cells.length &&
      !cells[newY][newX].isWall
    ) {
      return count + 1;
    }
    return count;
  }, 0);
} 
import type { Position, Cell, Maze } from '../types/maze';
import type { Ant, AntGroup } from '../types/ant';

interface AntState {
  position: Position;
  path: Position[];
  hasReachedEnd: boolean;
  moveProgress: number;
  targetPosition: Position | null;
  direction: { x: number; y: number } | null;
}

export class AntColonyOptimization {
  private ants: AntState[];
  private maze: Maze;
  private antGroup: AntGroup;
  private evaporationRate = 0.02;
  private pheromoneDeposit = 0.5;
  private moveSpeedFactor = 0.05;

  constructor(maze: Maze, antGroup: AntGroup) {
    this.maze = maze;
    this.antGroup = antGroup;
    this.ants = this.initializeAnts();
  }

  private initializeAnts(): AntState[] {
    return Array(this.antGroup.ants.length).fill(null).map(() => ({
      position: { ...this.maze.start },
      path: [this.maze.start],
      hasReachedEnd: false,
      moveProgress: 0,
      targetPosition: null,
      direction: null
    }));
  }

  public step(): void {
    console.log('Step called, ants:', this.ants);

    // 更新每只蚂蚁的位置
    for (let i = 0; i < this.ants.length; i++) {
      if (this.ants[i].hasReachedEnd) continue;

      const ant = this.ants[i];
      const antType = this.antGroup.ants[i];
      
      // 如果蚂蚁没有目标位置，或者已经到达目标位置
      if (!ant.targetPosition || ant.moveProgress >= 1) {
        const nextPosition = this.getNextPosition(ant);
        
        if (nextPosition) {
          // 检查是否是相邻格子
          // const dx = Math.abs(nextPosition.x - ant.position.x);
          // const dy = Math.abs(nextPosition.y - ant.position.y);
          
          // 只允许移动到相邻格子
          // if (dx + dy === 1) {
            ant.targetPosition = nextPosition;
            ant.moveProgress = 0;
            // 更新方向
            ant.direction = {
              x: nextPosition.x - ant.position.x,
              y: nextPosition.y - ant.position.y
            };
          // }
        }
      }

      // 更新移动进度
      if (ant.targetPosition) {
        // 根据蚂蚁类型调整移动速度
        const speedMultiplier = this.getSpeedMultiplier(antType);
        ant.moveProgress += this.moveSpeedFactor * speedMultiplier;

        // 如果移动完成
        if (ant.moveProgress >= 1) {
          const previousPosition = ant.position; // 保存移动前的位置
          ant.position = ant.targetPosition;
          ant.path.push(ant.position); // 将新的位置加入路径
          ant.targetPosition = null;

          // 在移动完成时沉积信息素，包括起点和中间点
          const intermediateX = (previousPosition.x + ant.position.x) / 2;
          const intermediateY = (previousPosition.y + ant.position.y) / 2;
          
          // 沉积信息素在当前位置和中间位置
          this.depositPheromone([ant.position, { x: intermediateX, y: intermediateY }]);

          // 检查是否到达终点
          if (ant.position.x === this.maze.end.x && ant.position.y === this.maze.end.y) {
            console.log(`Ant ${i} reached end!`);
            ant.hasReachedEnd = true;
            // 到达终点时额外沉积更多信息素
            this.depositPheromone(ant.path);
          }
        }
      }
    }

    // 信息素蒸发
    this.evaporatePheromone();
  }

  private getNextPosition(ant: AntState): Position | null {
    const neighbors = this.getValidNeighbors(ant.position);
    console.log('Valid neighbors:', neighbors);

    if (neighbors.length === 0) return null;

    // 根据信息素和探索率选择下一个位置
    const antType = this.antGroup.ants[this.ants.indexOf(ant)];
    const exploreChance = Math.random();
    
    if (exploreChance < antType.exploreRatio) {
      // 探索新路径
      const nextPos = neighbors[Math.floor(Math.random() * neighbors.length)];
      console.log('Exploring new path:', nextPos);
      return nextPos;
    } else {
      // 跟随信息素
      const pheromoneValues = neighbors.map(pos => this.maze.cells[pos.y][pos.x].pheromone);
      const maxPheromone = Math.max(...pheromoneValues);
      const bestNeighbors = neighbors.filter((_, i) => pheromoneValues[i] === maxPheromone);
      const nextPos = bestNeighbors[Math.floor(Math.random() * bestNeighbors.length)];
      console.log('Following pheromone:', nextPos);
      return nextPos;
    }
  }

  private getValidNeighbors(pos: Position): Position[] {
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
      const wallX = pos.x + dir.x / 2; // 中间的墙
      const wallY = pos.y + dir.y / 2; // 中间的墙

      if (
        newX >= 0 && newX < this.maze.width &&
        newY >= 0 && newY < this.maze.height &&
        !this.maze.cells[newY][newX].isWall && // 目标单元格不是墙
        !this.maze.cells[wallY][wallX].isWall // 中间的墙已经被打通
      ) {
        neighbors.push({ x: newX, y: newY });
      }
    }

    return neighbors;
  }

  private depositPheromone(path: Position[]): void {
    const deposit = this.pheromoneDeposit / path.length;
    for (const pos of path) {
      this.maze.cells[pos.y][pos.x].pheromone += deposit;
      // 限制信息素最大值
      if (this.maze.cells[pos.y][pos.x].pheromone > 1.0) {
        this.maze.cells[pos.y][pos.x].pheromone = 1.0;
      }
    }
  }

  private evaporatePheromone(): void {
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        this.maze.cells[y][x].pheromone *= (1 - this.evaporationRate);
      }
    }
  }

  public isAllAntsReachedEnd(): boolean {
    return this.ants.some(ant => ant.hasReachedEnd);
  }

  public getAnts(): AntState[] {
    return this.ants.map(ant => ({
      ...ant,
      position: ant.targetPosition && ant.moveProgress < 1
        ? {
            x: ant.position.x + (ant.targetPosition.x - ant.position.x) * ant.moveProgress,
            y: ant.position.y + (ant.targetPosition.y - ant.position.y) * ant.moveProgress
          }
        : ant.position
    }));
  }

  private getSpeedMultiplier(ant: Ant): number {
    switch (ant.type) {
      case 'sprinter':
        return 2.0;
      case 'explorer':
        return 1.5;
      case 'allrounder':
        return 1.2;
      case 'elite':
        return 1.0;
      case 'memory':
        return 0.8;
      case 'patient':
        return 0.6;
      default:
        return 1.0;
    }
  }

  public reset(): void {
    // 重置所有蚂蚁的位置到起点
    this.ants.forEach(ant => {
      ant.position = { ...this.maze.start };
      ant.direction = { x: 0, y: 0 };
      ant.hasReachedEnd = false;
    });

    // 清除所有信息素
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        this.maze.cells[y][x].pheromone = 0;
      }
    }
  }
} 
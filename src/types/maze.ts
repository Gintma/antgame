/*
 * @Author: “crislee” ‘505267309@qq.com’
 * @Date: 2025-06-04 10:26:44
 * @LastEditors: “crislee” ‘505267309@qq.com’
 * @LastEditTime: 2025-06-04 10:27:26
 * @FilePath: /untgame/src/types/maze.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { AntGroup } from './ant';

export interface Position {
  x: number;
  y: number;
}

export interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  isVisited: boolean;
  pheromone: number;
}

export interface Maze {
  width: number;
  height: number;
  cells: Cell[][];
  start: Position;
  end: Position;
  standardCompletionRate: number;
  actualCompletionRate: number;
}

export interface GameState {
  maze: Maze;
  antGroup: AntGroup;
  isRunning: boolean;
  isCompleted: boolean;
  score: number;
  timeElapsed: number;
} 
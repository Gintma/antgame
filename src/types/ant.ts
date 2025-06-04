/*
 * @Author: “crislee” ‘505267309@qq.com’
 * @Date: 2025-06-04 10:26:37
 * @LastEditors: “crislee” ‘505267309@qq.com’
 * @LastEditTime: 2025-06-04 10:26:47
 * @FilePath: /untgame/src/types/ant.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export type AntType = 'explorer' | 'memory' | 'sprinter' | 'patient' | 'elite' | 'allrounder';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Skill = 'jump' | 'scout' | 'booster' | 'pheroboost' | 'pathfinder' | 'teleport';

export interface Ant {
  tokenId: number;
  type: AntType;
  rarity: Rarity;
  baseSpeed: number;
  memoryAffinity: number;
  exploreRatio: number;
  eliteChance: number;
  skills: Skill[];
  level: number;
  exp: number;
}

export interface AntGroup {
  ants: Ant[];
  totalSpeed: number;
  avgMemoryAffinity: number;
  avgExploreRatio: number;
  avgEliteChance: number;
} 
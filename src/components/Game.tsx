import React, { useEffect, useRef, useState } from 'react';
import { generateMaze } from '../utils/mazeGenerator';
import { AntColonyOptimization } from '../utils/antColony';
import { AntSelector } from './AntSelector';
import type { Maze } from '../types/maze';
import type { Ant, AntGroup } from '../types/ant';
import type { Difficulty } from '../utils/mazeGenerator';
import '../styles/Game.css';
import antSvg from '../assets/ant.svg';

const CELL_SIZE = 20;
const ANIMATION_SPEED = 32; // 增加到32ms，约等于30fps
const ANT_SIZE = 16;
const ANT_ANIMATION_FRAMES = 12;
const ANIMATION_SPEED_FACTOR = 0.1;
const MOVE_TRANSITION_DURATION = 400;

const ANT_COLORS = {
  explorer: '#FF0000',    // 纯红色
  memory: '#00BFFF',      // 深天蓝
  sprinter: '#FFD700',    // 金色
  patient: '#32CD32',     // 酸橙绿
  elite: '#FF1493',       // 深粉色
  allrounder: '#9370DB',  // 中紫色
};

interface AntState {
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  direction: { x: number; y: number };
  animationFrame: number;
  lastUpdate: number;
  moveStartTime: number;
}

export const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maze, setMaze] = useState<Maze | null>(null);
  const [antColony, setAntColony] = useState<AntColonyOptimization | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [selectedAnts, setSelectedAnts] = useState<Ant[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const antImageRef = useRef<HTMLImageElement | null>(null);
  const antStatesRef = useRef<AntState[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // 初始化游戏
  useEffect(() => {
    const newMaze = generateMaze({
      width: 31,
      height: 31,
      difficulty
    });
    setMaze(newMaze);

    // 加载蚂蚁图片
    const img = new Image();
    img.src = antSvg;
    img.onload = () => {
      antImageRef.current = img;
    };
  }, [difficulty]);

  // 当选择的蚂蚁改变时更新蚁群
  useEffect(() => {
    if (!maze) return;

    const antGroup: AntGroup = {
      ants: selectedAnts,
      totalSpeed: selectedAnts.reduce((sum, ant) => sum + ant.baseSpeed, 0),
      avgMemoryAffinity: selectedAnts.reduce((sum, ant) => sum + ant.memoryAffinity, 0) / selectedAnts.length || 0,
      avgExploreRatio: selectedAnts.reduce((sum, ant) => sum + ant.exploreRatio, 0) / selectedAnts.length || 0,
      avgEliteChance: selectedAnts.reduce((sum, ant) => sum + ant.eliteChance, 0) / selectedAnts.length || 0,
    };

    setAntColony(new AntColonyOptimization(maze, antGroup));
    // 初始化蚂蚁状态
    antStatesRef.current = selectedAnts.map(() => ({
      position: { x: 0, y: 0 },
      targetPosition: { x: 0, y: 0 },
      direction: { x: 0, y: 0 },
      animationFrame: 0,
      lastUpdate: Date.now(),
      moveStartTime: Date.now()
    }));
  }, [maze, selectedAnts]);

  // 游戏循环
  useEffect(() => {
    if (!isRunning || !antColony) return;

    let lastUpdate = Date.now();
    let animationFrameId: number;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdate;

      // 更新游戏逻辑
      if (deltaTime >= ANIMATION_SPEED) {
        antColony.step();
        lastUpdate = now;

        if (antColony.isAllAntsReachedEnd()) {
          setIsRunning(false);
          setScore(prev => prev + 100);
          setShowCompletionModal(true);
          return;
        }
      }

      // 更新动画
      setUpdateTrigger(prev => prev + 1);
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, antColony]);

  // 绘制游戏
  useEffect(() => {
    if (!maze || !antColony || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    canvas.width = maze.width * CELL_SIZE;
    canvas.height = maze.height * CELL_SIZE;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制迷宫
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.cells[y][x];
        if (cell.isWall) {
          ctx.fillStyle = '#333';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else {
          // 先绘制白色背景
          ctx.fillStyle = 'white';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          
          // 只在有信息素的地方绘制黄色，增加基础透明度
          if (cell.pheromone > 0) {
            ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + cell.pheromone * 0.7})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }
    }

    // 绘制起点和终点
    ctx.fillStyle = 'green';
    ctx.fillRect(maze.start.x * CELL_SIZE, maze.start.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.fillStyle = 'red';
    ctx.fillRect(maze.end.x * CELL_SIZE, maze.end.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    // 绘制蚂蚁
    const ants = antColony.getAnts();
    ants.forEach((ant, index) => {
      const antType = selectedAnts[index]?.type;
      if (antType && antImageRef.current) {
        const x = (ant.position.x + 0.5) * CELL_SIZE;
        const y = (ant.position.y + 0.5) * CELL_SIZE;

        // 创建离屏 canvas 来合成颜色
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = ANT_SIZE;
        offscreenCanvas.height = ANT_SIZE;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        
        if (offscreenCtx) {
          // 保存上下文状态
          offscreenCtx.save();
          
          // 设置动画效果
          const scale = 1 + Math.sin(Date.now() * 0.005) * 0.05;
          offscreenCtx.translate(ANT_SIZE / 2, ANT_SIZE / 2);
          offscreenCtx.scale(scale, scale);
          
          // 计算旋转角度
          const angle = Math.atan2(ant.direction?.y || 0, ant.direction?.x || 0);
          offscreenCtx.rotate(angle);
          
          // 绘制蚂蚁图片
          offscreenCtx.drawImage(
            antImageRef.current,
            -ANT_SIZE / 2,
            -ANT_SIZE / 2,
            ANT_SIZE,
            ANT_SIZE
          );

          // 应用颜色和混合模式
          offscreenCtx.globalCompositeOperation = 'source-in';
          offscreenCtx.fillStyle = ANT_COLORS[antType];
          offscreenCtx.fillRect(-ANT_SIZE / 2, -ANT_SIZE / 2, ANT_SIZE, ANT_SIZE);

          // 恢复上下文状态
          offscreenCtx.restore();

          // 将合成后的图像绘制到主画布
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.drawImage(
            offscreenCanvas,
            x - ANT_SIZE / 2,
            y - ANT_SIZE / 2
          );
          ctx.restore();
        }
      }
    });
  }, [maze, antColony, updateTrigger, selectedAnts]);

  const startGame = () => {
    if (selectedAnts.length === 0) {
      alert('请先选择至少一只蚂蚁！');
      return;
    }
    setIsRunning(true);
  };

  const resetGame = () => {
    console.log('重置游戏按钮被点击');
    setIsRunning(false);
    console.log('isRunning 设置为 false');
    setScore(0);
    console.log('分数设置为 0');
    const newMaze = generateMaze({
      width: 31,
      height: 31,
      difficulty
    });
    setMaze(newMaze);
    console.log('生成新迷宫');
    
    // 重置蚂蚁状态
    if (antColony) {
      antColony.reset();
      console.log('蚁群状态已重置');
    }
    
    // 重置蚂蚁状态数组
    antStatesRef.current = selectedAnts.map(() => ({
      position: { x: 0, y: 0 },
      targetPosition: { x: 0, y: 0 },
      direction: { x: 0, y: 0 },
      animationFrame: 0,
      lastUpdate: Date.now(),
      moveStartTime: Date.now()
    }));
    console.log('蚂蚁状态数组已重置');
    
    // 强制更新视图
    setUpdateTrigger(prev => prev + 1);
    console.log('触发视图更新');
    setShowCompletionModal(false);
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>AntMaze</h1>
        <div className="game-controls">
          <div className="difficulty-selector">
            <label>难度：</label>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              disabled={isRunning}
            >
              <option value="very_easy">非常简单</option>
              <option value="easy">简单</option>
              <option value="normal">普通</option>
              <option value="hard">困难</option>
              <option value="very_hard">非常困难</option>
            </select>
          </div>
          <div className="score">得分: {score}</div>
          <div className="buttons">
            <button onClick={startGame} disabled={isRunning}>
              {isRunning ? '游戏中...' : '开始游戏'}
            </button>
            <button onClick={resetGame}>
              重置游戏
            </button>
          </div>
        </div>
      </div>
      
      {/* 新增一个容器来包裹 AntSelector 和 Canvas，实现左右布局 */}
      <div className="game-content-row">
        <div className="ant-selector-container">
          <AntSelector selectedAnts={selectedAnts} onAntsChange={setSelectedAnts} />
        </div>
        
        <canvas ref={canvasRef} />
      </div>

      {/* 完成弹窗 */}
      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>恭喜您！</h2>
            <p>您成功引导蚂蚁找到了出口！</p>
            <button onClick={resetGame}>确定</button>
          </div>
        </div>
      )}

    </div>
  );
}; 
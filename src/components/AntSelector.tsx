import React from 'react';
import type { Ant, AntType } from '../types/ant';
import { Tooltip } from './Tooltip';
import '../styles/AntSelector.css';

interface AntSelectorProps {
  selectedAnts: Ant[];
  onAntsChange: (ants: Ant[]) => void;
}

const ANT_TYPES: { type: AntType; color: string; name: string; description: string }[] = [
  { 
    type: 'explorer', 
    color: '#FF0000', 
    name: '探索型',
    description: '基础速度：60\n记忆亲和度：0.2\n探索比例：0.8\n精英概率：0.1\n特点：擅长探索新路径'
  },
  { 
    type: 'memory', 
    color: '#00BFFF', 
    name: '记忆型',
    description: '基础速度：40\n记忆亲和度：0.8\n探索比例：0.2\n精英概率：0.1\n特点：善于记住和利用已知路径'
  },
  { 
    type: 'sprinter', 
    color: '#FFD700', 
    name: '冲刺型',
    description: '基础速度：90\n记忆亲和度：0.4\n探索比例：0.5\n精英概率：0.15\n特点：移动速度最快'
  },
  { 
    type: 'patient', 
    color: '#32CD32', 
    name: '耐心型',
    description: '基础速度：30\n记忆亲和度：0.6\n探索比例：0.4\n精英概率：0.05\n特点：稳定可靠，不易迷失'
  },
  { 
    type: 'elite', 
    color: '#FF1493', 
    name: '精英型',
    description: '基础速度：50\n记忆亲和度：0.7\n探索比例：0.3\n精英概率：0.5\n特点：各方面能力均衡，精英概率高'
  },
  { 
    type: 'allrounder', 
    color: '#9370DB', 
    name: '多面手',
    description: '基础速度：55\n记忆亲和度：0.5\n探索比例：0.5\n精英概率：0.2\n特点：各项能力均衡发展'
  },
];

export const AntSelector: React.FC<AntSelectorProps> = ({ selectedAnts, onAntsChange }) => {
  const addAnt = (type: AntType) => {
    // 检查是否已达到蚂蚁数量上限
    if (selectedAnts.length >= 10) {
        return; // 如果已达到上限，则不添加
    }

    const newAnt: Ant = {
      tokenId: selectedAnts.length + 1,
      type,
      rarity: 'common',
      baseSpeed: getBaseSpeed(type),
      memoryAffinity: getMemoryAffinity(type),
      exploreRatio: getExploreRatio(type),
      eliteChance: getEliteChance(type),
      skills: [],
      level: 1,
      exp: 0,
    };
    onAntsChange([...selectedAnts, newAnt]);
  };

  // 移除蚂蚁
  const removeAnt = (index: number) => {
    const newAnts = [...selectedAnts];
    newAnts.splice(index, 1);
    onAntsChange(newAnts);
  };

  return (
    <div className="ant-selector">
      <h3>选择蚂蚁 ({selectedAnts.length}/10)</h3>
      <div className="ant-type-buttons">
        {ANT_TYPES.map(({ type, color, name, description }) => (
          <Tooltip
            key={type}
            content={
              <div className="ant-tooltip">
                <div className="ant-tooltip-header" style={{ backgroundColor: color }}>
                  {name}
                </div>
                <div className="ant-tooltip-content">
                  {description.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            }
          >
            <button
              onClick={() => addAnt(type)}
              disabled={selectedAnts.length >= 10}
              style={{ backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px', padding: '10px', cursor: 'pointer', fontSize: '14px', margin: '5px', flex: '1 1 calc(50% - 10px)' }}
            >
              {name}
            </button>
          </Tooltip>
        ))}
      </div>
      
      {/* 显示已选择的蚂蚁列表 */}
      {selectedAnts.length > 0 && (
        <div className="selected-ants-list">
          {selectedAnts.map((ant, index) => (
            <div key={index} className="selected-ant-item">
              <span>{ANT_TYPES.find(t => t.type === ant.type)?.name}</span>
              <button className="delete-button" onClick={() => removeAnt(index)}>×</button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

// 根据蚂蚁类型获取基础属性
function getBaseSpeed(type: AntType): number {
  switch (type) {
    case 'sprinter': return 90;
    case 'explorer': return 60;
    case 'allrounder': return 55;
    case 'elite': return 50;
    case 'memory': return 40;
    case 'patient': return 30;
  }
}

function getMemoryAffinity(type: AntType): number {
  switch (type) {
    case 'memory': return 0.8;
    case 'elite': return 0.7;
    case 'patient': return 0.6;
    case 'allrounder': return 0.5;
    case 'sprinter': return 0.4;
    case 'explorer': return 0.2;
  }
}

function getExploreRatio(type: AntType): number {
  switch (type) {
    case 'explorer': return 0.8;
    case 'sprinter': return 0.5;
    case 'allrounder': return 0.5;
    case 'patient': return 0.4;
    case 'elite': return 0.3;
    case 'memory': return 0.2;
  }
}

function getEliteChance(type: AntType): number {
  switch (type) {
    case 'elite': return 0.5;
    case 'allrounder': return 0.2;
    case 'sprinter': return 0.15;
    case 'explorer': return 0.1;
    case 'memory': return 0.1;
    case 'patient': return 0.05;
  }
} 
import type { BoardBlock, BoardZone, BoardContentType, TeachingPriority } from '@/types';

const ZONE_TYPE_MAP: Record<BoardContentType, BoardZone> = {
  definition: 'top-left',
  concept: 'center',
  example: 'right',
  diagram: 'center-large',
  recap: 'bottom',
  formula: 'center-left',
  table: 'right',
  graph: 'center-large',
};

const ZONE_PRIORITY: BoardZone[] = [
  'top-left',
  'center-left',
  'center',
  'right',
  'bottom',
  'center-large',
];

export class BoardManager {
  private blocks: BoardBlock[] = [];
  private blockCounter = 0;

  addBlock(block: Omit<BoardBlock, 'id' | 'createdAt'>): BoardBlock {
    const zone = block.zone || this.assignZone(block.type);
    const id = `block-${++this.blockCounter}-${Date.now()}`;

    // Check if zone can be reused
    this.maybeClearZone(zone, block.lifespan, block.importance);

    const newBlock: BoardBlock = {
      ...block,
      id,
      zone,
      createdAt: Date.now(),
    };

    this.blocks.push(newBlock);
    return newBlock;
  }

  removeBlock(id: string): void {
    this.blocks = this.blocks.filter((b) => b.id !== id);
  }

  updateBlock(id: string, updates: Partial<BoardBlock>): void {
    const idx = this.blocks.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.blocks[idx] = { ...this.blocks[idx], ...updates };
    }
  }

  clearTemporary(): void {
    this.blocks = this.blocks.filter((b) => b.lifespan !== 'temporary');
  }

  clearSection(): void {
    this.blocks = this.blocks.filter((b) => b.lifespan === 'lesson');
  }

  clearAll(): void {
    this.blocks = [];
  }

  getBlocks(): BoardBlock[] {
    return [...this.blocks];
  }

  getBlocksByZone(zone: BoardZone): BoardBlock[] {
    return this.blocks.filter((b) => b.zone === zone);
  }

  getBlock(id: string): BoardBlock | undefined {
    return this.blocks.find((b) => b.id === id);
  }

  public assignZone(type: BoardContentType): BoardZone {
    const preferredZone = ZONE_TYPE_MAP[type];

    // Check if preferred zone is available or can be reused
    if (this.canReuseZone(preferredZone)) {
      return preferredZone;
    }

    // Find an alternative zone
    for (const zone of ZONE_PRIORITY) {
      if (this.canReuseZone(zone)) {
        return zone;
      }
    }

    // Fallback: return preferred zone anyway (will stack)
    return preferredZone;
  }

  private canReuseZone(zone: BoardZone): boolean {
    const zoneBlocks = this.blocks.filter((b) => b.zone === zone);
    if (zoneBlocks.length === 0) return true;

    // Zone can be reused if all blocks there are temporary
    return zoneBlocks.every((b) => b.lifespan === 'temporary');
  }

  private maybeClearZone(zone: BoardZone, newLifespan: BoardBlock['lifespan'], newImportance: TeachingPriority): void {
    const zoneBlocks = this.blocks.filter((b) => b.zone === zone);
    const priorityOrder: Record<TeachingPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    for (const block of zoneBlocks) {
      // Remove temporary blocks when new block is more important
      if (block.lifespan === 'temporary' && priorityOrder[newImportance] >= priorityOrder[block.importance]) {
        this.removeBlock(block.id);
      }
      // Remove section blocks when new block is lesson-level
      else if (block.lifespan === 'section' && newLifespan === 'lesson' && priorityOrder[newImportance] > priorityOrder[block.importance]) {
        this.removeBlock(block.id);
      }
    }
  }
}

export type TexturePainter = (ctx: CanvasRenderingContext2D, size: number) => void;

export type CharacterLoaders = {
  modelConfig?: Record<string, unknown>;
  buildModel?: (ctx: any) => any;
  buildWeapon?: (hand: any, ctx: any) => void;
  attachSkinGear?: (ctx: any) => void;
  paintTexture?: TexturePainter;
  loadVfx?: () => void;
};

export class BaseCharacter {
  [key: string]: any;

  readonly data: Record<string, any>;
  readonly loaders: CharacterLoaders;

  constructor(data: Record<string, any>, loaders: CharacterLoaders = {}) {
    Object.assign(this, data);
    this.data = data;
    this.loaders = loaders;
  }

  get modelConfig() {
    return this.loaders.modelConfig || null;
  }

  buildModel(ctx: any) {
    return this.loaders.buildModel ? this.loaders.buildModel(ctx) : null;
  }

  buildWeapon(hand: any, ctx: any) {
    if (this.loaders.buildWeapon) this.loaders.buildWeapon(hand, ctx);
  }

  attachSkinGear(ctx: any) {
    if (this.loaders.attachSkinGear) this.loaders.attachSkinGear(ctx);
  }

  paintTexture(ctx: CanvasRenderingContext2D, size: number) {
    if (this.loaders.paintTexture) this.loaders.paintTexture(ctx, size);
  }

  loadVfx() {
    if (this.loaders.loadVfx) this.loaders.loadVfx();
  }
}

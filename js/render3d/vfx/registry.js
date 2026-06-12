// 角色專屬特效註冊表 (純資料，無相依，避免循環匯入)
const REGISTRY = new Map();
export function registerVfx(id, def) { if (id) REGISTRY.set(id, def); }
export function getVfx(id) { return id ? REGISTRY.get(id) || null : null; }
export function hasVfx(id) { return !!id && REGISTRY.has(id); }

/**
 * AITutor v2.0 Enterprise Plugin Architecture & Event Bus SDK
 */

export class PluginManager {
  constructor(playerInstance = null) {
    this.player = playerInstance;
    this.plugins = new Map();
    this.listeners = new Map();
  }

  setPlayer(playerInstance) {
    this.player = playerInstance;
  }

  registerPlugin(plugin) {
    if (!plugin || typeof plugin !== 'object' || !plugin.name) {
      throw new Error('[AITutor Plugin SDK] Plugin must be an object with a unique "name" property.');
    }

    if (this.plugins.has(plugin.name)) {
      console.warn(`[AITutor Plugin SDK] Plugin "${plugin.name}" is already registered. Re-initializing.`);
      this.unregisterPlugin(plugin.name);
    }

    this.plugins.set(plugin.name, plugin);
    if (typeof plugin.init === 'function') {
      plugin.init(this.player || this);
    }
    this.emit('pluginRegistered', { name: plugin.name });
    return this;
  }

  unregisterPlugin(name) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      if (typeof plugin.destroy === 'function') {
        try { plugin.destroy(); } catch (_) {}
      }
      this.plugins.delete(name);
      this.emit('pluginUnregistered', { name });
    }
    return this;
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, payload = {}) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[AITutor Plugin Event Error] Event "${event}" callback error:`, err);
        }
      });
    }
  }

  destroy() {
    for (const name of Array.from(this.plugins.keys())) {
      this.unregisterPlugin(name);
    }
    this.listeners.clear();
  }
}

export default PluginManager;

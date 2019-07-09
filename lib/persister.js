class Persister {

  constructor() {
    this.canDo = typeof(Storage) !== "undefined";
  }

  set(key, value) {
    if (this.canDo) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  get(key) {
    if (!this.canDo) {
      return undefined;
    }

    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      localStorage.removeItem(key);
      return undefined;
    }
  }
}

module.exports = Persister;

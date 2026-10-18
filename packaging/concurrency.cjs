function createSlots(limit) {
  if (!Number.isSafeInteger(limit) || limit < 1) throw new RangeError('Slot limit must be a positive safe integer');
  let active = 0;
  return {
    tryAcquire() {
      if (active >= limit) return null;
      active += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        active -= 1;
      };
    }
  };
}

module.exports = { createSlots };

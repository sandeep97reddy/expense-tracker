jest.mock('react-native-mmkv', () => {
  let store = {};
  const mockInstance = {
    set: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    getString: jest.fn((key) => store[key] || undefined),
    getNumber: jest.fn((key) => (store[key] !== undefined ? Number(store[key]) : undefined)),
    getBoolean: jest.fn((key) => (store[key] !== undefined ? store[key] === 'true' : undefined)),
    contains: jest.fn((key) => key in store),
    delete: jest.fn((key) => {
      delete store[key];
    }),
    getAllKeys: jest.fn(() => Object.keys(store)),
    clearAll: jest.fn(() => {
      store = {};
    }),
    addOnValueChangedListener: jest.fn(),
  };

  return {
    MMKV: jest.fn().mockImplementation(() => mockInstance),
    createMMKV: jest.fn().mockImplementation(() => mockInstance),
  };
});

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-1234'),
}));

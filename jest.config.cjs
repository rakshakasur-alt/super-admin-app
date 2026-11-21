module.exports = {
  testEnvironment: '<rootDir>/test-environment.cjs',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg|glb|gltf)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  testMatch: ['**/tests/**/*.test.[jt]s?(x)'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node']
};

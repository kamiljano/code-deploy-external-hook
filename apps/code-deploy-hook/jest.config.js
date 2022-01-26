process.env.DEPLOYMENT_TABLE_NAME = 'deployments';
process.env.LIFECYCLE_STAGE = 'PRE_TRAFFIC';
process.env.DEPLOYMENT_TABLE_TTL = String(1000 * 60 * 10);

module.exports = {
  displayName: 'code-deploy-hook',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/code-deploy-hook',
};

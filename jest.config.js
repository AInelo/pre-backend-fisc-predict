/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@emails/(.*)$': '<rootDir>/src/emails/$1',
    '^@templates/(.*)$': '<rootDir>/src/templates/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};



// /** @type {import('ts-jest').JestConfigWithTsJest} */
// export default {
//     preset: "ts-jest",
//     testEnvironment: "node",
//     roots: ["<rootDir>/src"],
//     transform: {
//       "^.+\\.ts?$": "ts-jest",
//     },
//     moduleFileExtensions: ["ts", "tsx", "js"],
//     testMatch: ["**/__tests__/**/*.test.ts"],
//   };
  
  
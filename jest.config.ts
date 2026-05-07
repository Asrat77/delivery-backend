import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          types: ["jest", "node"],
        },
      },
    ],
  },
  testMatch: ["**/*.spec.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  maxWorkers: 1,
};

export default config;


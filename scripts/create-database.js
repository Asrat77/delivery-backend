const { execSync } = require("child_process");

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL not set, skipping database creation");
  process.exit(0);
}

const match = url.match(
  /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/
);
if (!match) {
  console.log("Could not parse DATABASE_URL, skipping database creation");
  process.exit(0);
}

const [, user, password, host, port, dbName] = match;

function psql(db, query) {
  return execSync(
    `PGPASSWORD=${password} psql -h ${host} -p ${port} -U ${user} -d ${db} -t -c "${query}"`,
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
  );
}

try {
  psql("postgres", `SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
} catch {
  console.log(`Creating database: ${dbName}`);
  try {
    psql("postgres", `CREATE DATABASE "${dbName}"`);
  } catch (err) {
    console.error(`Failed to create database: ${err.message}`);
  }
}

process.exit(0);

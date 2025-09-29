#!/usr/bin/env node

/**
 * Production Database Migration Script
 * Handles database migrations and seeding for production deployment
 */

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  try {
    log(`${colors.blue}📋 ${description}...${colors.reset}`);
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`${colors.green}✅ ${description} completed${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} failed: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  log(`${colors.magenta}🚀 AI Reels Platform - Production Migration${colors.reset}`);
  log(`${colors.cyan}Starting database migration process...${colors.reset}`);

  // Validate environment
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log(`${colors.red}❌ Missing required environment variables: ${missingVars.join(', ')}${colors.reset}`);
    process.exit(1);
  }

  log(`${colors.green}✅ Environment variables validated${colors.reset}`);

  // Generate Prisma client
  if (!executeCommand('npx prisma generate', 'Generating Prisma client')) {
    process.exit(1);
  }

  // Deploy migrations
  if (!executeCommand('npx prisma migrate deploy', 'Deploying database migrations')) {
    process.exit(1);
  }

  // Check if we should seed the database
  const shouldSeed = process.env.SEED_DATABASE === 'true' || process.argv.includes('--seed');
  
  if (shouldSeed) {
    if (!executeCommand('npx tsx prisma/seed.ts', 'Seeding database with initial data')) {
      log(`${colors.yellow}⚠️ Database seeding failed, but migration was successful${colors.reset}`);
    }
  } else {
    log(`${colors.yellow}ℹ️ Skipping database seeding (set SEED_DATABASE=true to enable)${colors.reset}`);
  }

  // Verify database connection
  if (!executeCommand('npx prisma db pull --print', 'Verifying database connection')) {
    log(`${colors.yellow}⚠️ Database verification failed, but migration completed${colors.reset}`);
  }

  log(`${colors.green}🎉 Production migration completed successfully!${colors.reset}`);
  log(`${colors.cyan}📝 Next steps:${colors.reset}`);
  log(`   • Deploy your application to Vercel`);
  log(`   • Verify all environment variables are set in production`);
  log(`   • Test the deployed application functionality`);
}

// Handle process termination
process.on('SIGINT', () => {
  log(`${colors.yellow}⚠️ Migration process interrupted${colors.reset}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  log(`${colors.yellow}⚠️ Migration process terminated${colors.reset}`);
  process.exit(1);
});

// Run the migration
main().catch((error) => {
  log(`${colors.red}❌ Migration failed: ${error.message}${colors.reset}`);
  process.exit(1);
});
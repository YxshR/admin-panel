#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set for production deployment
 */

const requiredEnvVars = {
  DATABASE_URL: {
    description: 'PostgreSQL database connection string',
    example: 'postgresql://user:pass@host:port/db?sslmode=require',
    validate: (value) => {
      if (!value.startsWith('postgresql://')) {
        return 'Must be a valid PostgreSQL connection string';
      }
      if (!value.includes('sslmode=require')) {
        return 'Should include sslmode=require for production security';
      }
      return null;
    }
  },
  JWT_SECRET: {
    description: 'Secret key for JWT token signing',
    example: 'your-super-secure-jwt-secret-key-minimum-32-chars',
    validate: (value) => {
      if (value.length < 32) {
        return 'Must be at least 32 characters long for security';
      }
      return null;
    }
  },
  NEXTAUTH_SECRET: {
    description: 'NextAuth.js secret for session encryption',
    example: 'your-super-secure-nextauth-secret-minimum-32-chars',
    validate: (value) => {
      if (value.length < 32) {
        return 'Must be at least 32 characters long for security';
      }
      return null;
    }
  },
  NEXTAUTH_URL: {
    description: 'Your production domain URL',
    example: 'https://your-domain.vercel.app',
    validate: (value) => {
      if (!value.startsWith('https://')) {
        return 'Must use HTTPS in production';
      }
      try {
        new URL(value);
        return null;
      } catch {
        return 'Must be a valid URL';
      }
    }
  }
};

const optionalEnvVars = {
  NODE_ENV: {
    description: 'Node.js environment',
    default: 'production',
    example: 'production'
  },
  UPLOAD_DIR: {
    description: 'Directory for file uploads',
    default: '/tmp/uploads',
    example: '/tmp/uploads'
  },
  MAX_FILE_SIZE: {
    description: 'Maximum file upload size in bytes',
    default: '5242880',
    example: '5242880'
  },
  SEED_DATABASE: {
    description: 'Whether to seed database on deployment',
    default: 'false',
    example: 'true'
  }
};

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

function validateEnvironment() {
  log(`${colors.magenta}🔍 AI Reels Platform - Environment Validation${colors.reset}`);
  log(`${colors.cyan}Checking production environment variables...${colors.reset}\n`);

  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  log(`${colors.blue}📋 Required Environment Variables:${colors.reset}`);
  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];
    
    if (!value) {
      log(`${colors.red}❌ ${varName}: MISSING${colors.reset}`);
      log(`   Description: ${config.description}`);
      log(`   Example: ${config.example}\n`);
      hasErrors = true;
    } else {
      const validationError = config.validate ? config.validate(value) : null;
      if (validationError) {
        log(`${colors.red}❌ ${varName}: INVALID - ${validationError}${colors.reset}`);
        log(`   Current: ${value.substring(0, 20)}...`);
        log(`   Example: ${config.example}\n`);
        hasErrors = true;
      } else {
        log(`${colors.green}✅ ${varName}: OK${colors.reset}`);
      }
    }
  }

  // Check optional variables
  log(`\n${colors.blue}📋 Optional Environment Variables:${colors.reset}`);
  for (const [varName, config] of Object.entries(optionalEnvVars)) {
    const value = process.env[varName];
    
    if (!value) {
      log(`${colors.yellow}⚠️  ${varName}: Using default (${config.default})${colors.reset}`);
      log(`   Description: ${config.description}`);
      hasWarnings = true;
    } else {
      log(`${colors.green}✅ ${varName}: ${value}${colors.reset}`);
    }
  }

  // Summary
  log(`\n${colors.magenta}📊 Validation Summary:${colors.reset}`);
  
  if (hasErrors) {
    log(`${colors.red}❌ Validation failed! Please fix the errors above before deploying.${colors.reset}`);
    log(`\n${colors.cyan}💡 Quick setup guide:${colors.reset}`);
    log(`1. Copy .env.production to your environment`);
    log(`2. Replace placeholder values with your actual values`);
    log(`3. Ensure all secrets are at least 32 characters long`);
    log(`4. Use a secure PostgreSQL database with SSL`);
    return false;
  }

  if (hasWarnings) {
    log(`${colors.yellow}⚠️  Validation passed with warnings. Consider setting optional variables.${colors.reset}`);
  } else {
    log(`${colors.green}✅ All environment variables are properly configured!${colors.reset}`);
  }

  log(`\n${colors.cyan}🚀 Ready for production deployment!${colors.reset}`);
  return true;
}

// Additional security checks
function performSecurityChecks() {
  log(`\n${colors.blue}🔒 Security Checks:${colors.reset}`);
  
  const checks = [
    {
      name: 'NODE_ENV is production',
      check: () => process.env.NODE_ENV === 'production',
      fix: 'Set NODE_ENV=production'
    },
    {
      name: 'Database uses SSL',
      check: () => process.env.DATABASE_URL?.includes('sslmode=require'),
      fix: 'Add sslmode=require to DATABASE_URL'
    },
    {
      name: 'NEXTAUTH_URL uses HTTPS',
      check: () => process.env.NEXTAUTH_URL?.startsWith('https://'),
      fix: 'Use HTTPS URL for NEXTAUTH_URL'
    },
    {
      name: 'Strong JWT secret',
      check: () => (process.env.JWT_SECRET?.length || 0) >= 32,
      fix: 'Use a JWT_SECRET with at least 32 characters'
    },
    {
      name: 'Strong NextAuth secret',
      check: () => (process.env.NEXTAUTH_SECRET?.length || 0) >= 32,
      fix: 'Use a NEXTAUTH_SECRET with at least 32 characters'
    }
  ];

  let securityIssues = 0;
  
  for (const check of checks) {
    if (check.check()) {
      log(`${colors.green}✅ ${check.name}${colors.reset}`);
    } else {
      log(`${colors.red}❌ ${check.name}${colors.reset}`);
      log(`   Fix: ${check.fix}`);
      securityIssues++;
    }
  }

  if (securityIssues > 0) {
    log(`\n${colors.red}🚨 ${securityIssues} security issue(s) found! Please fix before deploying.${colors.reset}`);
    return false;
  }

  log(`\n${colors.green}🔒 All security checks passed!${colors.reset}`);
  return true;
}

// Main execution
function main() {
  const envValid = validateEnvironment();
  const securityValid = performSecurityChecks();
  
  if (envValid && securityValid) {
    log(`\n${colors.green}🎉 Environment is ready for production deployment!${colors.reset}`);
    process.exit(0);
  } else {
    log(`\n${colors.red}❌ Environment validation failed. Please fix the issues above.${colors.reset}`);
    process.exit(1);
  }
}

// Run validation
main();
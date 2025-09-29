#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function verifySetup() {
  console.log('🔍 Verifying Admin Panel Setup...\n')
  
  const prisma = new PrismaClient()
  
  try {
    // Test database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connected successfully')
    
    // Check if admin user exists
    console.log('\n2. Checking admin user...')
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    if (adminUser) {
      console.log('   ✅ Admin user found')
      console.log(`   📧 Email: ${adminUser.email}`)
      console.log(`   👤 Role: ${adminUser.role}`)
      console.log(`   🟢 Status: ${adminUser.status}`)
      
      // Test password
      const isPasswordValid = await bcrypt.compare('admin123', adminUser.password)
      if (isPasswordValid) {
        console.log('   ✅ Password is correct')
      } else {
        console.log('   ❌ Password verification failed')
      }
    } else {
      console.log('   ❌ Admin user not found')
      console.log('   💡 Run: npm run db:seed')
    }
    
    // Check categories
    console.log('\n3. Checking categories...')
    const categoryCount = await prisma.category.count()
    console.log(`   📁 Categories found: ${categoryCount}`)
    
    // Check images
    console.log('\n4. Checking images...')
    const imageCount = await prisma.image.count()
    console.log(`   🖼️  Images found: ${imageCount}`)
    
    // Check activity logs
    console.log('\n5. Checking activity logs...')
    const activityCount = await prisma.activityLog.count()
    console.log(`   📊 Activity logs: ${activityCount}`)
    
    console.log('\n🎉 Setup verification complete!')
    console.log('\n📋 Next steps:')
    console.log('   1. Run: npm run dev')
    console.log('   2. Visit: http://localhost:3000/admin/login')
    console.log('   3. Login with: admin@example.com / admin123')
    
  } catch (error) {
    console.error('❌ Setup verification failed:', error.message)
    console.log('\n🔧 Try running:')
    console.log('   npm run db:generate')
    console.log('   npm run db:push')
    console.log('   npm run db:seed')
  } finally {
    await prisma.$disconnect()
  }
}

verifySetup()
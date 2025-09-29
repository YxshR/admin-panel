import { PrismaClient, Role, Status } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create categories
  const webDesignCategory = await prisma.category.upsert({
    where: { name: 'Web Design' },
    update: {},
    create: {
      name: 'Web Design',
      description: 'Website design and UI/UX related images',
    },
  })

  const photographyCategory = await prisma.category.upsert({
    where: { name: 'Photography' },
    update: {},
    create: {
      name: 'Photography',
      description: 'Professional photography and portraits',
    },
  })

  const graphicsCategory = await prisma.category.upsert({
    where: { name: 'Graphics' },
    update: {},
    create: {
      name: 'Graphics',
      description: 'Graphic design and illustrations',
    },
  })

  console.log('✅ Created categories')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
      status: Status.ACTIVE,
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create editor user
  const editorPassword = await bcrypt.hash('editor123', 12)
  
  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: {
      email: 'editor@example.com',
      password: editorPassword,
      role: Role.EDITOR,
      status: Status.ACTIVE,
    },
  })

  console.log('✅ Created editor user:', editorUser.email)

  // Create sample images (placeholder data)
  const sampleImage1 = await prisma.image.upsert({
    where: { cloudinaryId: 'sample-image-1' },
    update: {},
    create: {
      title: 'Modern Website Design',
      description: 'A clean and modern website design showcase',
      tags: 'web,design,modern,ui',
      cloudinaryId: 'sample-image-1',
      thumbnailUrl: '/placeholder-slider-1.svg',
      originalUrl: '/placeholder-slider-1.svg',
      fileSize: 245760,
      categoryId: webDesignCategory.id,
      uploadedById: adminUser.id,
    },
  })

  const sampleImage2 = await prisma.image.upsert({
    where: { cloudinaryId: 'sample-image-2' },
    update: {},
    create: {
      title: 'Portrait Photography',
      description: 'Professional portrait photography session',
      tags: 'photography,portrait,professional',
      cloudinaryId: 'sample-image-2',
      thumbnailUrl: '/placeholder-slider-2.svg',
      originalUrl: '/placeholder-slider-2.svg',
      fileSize: 512000,
      categoryId: photographyCategory.id,
      uploadedById: editorUser.id,
    },
  })

  console.log('✅ Created sample images')

  // Create activity logs
  await prisma.activityLog.create({
    data: {
      action: 'IMAGE_UPLOADED',
      details: {
        imageTitle: sampleImage1.title,
        category: webDesignCategory.name,
      },
      userId: adminUser.id,
      imageId: sampleImage1.id,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: 'IMAGE_UPLOADED',
      details: {
        imageTitle: sampleImage2.title,
        category: photographyCategory.name,
      },
      userId: editorUser.id,
      imageId: sampleImage2.id,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: 'CATEGORY_CREATED',
      details: {
        categoryName: webDesignCategory.name,
      },
      userId: adminUser.id,
    },
  })

  console.log('✅ Created activity logs')

  console.log('🎉 Database seeded successfully!')
  console.log('Admin user: admin@example.com / admin123')
  console.log('Editor user: editor@example.com / editor123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
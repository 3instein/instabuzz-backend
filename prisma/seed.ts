import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create Users
  const user1 = await prisma.user.create({
    data: {
      username: 'user1',
      otpTime: new Date(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'user2',
      otpTime: new Date(),
    },
  });

  // Create Jobs
  const job1 = await prisma.job.create({
    data: {
      title: 'Job 1',
      caption: 'Caption for Job 1',
      startDate: new Date(),
      endDate: new Date(),
      keepDuration: 10,
      type: 'story',
      creator: {
        connect: { id: user1.id },
      },
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: 'Job 2',
      caption: 'Caption for Job 2',
      startDate: new Date(),
      endDate: new Date(),
      keepDuration: 5,
      type: 'post',
      creator: {
        connect: { id: user2.id },
      },
    },
  });

  // Create JobUsers
  await prisma.jobUser.create({
    data: {
      job: {
        connect: { id: job1.id },
      },
      user: {
        connect: { id: user1.id },
      },
    },
  });

  await prisma.jobUser.create({
    data: {
      job: {
        connect: { id: job2.id },
      },
      user: {
        connect: { id: user2.id },
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

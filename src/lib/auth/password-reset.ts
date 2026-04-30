import crypto from 'crypto';
import { prisma } from '@/lib/db';

const RESET_TOKEN_TTL_MINUTES = 60 * 24; // 24 hours

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createPasswordResetToken(userId: string) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)
    }
  });

  return rawToken;
}

export async function getValidPasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });
}

export async function markPasswordResetTokenAsUsed(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.updateMany({
    where: {
      tokenHash,
      usedAt: null
    },
    data: {
      usedAt: new Date()
    }
  });
}

export async function invalidateUserResetTokens(userId: string) {
  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null
    },
    data: {
      usedAt: new Date()
    }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { growthAutomation } from '@/lib/growth/automation';

/**
 * POST /api/growth/referrals/generate
 * Gera novo link de referência para um usuário
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    const referral = await growthAutomation.generateReferralLink(userId);

    return NextResponse.json({
      success: true,
      data: referral,
    });
  } catch (error: any) {
    console.error('Erro ao gerar link de referência:', error);
    return NextResponse.json(
      {
        error: 'Falha ao gerar referência',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/growth/referrals?ref=CODE
 * Rastreia conversão de referência
 */
export async function GET(request: NextRequest) {
  try {
    const referralCode = request.nextUrl.searchParams.get('ref');
    const email = request.nextUrl.searchParams.get('email');

    if (!referralCode || !email) {
      return NextResponse.json(
        { error: 'ref e email são obrigatórios' },
        { status: 400 }
      );
    }

    const conversion = await growthAutomation.trackReferralConversion(
      referralCode,
      email
    );

    return NextResponse.json({
      success: true,
      data: conversion,
      message: 'Referência registrada! Você receberá uma recompensa em 30 dias.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Falha ao rastrear referência',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

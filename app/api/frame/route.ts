import { NextResponse } from 'next/server';

const getFrameResponse = () => {
  return {
    type: "frame",
    version: "vNext",
    image: "https://find-celo.vercel.app/images/background.png",
    imageAspectRatio: "1.91:1",
    buttons: [
      {
        label: "1 CELO",
      },
      {
        label: "5 CELO",
      },
      {
        label: "10 CELO",
      }
    ],
    postUrl: "https://find-celo.vercel.app/api/frame"
  };
};

export async function POST() {
  return NextResponse.json(getFrameResponse());
}

export async function GET() {
  return NextResponse.json(getFrameResponse());
}

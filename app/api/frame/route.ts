import { NextResponse } from 'next/server';

const getFrameResponse = () => {
  return {
    type: "frame",
    version: "vNext",
    image: "https://find-celo.vercel.app/images/background.png",
    imageAspectRatio: "1.91:1",
    buttons: [
      {
        label: "Play Now",
        action: "link",
        target: "https://find-celo.vercel.app"
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

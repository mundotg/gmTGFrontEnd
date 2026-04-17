// app/api/user/route.ts
import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis();

export async function GET() {
    const cached = await redis.get("user:1");

    if (cached) {
        return NextResponse.json({ source: "cache", data: cached });
    }

    const data = "Francemy";

    await redis.set("user:1", data, "EX", 60);

    return NextResponse.json({ source: "db", data });
}
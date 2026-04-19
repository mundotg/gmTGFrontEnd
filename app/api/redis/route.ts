import { NextResponse } from "next/server";
import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis() {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL || "redis://redis:6379", {
            maxRetriesPerRequest: 2,
            enableReadyCheck: true,
            lazyConnect: true,
        });
    }

    return redis;
}

export async function GET() {
    try {
        const client = getRedis();

        await client.connect().catch(() => {
            // ignora se já estiver conectado
        });

        const cached = await client.get("user:1");

        if (cached) {
            return NextResponse.json({
                source: "cache",
                data: cached,
            });
        }

        // simulação de DB
        const data = "Francemy";

        await client.set(
            "user:1",
            data,
            "EX",
            60
        );

        return NextResponse.json({
            source: "db",
            data
        });

    } catch (error) {
        console.error("Redis error:", error);

        return NextResponse.json(
            {
                error: "Redis unavailable"
            },
            {
                status: 500
            }
        );
    }
}
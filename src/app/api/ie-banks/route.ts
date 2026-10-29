import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bank = searchParams.get("bank");

  if (!bank) {
    return NextResponse.json({ error: "Bank parameter is required" }, { status: 400 });
  }

  const banksDir = path.join(process.cwd(), "public", "ie-banks", bank);

  if (!fs.existsSync(banksDir)) {
    return NextResponse.json({ files: [] });
  }

  try {
    const files = fs
      .readdirSync(banksDir)
      .filter(f => f.endsWith(".html"))
      .sort((a, b) => {
         const numA = parseInt(a);
         const numB = parseInt(b);
         if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
         return a.localeCompare(b);
      });

    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

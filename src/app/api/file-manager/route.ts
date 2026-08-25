import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const entries = await readdir(uploadDir);

    const files = await Promise.all(
      entries
        .filter((name) => name !== ".gitkeep")
        .map(async (name) => {
          const filePath = path.join(uploadDir, name);
          const fileStat = await stat(filePath);

          // Extract original name from timestamped name (timestamp_originalname.ext)
          const underscoreIndex = name.indexOf("_");
          const originalName =
            underscoreIndex !== -1 ? name.slice(underscoreIndex + 1) : name;

          return {
            name,
            originalName,
            size: fileStat.size,
            createdAt: fileStat.birthtime.toISOString(),
            url: `/uploads/${name}`,
          };
        })
    );

    // Sort by newest first
    files.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return Response.json({ files });
  } catch (error) {
    console.error("List files error:", error);
    return Response.json({ files: [] });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return Response.json(
        { error: "Thiếu tên file" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, fileName);

    // Security: ensure the resolved path is within uploadDir
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(uploadDir))) {
      return Response.json({ error: "Đường dẫn không hợp lệ" }, { status: 400 });
    }

    await unlink(filePath);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return Response.json({ error: "Lỗi khi xóa file" }, { status: 500 });
  }
}

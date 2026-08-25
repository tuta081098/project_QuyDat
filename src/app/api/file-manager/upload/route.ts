import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "Không có file nào được chọn" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.name;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const uniqueName = `${timestamp}_${baseName}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    return Response.json({
      success: true,
      file: {
        name: uniqueName,
        originalName: originalName,
        size: file.size,
        url: `/uploads/${uniqueName}`,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Lỗi khi upload file" }, { status: 500 });
  }
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Bắt đầu dọn dẹp dữ liệu cũ...')
  // Xóa dữ liệu cũ để tránh trùng lặp khi chạy script nhiều lần
  await prisma.projectState.deleteMany()
  await prisma.project.deleteMany()

  console.log('Đang insert dữ liệu demo...')

  // Insert Dự án 1 (Có 2 trạng thái)
  await prisma.project.create({
    data: {
      name: "Dự án Khu đô thị ven sông",
      code: "DA-001",
      totalLots: 150,
      chuaBanHanhCount: 30,
      chuaKiemKeCount: 50,
      xacNhanCount: 20,
      duThaoCount: 20,
      thamDinhCount: 15,
      pheDuyetCount: 15,
      projectStates: {
        create: [
          { name: "Đang GPMB", color: "#ef4444" },
          { name: "Chờ phê duyệt", color: "#f59e0b" }
        ]
      }
    }
  })

  // Insert Dự án 2 (Chưa ban hành toàn bộ)
  await prisma.project.create({
    data: {
      name: "Quỹ đất dọc Tỉnh lộ 10",
      code: "DA-002",
      totalLots: 80,
      chuaBanHanhCount: 80,
      chuaKiemKeCount: 0,
      xacNhanCount: 0,
      duThaoCount: 0,
      thamDinhCount: 0,
      pheDuyetCount: 0,
      projectStates: {
        create: [
          { name: "Vướng pháp lý", color: "#64748b" }
        ]
      }
    }
  })

  console.log('✅ Đã insert dữ liệu demo thành công!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
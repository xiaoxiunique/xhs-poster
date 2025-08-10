import { db } from "../db"

export async function ensureKvTable() {
  try {
    // 检查 kv 表是否存在
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'kv'
      );
    `)

    if (!tableExists[0].exists) {
      console.log("创建 kv 表...")
      
      // 创建 kv 表
      await db.query(`
        CREATE TABLE kv (
          key TEXT PRIMARY KEY,
          data JSONB NOT NULL
        );
      `)
      
      console.log("kv 表创建成功")
    } else {
      console.log("kv 表已存在")
    }
  } catch (error) {
    console.error("确保 kv 表存在时出错:", error)
    throw error
  }
}

// 如果直接运行此文件
if (require.main === module) {
  ensureKvTable()
    .then(() => {
      console.log("迁移完成")
      process.exit(0)
    })
    .catch((error) => {
      console.error("迁移失败:", error)
      process.exit(1)
    })
} 
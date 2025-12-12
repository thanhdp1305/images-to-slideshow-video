import { rename } from 'fs/promises';

async function renameDist() {
  try {
    await rename('dist', 'docs');
    console.log('✅ Thư mục dist đã được đổi tên thành docs');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
}

renameDist();

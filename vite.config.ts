import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 載入環境變數，這允許我們在 Vercel 或 .env 檔案中設定 API_KEY
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // 將 process.env.API_KEY 替換為實際的字串值，讓 SDK 能在瀏覽器運作
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import z from 'zod';

// kiểm ra xem có file env hay chưa
if (!fs.existsSync(path.resolve('.env'))) {
  console.log('Không thể tìm thấy file .env');
  process.exit(0);
}

const ConfigSchema = z.object({
  DATABASE_URL: z.string(),
  SECRET_API_KEY: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  ADMIN_NAME: z.string(),
  ADMIN_PASSWORD: z.string(),
  ADMIN_EMAIL: z.string(),
  ADMIN_PHONENUMBER: z.string(),
  OTP_EXPIRES_IN: z.string(),
  RESEND_API_KEY: z.string(),
});

const configServer = ConfigSchema.safeParse(process.env);

if (!configServer.success) {
  console.log('Giá trị khai báo trong file env không hợp lệ');
  process.exit(0);
}

const envConfig = configServer.data;
export default envConfig;

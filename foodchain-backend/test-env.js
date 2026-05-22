require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
    PRIVATE_KEY: z.string().startsWith('0x'),
    RPC_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    DATABASE_URL: z.string().url(),
    CONTRACT_USER_REGISTRY: z.string(),
    CONTRACT_STORE_REGISTRY: z.string(),
    CONTRACT_DONATION_ESCROW: z.string(),
    CONTRACT_DISPUTE_RESOLUTION: z.string(),
    PINATA_API_KEY: z.string(),
    PINATA_SECRET_KEY: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Validasi gagal:');
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
} else {
    console.log('Validasi berhasil!');
    console.log('PRIVATE_KEY:', parsed.data.PRIVATE_KEY.substring(0, 10) + '...');
}

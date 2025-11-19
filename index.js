const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const cron = require('node-cron');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'scf-bot',
        dataPath: path.join(__dirname, 'session')
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--no-first-run',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.initialize();

client.on('qr', qr => {
    console.log("📌 Scansiona questo QR per collegare WhatsApp:");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log("🔥 Bot pronto e WhatsApp collegato!");
    console.log("👤 Account collegato:", client.info.wid._serialized);

    // INVIO AUTOMATICO ogni giorno alle 16:00
    cron.schedule(
        '0 16 * * *',
        () => {
            console.log("⏰ Sono le 16:00, invio messaggio al gruppo SCF Luxury...");
            sendMessageToGroup('SCF Luxury', 'Assegnazioni: tutto allineato?');
        },
        { timezone: 'Europe/Rome' }
    );
});

async function sendMessageToGroup(groupName, message) {
    try {
        const chats = await client.getChats();
        const group = chats.find(
            c => c.isGroup && (
                c.name.toLowerCase() === groupName.toLowerCase() ||
                c.name.toLowerCase().includes(groupName.toLowerCase())
            )
        );

        if (!group) {
            console.log("❌ Gruppo non trovato:", groupName);
            return;
        }

        await client.sendMessage(group.id._serialized, message);
        console.log("📨 Messaggio inviato al gruppo:", groupName);

    } catch (err) {
        console.error("🚨 ERRORE durante l'invio:", err);
    }
}

process.on('unhandledRejection', reason => {
    console.error("🚨 Errore non gestito:", reason);
});

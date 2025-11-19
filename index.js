const { Client, LocalAuth, Buttons } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const cron = require('node-cron');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'scf-bot',
        dataPath: path.join(__dirname, 'session')
    }),
    puppeteer: {
    executablePath: '/usr/bin/google-chrome', // usa Chrome preinstallato nel server
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--no-zygote',
        '--single-process'
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

    // ⏰ SCHEDULAZIONE AUTOMATICA - tutti i giorni alle 16:00
    cron.schedule(
        '0 16 * * *',
        () => {
            console.log("⏰ Sono le 16:00, invio messaggio con pulsanti al gruppo SCF Luxury...");
            sendPollButtons('SCF Luxury');
        },
        {
            timezone: 'Europe/Rome'
        }
    );
});

// INVIA PULSANTI AL GRUPPO
async function sendPollButtons(groupName) {
    try {
        console.log("🔍 Cerco il gruppo:", groupName);
        const chats = await client.getChats();
        const groups = chats.filter(c => c.isGroup);

        const group = groups.find(g =>
            g.name.toLowerCase() === groupName.toLowerCase() ||
            g.name.toLowerCase().includes(groupName.toLowerCase())
        );

        if (!group) {
            console.log("❌ Gruppo non trovato:", groupName);
            return;
        }

        const buttons = new Buttons(
            "Verifica assegnazioni:\nDrivers e Brokers informati?",
            [{ body: "Sì" }, { body: "No" }],
            "",
            ""
        );

        const res = await client.sendMessage(group.id._serialized, buttons);
        console.log("📨 Pulsanti inviati! ID:", res.id.id);

    } catch (err) {
        console.error("🚨 ERRORE invio pulsanti:", err);
    }
}

process.on('unhandledRejection', (reason) => {
    console.error("🚨 Errore non gestito:", reason);
});

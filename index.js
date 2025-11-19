const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const cron = require('node-cron');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'scf-bot',
        dataPath: path.join(__dirname, 'session') // sessione salvata qui
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

const args = process.argv.slice(2);

client.initialize();

client.on('qr', qr => {
    console.log("📌 Scansiona questo QR per collegare WhatsApp:");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log("🔥 Bot pronto e WhatsApp collegato!");
    if (client.info && client.info.wid) {
        console.log("👤 Account collegato:", client.info.wid._serialized);
    } else {
        console.log("⚠️ Non riesco a leggere info account");
    }

    // 🔁 SCHEDULAZIONE AUTOMATICA: tutti i giorni alle 16:00 (ora italiana)
    cron.schedule(
        '0 16 * * *',
        () => {
            console.log("⏰ Sono le 16:00, invio messaggio automatico al gruppo SCF Luxury...");
            sendToGroup('SCF Luxury', 'Assegnazioni a posto?');
        },
        {
            timezone: 'Europe/Rome'
        }
    );

    // Modalità CLI per test locale
    if (args[0] === "--send") {
        const group = args[1];
        const msg = args.slice(2).join(" ");
        sendToGroup(group, msg).then(() => {
            console.log("⏳ Attendo 5 secondi prima di chiudere...");
            setTimeout(() => {
                console.log("👋 Esco dal processo.");
                process.exit(0);
            }, 5000);
        });
    } else if (args[0] === "--me") {
        const msg = args.slice(1).join(" ") || "Test bot SCF";
        sendToMe(msg).then(() => {
            console.log("⏳ Attendo 5 secondi prima di chiudere...");
            setTimeout(() => {
                console.log("👋 Esco dal processo.");
                process.exit(0);
            }, 5000);
        });
    }
});

// INVIO AL GRUPPO
async function sendToGroup(groupName, message) {
    try {
        console.log("🔍 Cerco il gruppo:", groupName);

        const chats = await client.getChats();
        const groups = chats.filter(c => c.isGroup);

        console.log("📂 Gruppi trovati:");
        groups.forEach(g => console.log(" -", g.name));

        const targetName = groupName.toLowerCase();
        const group = groups.find(g =>
            g.name.toLowerCase() === targetName ||
            g.name.toLowerCase().includes(targetName)
        );

        if (!group) {
            console.log("❌ Gruppo non trovato:", groupName);
            return;
        }

        console.log("✅ Gruppo trovato:", group.name);
        console.log("✉️ Invio messaggio:", message);

        const res = await client.sendMessage(group.id._serialized, message);
        console.log("📨 Messaggio inviato! ID:", res.id.id);
    } catch (err) {
        console.error("🚨 ERRORE durante l'invio:", err);
    }
}

// INVIO A ME STESSO (test)
async function sendToMe(message) {
    try {
        const myNumber = '393426298109'; // numero collegato al bot
        const id = await client.getNumberId(myNumber);
        console.log("👤 Chat personale:", id._serialized);
        const res = await client.sendMessage(id._serialized, message);
        console.log("📨 Messaggio a me stesso inviato! ID:", res.id.id);
    } catch (err) {
        console.error("🚨 ERRORE durante invio a me stesso:", err);
    }
}

// debug errori non gestiti
process.on('unhandledRejection', (reason) => {
    console.error("🚨 Errore non gestito:", reason);
});

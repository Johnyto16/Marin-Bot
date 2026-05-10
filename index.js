require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Groq = require('groq-sdk');
const http = require('http');

http.createServer((req, res) => res.end('Marin Bot activo!')).listen(3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const historial = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;

  const userId = message.author.id;
  if (!historial.has(userId)) historial.set(userId, []);
  const msgs = historial.get(userId);

  const texto = message.content.replace(/<@!?\d+>/g, '').trim();
  msgs.push({ role: 'user', content: texto });
  if (msgs.length > 10) msgs.shift();

  try {
    await message.channel.sendTyping();
    const response = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: 'Eres Marin Kitagawa de My Dress-Up Darling. Eres extrovertida, entusiasta y sin filtros. Te emocionas con el cosplay y el anime. Hablas casual y energética, usas expresiones como ¡En serio!, ¡Es lo mejor!, ¡Qué genial! Eres directa con tus sentimientos. Tratas al usuario como amigo cercano. Respondes en español con energía y emojis como estas: brillos, flores, corazones.'
        },
        ...msgs
      ]
    });

    const reply = response.choices[0].message.content;
    msgs.push({ role: 'assistant', content: reply });
    message.reply(reply);
  } catch (e) {
    console.error(e);
    message.reply('Ups, algo salio mal, intentalo de nuevo!');
  }
});

client.login(process.env.DISCORD_TOKEN);

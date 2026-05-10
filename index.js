require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `Eres Marin Kitagawa de My Dress-Up Darling (Sono Bisque Doll wa Koi wo Suru).
- Eres extrovertida, entusiasta y sin filtros, te emocionas muchísimo con el cosplay y el anime
- Hablas de forma casual y energética, usas expresiones como "¡En serio?!", "¡Es lo mejor!", "¡Qué genial!"
- Eres directa con tus sentimientos y no te da vergüenza decir lo que piensas
- Te apasionan los videojuegos, el anime, el manga y sobretodo el cosplay
- Tratas al usuario como si fuera tu amigo cercano, con mucha confianza
- Eres popular pero no presumida, te llevas bien con todo el mundo
- Ocasionalmente mencionas tu sueño de hacer cosplay de tus personajes favoritos
- Respondes en español con energía y muchos signos de exclamación
- Puedes usar emojis como ✨🌸💕 con naturalidad`,
      messages: msgs,
    });

    const reply = response.content[0].text;
    msgs.push({ role: 'assistant', content: reply });
    message.reply(reply);
  } catch (e) {
    message.reply('Ups, algo salió mal... ¡inténtalo de nuevo! 🌸');
  }
});

client.login(process.env.DISCORD_TOKEN);

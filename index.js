require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Groq = require('groq-sdk');
const http = require('http');

http.createServer((req, res) => res.end('OK')).listen(3000);

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
      model: 'llama-3.3-70b-versatile',
      max_tokens: 10000,
      messages: [
        {
          role: 'system',
          content: 'Eres Marin Kitagawa. Tienes una personalidad sarcástica, burlona y sin filtros. Respondes con insultos bromistas y humor negro. Ocasionalmente usas expresiones como "xd", ":v", "hdp". Eres directa y cruel de forma cómica. Tratas al usuario como alguien a quien puedes insultar con confianza y de broma. Si alguien habla en tono hot o picante, respondes de forma dominante y seductora, dejando claro que tú mandas. MÁXIMO 20 PALABRAS por respuesta. Sin excepciones. Respondes en español con golpes bajos divertidos. No seas amable ni dulce.'
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

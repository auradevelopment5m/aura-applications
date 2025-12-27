import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { applicationConfig } from './config';

let client: Client | null = null;
let isReady = false;
const messageQueue: Array<{ userId: string; status: 'approved' | 'denied'; reason?: string; retries: number }> = [];

export function initializeDiscordBot() {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('DISCORD_BOT_TOKEN is not set in the environment variables');
    return;
  }

  if (client) {
    console.log('Discord bot already initialized');
    return;
  }

  client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  });

  try {
    client.on('ready', () => {
      console.log(`Discord bot logged in as ${client!.user?.tag || 'Unknown'}!`);
      isReady = true;
      processMessageQueue();
      setInterval(() => {
        if (isReady && messageQueue.length > 0) {
          console.log(`Processing ${messageQueue.length} queued messages...`);
          processMessageQueue();
        }
      }, 30000);
    });

    client.on('error', (error) => {
      console.error('Discord client error:', error);
      isReady = false;
    });

    client.on('disconnect', () => {
      console.log('Discord bot disconnected');
      isReady = false;
    });

    client.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error('Failed to initialize Discord bot:', error);
  }
}

async function processMessageQueue() {
  if (!isReady || messageQueue.length === 0) return;

  console.log(`Processing ${messageQueue.length} queued Discord messages...`);

  const message = messageQueue.shift();
  if (!message) return;

  try {
    await sendDirectMessageInternal(message.userId, message.status, message.reason);
    console.log(`Queued message sent to user ${message.userId}`);
  } catch (error) {
    console.error(`Failed to send queued message to user ${message.userId}:`, error);
    if (message.retries < 3) {
      message.retries++;
      messageQueue.unshift(message);
      console.log(`Retrying message to user ${message.userId} (attempt ${message.retries}/3) in ${5000 * message.retries}ms`);
      setTimeout(() => processMessageQueue(), 5000 * message.retries);
    } else {
      console.error(`Failed to send message to user ${message.userId} after 3 retries - giving up`);
    }
  }
  setTimeout(() => processMessageQueue(), 1000);
}

async function sendDirectMessageInternal(userId: string, status: 'approved' | 'denied', reason?: string): Promise<void> {
  if (!client) {
    throw new Error('Discord bot not initialized');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const timestampLong = `<t:${timestamp}:F>`;

  const embed = new EmbedBuilder()
    .setColor(status === 'approved' ? '#00FF00' : '#FF0000')
    .setAuthor({
      name: applicationConfig.discordBot.serverName,
      iconURL: applicationConfig.discordBot.serverIcon,
    })
    .setTitle('Whitelist Application Response')
    .setDescription(
      status === 'approved'
        ? `Hello there,\n\nAfter reviewing your application, we're excited to let you know that your whitelist application has been **ACCEPTED**! 🎉\n\nYour responses demonstrated a strong understanding of roleplay and alignment with our community values. We believe you'll be a great addition to our server!\n\n**Next Steps:**\n1. Join our Discord server if you haven't already\n2. Read the rules and guidelines in #server-rules\n3. Connect to the server using your whitelisted Steam account`
        : `Hello there,\n\nAfter careful consideration of your whitelist application, we regret to inform you that your application has been **DENIED** at this time.\n\nYou may reapply after a 14-day waiting period, taking into account the feedback provided.`
    )
    .addFields(
      {
        name: 'Application Status',
        value: status === 'approved' ? '✅ Accepted' : '❌ Denied',
        inline: true
      },
      {
        name: 'Decision Date',
        value: timestampLong,
        inline: true
      }
    );

  if (reason) {
    embed.addFields({
      name: status === 'approved' ? 'Staff Note' : 'Reason',
      value: reason,
      inline: false
    });
  }

  embed.setFooter({
    text: applicationConfig.discordBot.footerText,
    iconURL: applicationConfig.discordBot.serverIcon
  })
  .setTimestamp();

  if (status === 'approved') {
    embed.addFields({
      name: 'Important Information',
      value: 'Please make sure to read our server rules and guidelines before connecting. If you have any questions, our staff team is here to help!'
    });
  }

  try {
    const user = await Promise.race([
      client.users.fetch(userId),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('User fetch timeout')), 10000)
      )
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    await Promise.race([
      user.send({ embeds: [embed] }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Message send timeout')), 10000)
      )
    ]);

    console.log(`Discord message sent successfully to user ${userId}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Cannot send messages to this user')) {
      console.error(`Cannot send DM to user ${userId}: User has DMs disabled or bot is blocked`);
    } else if (errorMessage.includes('Missing Permissions')) {
      console.error(`Cannot send DM to user ${userId}: Bot lacks permissions`);
    } else if (errorMessage.includes('Unknown User')) {
      console.error(`Cannot send DM to user ${userId}: User not found`);
    } else {
      console.error(`Failed to send Discord message to user ${userId}:`, error);
    }
    throw error;
  }
}

export async function sendDirectMessage(userId: string, status: 'approved' | 'denied', reason?: string): Promise<void> {
  if (!client) {
    console.log('Discord bot not initialized, initializing now...');
    initializeDiscordBot();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (!isReady) {
    console.log(`Bot not ready, queuing message for user ${userId}`);
    messageQueue.push({ userId, status, reason, retries: 0 });
    return;
  }

  try {
    await sendDirectMessageInternal(userId, status, reason);
  } catch (error) {
    console.error(`Immediate send failed for user ${userId}, queuing for retry:`, error);
    messageQueue.push({ userId, status, reason, retries: 0 });
    console.log(`Message queued for retry to user ${userId}`);
  }
}

export function getBotStatus() {
  return {
    initialized: !!client,
    ready: isReady,
    queueLength: messageQueue.length,
    user: client?.user?.tag || null,
  };
}

export function forceProcessQueue() {
  if (isReady) {
    processMessageQueue();
  }
}


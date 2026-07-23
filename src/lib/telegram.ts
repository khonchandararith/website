// Telegram Bot API utility for sending notifications
const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('[Telegram] Bot token or chat ID not configured, skipping notification');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('[Telegram] Failed to send message:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Error sending message:', error);
    return false;
  }
}

export async function notifyAdminNewSale(order: {
  id: string;
  total_usd: number;
  customer_email?: string | null;
  customer_name?: string | null;
  items?: { product_title: string; key_code: string }[];
}): Promise<void> {
  const itemsList = order.items
    ?.map((item) => `  • ${item.product_title}`)
    .join('\n') || '  • (no items)';

  const message = `
🎉 <b>New Sale — RITH STORE LICENCE</b>

💰 <b>Amount:</b> $${order.total_usd.toFixed(2)} USD
👤 <b>Customer:</b> ${order.customer_name || 'Guest'}
📧 <b>Email:</b> ${order.customer_email || 'N/A'}
🆔 <b>Order ID:</b> <code>${order.id}</code>

📦 <b>Items:</b>
${itemsList}

✅ Payment confirmed via KHQR
`.trim();

  await sendTelegramMessage(message);
}

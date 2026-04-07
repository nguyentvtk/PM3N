// Using global fetch available in Next.js environment

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface NotificationData {
  id: string;
  projectName: string;
  documentName: string;
  priority: 'Gấp' | 'Thường';
  status: string;
  timestamp: string;
}

export async function sendTelegramNotification(data: NotificationData) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram Bot Token or Chat ID not configured.');
    return;
  }

  const priorityIcon = data.priority === 'Gấp' ? '🔴 <b>GẤP</b>' : '🟡 THƯỜNG';
  const timestamp = new Date(data.timestamp).toLocaleString('vi-VN');

  /* 
  const message = `...` 
  */

  // Telegram HTML format doesn't support <span style="color: blue">. 
  // We'll use <b> or <i> or <code> or <a> links.
  // Replacing span with <b> for the project name as per common bot best practices.
  
  const finalMessage = `
🚀 <b>HỒ SƠ MỚI / THAY ĐỔI TRẠNG THÁI</b>

<b>Mã số hồ sơ:</b> <code>${data.id}</code>
<b>Dự án:</b> <b>${data.projectName}</b>
<b>Tài liệu:</b> ${data.documentName}
<b>Mức độ:</b> ${priorityIcon}
<b>Trạng thái:</b> <i>${data.status}</i>
<b>Thời gian:</b> ${timestamp}
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: finalMessage,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send Telegram notification:', errorData);
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

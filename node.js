// ...existing code...
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: +(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // timeouts úteis para evitar hangs longos
  connectionTimeout: 30_000,
  greetingTimeout: 10_000,
  socketTimeout: 30_000
});

// verifica conexão SMTP ao iniciar
transporter.verify().then(() => {
  console.log('SMTP conectado e pronto para envio');
}).catch(err => {
  console.error('Falha ao verificar SMTP:', err && err.message ? err.message : err);
});

const FAILED_QUEUE = path.join(__dirname, 'failed-emails.json');

function saveFailedEmail(obj) {
  let arr = [];
  try {
    if (fs.existsSync(FAILED_QUEUE)) arr = JSON.parse(fs.readFileSync(FAILED_QUEUE, 'utf8') || '[]');
  } catch (e) { console.error('Erro ao ler fila de falhas:', e); }
  arr.push({ ...obj, date: new Date().toISOString() });
  try { fs.writeFileSync(FAILED_QUEUE, JSON.stringify(arr, null, 2)); } catch (e) { console.error('Erro ao salvar fila de falhas:', e); }
}

// retry simples com backoff exponencial
async function sendMailWithRetry(mailOptions, attempts = 3) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      await transporter.sendMail(mailOptions);
      return { ok: true };
    } catch (err) {
      lastErr = err;
      const wait = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.error(`Envio falhou (tentativa ${i+1}/${attempts}):`, err && err.message ? err.message : err);
      await new Promise(r => setTimeout(r, wait));
      // opcional: re-verify before next attempt
      try { await transporter.verify(); } catch (vErr) { console.error('verify falhou:', vErr && vErr.message ? vErr.message : vErr); }
    }
  }
  // após tentativas falhadas, salva para reenvio posterior
  saveFailedEmail({ mailOptions, error: (lastErr && lastErr.message) || String(lastErr) });
  return { ok: false, error: lastErr };
}

app.post('/api/agendamentos', async (req, res) => {
  const { nome, email, data, hora, servico } = req.body;
  if (!nome || !email || !data || !hora) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  const html = `
    <h2>Confirmação de Agendamento</h2>
    <p>Olá <strong>${nome}</strong>,</p>
    <p>Seu agendamento para <strong>${servico || 'serviço'}</strong> foi marcado em <strong>${data}</strong> às <strong>${hora}</strong>.</p>
    <p>Obrigado por escolher nossa equipe.</p>
  `;

  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: email,
    subject: 'Confirmação de agendamento - C&C Beauty',
    text: `Olá ${nome}, seu agendamento em ${data} às ${hora} foi confirmado.`,
    html
  };

  try {
    const result = await sendMailWithRetry(mailOptions, 3);
    if (result.ok) {
      return res.json({ ok: true, message: 'Email enviado' });
    } else {
      return res.status(500).json({ error: 'Falha ao enviar email; será reenviado automaticamente mais tarde.' });
    }
  } catch (err) {
    console.error('Erro inesperado no envio:', err);
    return res.status(500).json({ error: 'Erro interno ao tentar enviar email' });
  }
});

// opcional: rota para tentar reenviar fila de falhas manualmente
app.post('/admin/retry-failed', async (req, res) => {
  try {
    if (!fs.existsSync(FAILED_QUEUE)) return res.json({ ok: true, retried: 0 });
    const arr = JSON.parse(fs.readFileSync(FAILED_QUEUE, 'utf8') || '[]');
    const results = [];
    for (const item of arr) {
      const r = await sendMailWithRetry(item.mailOptions, 3);
      results.push({ id: item.date, ok: r.ok });
    }
    // limpar arquivo se tudo ok
    fs.unlinkSync(FAILED_QUEUE);
    return res.json({ ok: true, results });
  } catch (e) {
    console.error('Erro ao reenviar fila de falhas:', e);
    return res.status(500).json({ error: 'Falha ao reenviar fila' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
// ...existing code...
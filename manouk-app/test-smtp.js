const nodemailer = require('nodemailer');

async function test() {
  const smtp = {
    host: 'smtp.gmail.com',
    port: 465, // ou 587
    secure: true, // false si port 587
    auth: { user: 'lordbibo@gmail.com', pass: 'awgw getw nowu isdm' }
  };

  const transporter = nodemailer.createTransport(smtp);

  try {
    await transporter.verify();
    console.log('Connexion OK');
    const info = await transporter.sendMail({
      from: smtp.auth.user,
      to: 'destinataire@exemple.com',
      subject: 'Test SMTP Manouk',
      text: 'Ceci est un test'
    });
    console.log('Envoi OK', info.messageId);
  } catch (err) {
    console.error('Erreur SMTP:', err.message);
  }
}

test();
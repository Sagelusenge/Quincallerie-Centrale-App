import nodemailer from 'nodemailer';

const getTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

export const isMailReady = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

export const sendMail = async ({ to, subject, text, html, replyTo, fromName }) => {
    const transporter = getTransporter();

    if (!transporter) {
        return { skipped: true, message: 'Configuration email absente' };
    }

    const info = await transporter.sendMail({
        from: `"${fromName || 'CRM PME'}" <${process.env.EMAIL_USER}>`,
        ...(replyTo ? { replyTo } : {}),
        to,
        subject,
        text,
        html
    });

    return { skipped: false, messageId: info.messageId };
};

export const sendWelcomeUserEmail = async ({ to, name, role, password, company }) => {
    if (!to) return { skipped: true, message: 'Destinataire absent' };

    const subject = `Bienvenue sur CRM PME${company ? ` - ${company}` : ''}`;
    const text = [
        `Bonjour ${name || ''},`,
        '',
        `Votre compte CRM PME est pret.`,
        `Role: ${role || 'utilisateur'}`,
        password ? `Mot de passe temporaire: ${password}` : '',
        '',
        'Connectez-vous depuis votre espace CRM PME.'
    ].filter(Boolean).join('\n');

    const html = `
        <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
            <h2>Bienvenue sur CRM PME</h2>
            <p>Bonjour ${name || ''}, votre compte est pret.</p>
            <p><strong>Role:</strong> ${role || 'utilisateur'}</p>
            ${password ? `<p><strong>Mot de passe temporaire:</strong> ${password}</p>` : ''}
            <p>Connectez-vous depuis votre espace CRM PME.</p>
        </div>
    `;

    return sendMail({ to, subject, text, html });
};

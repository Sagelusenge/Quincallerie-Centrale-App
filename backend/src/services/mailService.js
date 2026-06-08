import nodemailer from 'nodemailer';
import pool from '../config/db.js';

let cachedMailConfig = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

const getEnvMailConfig = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

    return {
        service: 'gmail',
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        fromName: 'CRM PME'
    };
};

const getMailConfig = async () => {
    const now = Date.now();
    if (cachedMailConfig && now - cachedAt < CACHE_TTL_MS) {
        return cachedMailConfig;
    }

    try {
        const [rows] = await pool.query(
            `SELECT service, email_user, email_pass, from_name
             FROM mail_settings
             WHERE actif = TRUE
             ORDER BY id_setting ASC
             LIMIT 1`
        );

        if (rows.length > 0) {
            cachedMailConfig = {
                service: rows[0].service || 'gmail',
                user: rows[0].email_user,
                pass: rows[0].email_pass,
                fromName: rows[0].from_name || 'CRM PME'
            };
            cachedAt = now;
            return cachedMailConfig;
        }
    } catch (error) {
        cachedMailConfig = null;
    }

    cachedMailConfig = getEnvMailConfig();
    cachedAt = now;
    return cachedMailConfig;
};

const getTransporter = async () => {
    const config = await getMailConfig();

    if (!config?.user || !config?.pass) {
        return null;
    }

    const transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
            user: config.user,
            pass: config.pass
        }
    });

    return { transporter, config };
};

export const isMailReady = async () => {
    const config = await getMailConfig();
    return Boolean(config?.user && config?.pass);
};

export const getMailSender = async () => {
    const config = await getMailConfig();
    return config?.user || null;
};

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const sendMail = async ({ to, subject, text, html, replyTo, fromName }) => {
    const mail = await getTransporter();

    if (!mail) {
        return { skipped: true, message: 'Configuration email absente' };
    }

    const info = await mail.transporter.sendMail({
        from: `"${fromName || mail.config.fromName || 'CRM PME'}" <${mail.config.user}>`,
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

    const displayName = name || 'cher utilisateur';
    const displayRole = role || 'utilisateur';
    const displayCompany = company || 'votre entreprise';
    const subject = `Vos acces CRM PME${company ? ` - ${company}` : ''}`;
    const text = [
        `Bonjour ${displayName},`,
        '',
        `Votre compte CRM PME pour ${displayCompany} a ete cree avec succes.`,
        '',
        'Voici vos informations de connexion :',
        `Identifiant : ${to}`,
        `Role : ${displayRole}`,
        password ? `Mot de passe temporaire : ${password}` : '',
        '',
        'Pour votre securite, veuillez vous connecter puis remplacer ce mot de passe temporaire par un mot de passe personnel.',
        '',
        'CRM PME centralise les clients, paniers, factures, paiements et stocks de votre entreprise.',
        '',
        'Cordialement,',
        'Equipe CRM PME'
    ].filter(Boolean).join('\n');

    const html = `
        <div style="margin:0;background:#f4f6fb;padding:24px;font-family:Arial,sans-serif;color:#111827;line-height:1.6">
            <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #d8deea;border-radius:10px;overflow:hidden">
                <div style="background:#002b67;color:#ffffff;padding:22px 26px">
                    <h1 style="margin:0;font-size:22px">Bienvenue sur CRM PME</h1>
                    <p style="margin:6px 0 0;color:#dbeafe">Votre espace de gestion est pret.</p>
                </div>
                <div style="padding:26px">
                    <p>Bonjour <strong>${escapeHtml(displayName)}</strong>,</p>
                    <p>Votre compte CRM PME pour <strong>${escapeHtml(displayCompany)}</strong> a ete cree avec succes.</p>
                    <div style="background:#f8fafc;border:1px solid #d8deea;border-radius:8px;padding:16px;margin:20px 0">
                        <p style="margin:0 0 8px"><strong>Identifiant :</strong> ${escapeHtml(to)}</p>
                        <p style="margin:0 0 8px"><strong>Role :</strong> ${escapeHtml(displayRole)}</p>
                        ${password ? `<p style="margin:0"><strong>Mot de passe temporaire :</strong> ${escapeHtml(password)}</p>` : ''}
                    </div>
                    <p style="margin:0 0 12px">Pour votre securite, connectez-vous puis remplacez ce mot de passe temporaire par un mot de passe personnel.</p>
                    <p style="margin:0">CRM PME vous permet de centraliser les clients, paniers, factures, paiements et stocks de votre entreprise.</p>
                    <p style="margin:24px 0 0">Cordialement,<br><strong>Equipe CRM PME</strong></p>
                </div>
            </div>
        </div>
    `;

    return sendMail({ to, subject, text, html });
};

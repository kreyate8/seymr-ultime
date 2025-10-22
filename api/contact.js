/**
 * SEYMR® - API Contact Handler
 * Modèle Concierge avec Redis Rate Limiting
 */

const Stripe = require('stripe');
const { Resend } = require('resend');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const fs = require('fs').promises;
const path = require('path');
const { rateLimitMiddleware } = require('./rate-limiter');

// Initialisation DOMPurify pour Node.js
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Initialisation des services
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuration
const CONFIG = {
    from_email: 'concierge@seymr.art',
    reply_to: 'contact@seymr.art',
    admin_email: 'admin@seymr.art',
    base_url: 'https://seymr.art',
    max_message_length: 5000,
    products_json_path: path.join(process.cwd(), '_data', 'products.json')
};

// Cache pour products.json
let productsCache = null;
let productsCacheTimestamp = 0;
const CACHE_DURATION = 300000; // 5 minutes

/**
 * Load products from JSON
 */
async function loadProducts() {
    const now = Date.now();
    
    if (productsCache && (now - productsCacheTimestamp < CACHE_DURATION)) {
        return productsCache;
    }

    try {
        const data = await fs.readFile(CONFIG.products_json_path, 'utf8');
        const parsed = JSON.parse(data);
        
        const productsMap = {};
        parsed.products.forEach(product => {
            productsMap[product.name] = {
                price_in_cents: product.price_cents,
                name: product.display_name,
                description: product.description_short,
                delivery_time: product.delivery_time,
                edition: product.edition
            };
        });
        
        productsCache = productsMap;
        productsCacheTimestamp = now;
        
        return productsMap;
    } catch (error) {
        console.error('Error loading products.json:', error);
        return {};
    }
}

/**
 * Sanitize input avec DOMPurify
 */
function sanitizeInput(input, maxLength = CONFIG.max_message_length) {
    if (typeof input !== 'string') return '';
    
    let cleaned = input.trim().slice(0, maxLength);
    
    cleaned = DOMPurify.sanitize(cleaned, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false
    });
    
    return cleaned;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate phone format
 */
function isValidPhone(phone) {
    if (!phone) return true;
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 8 && phone.length <= 20;
}

/**
 * Send confirmation email to customer - MODÈLE CONCIERGE PUR
 */
async function sendCustomerEmail(data, product) {
    const safeName = DOMPurify.sanitize(data.name);
    const safeProduct = DOMPurify.sanitize(data.product_interest);
    const safePersonalization = data.personalization ? DOMPurify.sanitize(data.personalization) : '';
    const safeMessage = data.message ? DOMPurify.sanitize(data.message) : '';
    
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&display=swap');
            body { font-family: 'Cormorant Garamond', Georgia, serif; line-height: 1.6; color: #1a1a1a; background: #fafafa; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; }
            .header { text-align: center; border-bottom: 1px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 32px; color: #D4AF37; letter-spacing: 0.2em; font-weight: 300; }
            .subtitle { margin: 10px 0 0; color: #666; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
            .content { color: #333; }
            .greeting { font-size: 18px; margin-bottom: 20px; }
            .details { background: linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%); padding: 25px; margin: 25px 0; border-left: 3px solid #D4AF37; }
            .detail-title { font-size: 20px; color: #D4AF37; margin-bottom: 15px; font-weight: 400; }
            .detail-line { margin: 8px 0; color: #555; }
            .detail-label { font-weight: 500; color: #333; }
            .protocol-box { background: #fff9e6; border: 1px solid #D4AF37; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .protocol-title { font-size: 16px; color: #D4AF37; font-weight: 500; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
            .protocol-step { margin: 10px 0; padding-left: 25px; position: relative; }
            .protocol-step::before { content: "→"; position: absolute; left: 0; color: #D4AF37; font-weight: bold; }
            .signature { margin-top: 40px; font-style: italic; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #888; text-align: center; line-height: 1.4; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SEYMR®</div>
                <p class="subtitle">Maison de Création • Depuis MMXVIII</p>
            </div>
            
            <div class="content">
                <p class="greeting">Cher(ère) ${safeName},</p>
                
                <p>C'est avec honneur que nous confirmons la réception de votre demande d'acquisition pour une création d'exception de notre Maison.</p>
                
                <div class="details">
                    <h3 class="detail-title">${safeProduct}</h3>
                    <p class="detail-line"><span class="detail-label">Édition :</span> ${product?.edition || 'À définir'}</p>
                    <p class="detail-line"><span class="detail-label">Délai de création :</span> ${product?.delivery_time || 'À définir'}</p>
                    ${safePersonalization ? `<p class="detail-line"><span class="detail-label">Personnalisation :</span> ${safePersonalization}</p>` : ''}
                    ${safeMessage ? `<p class="detail-line"><span class="detail-label">Votre message :</span> ${safeMessage}</p>` : ''}
                </div>
                
                <div class="protocol-box">
                    <p class="protocol-title">Prochaines Étapes du Protocole</p>
                    <div class="protocol-step">Un conseiller privilégié de la Maison SEYMR® prendra contact avec vous dans un délai de <strong>24 heures</strong>.</div>
                    <div class="protocol-step">Nous discuterons ensemble des détails de votre projet, répondrons à vos questions et affinerons la personnalisation.</div>
                    <div class="protocol-step">Une fois tous les détails validés, nous vous enverrons un <strong>lien de paiement sécurisé</strong> personnalisé.</div>
                    <div class="protocol-step">Votre œuvre sera façonnée à la main dans nos ateliers londoniens et acheminée avec traçabilité intégrale.</div>
                </div>
                
                <p>Cette approche nous permet de garantir que chaque acquisition correspond parfaitement à votre vision et aux standards d'excellence de la Maison SEYMR®.</p>
                
                <p class="signature">Nous vous remercions de la confiance que vous accordez à notre Maison et de votre adhésion à notre vision de l'art fréquentiel.</p>
                
                <p>Avec notre plus haute considération,</p>
                <p><strong>L'Équipe SEYMR®</strong></p>
            </div>
            
            <div class="footer">
                <p><strong>SEYMR®</strong> • Maison de Création Souveraine</p>
                <p>Saint-Barthélemy • Londres • Guadeloupe<br>+590 691 267 209 • concierge@seymr.art</p>
                <p>© SEYMR® 2025. Tous droits réservés.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    await resend.emails.send({
        from: `SEYMR® <${CONFIG.from_email}>`,
        to: data.email,
        reply_to: CONFIG.reply_to,
        subject: `Demande enregistrée - ${safeProduct} | SEYMR®`,
        html: emailHtml
    });
}

/**
 * Send notification to admin with Stripe link generation hint
 */
async function sendAdminNotification(data, product) {
    const price = product?.price_in_cents ? 
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
            .format(product.price_in_cents / 100) : 
        'Sur devis';

    const adminHtml = `
    <h2>Nouvelle demande d'acquisition SEYMR®</h2>
    
    <h3>Information client</h3>
    <ul>
        <li><strong>Nom :</strong> ${DOMPurify.sanitize(data.name)}</li>
        <li><strong>Email :</strong> ${DOMPurify.sanitize(data.email)}</li>
        <li><strong>Téléphone :</strong> ${data.phone ? DOMPurify.sanitize(data.phone) : 'Non renseigné'}</li>
    </ul>
    
    <h3>Détails de la commande</h3>
    <ul>
        <li><strong>Produit :</strong> ${DOMPurify.sanitize(data.product_interest)}</li>
        <li><strong>Prix catalogue :</strong> ${price}</li>
        <li><strong>Édition :</strong> ${product?.edition || 'N/A'}</li>
        <li><strong>Délai :</strong> ${product?.delivery_time || 'À définir'}</li>
        <li><strong>Personnalisation :</strong> ${data.personalization ? DOMPurify.sanitize(data.personalization) : 'Aucune'}</li>
    </ul>
    
    <h3>Message client</h3>
    <p>${data.message ? DOMPurify.sanitize(data.message) : 'Aucun message'}</p>
    
    <h3>Métadonnées</h3>
    <ul>
        <li><strong>Date/Heure :</strong> ${new Date().toLocaleString('fr-FR', { timeZone: 'America/Guadeloupe' })}</li>
        <li><strong>Référence :</strong> SEYMR-${Date.now().toString(36).toUpperCase()}</li>
    </ul>
    
    <hr>
    <h3 style="color: #D4AF37;">Protocole Concierge</h3>
    <ol>
        <li><strong>Contacter le client sous 24h</strong> (téléphone préféré)</li>
        <li><strong>Valider le projet</strong> : personnalisation, délai, logistique</li>
        <li><strong>Générer le lien Stripe</strong> via dashboard et l'envoyer au client</li>
        <li><strong>Suivre la production</strong> après paiement</li>
    </ol>
    <p><em>⏰ Action requise : Contact client sous 24h</em></p>
    `;

    await resend.emails.send({
        from: `SEYMR® System <${CONFIG.from_email}>`,
        to: CONFIG.admin_email,
        subject: `[LEAD] Nouvelle acquisition - ${data.product_interest} - ${data.name}`,
        html: adminHtml
    });
}

/**
 * Main handler avec Redis Rate Limiting
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://seymr.art');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            message: 'Méthode non autorisée' 
        });
    }

    // APPLIQUER LE RATE LIMITING REDIS
    return new Promise((resolve) => {
        rateLimitMiddleware()(req, res, async () => {
            try {
                const PRODUCTS = await loadProducts();
                
                const rawData = req.body;
                const data = {
                    name: sanitizeInput(rawData.name, 100),
                    email: sanitizeInput(rawData.email, 254),
                    phone: sanitizeInput(rawData.phone, 20),
                    product_interest: sanitizeInput(rawData.product_interest, 100),
                    personalization: sanitizeInput(rawData.personalization, 500),
                    message: sanitizeInput(rawData.message, 2000)
                };

                const errors = [];
                
                if (!data.name || data.name.length < 2) {
                    errors.push('Nom invalide (minimum 2 caractères)');
                }
                
                if (!data.email || !isValidEmail(data.email)) {
                    errors.push('Email invalide');
                }
                
                if (data.phone && !isValidPhone(data.phone)) {
                    errors.push('Numéro de téléphone invalide');
                }
                
                if (!data.product_interest || !PRODUCTS[data.product_interest]) {
                    errors.push('Création non reconnue');
                }

                if (errors.length > 0) {
                    return resolve(res.status(400).json({
                        success: false,
                        message: errors.join(', ')
                    }));
                }

                const product = PRODUCTS[data.product_interest];
                
                await Promise.all([
                    sendCustomerEmail(data, product),
                    sendAdminNotification(data, product)
                ]);

                const reference = `SEYMR-${Date.now().toString(36).toUpperCase()}`;

                console.log(`[${new Date().toISOString()}] New lead: ${reference} - ${data.product_interest}`);

                return resolve(res.status(200).json({
                    success: true,
                    message: 'Votre demande a été enregistrée avec succès',
                    reference: reference
                }));

            } catch (error) {
                console.error('API Error:', error);
                
                return resolve(res.status(500).json({
                    success: false,
                    message: 'Une erreur est survenue. Veuillez réessayer ou nous contacter directement.'
                }));
            }
        });
    });
}
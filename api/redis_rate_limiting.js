/**
 * SEYMR® - Rate Limiter with Redis (Vercel KV)
 * Protection infaillible contre les abus
 */

const { kv } = require('@vercel/kv');

/**
 * Configuration du rate limiter
 */
const RATE_LIMIT_CONFIG = {
    // Limite principale : 5 requêtes par heure
    maxRequests: 5,
    windowMs: 3600000, // 1 heure en millisecondes
    
    // Limite pour les IPs suspectes : 3 requêtes par 24h
    suspiciousMaxRequests: 3,
    suspiciousWindowMs: 86400000, // 24 heures
    
    // Durée du ban
    banDurationMs: 86400000, // 24 heures
    
    // Préfixes des clés Redis
    keyPrefix: 'seymr:ratelimit:',
    banPrefix: 'seymr:ban:',
    suspiciousPrefix: 'seymr:suspicious:'
};

/**
 * Rate Limiter basé sur Redis/Vercel KV
 */
class RateLimiter {
    
    /**
     * Vérifier si une IP est limitée
     * @param {string} clientIp - Adresse IP du client
     * @returns {Promise<Object>} - { allowed: boolean, remaining: number, resetAt: number }
     */
    async checkLimit(clientIp) {
        try {
            // 1. Vérifier si l'IP est bannie
            const isBanned = await this.isBanned(clientIp);
            if (isBanned) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: Date.now() + RATE_LIMIT_CONFIG.banDurationMs,
                    reason: 'IP banned'
                };
            }

            // 2. Vérifier si l'IP est suspecte
            const isSuspicious = await this.isSuspicious(clientIp);
            const config = isSuspicious ? {
                max: RATE_LIMIT_CONFIG.suspiciousMaxRequests,
                window: RATE_LIMIT_CONFIG.suspiciousWindowMs
            } : {
                max: RATE_LIMIT_CONFIG.maxRequests,
                window: RATE_LIMIT_CONFIG.windowMs
            };

            // 3. Construire la clé Redis
            const key = `${RATE_LIMIT_CONFIG.keyPrefix}${clientIp}`;
            
            // 4. Obtenir le compteur actuel
            const currentCount = await kv.get(key) || 0;
            
            // 5. Vérifier la limite
            if (currentCount >= config.max) {
                // Marquer comme suspecte si pas déjà fait
                if (!isSuspicious) {
                    await this.markAsSuspicious(clientIp);
                }
                
                // Bannir si trop d'abus
                if (currentCount >= config.max + 5) {
                    await this.banIP(clientIp);
                }

                const ttl = await kv.ttl(key);
                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: Date.now() + (ttl * 1000),
                    reason: 'Rate limit exceeded'
                };
            }

            // 6. Incrémenter le compteur
            const pipeline = kv.pipeline();
            pipeline.incr(key);
            
            // Définir l'expiration seulement si c'est la première requête
            if (currentCount === 0) {
                pipeline.pexpire(key, config.window);
            }
            
            await pipeline.exec();

            // 7. Retourner les informations
            const ttl = await kv.ttl(key);
            return {
                allowed: true,
                remaining: config.max - (currentCount + 1),
                resetAt: Date.now() + (ttl * 1000),
                reason: isSuspicious ? 'Suspicious IP - limited' : 'OK'
            };

        } catch (error) {
            console.error('Rate limiter error:', error);
            
            // En cas d'erreur Redis, fallback sur autorisation
            // (mieux vaut laisser passer qu'empêcher les vrais clients)
            return {
                allowed: true,
                remaining: RATE_LIMIT_CONFIG.maxRequests,
                resetAt: Date.now() + RATE_LIMIT_CONFIG.windowMs,
                reason: 'Fallback (Redis error)'
            };
        }
    }

    /**
     * Vérifier si une IP est bannie
     */
    async isBanned(clientIp) {
        const banKey = `${RATE_LIMIT_CONFIG.banPrefix}${clientIp}`;
        const banned = await kv.get(banKey);
        return banned === 1;
    }

    /**
     * Bannir une IP
     */
    async banIP(clientIp) {
        const banKey = `${RATE_LIMIT_CONFIG.banPrefix}${clientIp}`;
        await kv.set(banKey, 1, { px: RATE_LIMIT_CONFIG.banDurationMs });
        
        console.log(`[SECURITY] IP banned: ${clientIp}`);
        
        // Optionnel : Envoyer une alerte (email, Slack, etc.)
        // await sendSecurityAlert('IP_BANNED', { ip: clientIp });
    }

    /**
     * Débannir une IP (admin)
     */
    async unbanIP(clientIp) {
        const banKey = `${RATE_LIMIT_CONFIG.banPrefix}${clientIp}`;
        await kv.del(banKey);
        console.log(`[SECURITY] IP unbanned: ${clientIp}`);
    }

    /**
     * Vérifier si une IP est suspecte
     */
    async isSuspicious(clientIp) {
        const suspiciousKey = `${RATE_LIMIT_CONFIG.suspiciousPrefix}${clientIp}`;
        const suspicious = await kv.get(suspiciousKey);
        return suspicious === 1;
    }

    /**
     * Marquer une IP comme suspecte
     */
    async markAsSuspicious(clientIp) {
        const suspiciousKey = `${RATE_LIMIT_CONFIG.suspiciousPrefix}${clientIp}`;
        await kv.set(suspiciousKey, 1, { px: RATE_LIMIT_CONFIG.suspiciousWindowMs });
        
        console.log(`[SECURITY] IP marked as suspicious: ${clientIp}`);
    }

    /**
     * Obtenir les statistiques d'une IP
     */
    async getIPStats(clientIp) {
        const key = `${RATE_LIMIT_CONFIG.keyPrefix}${clientIp}`;
        const banKey = `${RATE_LIMIT_CONFIG.banPrefix}${clientIp}`;
        const suspiciousKey = `${RATE_LIMIT_CONFIG.suspiciousPrefix}${clientIp}`;

        const [count, banned, suspicious, ttl] = await Promise.all([
            kv.get(key),
            kv.get(banKey),
            kv.get(suspiciousKey),
            kv.ttl(key)
        ]);

        return {
            ip: clientIp,
            requestCount: count || 0,
            isBanned: banned === 1,
            isSuspicious: suspicious === 1,
            resetIn: ttl > 0 ? ttl : null
        };
    }

    /**
     * Réinitialiser le compteur d'une IP (admin)
     */
    async resetIP(clientIp) {
        const key = `${RATE_LIMIT_CONFIG.keyPrefix}${clientIp}`;
        const suspiciousKey = `${RATE_LIMIT_CONFIG.suspiciousPrefix}${clientIp}`;
        
        await Promise.all([
            kv.del(key),
            kv.del(suspiciousKey)
        ]);
        
        console.log(`[SECURITY] IP reset: ${clientIp}`);
    }

    /**
     * Nettoyer les anciennes entrées (cron job)
     */
    async cleanup() {
        // Vercel KV gère automatiquement l'expiration avec TTL
        // Cette fonction est gardée pour compatibilité future
        console.log('[SECURITY] Cleanup executed (automatic via TTL)');
    }
}

/**
 * Middleware Express/Vercel pour rate limiting
 */
function rateLimitMiddleware(limiter = new RateLimiter()) {
    return async (req, res, next) => {
        // Extraire l'IP réelle (derrière proxy/CDN)
        const clientIp = 
            req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown';

        // Vérifier la limite
        const result = await limiter.checkLimit(clientIp);

        // Ajouter les headers de rate limiting (standard)
        res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt / 1000));

        if (!result.allowed) {
            // Ajouter le header Retry-After
            const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
            res.setHeader('Retry-After', retryAfter);

            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: result.reason === 'IP banned' 
                    ? 'Votre adresse IP a été temporairement bloquée en raison d\'une activité suspecte.' 
                    : 'Trop de requêtes. Veuillez patienter avant de réessayer.',
                retryAfter: retryAfter
            });
        }

        // Passer au prochain middleware
        next();
    };
}

/**
 * Instance singleton
 */
const rateLimiter = new RateLimiter();

module.exports = {
    RateLimiter,
    rateLimiter,
    rateLimitMiddleware,
    RATE_LIMIT_CONFIG
};
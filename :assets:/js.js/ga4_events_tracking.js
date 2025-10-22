/**
 * SEYMR® - Google Analytics 4 Events
 * Tracking complet des interactions utilisateur
 */

(function() {
    'use strict';

    // Vérifier que gtag est disponible
    if (typeof gtag === 'undefined') {
        console.warn('GA4: gtag not loaded');
        return;
    }

    /**
     * Configuration des événements E-commerce
     */
    const GA4Events = {
        
        /**
         * Vue d'un produit (depuis la grille ou page produit)
         */
        viewItem(productName, price, category = 'Mobilier') {
            gtag('event', 'view_item', {
                currency: 'EUR',
                value: price,
                items: [{
                    item_id: this.generateItemId(productName),
                    item_name: productName,
                    item_category: category,
                    item_brand: 'SEYMR',
                    price: price,
                    quantity: 1
                }]
            });
            console.log('GA4: view_item -', productName);
        },

        /**
         * Clic sur "Acquérir" (ajout au panier virtuel)
         */
        addToCart(productName, price) {
            gtag('event', 'add_to_cart', {
                currency: 'EUR',
                value: price,
                items: [{
                    item_id: this.generateItemId(productName),
                    item_name: productName,
                    item_brand: 'SEYMR',
                    price: price,
                    quantity: 1
                }]
            });
            console.log('GA4: add_to_cart -', productName);
        },

        /**
         * Début du processus d'acquisition (formulaire affiché)
         */
        beginCheckout(productName, price) {
            gtag('event', 'begin_checkout', {
                currency: 'EUR',
                value: price,
                items: [{
                    item_id: this.generateItemId(productName),
                    item_name: productName,
                    item_brand: 'SEYMR',
                    price: price,
                    quantity: 1
                }]
            });
            console.log('GA4: begin_checkout -', productName);
        },

        /**
         * Soumission du formulaire (lead généré)
         */
        generateLead(productName, price) {
            gtag('event', 'generate_lead', {
                currency: 'EUR',
                value: price,
                lead_source: 'website_form'
            });
            console.log('GA4: generate_lead -', productName);
        },

        /**
         * Génération d'un item_id unique
         */
        generateItemId(productName) {
            const map = {
                'Fauteuil SISIT': 'SEYMR-SISIT-001',
                'Paravent': 'SEYMR-PARA-001',
                'Tapis NEXUS': 'SEYMR-NEXUS-001',
                'Repose-pieds SATELLITE': 'SEYMR-SATELLITE-001',
                'Pouf COSMOSIS': 'SEYMR-COSMOSIS-001',
                'Tirage d\'art': 'SEYMR-TIRAGE-001',
                'Sac CONQUEROR': 'SEYMR-SAC-001',
                'Porte-documents': 'SEYMR-PORTE-001',
                'Valise': 'SEYMR-VALISE-001',
                'Casquette': 'SEYMR-CASQUETTE-001'
            };
            return map[productName] || 'SEYMR-OTHER-001';
        }
    };

    /**
     * Tracking des interactions UI
     */
    const UITracking = {
        
        /**
         * Ouverture du modal Sanctuaire
         */
        openSanctuaryModal() {
            gtag('event', 'view_promotion', {
                creative_name: 'Sanctuaire Modal',
                creative_slot: 'modal',
                promotion_id: 'sanctuaire_vip',
                promotion_name: 'Le Sanctuaire Privé'
            });
            console.log('GA4: open_sanctuary_modal');
        },

        /**
         * Clic sur CTA "Devenir collectionneur"
         */
        becomeCollector() {
            gtag('event', 'select_promotion', {
                creative_name: 'Sanctuaire CTA',
                creative_slot: 'modal',
                promotion_id: 'sanctuaire_vip'
            });
            console.log('GA4: become_collector_click');
        },

        /**
         * Navigation vers une section
         */
        scrollToSection(sectionName) {
            gtag('event', 'scroll', {
                section: sectionName,
                engagement_time_msec: Date.now()
            });
            console.log('GA4: scroll_to -', sectionName);
        },

        /**
         * Changement de thème
         */
        toggleTheme(newTheme) {
            gtag('event', 'theme_change', {
                theme: newTheme
            });
            console.log('GA4: theme_change -', newTheme);
        },

        /**
         * Téléchargement (si applicable)
         */
        download(fileName) {
            gtag('event', 'file_download', {
                file_name: fileName,
                file_extension: fileName.split('.').pop()
            });
            console.log('GA4: file_download -', fileName);
        }
    };

    /**
     * Tracking du formulaire
     */
    const FormTracking = {
        
        /**
         * Focus sur un champ
         */
        fieldFocus(fieldName) {
            gtag('event', 'form_field_focus', {
                form_name: 'acquisition_form',
                field_name: fieldName
            });
        },

        /**
         * Erreur de validation
         */
        validationError(fieldName, errorType) {
            gtag('event', 'form_error', {
                form_name: 'acquisition_form',
                field_name: fieldName,
                error_type: errorType
            });
            console.log('GA4: form_error -', fieldName, errorType);
        },

        /**
         * Soumission réussie
         */
        submitSuccess(productName, formData) {
            gtag('event', 'form_submit', {
                form_name: 'acquisition_form',
                product: productName,
                personalization: formData.personalization ? 'yes' : 'no'
            });
            console.log('GA4: form_submit_success');
        },

        /**
         * Abandon du formulaire
         */
        formAbandonment(completionRate) {
            gtag('event', 'form_abandon', {
                form_name: 'acquisition_form',
                completion_rate: completionRate
            });
            console.log('GA4: form_abandon -', completionRate + '%');
        }
    };

    /**
     * Engagement avec le contenu
     */
    const ContentTracking = {
        
        /**
         * Lecture d'une archive
         */
        readArchive(archiveTitle) {
            gtag('event', 'select_content', {
                content_type: 'archive_article',
                item_id: this.slugify(archiveTitle)
            });
            console.log('GA4: read_archive -', archiveTitle);
        },

        /**
         * Temps passé sur une section
         */
        sectionEngagement(sectionName, timeSpent) {
            gtag('event', 'user_engagement', {
                engagement_time_msec: timeSpent,
                section: sectionName
            });
            console.log('GA4: section_engagement -', sectionName, timeSpent + 'ms');
        },

        /**
         * Partage social (si implémenté)
         */
        socialShare(platform, contentUrl) {
            gtag('event', 'share', {
                method: platform,
                content_type: 'product',
                item_id: contentUrl
            });
            console.log('GA4: social_share -', platform);
        },

        slugify(text) {
            return text.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }
    };

    /**
     * Initialisation automatique des trackings
     */
    function initializeTracking() {
        
        // 1. Tracking des produits de la grille
        document.querySelectorAll('[data-product]').forEach(button => {
            button.addEventListener('click', function() {
                const productName = this.dataset.product;
                const priceText = this.closest('.creation-card')?.querySelector('.creation-price')?.textContent;
                const price = priceText ? parseFloat(priceText.replace(/[^\d]/g, '')) : 0;
                
                GA4Events.addToCart(productName, price);
            });
        });

        // 2. Tracking du modal Sanctuaire
        const sanctuaryLink = document.getElementById('sanctuary-link');
        if (sanctuaryLink) {
            sanctuaryLink.addEventListener('click', function() {
                UITracking.openSanctuaryModal();
            });
        }

        const sanctuaryCTA = document.querySelector('.btn-modal-cta');
        if (sanctuaryCTA) {
            sanctuaryCTA.addEventListener('click', function() {
                UITracking.becomeCollector();
            });
        }

        // 3. Tracking de la navigation
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', function() {
                const section = this.getAttribute('href').replace('#', '');
                if (section) {
                    UITracking.scrollToSection(section);
                }
            });
        });

        // 4. Tracking du changement de thème
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                UITracking.toggleTheme(newTheme);
            });
        }

        // 5. Tracking du formulaire
        const form = document.getElementById('acquisition-form');
        if (form) {
            let formStartTime = null;
            let fieldsCompleted = new Set();
            const totalFields = form.querySelectorAll('input[required], select[required]').length;

            // Début du formulaire
            form.addEventListener('focusin', function(e) {
                if (!formStartTime) {
                    formStartTime = Date.now();
                    const productSelect = document.getElementById('product_interest');
                    const productName = productSelect?.value || 'Unknown';
                    // GA4Events.beginCheckout(productName, 0); // Décommenter si besoin
                }

                if (e.target.id) {
                    FormTracking.fieldFocus(e.target.id);
                }
            }, true);

            // Suivi de la complétion
            form.addEventListener('input', function(e) {
                if (e.target.required && e.target.value.trim()) {
                    fieldsCompleted.add(e.target.id);
                }
            });

            // Erreurs de validation
            form.addEventListener('invalid', function(e) {
                if (e.target.id) {
                    FormTracking.validationError(e.target.id, 'validation_failed');
                }
            }, true);

            // Soumission
            form.addEventListener('submit', function(e) {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                GA4Events.generateLead(data.product_interest, 0);
                FormTracking.submitSuccess(data.product_interest, data);
            });

            // Abandon (utilisateur quitte la page avec formulaire incomplet)
            window.addEventListener('beforeunload', function() {
                if (formStartTime && fieldsCompleted.size < totalFields) {
                    const completionRate = Math.round((fieldsCompleted.size / totalFields) * 100);
                    FormTracking.formAbandonment(completionRate);
                }
            });
        }

        // 6. Tracking des archives
        document.querySelectorAll('.archive-link').forEach(link => {
            link.addEventListener('click', function(e) {
                const archiveTitle = this.closest('.archive-card')?.querySelector('h3')?.textContent;
                if (archiveTitle) {
                    ContentTracking.readArchive(archiveTitle);
                }
            });
        });

        // 7. Engagement par section (temps passé)
        const sections = document.querySelectorAll('section[id]');
        const sectionTimes = new Map();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionId = entry.target.id;
                
                if (entry.isIntersecting) {
                    sectionTimes.set(sectionId, Date.now());
                } else if (sectionTimes.has(sectionId)) {
                    const timeSpent = Date.now() - sectionTimes.get(sectionId);
                    if (timeSpent > 3000) { // Plus de 3 secondes
                        ContentTracking.sectionEngagement(sectionId, timeSpent);
                    }
                    sectionTimes.delete(sectionId);
                }
            });
        }, {
            threshold: 0.5
        });

        sections.forEach(section => observer.observe(section));

        console.log('✓ GA4 Events initialized');
    }

    // Initialiser quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTracking);
    } else {
        initializeTracking();
    }

    // Exposer l'API globalement pour usage manuel
    window.SEYMR_GA4 = {
        events: GA4Events,
        ui: UITracking,
        form: FormTracking,
        content: ContentTracking
    };

})();
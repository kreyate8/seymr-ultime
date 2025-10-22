/**
 * SEYMR® - Main JavaScript
 * Version 2.1 Final (Architecture SSOT Complète & Pages Produits)
 * * Ce script gère :
 * 1. Le chargement dynamique de TOUS les produits (Vedette + Grille + Select) depuis /_data/products.json
 * 2. La liaison de la grille vers les pages produits dédiées.
 * 3. La navigation (scroll, menu mobile, modals via data-modal).
 * 4. La gestion du formulaire "Concierge" (validation, pré-sélection et envoi vers /api/contact).
 * 5. Les animations et optimisations de performance (lazy loading, prefetch).
 * 6. La gestion du thème (dark/light).
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        scrollThreshold: 50,
        animationDelay: 100, // Décalage pour animations stagger
        intersectionThreshold: 0.15, // % de visibilité pour déclencher l'animation
        productsJsonPath: '/_data/products.json' // Source de Vérité Unique 
    };

    // État de l'application
    const state = {
        theme: localStorage.getItem('theme') || 'dark', // Thème par défaut
        isMenuOpen: false,
        isSubmitting: false,
        products: [] // Catalogue chargé depuis JSON
    };

    /**
     * Module: Products Loader
     * Charge les données depuis products.json et hydrate l'HTML
     */
    const ProductsLoader = {
        async init() {
            try {
                // Utilise le preloading initié dans l'HTML
                const response = await fetch(CONFIG.productsJsonPath); 
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - Échec du chargement du catalogue produits.`);
                }
                const data = await response.json();
                state.products = data.products; // Stocker les produits chargés
                
                // Hydratation de la page - Exécutée une fois les produits chargés
                this.renderFeaturedProduct(); // Corrige la fuite SSOT
                this.renderProductsGrid();    // Corrige la liaison de la grille
                this.renderProductSelect();   // Hydrate le sélecteur du formulaire
                
                console.log('✓ Catalogue SEYMR® chargé et page hydratée avec succès');
            } catch (error) {
                console.error('Erreur critique lors du chargement ou de l\'hydratation des produits:', error);
                // Afficher un message d'erreur à l'utilisateur ?
                const grid = document.querySelector('.creations-grid');
                if (grid) grid.innerHTML = '<p style="text-align: center; color: var(--or-souverain);">Erreur lors du chargement des créations.</p>';
            }
        },

        /**
         * [NOUVEAU - FIX SSOT LOOPHOLE]
         * Hydrate le produit en vedette sur la page d'accueil depuis products.json.
         */
        renderFeaturedProduct() {
            const featuredProduct = state.products.find(p => p.featured === true); //
            if (!featuredProduct) {
                console.warn("Aucun produit marqué comme 'featured' dans products.json");
                return;
            }

            const container = document.querySelector('.creation-featured'); //
            if (!container) {
                 console.warn("Conteneur '.creation-featured' introuvable dans l'HTML.");
                 return;
            }

            // Sélection robuste des éléments DOM via querySelector
            const elements = {
                name: container.querySelector('.creation-name'),
                tagline: container.querySelector('.creation-tagline'),
                description: container.querySelector('.creation-description'),
                edition: container.querySelector('[data-spec="edition"]'), // Utilise data-spec
                manufacturing: container.querySelector('[data-spec="façonnage"]'), // Utilise data-spec
                materials: container.querySelector('[data-spec="matériaux"]'), // Utilise data-spec
                delivery_time: container.querySelector('[data-spec="délai"]'), // Délai ajouté
                acquireBtn: container.querySelector('.btn-acquire'),
                picture: container.querySelector('.creation-visual picture') //
            };

            // Fonction pour mettre à jour le contenu textuel si l'élément existe
            const updateText = (el, text) => { if (el) el.textContent = text || ''; };

            // Injecter les données du JSON
            updateText(elements.name, featuredProduct.display_name);
            updateText(elements.tagline, featuredProduct.tagline);
            updateText(elements.description, featuredProduct.description_long);
            updateText(elements.edition, featuredProduct.edition);
            updateText(elements.manufacturing, featuredProduct.manufacturing);
            updateText(elements.materials, featuredProduct.materials);
            updateText(elements.delivery_time, featuredProduct.delivery_time); // Mise à jour du délai
            
            // Mettre à jour le bouton d'acquisition
            if (elements.acquireBtn) {
                elements.acquireBtn.dataset.product = featuredProduct.name; // Pour pré-sélection formulaire
                elements.acquireBtn.textContent = `Acquérir cette œuvre (${this.formatPrice(featuredProduct.price)})`;
            }
            
            // Mettre à jour l'image et ses sources dynamiquement
            if (elements.picture && featuredProduct.images && featuredProduct.images.main) {
                const mainImgBase = featuredProduct.images.main.replace(/\.(webp|jpg|avif)$/i, ''); // Chemin sans extension
                const altText = `${featuredProduct.display_name} - ${featuredProduct.tagline} SEYMR®`;
                elements.picture.innerHTML = `
                    <source type="image/avif" srcset="${mainImgBase}-600w.avif 600w, ${mainImgBase}-1200w.avif 1200w">
                    <source type="image/webp" srcset="${mainImgBase}-600w.webp 600w, ${mainImgBase}-1200w.webp 1200w">
                    <img src="${mainImgBase}-1200w.jpg" 
                         srcset="${mainImgBase}-600w.jpg 600w, ${mainImgBase}-1200w.jpg 1200w"
                         sizes="(max-width: 768px) 100vw, 50vw"
                         alt="${altText}"
                         loading="lazy" width="600" height="600"> `;
            } else if (elements.picture) {
                 elements.picture.innerHTML = '<img src="assets/placeholder.jpg" alt="Image non disponible" width="600" height="600">'; // Fallback
            }
        },

        /**
         * [MODIFIÉ - FIX GRID CONNECTION]
         * Hydrate la grille des créations avec des liens vers les pages produits dédiées.
         */
        renderProductsGrid() {
            const gridContainer = document.querySelector('.creations-grid'); //
            if (!gridContainer) {
                console.warn("Conteneur '.creations-grid' introuvable.");
                return;
            }

            // Filtrer les produits pour la grille (exclut featured, 'autre', 'le-livre')
            const gridProducts = state.products.filter(p => 
                !p.featured && p.id !== 'autre' && p.id !== 'le-livre'
            );

            // Générer le HTML pour chaque carte produit
            gridContainer.innerHTML = gridProducts.map(product => {
                const imgPath = product.images?.main || 'assets/placeholder.jpg'; // Image principale ou fallback
                const imgBase = imgPath.replace(/\.(webp|jpg|avif)$/i, '');
                const altText = `${product.display_name} - ${product.tagline}`;
                
                return `
                <article class="creation-card" data-product-id="${product.id}">
                    <div class="creation-image-container"> <picture>
                              <source type="image/avif" srcset="${imgBase}-400w.avif 400w, ${imgBase}-800w.avif 800w">
                              <source type="image/webp" srcset="${imgBase}-400w.webp 400w, ${imgBase}-800w.webp 800w">
                              <img src="${imgBase}-800w.jpg" 
                                   srcset="${imgBase}-400w.jpg 400w, ${imgBase}-800w.jpg 800w"
                                   sizes="(max-width: 768px) 100vw, 33vw"
                                   alt="${altText}" 
                                   class="creation-image" 
                                   loading="lazy" width="400" height="400"> </picture>
                    </div>
                    <div class="creation-card-content"> <h3 class="creation-name">${product.display_name}</h3>
                        <p class="creation-tagline">${product.tagline}</p>
                        <p class="creation-price">${this.formatPrice(product.price)}</p>
                        
                        <a href="/${product.id}.html" class="btn-discover">Découvrir l'œuvre</a> 
                    </div>
                </article>
            `}).join('');

            // Ajouter la carte spéciale pour "Le Livre" (si présente dans le JSON)
            const livre = state.products.find(p => p.id === 'le-livre');
            if (livre) {
                 const imgPath = livre.images?.main || 'assets/placeholder.jpg';
                 const imgBase = imgPath.replace(/\.(webp|jpg|avif)$/i, '');
                 gridContainer.innerHTML += `
                    <article class="creation-card" data-product-id="${livre.id}">
                         <div class="creation-image-container">
                              <picture>
                                   <source type="image/avif" srcset="${imgBase}-400w.avif 400w, ${imgBase}-800w.avif 800w">
                                   <source type="image/webp" srcset="${imgBase}-400w.webp 400w, ${imgBase}-800w.webp 800w">
                                   <img src="${imgBase}-800w.jpg" 
                                        srcset="${imgBase}-400w.jpg 400w, ${imgBase}-800w.jpg 800w"
                                        alt="${livre.display_name}" class="creation-image" loading="lazy" width="400" height="400">
                              </picture>
                         </div>
                         <div class="creation-card-content">
                              <h3 class="creation-name">${livre.display_name}</h3>
                              <p class="creation-tagline">${livre.tagline}</p>
                              <p class="creation-price">${this.formatPrice(livre.price)}</p>
                              <a href="#contact" class="btn-discover" data-product="${livre.name}">Demander</a>
                         </div>
                    </article>
                 `;
            }
        },

        /**
         * Hydrate le sélecteur <select> du formulaire de contact.
         */
        renderProductSelect() {
            const select = document.getElementById('product_interest'); //
            if (!select) {
                console.warn("Sélecteur '#product_interest' introuvable.");
                return;
            }

            select.innerHTML = '<option value="">Sélectionner une création</option>'; // Réinitialiser

            state.products.forEach(product => {
                // Formatage du texte de l'option
                const priceText = product.price ? 
                    ` - ${this.formatPrice(product.price)}` : 
                    (product.id === 'autre' ? '' : ' - Sur demande'); //
                
                const option = document.createElement('option');
                option.value = product.name; // Valeur envoyée au serveur
                option.textContent = `${product.display_name}${priceText}`; // Texte affiché
                // Désactiver l'option "Sélectionner" pour la rendre non-choisissable si besoin
                // if (product.id === '') option.disabled = true; 
                select.appendChild(option);
            });
        },

        // Helper pour formater le prix en Euros
        formatPrice(price) {
            if (price === null || price === undefined) return 'Sur demande';
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(price);
        }
    };

    /**
     * Module: Theme Management
     * Gère le basculement entre les thèmes dark/light.
     */
    const ThemeManager = {
        init() {
            this.themeToggleBtn = document.getElementById('themeToggle'); //
            this.themeIcon = this.themeToggleBtn ? this.themeToggleBtn.querySelector('.theme-icon') : null; //
            
            this.applyTheme(state.theme); 
            this.bindEvents();
        },

        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme); //
            localStorage.setItem('theme', theme); 
            state.theme = theme;
            // Mettre à jour l'icône (si géré par JS, sinon CSS)
            if (this.themeIcon) {
                // Adaptez ceci si votre icône est gérée différemment (ex: SVG)
                this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙'; 
            }
        },

        toggle() {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
            // Envoyer un événement GA4 si configuré
            // window.SEYMR_GA4?.ui.toggleTheme(newTheme); 
        },

        bindEvents() {
            if (this.themeToggleBtn) {
                this.themeToggleBtn.addEventListener('click', () => this.toggle()); 
            }
        }
    };

    /**
     * Module: Navigation
     * Gère le menu (scroll, mobile), et le smooth scroll.
     */
    const Navigation = {
        init() {
            this.nav = document.querySelector('nav'); //
            this.mobileMenuToggle = document.getElementById('mobileMenuToggle'); //
            this.overlay = document.getElementById('navigation-overlay'); //
            
            this.bindScrollEvents();
            this.bindMobileMenu();
            this.bindSmoothScroll();
        },

        bindScrollEvents() {
            if (!this.nav) return;

            let lastScroll = 0;
            const handleScroll = () => {
                const currentScroll = window.pageYOffset;
                
                // Ajoute/enlève la classe 'scrolled' pour le style
                this.nav.classList.toggle('scrolled', currentScroll > CONFIG.scrollThreshold); 
                
                // Cache la nav au scroll vers le bas, la montre au scroll vers le haut
                if (currentScroll > lastScroll && currentScroll > this.nav.offsetHeight) {
                    this.nav.style.transform = 'translateY(-100%)'; // Cache
                } else {
                    this.nav.style.transform = 'translateY(0)'; // Montre
                }
                lastScroll = currentScroll <= 0 ? 0 : currentScroll; // Pour gérer le scroll tout en haut
            };
            
            // Utilise throttle pour limiter la fréquence d'exécution
            window.addEventListener('scroll', throttle(handleScroll, 100)); 
        },

        bindMobileMenu() {
            if (!this.mobileMenuToggle || !this.overlay) return;

            const toggleMenu = (forceClose = false) => {
                if (forceClose) {
                    state.isMenuOpen = false;
                } else {
                    state.isMenuOpen = !state.isMenuOpen;
                }
                this.mobileMenuToggle.classList.toggle('active', state.isMenuOpen);
                this.mobileMenuToggle.setAttribute('aria-expanded', state.isMenuOpen);
                this.overlay.classList.toggle('active', state.isMenuOpen);
                this.overlay.setAttribute('aria-hidden', !state.isMenuOpen);
                // Bloque/débloque le scroll du body
                document.body.style.overflow = state.isMenuOpen ? 'hidden' : ''; 
            };

            this.mobileMenuToggle.addEventListener('click', () => toggleMenu()); 

            // Ferme le menu en cliquant sur un lien dans l'overlay
            this.overlay.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => toggleMenu(true)); // Force la fermeture
            }); 

            // Ferme le menu avec la touche Echap
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.isMenuOpen) {
                    toggleMenu(true); // Force la fermeture
                }
            }); 
        },

        // Gère le défilement doux vers les ancres
        bindSmoothScroll() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const targetId = this.getAttribute('href');
                    // Ignore les liens '#' simples ou ceux sans cible existante
                    if (targetId === '#' || targetId.length <= 1) return; 
                    
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        const navHeight = document.querySelector('nav')?.offsetHeight || 80; // Hauteur de la nav
                        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20; // Décalage sous la nav
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth' // Effet de défilement doux
                        }); 
                        // Mettre à jour l'URL sans recharger (optionnel)
                        // history.pushState(null, '', targetId); 
                    }
                });
            });
        }
    };

    /**
     * Module: Modal Management
     * Gère l'ouverture/fermeture des modals via data-modal
     */
    const ModalManager = {
        init() {
            this.bindModalTriggers();
            this.bindModalCloseEvents();
        },

        open(modalId) {
            const modal = document.getElementById(modalId); 
            if (!modal || modal.classList.contains('active')) return; // Ne fait rien si déjà ouvert

            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Empêche le scroll du body
            
            // Focus sur le premier élément focusable dans le modal pour l'accessibilité
            const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) firstFocusable.focus();
            
            // Envoyer événement GA4 si configuré
            // window.SEYMR_GA4?.ui.openModal(modalId);
        },

        close(modal) {
            if (!modal || !modal.classList.contains('active')) return; // Ne fait rien si déjà fermé

            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            
            // Vérifie s'il reste d'autres modals ouverts avant de réactiver le scroll
            const anyModalActive = document.querySelector('.modal-overlay.active');
            if (!anyModalActive) {
                document.body.style.overflow = '';
            }
            
            // Renvoyer le focus à l'élément qui a ouvert le modal (si possible/nécessaire)
            // const trigger = document.querySelector(`[data-modal="${modal.id.replace('-modal', '')}"]`);
            // if (trigger) trigger.focus();
        },
        
        // Trouve le modal parent d'un élément
        findParentModal(element) {
             return element.closest('.modal-overlay');
        },

        bindModalTriggers() {
            // Écoute les clics sur TOUT le document
            document.addEventListener('click', (e) => {
                const trigger = e.target.closest('[data-modal]'); // Trouve le déclencheur le plus proche
                if (trigger) {
                    e.preventDefault();
                    const modalId = `${trigger.dataset.modal}-modal`; // Construit l'ID du modal
                    this.open(modalId);
                }
            });
        },

        bindModalCloseEvents() {
            // Écoute les clics sur TOUT le document pour les boutons de fermeture
            document.addEventListener('click', (e) => {
                // Fermeture via bouton .modal-close
                if (e.target.matches('.modal-close')) {
                    this.close(this.findParentModal(e.target));
                }
                // Fermeture via lien .close-modal-and-scroll (qui ferme ET scroll)
                else if (e.target.matches('.close-modal-and-scroll')) {
                     this.close(this.findParentModal(e.target));
                     // La partie scroll est gérée par bindSmoothScroll si le href est une ancre
                }
                // Fermeture en cliquant sur l'overlay (arrière-plan)
                else if (e.target.matches('.modal-overlay')) {
                    this.close(e.target);
                }
            });

            // Fermeture avec la touche Echap
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const activeModal = document.querySelector('.modal-overlay.active');
                    if (activeModal) this.close(activeModal);
                }
            }); 
        }
    };

    /**
     * Module: Form Handling
     * Gère la validation et la soumission du formulaire vers l'API /api/contact
     */
    const FormHandler = {
        init() {
            this.form = document.getElementById('acquisition-form'); //
            if (!this.form) return; // Ne rien faire si le formulaire n'existe pas

            this.statusEl = document.getElementById('form-status'); //
            this.submitBtn = document.getElementById('submit-btn'); //
            this.btnText = this.submitBtn.querySelector('.btn-text');
            this.loader = this.submitBtn.querySelector('.btn-loader');
            
            this.bindValidation();
            this.bindSubmit();
            this.bindProductPreselect();
        },

        // Validation en temps réel (au blur et à la saisie si erreur)
        bindValidation() {
            this.form.querySelectorAll('input[required], select[required]').forEach(field => {
                field.addEventListener('blur', () => this.validateField(field));
                // Re-valide à la saisie seulement si le champ était en erreur
                field.addEventListener('input', () => {
                    if (field.classList.contains('error')) {
                        this.validateField(field);
                    }
                });
            });
        },

        // Valide un champ spécifique et affiche/cache l'erreur
        validateField(field) {
            const errorEl = document.getElementById(`${field.id}-error`); //
            if (!errorEl) return true; // Pas d'élément d'erreur associé

            let isValid = true;
            let errorMessage = '';

            // Vérification simple : requis et non vide
            if (field.hasAttribute('required') && !field.value.trim()) {
                isValid = false;
                errorMessage = 'Ce champ est requis.';
            } 
            // Vérification spécifique pour l'email
            else if (field.type === 'email' && field.value.trim()) {
                // Regex simple pour format email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
                if (!emailRegex.test(field.value)) {
                    isValid = false;
                    errorMessage = 'Veuillez entrer une adresse email valide.';
                }
            }
             // Vérification spécifique pour le téléphone (optionnel)
            else if (field.type === 'tel' && field.value.trim()) {
                // Regex simple pour chiffres, espaces, +, -, () - minimum 8 chars
                const phoneRegex = /^[\d\s()+-]{8,}$/; 
                if (!phoneRegex.test(field.value)) {
                    isValid = false;
                    errorMessage = 'Format de téléphone invalide.';
                }
            }

            // Met à jour l'UI (classe CSS et message)
            field.classList.toggle('error', !isValid);
            errorEl.textContent = errorMessage;
            errorEl.style.display = isValid ? 'none' : 'block'; // Affiche/cache le message
            
            return isValid;
        },
        
        // Valide tous les champs requis du formulaire
        validateForm() {
            let isFormValid = true;
            this.form.querySelectorAll('input[required], select[required]').forEach(field => {
                 if (!this.validateField(field)) {
                     isFormValid = false;
                 }
            });
            // Valide aussi les champs non requis qui ont une valeur (ex: téléphone)
            this.form.querySelectorAll('input:not([required]), textarea:not([required])').forEach(field => {
                 if (field.value.trim() && !this.validateField(field)) { // Si non vide ET invalide
                      isFormValid = false;
                 }
            });
            return isFormValid;
        },

        // Gère la soumission du formulaire vers l'API Vercel
        bindSubmit() {
            this.form.addEventListener('submit', async (e) => {
                e.preventDefault(); // Empêche la soumission HTML par défaut

                // 1. Valider le formulaire complet
                if (!this.validateForm()) {
                    this.showStatus('Veuillez corriger les erreurs indiquées.', 'error');
                    // Focus sur le premier champ en erreur pour l'accessibilité
                    this.form.querySelector('.error')?.focus(); 
                    return;
                }

                // 2. Empêcher double soumission
                if (state.isSubmitting) return; 
                state.isSubmitting = true;

                // 3. Mettre à jour l'UI (bouton loading, message statut)
                this.submitBtn.classList.add('loading'); 
                this.submitBtn.disabled = true;
                if (this.btnText) this.btnText.style.display = 'none'; // Cache texte
                if (this.loader) this.loader.style.display = 'inline-block'; // Montre loader
                this.showStatus('Envoi de votre demande...', ''); // Message neutre

                try {
                    // 4. Récupérer les données du formulaire
                    const formData = new FormData(this.form);
                    const data = Object.fromEntries(formData.entries());

                    // 5. Envoyer les données à l'API Serverless Vercel
                    const response = await fetch('/api/contact', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    // 6. Analyser la réponse de l'API
                    const result = await response.json();

                    if (response.ok && result.success) {
                        // 7. Succès -> Redirection vers la page de remerciement
                        console.log('Formulaire soumis avec succès:', result.reference);
                        window.location.href = '/merci.html'; 
                        // Envoyer événement GA4 si configuré
                        // window.SEYMR_GA4?.form.submitSuccess(data.product_interest, data);
                        // window.SEYMR_GA4?.events.generateLead(data.product_interest, 0); // Utiliser prix si disponible
                    } else {
                        // 8. Échec -> Afficher message d'erreur de l'API
                        throw new Error(result.message || `Erreur serveur ${response.status}`);
                    }
                } catch (error) {
                    console.error('Erreur lors de la soumission du formulaire:', error);
                    this.showStatus(`Erreur : ${error.message}. Veuillez réessayer.`, 'error');
                    // Envoyer événement GA4 d'erreur si configuré
                    // window.SEYMR_GA4?.form.validationError('form_submission', error.message);
                } finally {
                    // 9. Dans tous les cas, réinitialiser l'état du bouton et de soumission
                    state.isSubmitting = false;
                    this.submitBtn.classList.remove('loading');
                    this.submitBtn.disabled = false;
                     if (this.btnText) this.btnText.style.display = 'inline-block'; // Remontre texte
                     if (this.loader) this.loader.style.display = 'none'; // Cache loader
                }
            });
        },

        // Pré-remplit le sélecteur produit si on clique sur un bouton "Acquérir"
        bindProductPreselect() {
            document.addEventListener('click', (e) => {
                const productBtn = e.target.closest('[data-product]'); //
                if (productBtn) {
                    const productSelect = document.getElementById('product_interest'); //
                    const productName = productBtn.dataset.product; 
                    
                    if (productSelect && productName && productName !== 'Chargement...') {
                         // Vérifie si l'option existe avant de la sélectionner
                         if ([...productSelect.options].some(option => option.value === productName)) {
                              productSelect.value = productName; 
                              // Optionnel: Faire défiler jusqu'au formulaire
                              // document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                         } else {
                              console.warn(`Produit "${productName}" non trouvé dans le sélecteur.`);
                         }
                    }
                }
            });
        },

        // Affiche un message de statut sous le formulaire
        showStatus(message, type = '') { // type peut être 'error' ou 'success'
            if (!this.statusEl) return;
            this.statusEl.textContent = message;
            this.statusEl.className = `form-status ${type}`; 
            // Pour l'accessibilité, s'assure que le message est lu par les lecteurs d'écran
            this.statusEl.setAttribute('role', type === 'error' ? 'alert' : 'status'); 
        }
    };

    /**
     * Module: Scroll Animations
     * Anime les éléments avec data-animate lorsqu'ils deviennent visibles.
     */
    const ScrollAnimations = {
        init() {
            // Si IntersectionObserver n'est pas supporté, affiche tout directement
            if (!('IntersectionObserver' in window)) {
                this.showAllAnimations();
                console.warn("IntersectionObserver non supporté, animations affichées directement.");
                return;
            }

            this.observer = new IntersectionObserver(this.handleIntersect, {
                threshold: CONFIG.intersectionThreshold, // Déclenche quand 15% est visible
                rootMargin: '0px 0px -50px 0px' // Commence un peu avant que l'élément n'entre complètement
            });
            this.observeElements();
        },

        // Callback pour l'IntersectionObserver
        handleIntersect(entries, observer) {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    const delay = parseFloat(entry.target.dataset.delay || 0) * 1000; // Lire délai depuis data-delay="0.2s"
                    // Applique un délai + décalage basé sur l'ordre d'apparition
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, delay + index * CONFIG.animationDelay); 
                    
                    observer.unobserve(entry.target); // N'observe qu'une seule fois
                }
            });
        },

        // Observe tous les éléments marqués pour l'animation
        observeElements() {
            const elements = document.querySelectorAll('[data-animate]'); //
            elements.forEach(el => this.observer.observe(el));
        },

        // Fallback: Affiche tout si l'Observer n'est pas supporté
        showAllAnimations() {
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.classList.add('is-visible');
            });
        }
    };

    /**
     * Module: Performance Optimizations
     * Gère le lazy loading (si natif non supporté) et le prefetch des liens.
     */
    const Performance = {
        init() {
            this.addNativeLazyLoadSupport(); // Ajoute support pour anciens navigateurs
            this.prefetchInternalLinks(); // Précharge les liens internes au survol
        },

        // Ajoute un fallback JS pour le lazy loading si `loading="lazy"` n'est pas supporté
        addNativeLazyLoadSupport() {
            if ('loading' in HTMLImageElement.prototype) {
                 console.log("Lazy loading natif supporté.");
                 return; // Le navigateur gère nativement
            }

            console.log("Lazy loading natif NON supporté, activation du fallback JS.");
            const images = document.querySelectorAll('img[loading="lazy"]'); //
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        // Remplacer src par data-src si utilisé, sinon utilise src directement
                        if (img.dataset.src) img.src = img.dataset.src; 
                        // Gérer srcset si présent
                        if (img.dataset.srcset) img.srcset = img.dataset.srcset; 
                        img.removeAttribute('loading'); // Important pour éviter conflit
                        img.classList.add('lazyloaded'); // Classe pour feedback visuel (ex: transition opacity)
                        observer.unobserve(img); // Observer une seule fois
                    }
                });
            }, { rootMargin: '200px' }); // Charge un peu avant que l'image n'arrive

            images.forEach(img => imageObserver.observe(img));
        },

        // Précharge les pages internes au survol pour accélérer la navigation
        prefetchInternalLinks() {
            // Utilise l'événement 'mouseover' avec une option 'capture' pour déléguer
            document.body.addEventListener('mouseover', (e) => {
                const link = e.target.closest('a[href^="/"]'); // Cible uniquement les liens internes `href="/..."`
                
                if (link && !link.hasAttribute('data-prefetched')) {
                    // Vérifie si le prefetch est déjà dans le <head>
                    const alreadyPrefetched = document.querySelector(`link[rel="prefetch"][href="${link.href}"]`);
                    if (!alreadyPrefetched) {
                        const prefetchLink = document.createElement('link');
                        prefetchLink.rel = 'prefetch';
                        prefetchLink.href = link.href;
                        prefetchLink.as = 'document'; // Indique que c'est un document HTML
                        document.head.appendChild(prefetchLink);
                        link.setAttribute('data-prefetched', 'true'); // Marque pour ne pas le refaire
                        // console.log('Prefetching:', link.href);
                    }
                }
            }, { capture: true, passive: true }); // Options pour performance
        }
    };

    /**
     * Utility: Throttle function
     * Limite la fréquence d'appel d'une fonction (utile pour scroll, resize).
     */
    function throttle(func, limit) {
        let inThrottle;
        let lastResult;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
                lastResult = func.apply(context, args);
            }
            return lastResult;
        };
    } 

    /**
     * Initialize Application
     * Orchestre l'initialisation des modules dans le bon ordre.
     */
    async function initializeApp() {
        console.log('Initialisation SEYMR® App...');
        // 1. Appliquer le thème immédiatement pour éviter le flash
        ThemeManager.init();
        
        // 2. Charger le catalogue produits (étape asynchrone critique)
        await ProductsLoader.init(); 
        
        // 3. Initialiser les modules restants une fois le catalogue prêt
        Navigation.init();
        ModalManager.init();
        FormHandler.init(); // Dépend du catalogue pour le select
        ScrollAnimations.init();
        Performance.init();

        // 4. Marquer l'application comme complètement chargée (ex: pour cacher un loader)
        document.body.classList.add('app-loaded');
        console.log('✓ Application SEYMR® initialisée.');
    }

    // Démarrer l'application une fois le DOM prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp(); // Si le DOM est déjà prêt
    }

})(); // Fin de l'IIFE
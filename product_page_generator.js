const path = require('path');
/* * SEYMR® - Product Pages Generator
 * Génère automatiquement toutes les pages produits depuis _data/products.json
 */

const fs = require('fs').promises;

// Descriptions complètes et spécifications (MISES À JOUR selon votre dernier texte)
const PRODUCT_DESCRIPTIONS = {
  'fauteuil-sisit': {
    intro: "L'art quitte le mur pour habiter le quotidien. Ce fauteuil transpose une œuvre originale certifiée par imprégnation pigmentaire au cœur même de la fibre du velours. Chaque pièce devient ainsi dépositaire d'une création exclusive, abolissant toute hiérarchie entre mobilier et expression plastique contemporaine.",
    sections: [
      {
        title: "Quintessence de la Matière",
        content: "L'assise, généreuse et enveloppante, intègre une mousse haute densité de 45 kg/m³ qui garantit maintien et longévité. Le velours haute couture offre une profondeur tactile remarquable, sa texture servant d'écrin au motif. Le piètement, taillé dans un bois certifié FSC issu de forêts gérées durablement, ancre cette pièce dans une conscience environnementale contemporaine tout en assurant stabilité et élégance."
      },
      {
        title: "Signature d'Exclusivité",
        content: "Vingt-deux exemplaires pour le monde entier. Chaque fauteuil porte une numérotation gravée sous l'assise, attestation discrète de son authenticité. Garantie décennale, témoignage de notre confiance absolue dans les matériaux sélectionnés et les savoir-faire mobilisés."
      }
    ],
    specs: [
      "Édition mondiale limitée à 22 exemplaires numérotés",
      "Velours haute couture, mousse 45 kg/m³, piètement bois certifié FSC",
      "Hauteur 74 cm, largeur 63 cm",
      "Assise : profondeur 49 cm",
      "Dossier : hauteur 55 cm, largeur 50 cm",
      "Piètement : hauteur avant 23 cm, hauteur arrière 19 cm",
      "Poids : 7 kg"
    ]
  },
  'paravent': {
    intro: "Architecture modulable en quatre panneaux. Le paravent sculpte l'espace sans l'enfermer, créant des sanctuaires intimes au sein d'un volume plus vaste. Son motif symétrique agit comme une frontière perceptuelle qui structure le vide et réorganise la géométrie de la pièce selon vos intentions.",
    sections: [
      {
        title: "Œuvre Transposée et Structure",
        content: "Chaque panneau reçoit la transposition numérique d'une œuvre originale par fusion pigmentaire à la fibre du support textile. Cette technique préserve l'intensité chromatique et la fidélité du motif dans la durée. Assemblé manuellement dans notre manufacture londonienne, le paravent conjugue légèreté constructive et présence monumentale. Les charnières de haute précision permettent une configuration libre de l'espace."
      }
    ],
    specs: [
      "Édition mondiale limitée à 44 exemplaires",
      "Structure modulaire en 4 panneaux articulés",
      "Dimensions totales : largeur 224 cm, hauteur 152 cm",
      "Dimensions du motif : 64,06 × 81,81 cm ou 125,26 × 156,9 cm"
    ]
  },
  'tapis-nexus': {
    intro: "Un tapis définit un territoire. Celui-ci établit une zone d'influence qui commande l'ordonnancement de la pièce entière. Marcher sur ses motifs, c'est interagir avec une cartographie visuelle qui ancre et unifie l'espace.",
    sections: [
      {
        title: "Œuvre Transposée et Matière",
        content: "Réalisé en panne de velours marbrée, matière sélectionnée pour sa texture profonde et ses reflets changeants qui animent le dessin. Le motif transpose une œuvre d'art certifiée dont l'intégrité chromatique demeure intacte. Tissé avec une densité exceptionnelle par nos artisans londoniens, il reçoit une finition en frange de coton brut et des coutures au fil blanc."
      }
    ],
    specs: [
      "Édition mondiale limitée à 44 exemplaires",
      "Panne de velours marbrée, tissage haute densité",
      "Dimensions : largeur 128 cm, longueur 150 cm",
      "Finitions : frange en coton brut, coutures au fil blanc"
    ]
  },
  'repose-pieds-satellite': {
    intro: "Conçu comme extension d'un fauteuil ou comme sculpture autonome, SATELLITE complète l'harmonie spatiale de la pièce. Le motif qui l'habille poursuit le dialogue visuel initié par les autres pièces de la collection.",
    sections: [
      {
        title: "Œuvre Transposée et Maîtrise Artisanale",
        content: "Le motif, transposé avec une fidélité pigmentaire sur le velours ignifugé, préserve l'intégrité de l'œuvre originale. La structure et le piètement sont façonnés en bois certifié FSC, garantissant provenance responsable et stabilité durable. Le velours ignifugé offre une texture profonde et une résilience remarquable."
      }
    ],
    specs: [
      "Édition mondiale limitée à 44 exemplaires",
      "Velours ignifugé, structure et piètement en bois certifié FSC",
      "Forme carrée",
      "Dimensions : longueur 38 cm, largeur 38 cm, hauteur 39 cm",
      "Hauteur du piètement : 25 cm, profondeur du coussin : 14 cm",
      "Poids : 3,5 kg"
    ]
  },
  'pouf-cosmosis': {
    intro: "Sphère de 70 cm qui impose sa présence magnétique. Son volume sphérique commande l'espace environnant, agissant comme pivot visuel de la pièce. Habillé d'une impression à la fidélité muséale du motif SEYMR®.",
    sections: [
      {
        title: "Œuvre Transposée et Technologie",
        content: "La suédine ultra-dense de 250 g/m² reçoit la transposition intégrale de l'œuvre originale. Le garnissage viscoélastique procure une assise enveloppante tout en offrant un soutien morphologique adapté. Chaque sphère est façonnée manuellement à Londres."
      }
    ],
    specs: [
      "Édition mondiale limitée à 44 exemplaires",
      "Suédine haute densité 250 g/m², garnissage viscoélastique",
      "Dimensions : diamètre 70 cm, hauteur 70 cm"
    ]
  },
  'tirage-art': {
    intro: "Ce tirage constitue la manifestation la plus épurée du code SEYMR®. Fragment capturé de l'œuvre originale, il ouvre une fenêtre sur les architectures invisibles qui gouvernent la perception de l'espace.",
    sections: [
      {
        title: "Matérialité de l'Archive",
        content: "L'œuvre est matérialisée par impression haute définition sur soie de 51 cm. L'encadrement en bois noir mat, certifié FSC, est réalisé par nos maîtres artisans londoniens. Le verso intègre un certificat d'authenticité A5 détachable."
      }
    ],
    specs: [
      "Édition mondiale limitée à 11 exemplaires numérotés",
      "Impression haute définition sur soie de 51 cm",
      "Encadrement : cadre de 61 cm en bois noir mat certifié FSC",
      "Certificat d'authenticité A5 détachable au verso du cadre"
    ]
  },
  'sac-conqueror': {
    intro: "Archive mobile et territoire porté. Ce sac est conçu comme prolongement de votre souveraineté personnelle. Son motif agit comme signature visuelle qui délimite votre espace, où que vous soyez.",
    sections: [
      {
        title: "Maîtrise Artisanale et Matériaux Souverains",
        content: "Chaque sac est façonné manuellement dans notre manufacture londonienne à partir d'un cuir pleine fleur grainé. Le motif est gravé par procédé haute précision. Les coutures au fil noir charbon et les éléments métalliques en acier brossé témoignent d'une exécution rigoureuse."
      }
    ],
    specs: [
      "Édition mondiale limitée à 99 exemplaires",
      "Cuir pleine fleur grainé, gravure haute précision",
      "Dimensions : longueur 51 cm, profondeur 23 cm, hauteur 28,5 cm",
      "Finitions : éléments métalliques en acier brossé, coutures au fil noir charbon"
    ]
  },
  'porte-documents': {
    intro: "Objet conçu pour sanctuariser les instruments de votre autorité : contrats, documents, créations. Le motif qui l'enveloppe, issu de notre atelier guadeloupéen, agit comme sceau protecteur.",
    sections: [
      {
        title: "Maîtrise Artisanale et Exclusivité",
        content: "Façonné manuellement dans notre manufacture londonienne à partir d'un cuir pleine fleur grainé. La transposition du motif sur le cuir est réalisée avec une précision qui garantit tension graphique et longévité. Les coutures et éléments métalliques assurent sa pérennité."
      }
    ],
    specs: [
      "Édition mondiale limitée à 99 exemplaires",
      "Cuir pleine fleur grainé, transposition haute précision",
      "Finitions : éléments métalliques en acier brossé, coutures au fil noir charbon"
    ]
  },
  'valise': {
    intro: "Voyager avec cette valise, c'est déplacer votre centre de gravité. Elle projette votre identité dans les espaces de transition, transformant le déplacement en affirmation de présence.",
    sections: [
      {
        title: "Œuvre Transposée sur Coque",
        content: "La coque protectrice reçoit le motif symétrique par fusion haute précision, opération réalisée dans notre manufacture londonienne pour garantir adhérence et durabilité parfaites. Le motif transpose l'œuvre en haute définition."
      }
    ],
    specs: [
      "Édition mondiale limitée à 99 exemplaires",
      "Format valise cabine normalisé",
      "Technique : fusion du motif sur coque par procédé haute précision"
    ]
  },
  'casquette': {
    intro: "Au-delà de l'accessoire, cette casquette signale une appartenance. La porter affirme une adhésion à une philosophie et une esthétique qui transcendent les codes conventionnels.",
    sections: [
      {
        title: "Œuvre Transposée sur Soie",
        content: "Confectionnée en satin de soie de 85 g/m². Le motif transpose fidèlement le code SEYMR® sur le textile. Les surpiqûres ton crème et les détails métalliques nickelés, réalisés à Londres, témoignent d'une exigence appliquée à chaque création."
      }
    ],
    specs: [
      "Édition mondiale limitée à 99 exemplaires",
      "Satin de soie 85 g/m²",
      "Finitions : surpiqûres ton crème, détails métalliques nickelés"
    ]
  }
};

/**
 * Template HTML de page produit
 * Génère le contenu HTML complet pour une page produit donnée.
 */
function generateProductHTML(product, description) {
  const slug = product.id;
  const pageUrl = `https://seymr.art/${slug}.html`; 
  const itemId = `SEYMR-${slug.toUpperCase().replace(/-/g, '')}-001`; 
  
  const specsHTML = (description.specs || []).map(spec => `<li>${spec}</li>`).join('\n                                ');
  const sectionsHTML = (description.sections || []).map(section => `
                            <h3>${section.title}</h3>
                            <p>${section.content.replace(/"/g, '&quot;')}</p> `).join('\n');
  
  const mainImage = product.images?.main || 'assets/placeholder.jpg'; 
  const galleryImages = Array.isArray(product.images?.gallery) ? product.images.gallery : [];
  const absoluteMainImage = mainImage.startsWith('assets/') ? `/${mainImage}` : mainImage;
  const absoluteGalleryImages = galleryImages.map(img => img.startsWith('assets/') ? `/${img}` : img);
  const absoluteThumbnails = [absoluteMainImage, ...absoluteGalleryImages].slice(0, 4); 
  const schemaImages = [absoluteMainImage, ...absoluteGalleryImages]; 

  const formattedPrice = product.price || 'Sur demande';
  const priceNumeric = product.price_numeric;

  return `<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product.seo?.title || product.display_name + ' | SEYMR®'}</title>
    
    <meta name="robots" content="index, follow, max-image-preview:large">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="description" content="${product.seo?.description || description.intro.substring(0, 160)}">
    <meta name="keywords" content="${product.seo?.keywords || slug + ', SEYMR, art fréquentiel, ' + product.category + ', édition limitée'}">
    
    <meta property="og:title" content="${product.seo?.title || product.display_name + ' | SEYMR®'}">
    <meta property="og:description" content="${product.edition}. ${description.intro.substring(0, 150)}...">
    <meta property="og:type" content="product">
    <meta property="og:url" content="${pageUrl}"> 
    <meta property="og:image" content="https://seymr.art${absoluteMainImage}"> 
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    ${priceNumeric ? `<meta property="product:price:amount" content="${priceNumeric}">` : ''}
    <meta property="product:price:currency" content="EUR">
    
    <link rel="canonical" href="${pageUrl}"> 
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <style>
        :root{--or-souverain:#D4AF37;--noir-absolu:#0A0A0A;--blanc-pur:#FAFAFA;--gris-noble:#2A2A2A;--font-titre:'Cormorant Garamond',serif;--font-corps:'Montserrat',sans-serif}*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}body{font-family:var(--font-corps);background:var(--noir-absolu);color:var(--blanc-pur);overflow-x:hidden;min-height:100vh;font-weight:300;line-height:1.6}nav{position:fixed;top:0;width:100%;z-index:1000;background:rgba(10,10,10,0.98);backdrop-filter:blur(10px);transition:all .3s}
        .skip-link{position:absolute;top:-40px;left:0;background:var(--or-souverain);color:var(--noir-absolu);padding:8px;text-decoration:none;z-index:9999} .skip-link:focus{top:0}
    </style>
    
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@200;300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/styles.css"> 
    <link rel="stylesheet" href="/assets/css/product_page.css"> 
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "${product.display_name}",
      "description": "${description.intro.replace(/"/g, '\\"')}",
      "image": [
        ${schemaImages.map(img => `"https://seymr.art${img}"`).join(',\n        ')}
      ],
      "sku": "${itemId}", 
      "brand": {
        "@type": "Brand",
        "name": "SEYMR®"
      },
      "offers": {
        "@type": "Offer",
        "url": "${pageUrl}", 
        "priceCurrency": "EUR",
        ${priceNumeric ? `"price": "${priceNumeric}",` : ''} 
        "priceValidUntil": "2025-12-31", 
        "itemCondition": "https://schema.org/NewCondition", 
        "availability": "${product.availability === 'Disponible' ? 'https://schema.org/InStock' : product.availability === 'Sur commande' ? 'https://schema.org/PreOrder' : 'https://schema.org/LimitedAvailability'}",
        "seller": {
          "@type": "Organization",
          "name": "SEYMR®"
        }
      },
      "material": "${product.materials}",
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Édition",
          "value": "${product.edition}"
        },
        {
          "@type": "PropertyValue",
          "name": "Catégorie",
          "value": "${product.category}"
        },
        {
          "@type": "PropertyValue",
          "name": "Fabrication",
          "value": "${product.manufacturing}"
        },
        {
          "@type": "PropertyValue",
          "name": "Conception",
          "value": "${product.design}"
        }
         ${product.specs?.dimensions ? `, {
          "@type": "PropertyValue",
          "name": "Dimensions",
          "value": "${product.specs.dimensions}"
        }` : ''}
         ${product.specs?.weight ? `, {
          "@type": "PropertyValue",
          "name": "Poids",
          "value": "${product.specs.weight}"
        }` : ''}
      ]
    }
    </script>
    
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
      
      gtag('event', 'view_item', {
        currency: 'EUR',
        value: ${priceNumeric || 0}, 
        items: [{
          item_id: '${itemId}', 
          item_name: '${product.display_name}',
          item_category: '${product.category}',
          item_brand: 'SEYMR',
          price: ${priceNumeric || 0},
          quantity: 1
        }]
      });
    </script>
</head>
<body>
    <a href="#main" class="skip-link">Aller au contenu principal</a>
    
    <nav role="navigation" aria-label="Navigation principale">
        <div class="nav-container">
            <a href="/index.html" class="nav-logo" aria-label="SEYMR - Accueil">SEYMR®</a>
            <div class="nav-center"> 
                <ul class="nav-menu" role="menubar">
                    <li role="none"><a href="/index.html#oeuvre" class="nav-link" role="menuitem">L'Œuvre</a></li>
                    <li role="none"><a href="/index.html#philosophie" class="nav-link" role="menuitem">Philosophie</a></li>
                    <li role="none"><a href="/index.html#creations" class="nav-link" role="menuitem">Créations</a></li>
                    <li role="none"><a href="/index.html#contact" class="nav-link" role="menuitem">Contact</a></li>
                </ul>
            </div>
            <div class="nav-right">
                <button class="theme-toggle" id="themeToggle" aria-label="Basculer le thème">
                    <span class="theme-icon"></span> 
                </button>
                <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Menu mobile" aria-expanded="false">
                    <span></span><span></span><span></span>
                </button>
            </div>
        </div>
    </nav>
    <div id="navigation-overlay" class="navigation-overlay" aria-hidden="true">
        <ul class="mobile-nav" role="menu">
             <li role="none"><a href="/index.html#oeuvre" class="nav-link" role="menuitem">L'Œuvre</a></li>
             <li role="none"><a href="/index.html#philosophie" class="nav-link" role="menuitem">Philosophie</a></li>
             <li role="none"><a href="/index.html#creations" class="nav-link" role="menuitem">Créations</a></li>
             <li role="none"><a href="/index.html#livre" class="nav-link" role="menuitem">Le Livre</a></li>
             <li role="none"><a href="/index.html#archives" class="nav-link" role="menuitem">Archives</a></li>
             <li role="none"><a href="/index.html#contact" class="nav-link" role="menuitem">Contact</a></li>
             <li role="none"><a href="#sanctuaire" class="nav-link sanctuary-mobile" data-modal="sanctuaire">Sanctuaire</a></li>
        </ul>
    </div>

    <main id="main">
        <section class="product-hero">
            <div class="product-container">
                <nav class="product-breadcrumb" aria-label="Fil d'Ariane">
                    <a href="/index.html">Accueil</a> / 
                    <a href="/index.html#creations">Créations</a> / 
                    <span>${product.display_name}</span>
                </nav>

                <div class="product-layout">
                    <div class="product-gallery">
                        <img src="${absoluteMainImage}" 
                             alt="${product.display_name} SEYMR® - Vue principale" 
                             class="main-image" 
                             id="mainImage"
                             fetchpriority="high" width="800" height="800"> 
                        <div class="thumbnail-grid">
                            ${absoluteThumbnails.map((img, i) => `<img src="${img}" alt="Vue ${i + 1} de ${product.display_name}" class="thumbnail ${img === absoluteMainImage ? 'active' : ''}" data-full="${img}" width="150" height="150">`).join('\n                            ')}
                        </div>
                    </div>

                    <div class="product-details">
                        <h1 class="product-title">${product.display_name}</h1>
                        <p class="product-tagline">${product.tagline}</p>
                        <div class="product-price">${formattedPrice}</div>

                        <div class="product-specs">
                            <div class="spec-item">
                                <span class="spec-label">Édition</span>
                                <span class="spec-value">${product.edition}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Fabrication</span>
                                <span class="spec-value">${product.manufacturing}</span>
                            </div>
                            ${product.specs?.dimensions ? `
                            <div class="spec-item">
                                <span class="spec-label">Dimensions</span>
                                <span class="spec-value">${product.specs.dimensions}</span>
                            </div>` : ''}
                            ${product.specs?.weight ? `
                            <div class="spec-item">
                                <span class="spec-label">Poids</span>
                                <span class="spec-value">${product.specs.weight}</span>
                            </div>` : ''}
                            ${product.specs?.format ? `
                            <div class="spec-item">
                                <span class="spec-label">Format</span>
                                <span class="spec-value">${product.specs.format}</span>
                            </div>` : ''}
                            <div class="spec-item">
                                <span class="spec-label">Matériaux</span>
                                <span class="spec-value">${product.materials}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Délai</span>
                                <span class="spec-value">${product.lead_time}</span>
                            </div>
                        </div>

                        <div class="product-description">
                            ${description.intro ? `<p>${description.intro.replace(/"/g, '&quot;')}</p>` : ''}
                            ${sectionsHTML}
                            
                            ${specsHTML.length > 0 ? `<h3>Spécifications Complètes</h3><ul>${specsHTML}</ul>` : ''}
                        </div>

                        <div class="product-cta">
                            <a href="/index.html#contact" class="btn-acquire-product" data-product="${product.name}" id="acquireBtn">
                                Initier l'acquisition
                            </a>
                            <p class="cta-secondary">Un conseiller vous contactera sous 24h</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer" role="contentinfo">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <p class="footer-logo">SEYMR®</p>
                    <p class="footer-tagline">Maison de Création • Depuis MMXVIII</p>
                </div>
                <div class="footer-contact">
                    <p>Saint-Barthélemy • Londres • Guadeloupe</p>
                    <p><a href="tel:+590691267209">+590 691 267 209</a></p>
                    <p><a href="mailto:concierge@seymr.art">concierge@seymr.art</a></p>
                </div>
                <div class="footer-legal">
                    <p>© SEYMR® ${new Date().getFullYear()}. Tous droits réservés.</p>
                    <p>
                        <a href="/mentions-legales.html">Mentions légales</a> • 
                        <a href="/confidentialite.html">Confidentialité</a> • 
                        <a href="/cgv.html">Conditions de Vente</a>
                    </p>
                </div>
            </div>
        </div>
    </footer>

    <script src="/assets/js/ga4_events_tracking.js" defer></script> 
    <script src="/assets/js/main.js" defer></script> 
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const thumbnails = document.querySelectorAll('.thumbnail');
            const mainImage = document.getElementById('mainImage');
            
            if (mainImage && thumbnails.length > 0) {
                 const firstThumbSrc = thumbnails[0]?.dataset?.full;
                 if (firstThumbSrc && mainImage.src !== new URL(firstThumbSrc, window.location.origin).href) {
                     mainImage.src = firstThumbSrc; 
                 }
                
                thumbnails.forEach(thumb => {
                    thumb.addEventListener('click', function() {
                        if (this.classList.contains('active')) return; 
                        mainImage.style.opacity = '0.5'; 
                        setTimeout(() => {
                           mainImage.src = this.dataset.full;
                           mainImage.alt = this.alt; 
                           mainImage.style.opacity = '1'; 
                        }, 150); 
                        thumbnails.forEach(t => t.classList.remove('active'));
                        this.classList.add('active');
                    });
                });
            }

             const acquireButton = document.getElementById('acquireBtn');
             if (acquireButton) {
                 acquireButton.addEventListener('click', function(e) {
                      const productName = this.dataset.product;
                      sessionStorage.setItem('preselectedProduct', productName); 

                      const priceText = document.querySelector('.product-price')?.textContent || '0';
                      const price = parseFloat(priceText.replace(/[^\\d.,]/g, '').replace(',', '.')) || 0; 
                      
                       if (typeof gtag === 'function') {
                            const itemIdForGA = '${itemId}'; 
                            const productNameForGA = '${product.display_name}'; 
                            
                            gtag('event', 'add_to_cart', {
                                currency: 'EUR',
                                value: price,
                                items: [{
                                    item_id: itemIdForGA,
                                    item_name: productNameForGA,
                                    item_brand: 'SEYMR',
                                    price: price,
                                    quantity: 1
                                }]
                            });
                       } else {
                            console.warn('gtag non défini, add_to_cart non envoyé.');
                       }
                 });
             }
        });
    </script>
</body>
</html>`;
}

/**
 * Fonction principale qui génère toutes les pages produits.
 */
async function generateAllProductPages() {
  try {
    console.log("Lecture du catalogue produits depuis _data/products.json...");
    const productsJsonPath = path.join(process.cwd(), '_data', 'products.json');
    const productsData = await fs.readFile(productsJsonPath, 'utf8');
    const { products } = JSON.parse(productsData);
    
    console.log(`🚀 Démarrage de la génération pour ${products.length} produits (excluant spéciaux)...`);
    
    let generatedCount = 0;
    let skippedCount = 0;
    
    for (const product of products) {
      const slug = product.id; 
      
      if (slug === 'autre' || slug === 'le-livre') { 
             console.log(`⊘ Ignoré (entrée spéciale): ${product.display_name}`);
             skippedCount++;
             continue; 
      }
      
      const description = PRODUCT_DESCRIPTIONS[slug]; 
      
      if (!description) {
        console.warn(`⚠️  Attention: Description longue (PRODUCT_DESCRIPTIONS) manquante pour ${slug}. Page ignorée.`);
        skippedCount++;
        continue; 
      }
      
       product.images = product.images || {};
       product.images.main = product.images.main || 'assets/placeholder.jpg';
       product.images.gallery = Array.isArray(product.images.gallery) ? product.images.gallery : [];
       if (!product.images.main.startsWith('assets/')) {
           console.warn(`⚠️ Path image principal invalide pour ${slug}: ${product.images.main}`);
           product.images.main = 'assets/placeholder.jpg';
       }
       
      console.log(`   🛠️  Génération de ${slug}.html...`);
      const htmlContent = generateProductHTML(product, description);
      
      const outputFilename = `${slug}.html`;
      
      await fs.writeFile(outputFilename, htmlContent, 'utf8');
      console.log(`   ✅ Fichier généré: ${outputFilename}`);
      generatedCount++;
    }
    
    console.log(`\n✨ Terminé! ${generatedCount} pages produits générées, ${skippedCount} entrées ignorées.`);
    console.log(`\n➡️  Assurez-vous que les fichiers CSS (/assets/css/...) et JS (/assets/js/...) existent.`);
    console.log(`\n📤 Poussez ces changements sur GitHub pour le déploiement Vercel.`);
    
  } catch (error) {
    console.error('❌ Erreur critique lors de la génération des pages:', error);
    process.exit(1); 
  }
}

if (require.main === module) {
  generateAllProductPages();
}

module.exports = { generateAllProductPages, generateProductHTML };
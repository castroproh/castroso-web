/**
 * CASTROSO.JPG — Main JavaScript
 * Interacciones: navegación responsive, filtros, animaciones, formularios
 */

(() => {
    'use strict';

    // ==========================================================================
    // Configuración desde config.js
    // ==========================================================================

    const CONFIG = window.CASTROSO_CONFIG || {
        basePath: '',
        siteUrl: '',
        formspreeEndpoint: '',
        newsletterEndpoint: '',
        studio: {},
        contact: {}
    };

    // ==========================================================================
    // Utilidades
    // ==========================================================================

    const $ = (selector, context = document) => context.querySelector(selector);
    const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

    const debounce = (fn, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(null, args), delay);
        };
    };

    const prefersReducedMotion = () => 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ==========================================================================
    // Navegación Responsive
    // ==========================================================================

    const initMobileNav = () => {
        const toggle = $('.nav-toggle');
        const navList = $('.nav-list');
        const nav = $('.main-nav');
        const body = document.body;
        const mobileBreakpoint = 860;

        if (!toggle || !navList || !nav) return;

        const openMenu = () => {
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Cerrar menú');
            navList.classList.add('nav-list--open');
            body.style.overflow = 'hidden';
            navList.querySelector('a')?.focus();
        };

        const closeMenu = () => {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Abrir menú');
            navList.classList.remove('nav-list--open');
            body.style.overflow = '';
        };

        const handleKeydown = (e) => {
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            if (e.key === 'Escape' && isOpen) {
                closeMenu();
                toggle.focus();
            }
            
            if (e.key === 'Tab' && isOpen) {
                const focusableElements = navList.querySelectorAll(
                    'a[href], button, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (firstElement && e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (lastElement && !e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        toggle.addEventListener('click', () => {
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close on link click
        $$('a', navList).forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('click', (e) => {
            if (toggle.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target)) {
                closeMenu();
            }
        });

        // Keyboard handling
        document.addEventListener('keydown', handleKeydown);

        // Handle resize
        const handleResize = debounce(() => {
            if (window.innerWidth > mobileBreakpoint && toggle.getAttribute('aria-expanded') === 'true') {
                closeMenu();
            }
        }, 250);

        window.addEventListener('resize', handleResize);
    };

    // ==========================================================================
    // Header Scroll Effect
    // ==========================================================================

    const initHeaderScroll = () => {
        const header = $('.site-header');
        if (!header) return;

        let lastScroll = 0;
        const threshold = 100;

        const handleScroll = debounce(() => {
            const currentScroll = window.scrollY;
            
            if (currentScroll > threshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        }, 50);

        window.addEventListener('scroll', handleScroll, { passive: true });
    };

    // ==========================================================================
    // Project Filters & Pagination
    // ==========================================================================

    const initProjectFilters = () => {
        const filterBar = $('.filters');
        const grid = $('#projects-grid');
        const emptyState = $('#projects-empty');
        const pagination = $('#pagination');
        
        if (!filterBar || !grid) return;

        const buttons = $$('.filter-btn', filterBar);
        const cards = $$('.project-card', grid);
        const projectsData = window.PROJECTS_DATA || [];
        const perPage = window.PROJECTS_PER_PAGE || 9;
        let currentPage = 1;
        let currentFilter = 'all';
        let filteredProjects = [...projectsData];

        if (buttons.length === 0 || cards.length === 0) return;

        const renderProjects = () => {
            const start = (currentPage - 1) * perPage;
            const end = start + perPage;
            const pageProjects = filteredProjects.slice(start, end);
            
            // Hide all cards
            cards.forEach(card => card.hidden = true);
            
            // Show current page projects
            pageProjects.forEach((project, index) => {
                const card = cards.find(c => c.dataset.projectSlug === project.slug);
                if (card) {
                    card.hidden = false;
                    card.style.animation = 'fadeInUp 0.4s ease forwards';
                    card.style.animationDelay = `${index * 0.05}s`;
                }
            });
            
            // Show/hide empty state
            if (emptyState) {
                emptyState.hidden = filteredProjects.length > 0;
            }
            
            // Update pagination
            updatePagination(filteredProjects.length);
            
            // Update URL
            const params = new URLSearchParams();
            if (currentFilter !== 'all') params.set('category', currentFilter);
            if (currentPage > 1) params.set('page', currentPage.toString());
            const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
            window.history.replaceState({}, '', newUrl);
        };

        const filterProjects = (category) => {
            currentFilter = category;
            currentPage = 1;
            
            buttons.forEach(btn => {
                const isActive = btn.dataset.filter === category;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-pressed', isActive);
            });

            filteredProjects = category === 'all' 
                ? [...projectsData] 
                : projectsData.filter(p => slugify(p.category) === category || (p.categories || []).some(c => slugify(c) === category));
            
            renderProjects();
        };

        const updatePagination = (totalItems) => {
            if (!pagination) return;
            
            const totalPages = Math.ceil(totalItems / perPage);
            const pageInfo = pagination.querySelector('.page-info');
            const prevBtn = pagination.querySelector('[data-page="prev"]');
            const nextBtn = pagination.querySelector('[data-page="next"]');
            
            if (totalPages <= 1) {
                pagination.hidden = true;
                return;
            }
            
            pagination.hidden = false;
            
            if (pageInfo) {
                pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
            }
            
            if (prevBtn) {
                prevBtn.disabled = currentPage === 1;
                prevBtn.setAttribute('aria-disabled', currentPage === 1);
            }
            
            if (nextBtn) {
                nextBtn.disabled = currentPage === totalPages;
                nextBtn.setAttribute('aria-disabled', currentPage === totalPages);
            }
        };

        const goToPage = (page) => {
            const totalPages = Math.ceil(filteredProjects.length / perPage);
            if (page < 1 || page > totalPages) return;
            currentPage = page;
            renderProjects();
            window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' });
        };

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.filter || 'all';
                filterProjects(category);
            });
        });

        pagination?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-page]');
            if (!btn) return;
            
            const page = btn.dataset.page;
            if (page === 'prev') goToPage(currentPage - 1);
            else if (page === 'next') goToPage(currentPage + 1);
        });

        // Check URL for initial state
        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('category') || 'all';
        const initialPage = parseInt(urlParams.get('page') || '1', 10);
        
        const validCategories = ['all', ...buttons.map(b => b.dataset.filter).filter(Boolean)];
        if (validCategories.includes(initialCategory)) {
            filterProjects(initialCategory);
            if (initialPage > 1) {
                currentPage = initialPage;
                renderProjects();
            }
        }

        function slugify(str) {
            return String(str)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }
    };

    // ==========================================================================
    // Intersection Observer for Animations
    // ==========================================================================

    const initScrollAnimations = () => {
        if (prefersReducedMotion()) {
            $$('.animate-entrance').forEach(el => el.style.opacity = '1');
            return;
        }

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        $$('.animate-entrance').forEach(el => observer.observe(el));
    };

    // ==========================================================================
    // Form Handling (Formspree)
    // ==========================================================================

    const initContactPrefill = () => {
        const serviceSelect = $('#servicio');
        const requestedService = new URLSearchParams(window.location.search).get('servicio');
        if (!serviceSelect || !requestedService) return;

        const normalize = value => value.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const category = CONFIG.serviceCategories?.[requestedService];
        const options = Array.from(serviceSelect.options);
        const option = options.find(item => normalize(item.value) === normalize(requestedService))
            || options.find(item => category && normalize(item.value) === normalize(category));

        if (option) serviceSelect.value = option.value;
    };

    const initContactForm = () => {
        const form = $('#contact-form');
        if (!form) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const statusContainer = form.querySelector('.form-status');
        const honeypotField = form.querySelector(`[name="${CONFIG.contact?.honeypot_field || 'website_url'}"]`);
        const successMessage = CONFIG.contact?.success_message || 'Gracias por contactarnos. Revisaremos tu mensaje y te responderemos pronto.';
        const errorMessage = CONFIG.contact?.error_message || 'Hubo un error al enviar el formulario. Inténtalo de nuevo o escríbenos directamente a Instagram.';

        // Remove honeypot from accessibility tree
        if (honeypotField) {
            honeypotField.setAttribute('tabindex', '-1');
            honeypotField.setAttribute('autocomplete', 'off');
            honeypotField.style.display = 'none';
            honeypotField.setAttribute('aria-hidden', 'true');
        }

        const showMessage = (type, text) => {
            if (!statusContainer) return;
            
            statusContainer.className = `form-status form-status--${type}`;
            statusContainer.textContent = text;
            statusContainer.hidden = false;
            
            statusContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };

        const hideMessage = () => {
            if (statusContainer) {
                statusContainer.hidden = true;
            }
        };

        const setLoading = (loading) => {
            if (submitBtn) {
                submitBtn.disabled = loading;
                submitBtn.setAttribute('aria-busy', loading);
                submitBtn.innerHTML = loading 
                    ? '<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="30 100" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></circle></svg> Enviando...'
                    : CONFIG.contact?.submit_text || 'Enviar solicitud';
            }
        };

        const validateField = (field) => {
            const errorId = `${field.name}-error`;
            let errorEl = form.querySelector(`#${errorId}`);
            
            if (!field.checkValidity()) {
                field.setAttribute('aria-invalid', 'true');
                
                if (!errorEl) {
                    errorEl = document.createElement('p');
                    errorEl.id = errorId;
                    errorEl.className = 'form-error';
                    field.parentNode.appendChild(errorEl);
                }
                
                errorEl.textContent = field.validationMessage;
                field.setAttribute('aria-describedby', errorId);
                return false;
            } else {
                field.setAttribute('aria-invalid', 'false');
                field.removeAttribute('aria-describedby');
                if (errorEl) {
                    errorEl.remove();
                }
                return true;
            }
        };

        // Real-time validation
        $$('input, textarea, select', form).forEach(field => {
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => {
                if (field.getAttribute('aria-invalid') === 'true') {
                    validateField(field);
                }
            });
        });

        // Form submit
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideMessage();

            // Check honeypot
            if (honeypotField && honeypotField.value) {
                showMessage('error', 'Spam detectado.');
                return;
            }

            // Validate all fields
            let isValid = true;
            $$('input[required], textarea[required], select[required]', form).forEach(field => {
                if (!validateField(field)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                const firstInvalid = form.querySelector('[aria-invalid="true"]');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            const endpoint = CONFIG.formspreeEndpoint;
            if (!endpoint) {
                showMessage('warning', 'El formulario no está activo todavía. Puedes contactarnos por Instagram mientras configuramos el envío.');
                return;
            }

            setLoading(true);

            try {
                const formData = new FormData(form);
                
                // Remove honeypot from submission
                if (CONFIG.contact?.honeypot_field) {
                    formData.delete(CONFIG.contact.honeypot_field);
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok && result.ok) {
                    showMessage('success', successMessage);
                    form.reset();
                    
                    // Reset validation states
                    $$('[aria-invalid]', form).forEach(field => {
                        field.removeAttribute('aria-invalid');
                        const errorId = `${field.name}-error`;
                        const errorEl = form.querySelector(`#${errorId}`);
                        if (errorEl) errorEl.remove();
                    });
                } else {
                    showMessage('error', result.error || errorMessage);
                    
                    // Show field errors if provided
                    if (result.errors) {
                        Object.entries(result.errors).forEach(([fieldName, message]) => {
                            const field = form.querySelector(`[name="${fieldName}"]`);
                            if (field) {
                                field.setAttribute('aria-invalid', 'true');
                                let errorEl = form.querySelector(`#${fieldName}-error`);
                                if (!errorEl) {
                                    errorEl = document.createElement('p');
                                    errorEl.id = `${fieldName}-error`;
                                    errorEl.className = 'form-error';
                                    field.parentNode.appendChild(errorEl);
                                }
                                errorEl.textContent = message;
                                field.setAttribute('aria-describedby', `${fieldName}-error`);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Form submission error:', error);
                
                if (!CONFIG.formspreeEndpoint) {
                    showMessage('warning', 'El formulario no está activo todavía. Puedes contactarnos por Instagram mientras configuramos el envío.');
                } else {
                    showMessage('error', 'Error de conexión. Inténtalo de nuevo o escríbenos directamente por Instagram.');
                }
            } finally {
                setLoading(false);
            }
        });
    };

    // ==========================================================================
    // Newsletter Form
    // ==========================================================================

    const initNewsletterForm = () => {
        const form = $('.newsletter-form[data-formspree]');
        if (!form) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const emailInput = form.querySelector('input[type="email"]');
        const endpoint = CONFIG.newsletterEndpoint;

        if (!endpoint) {
            // Disable if no endpoint
            form.innerHTML = '<p class="form-disclaimer">Suscríbete a nuestro newsletter próximamente. Síguenos en <a href="' + CONFIG.studio?.instagram + '" target="_blank" rel="noopener">Instagram</a> mientras tanto.</p>';
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput?.value?.trim();
            if (!email || !email.includes('@')) return;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Suscribiendo...';

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (response.ok) {
                    form.innerHTML = '<p class="form-success">¡Gracias por suscribirte! Te mantendremos al día.</p>';
                } else {
                    throw new Error('Subscription failed');
                }
            } catch {
                alert('Error al suscribir. Inténtalo de nuevo más tarde.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Suscribirse';
            }
        });
    };

    // ==========================================================================
    // Gallery Lightbox
    // ==========================================================================

    const initGalleryLightbox = () => {
        const galleryImages = $$('[data-lightbox] img, .project-cover img, .gallery-item img');
        if (galleryImages.length === 0) return;

        let lightbox = null;
        let currentIndex = 0;
        const images = Array.from(galleryImages).map(img => ({
            src: img.src,
            alt: img.alt || ''
        }));

        const createLightbox = () => {
            lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.hidden = true;
            lightbox.innerHTML = `
                <div class="lightbox-overlay" data-lightbox-close></div>
                <button class="lightbox-close" data-lightbox-close aria-label="Cerrar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <button class="lightbox-prev" data-lightbox-prev aria-label="Anterior">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button class="lightbox-next" data-lightbox-next aria-label="Siguiente">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                <div class="lightbox-content">
                    <img class="lightbox-image" src="" alt="">
                    <div class="lightbox-caption"></div>
                </div>
                <div class="lightbox-counter"></div>
            `;
            document.body.appendChild(lightbox);

            const style = document.createElement('style');
            style.textContent = `
                .lightbox {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(8, 9, 11, 0.98);
                    backdrop-filter: blur(10px);
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                }
                .lightbox:not([hidden]) {
                    opacity: 1;
                    visibility: visible;
                }
                .lightbox-overlay { position: absolute; inset: 0; }
                .lightbox-close,
                .lightbox-prev,
                .lightbox-next {
                    position: absolute;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(242, 240, 234, 0.05);
                    border: 1px solid rgba(242, 240, 234, 0.1);
                    border-radius: 50%;
                    color: #F2F0EA;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    z-index: 10;
                }
                .lightbox-close { top: 24px; right: 24px; }
                .lightbox-prev { left: 24px; top: 50%; transform: translateY(-50%); }
                .lightbox-next { right: 24px; top: 50%; transform: translateY(-50%); }
                .lightbox-close:hover { background: rgba(229, 43, 53, 0.2); border-color: #E52B35; color: #E52B35; }
                .lightbox-prev:hover,
                .lightbox-next:hover { background: rgba(20, 91, 255, 0.2); border-color: #145BFF; color: #145BFF; }
                .lightbox-content { max-width: 90vw; max-height: 85vh; }
                .lightbox-image { max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 8px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
                .lightbox-caption { text-align: center; margin-top: 16px; color: #777777; font-size: 0.875rem; }
                .lightbox-counter { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); color: #777777; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; }
                @media (max-width: 768px) {
                    .lightbox-prev { left: 12px; width: 44px; height: 44px; }
                    .lightbox-next { right: 12px; width: 44px; height: 44px; }
                    .lightbox-close { top: 12px; right: 12px; width: 40px; height: 40px; }
                }
                @media (prefers-reduced-motion: reduce) { .lightbox { transition: none; } }
            `;
            document.head.appendChild(style);

            lightbox.querySelectorAll('[data-lightbox-close]').forEach(el => {
                el.addEventListener('click', closeLightbox);
            });

            lightbox.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => navigate(-1));
            lightbox.querySelector('[data-lightbox-next]')?.addEventListener('click', () => navigate(1));

            document.addEventListener('keydown', handleLightboxKeydown);
        };

        const handleLightboxKeydown = (e) => {
            if (!lightbox || lightbox.hidden) return;
            
            switch (e.key) {
                case 'Escape': closeLightbox(); break;
                case 'ArrowLeft': navigate(-1); break;
                case 'ArrowRight': navigate(1); break;
            }
        };

        const openLightbox = (index) => {
            if (!lightbox) createLightbox();
            
            currentIndex = index;
            updateLightboxContent();
            lightbox.hidden = false;
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                lightbox.querySelector('.lightbox-close')?.focus();
            }, 100);
        };

        const closeLightbox = () => {
            if (lightbox) {
                lightbox.hidden = true;
                document.body.style.overflow = '';
            }
        };

        const navigate = (direction) => {
            currentIndex = (currentIndex + direction + images.length) % images.length;
            updateLightboxContent();
        };

        const updateLightboxContent = () => {
            if (!lightbox) return;
            
            const image = images[currentIndex];
            const imgEl = lightbox.querySelector('.lightbox-image');
            const captionEl = lightbox.querySelector('.lightbox-caption');
            const counterEl = lightbox.querySelector('.lightbox-counter');
            
            imgEl.src = image.src;
            imgEl.alt = image.alt;
            captionEl.textContent = image.alt;
            counterEl.textContent = `${currentIndex + 1} / ${images.length}`;
        };

        galleryImages.forEach((img, index) => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => openLightbox(index));
        });
    };

    // ==========================================================================
    // Smooth Scroll for Anchor Links
    // ==========================================================================

    const initSmoothScroll = () => {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (!target) return;
            
            e.preventDefault();
            
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: prefersReducedMotion() ? 'auto' : 'smooth'
            });
            
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        });
    };

    // ==========================================================================
    // Lazy Loading Enhancement
    // ==========================================================================

    const initLazyLoading = () => {
        if (!('IntersectionObserver' in window)) return;

        const lazyImages = $$('img[loading="lazy"]');
        if (lazyImages.length === 0) return;

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.removeAttribute('loading');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    };

    // ==========================================================================
    // Initialize All
    // ==========================================================================

    const init = () => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        initMobileNav();
        initHeaderScroll();
        initProjectFilters();
        initScrollAnimations();
        initContactPrefill();
        initContactForm();
        initNewsletterForm();
        initGalleryLightbox();
        initSmoothScroll();
        initLazyLoading();

        document.body.classList.add('js-loaded');
    };

    init();
})();
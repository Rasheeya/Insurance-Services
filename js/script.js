/**
 * Insurance Services Platform - Core Interactive Script
 * Single JavaScript file powering all 9 pages of the platform.
 * Fully vanilla JavaScript with optional GSAP, AOS, and Chart.js integration.
 * GitHub Pages compatible, zero backend required, strictly client-side demo data.
 */

function initStacklyApp() {
  'use strict';

  // ==========================================
  // 1. POPUP ALERT PREVENTION & UTILITIES
  // ==========================================
  // Strictly prevent any native browser popup alerts throughout the website
  window.alert = function(msg) {
    console.warn('Popup alert prevented:', msg);
  };
  window.confirm = function(msg) {
    console.warn('Popup confirm dialog prevented:', msg);
    return true;
  };
  window.prompt = function(msg) {
    console.warn('Popup prompt dialog prevented:', msg);
    return null;
  };

  /**
   * showToast placeholder - strictly disables popup alerts/toast notifications throughout the website
   */
  window.showToast = function(title, message, type = 'info') {
    // Popup alerts disabled throughout the website
    console.info(`[Notification - No Popup Alert] ${title}: ${message}`);
  };

  // Remove any legacy toast container if present
  const existingToastContainer = document.getElementById('toast-container');
  if (existingToastContainer) {
    existingToastContainer.remove();
  }

  // Track previous non-404 page for seamless Go Back navigation
  const pagePath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (!pagePath.includes('404')) {
    try {
      sessionStorage.setItem('stackly_prev_page', window.location.href);
    } catch (e) {}
  }

  // ==========================================
  // 2. ACCESSIBLE MODAL SYSTEM
  // ==========================================
  const modalSystem = {
    activeModal: null,
    previousFocusedElement: null,

    open(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      this.previousFocusedElement = document.activeElement;
      this.activeModal = modal;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');

      // Focus first interactive element
      const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) {
        setTimeout(() => focusable[0].focus(), 50);
      }
    },

    close(modalId) {
      const modal = modalId ? document.getElementById(modalId) : this.activeModal;
      if (!modal) return;

      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');

      if (this.previousFocusedElement && this.previousFocusedElement.focus) {
        this.previousFocusedElement.focus();
      }
      this.activeModal = null;
    },

    init() {
      // Trigger buttons
      document.querySelectorAll('[data-modal-target]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          const target = trigger.getAttribute('data-modal-target');
          modalSystem.open(target);
        });
      });

      // Close buttons
      document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const modal = btn.closest('.modal');
          if (modal) modalSystem.close(modal.id);
        });
      });

      // Backdrop clicks
      document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modalSystem.close(modal.id);
          }
        });
      });

      // Keyboard trap & Escape listener
      document.addEventListener('keydown', (e) => {
        if (!modalSystem.activeModal) return;

        if (e.key === 'Escape') {
          modalSystem.close(modalSystem.activeModal.id);
          return;
        }

        if (e.key === 'Tab') {
          const focusable = modalSystem.activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      });
    }
  };
  modalSystem.init();
  window.modalSystem = modalSystem;

  // ==========================================
  // 3. COMMON NAVBAR & MOBILE MENU
  // ==========================================
  const navbar = document.querySelector('.site-header');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const backToTopBtn = document.querySelector('.back-to-top');

  // Sticky header with elevation on scroll
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        navbar.classList.add('is-scrolled');
      } else {
        navbar.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // Ensure horizontal scroll is strictly locked to 0
  if (window.scrollX !== 0) {
    window.scrollTo(0, window.scrollY);
  }
  window.addEventListener('resize', () => {
    if (window.scrollX !== 0) {
      window.scrollTo(0, window.scrollY);
    }
  }, { passive: true });

  // Hamburger mobile menu
  if (mobileToggle && navMenu) {
    const setNavState = (isOpen) => {
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
      mobileToggle.classList.toggle('is-active', isOpen);
      navMenu.classList.toggle('is-active', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
      document.documentElement.classList.toggle('nav-open', isOpen);
    };

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      setNavState(!isExpanded);
    });

    // Close menu when clicking nav link or mobile auth link
    navMenu.querySelectorAll('.nav-link, .mobile-only-auth a').forEach(link => {
      link.addEventListener('click', () => {
        setNavState(false);
      });
    });

    // Close menu on click outside
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('is-active') && !navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        setNavState(false);
      }
    });

    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-active')) {
        setNavState(false);
      }
    });

    // Auto-close mobile menu when resizing back to desktop width
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navMenu.classList.contains('is-active')) {
        setNavState(false);
      }
    }, { passive: true });
  }

  // Highlight active link based on current path
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // Back to top smooth scroll
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('is-visible');
      } else {
        backToTopBtn.classList.remove('is-visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================================
  // 4. ANIMATIONS (AOS, GSAP, COUNTERS, PARALLAX)
  // ==========================================
  // Initialize AOS if loaded (disabled on mobile to prevent horizontal viewport offset)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      disable: () => window.innerWidth < 768
    });
  }

  // Counter animation for statistics
  const counterElements = document.querySelectorAll('[data-counter]');
  if (counterElements.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-counter')) || 0;
          const prefix = el.getAttribute('data-counter-prefix') || '';
          const suffix = el.getAttribute('data-counter-suffix') || '';
          const decimals = parseInt(el.getAttribute('data-counter-decimals') || '0', 10);
          const duration = 1800; // ms
          const startTime = performance.now();

          const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = (target * easeProgress).toFixed(decimals);
            el.textContent = `${prefix}${currentVal}${suffix}`;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
            }
          };

          requestAnimationFrame(updateCounter);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    counterElements.forEach(el => counterObserver.observe(el));
  }

  // Desktop mouse subtle parallax for hero section
  const heroParallax = document.querySelector('[data-parallax-container]');
  if (heroParallax && window.innerWidth > 992) {
    const floaters = heroParallax.querySelectorAll('[data-parallax-depth]');
    heroParallax.addEventListener('mousemove', (e) => {
      const rect = heroParallax.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      floaters.forEach(item => {
        const depth = parseFloat(item.getAttribute('data-parallax-depth')) || 20;
        const moveX = x * depth;
        const moveY = y * depth;
        item.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });
    });

    heroParallax.addEventListener('mouseleave', () => {
      floaters.forEach(item => {
        item.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  // ==========================================
  // 5. ACCORDION COMPONENT (FAQ)
  // ==========================================
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');

    if (trigger && panel) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // Close siblings if in single-mode container
        const parentContainer = item.closest('.accordion-group');
        if (parentContainer && parentContainer.getAttribute('data-single-open') === 'true') {
          parentContainer.querySelectorAll('.accordion-item').forEach(sibling => {
            if (sibling !== item) {
              sibling.classList.remove('is-open');
              const siblingBtn = sibling.querySelector('.accordion-trigger');
              const siblingPanel = sibling.querySelector('.accordion-panel');
              if (siblingBtn) siblingBtn.setAttribute('aria-expanded', 'false');
              if (siblingPanel) siblingPanel.style.maxHeight = null;
            }
          });
        }

        if (isOpen) {
          item.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
          panel.style.maxHeight = null;
        } else {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = `${panel.scrollHeight + 20}px`;
        }
      });
    }
  });

  // ==========================================
  // 6. TESTIMONIAL CAROUSEL (INDEX PAGE)
  // ==========================================
  const carousel = document.querySelector('.testimonial-carousel');
  if (carousel) {
    const slides = carousel.querySelectorAll('.testimonial-slide');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    let currentIndex = 0;
    let autoSlideInterval = null;

    // Create dots
    if (dotsContainer && slides.length > 1) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to testimonial slide ${idx + 1}`);
        dot.addEventListener('click', () => goToSlide(idx));
        dotsContainer.appendChild(dot);
      });
    }

    const updateCarousel = () => {
      slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === currentIndex);
      });

      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === currentIndex);
        });
      }
    };

    const goToSlide = (index) => {
      currentIndex = (index + slides.length) % slides.length;
      updateCarousel();
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
        resetAuto();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
        resetAuto();
      });
    }

    const startAuto = () => {
      autoSlideInterval = setInterval(() => {
        goToSlide(currentIndex + 1);
      }, 6000);
    };

    const resetAuto = () => {
      clearInterval(autoSlideInterval);
      startAuto();
    };

    carousel.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
    carousel.addEventListener('mouseleave', startAuto);

    startAuto();
  }

  // ==========================================
  // 7. PLAN DETAILS MODAL (INDEX / SERVICES)
  // ==========================================
  const planDetailsData = {
    'health-essential': {
      title: 'HealthGuard Essential Plan',
      category: 'Health Insurance',
      coverage: '$250,000 / year',
      samplePremium: '$85 / month (Illustrative sample only)',
      eligibility: 'Ages 18–65. Subject to medical underwriting and insurer terms.',
      features: [
        'Inpatient & outpatient hospitalization coverage',
        'Emergency ambulance & intensive care support',
        'Prescription drug formulary allowance',
        'Access to network hospitals and cashless claims'
      ],
      exclusions: 'Pre-existing conditions subject to a 24-month waiting period. Cosmetic treatments and elective unprescribed procedures are excluded.',
      disclaimer: 'Sample educational terms only. Actual policy limits, deductibles, and exclusions are determined by underwriting insurers.'
    },
    'health-premium': {
      title: 'HealthGuard Comprehensive Family',
      category: 'Health Insurance',
      coverage: '$1,000,000 / family aggregate',
      samplePremium: '$190 / month (Illustrative sample only)',
      eligibility: 'Primary applicant ages 18–60, dependent children up to 25.',
      features: [
        'Global emergency medical evacuation coverage',
        'Zero deductible options across preferred network hospitals',
        'Maternity and preventive health check-up allowances',
        'Specialist outpatient consultations without mandatory referral'
      ],
      exclusions: 'Alternative experimental treatments and non-emergency international treatments without prior insurer approval.',
      disclaimer: 'Illustrative demo coverage. Does not represent a binding contractual quote.'
    },
    'life-term': {
      title: 'FamilySecure Term Life Protection',
      category: 'Life Insurance',
      coverage: '$500,000 lump sum',
      samplePremium: '$45 / month (Illustrative sample only)',
      eligibility: 'Ages 20–60. Premium based on age, lifestyle, and health declaration.',
      features: [
        'Guaranteed death benefit payable to designated beneficiaries',
        'Terminal illness accelerated benefit advance',
        'Flexible policy durations: 10, 20, or 30-year terms',
        'Level premium guarantee throughout the policy tenure'
      ],
      exclusions: 'Suicide clause applicable within the initial 12 months. Untruthful medical disclosures invalidate coverage.',
      disclaimer: 'Pure risk protection policy without investment maturity payout.'
    },
    'motor-comprehensive': {
      title: 'DriveProtect Comprehensive Auto',
      category: 'Motor Insurance',
      coverage: 'Agreed Market Value + $10M Third-Party Liability',
      samplePremium: '$65 / month (Illustrative sample only)',
      eligibility: 'Valid driver license, vehicle under 12 years of age.',
      features: [
        'Collision, fire, theft, and natural peril protection',
        '24/7 roadside assistance & complimentary towing up to 50 miles',
        'Temporary replacement vehicle allowance during certified repairs',
        'Windscreen and glass cover without zero-deductible penalty'
      ],
      exclusions: 'Driving under the influence, unlicensed operators, and commercial racing or unauthorized ridesharing.',
      disclaimer: 'Comprehensive coverage depends on vehicle inspection and insurer policy agreement.'
    },
    'home-complete': {
      title: 'HomeSafe Structure & Contents Shield',
      category: 'Home & Property Insurance',
      coverage: '$450,000 Structure + $100,000 Contents',
      samplePremium: '$55 / month (Illustrative sample only)',
      eligibility: 'Owner-occupied residential dwellings, standard construction.',
      features: [
        'Protection against fire, storm, burst pipes, and civil unrest',
        'Temporary alternate accommodation coverage during reconstruction',
        'Personal liability protection for accidental property damage to third parties',
        'Valuable belongings itemized protection endorsement'
      ],
      exclusions: 'Normal wear-and-tear, termite or pest damage, and unendorsed flood zones.',
      disclaimer: 'Property value assessment and deductible limits set by local insurer.'
    },
    'business-shield': {
      title: 'EnterpriseGuard Business Protection',
      category: 'Business Insurance',
      coverage: '$2,000,000 Public Liability + Property Protection',
      samplePremium: '$220 / month (Illustrative sample only)',
      eligibility: 'Registered small and medium enterprises with under $5M annual revenue.',
      features: [
        'Commercial property and inventory loss protection',
        'Third-party bodily injury and property damage public liability',
        'Business interruption income replacement for up to 12 months',
        'Electronic equipment and data recovery coverage'
      ],
      exclusions: 'Intentional misconduct, contract breach, and non-certified offshore operations.',
      disclaimer: 'Commercial risk evaluation required. Figures are sample benchmarks.'
    }
  };

  document.querySelectorAll('[data-plan-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const planId = btn.getAttribute('data-plan-id');
      const data = planDetailsData[planId];
      if (!data) return;

      const modalTitle = document.getElementById('plan-modal-title');
      const modalCategory = document.getElementById('plan-modal-category');
      const modalCoverage = document.getElementById('plan-modal-coverage');
      const modalPremium = document.getElementById('plan-modal-premium');
      const modalEligibility = document.getElementById('plan-modal-eligibility');
      const modalFeatures = document.getElementById('plan-modal-features');
      const modalExclusions = document.getElementById('plan-modal-exclusions');
      const modalDisclaimer = document.getElementById('plan-modal-disclaimer');

      if (modalTitle) modalTitle.textContent = data.title;
      if (modalCategory) modalCategory.textContent = data.category;
      if (modalCoverage) modalCoverage.textContent = data.coverage;
      if (modalPremium) modalPremium.textContent = data.samplePremium;
      if (modalEligibility) modalEligibility.textContent = data.eligibility;
      if (modalExclusions) modalExclusions.textContent = data.exclusions;
      if (modalDisclaimer) modalDisclaimer.textContent = data.disclaimer;

      if (modalFeatures) {
        modalFeatures.innerHTML = data.features.map(f => `<li><i class="fa-solid fa-check text-accent"></i> <span>${f}</span></li>`).join('');
      }

      modalSystem.open('plan-details-modal');
    });
  });

  // ==========================================
  // 8. BLOG SEARCH, CATEGORY FILTERS & ARTICLE MODAL
  // ==========================================
  const blogContainer = document.querySelector('.blog-feed');
  const blogSearchInput = document.getElementById('blog-search');
  const blogCategoryPills = document.querySelectorAll('.blog-filter-btn');
  const blogSortSelect = document.getElementById('blog-sort');

  const blogArticlesData = {
    'art-1': {
      title: 'Understanding Health Insurance Coverage & Waiting Periods',
      category: 'Health Insurance',
      date: 'October 15, 2026',
      readTime: '6 min read',
      author: 'Dr. Evelyn Vance, Insurance Policy Analyst',
      fullContent: `
        <p>Navigating health insurance policies often feels daunting because of technical terms like waiting periods, deductibles, co-payments, and exclusions. When selecting a healthcare plan, knowing what is covered immediately versus what requires a qualifying time buffer is crucial.</p>
        <h4>What is an Initial Waiting Period?</h4>
        <p>Most individual and family health insurance policies feature an initial waiting period—frequently 30 days—during which non-emergency illnesses are not covered. Emergency treatments resulting from sudden accidents are generally exempt from this restriction.</p>
        <h4>Specific Illnesses and Pre-Existing Conditions</h4>
        <p>Specific conditions such as cataracts, hernia surgeries, and joint replacements usually entail a specific waiting duration of 12 to 24 months. Pre-existing conditions declared during application may require 24 to 48 months of continuous policy renewals before full claim benefits become payable.</p>
        <h4>Practical Checklist Before Applying:</h4>
        <ul>
          <li>Review the defined list of network hospitals offering cashless admissions.</li>
          <li>Examine room rent sub-limits and proportionate ICU deduction clauses.</li>
          <li>Check restorative benefits that replenish sum insured if exhausted in a single year.</li>
        </ul>
        <div class="note-box"><strong>Educational Notice:</strong> Exact terms vary by insurance underwriter and geographical jurisdiction. Always read policy wording documents thoroughly prior to enrolling.</div>
      `
    },
    'art-2': {
      title: 'How Life Insurance Can Support Your Family’s Financial Horizon',
      category: 'Life Insurance',
      date: 'October 10, 2026',
      readTime: '5 min read',
      author: 'Marcus Sterling, CFP®',
      fullContent: `
        <p>Life insurance is fundamentally an instrument of income replacement. In the event of an untimely demise of a family's primary earner, the insurance payout acts as a financial bridge to settle debts, fund educational milestones, and sustain daily household expenses.</p>
        <h4>Term Life vs. Whole Life Protection</h4>
        <p>Pure term life insurance provides high sum-insured coverage for a defined duration at an affordable premium. It has no cash-value accumulation or investment component, making it exceptionally cost-effective for pure income security.</p>
        <h4>Determining Your Coverage Needs</h4>
        <p>A widely referenced financial rule of thumb is the <em>Human Life Value</em> approach, which suggests securing coverage between 10 to 15 times your annual take-home income, added to outstanding long-term liabilities like mortgages.</p>
        <ul>
          <li><strong>Liabilities:</strong> Ensure home and personal loan balances are fully factored.</li>
          <li><strong>Inflation:</strong> Account for increasing higher education and healthcare costs.</li>
          <li><strong>Beneficiaries:</strong> Regularly review named primary and contingent beneficiaries.</li>
        </ul>
      `
    },
    'art-3': {
      title: 'Essential Things to Know Before Buying Motor Insurance',
      category: 'Motor Insurance',
      date: 'September 28, 2026',
      readTime: '4 min read',
      author: 'Clara Hughes, Auto Claims Specialist',
      fullContent: `
        <p>Whether you are purchasing a brand-new vehicle or renewing an existing policy, motor insurance encompasses two principal components: mandatory third-party liability and optional own-damage coverage.</p>
        <h4>Understanding Comprehensive Coverage</h4>
        <p>A comprehensive auto policy safeguards your vehicle against accidental collision, natural disasters (hail, storm, flood), fire, vandalism, and theft, in addition to third-party liability.</p>
        <h4>Zero-Depreciation & Add-On Riders</h4>
        <p>Standard claims deduct depreciation costs for replaced plastic, rubber, and metal parts. A Zero Depreciation (Bumper-to-Bumper) rider ensures the insurer reimburses part replacement costs in full without standard depreciation deductions.</p>
        <p><strong>Tips for Renewal:</strong> Retain your No Claim Bonus (NCB) certificate when switching insurers to enjoy cumulative premium discounts of up to 50% for claim-free driving history.</p>
      `
    },
    'art-4': {
      title: 'Home & Property Protection: Safeguarding Against Everyday Perils',
      category: 'Home Insurance',
      date: 'September 18, 2026',
      readTime: '7 min read',
      author: 'Julian Vance, Risk Management Consultant',
      fullContent: `
        <p>For most homeowners, their residence is their most significant single financial asset. Homeowners insurance shields both the physical building structure and the household contents from unforeseen structural perils.</p>
        <h4>Structure vs. Contents Coverage</h4>
        <p>Structure insurance covers rebuilding costs following fires, explosions, storm damage, or vehicle impacts. Contents coverage protects movable household belongings such as appliances, furniture, electronics, and clothing against theft, burglary, or accidental ruin.</p>
        <h4>Crucial Exclusions to Bear in Mind:</h4>
        <p>Standard home policies frequently exclude gradual wear-and-tear, soil subsidence, dry rot, vermin infestations, and flooding from coastal storm surges unless an explicit flood rider is endorsed.</p>
      `
    },
    'art-5': {
      title: 'Travel Insurance: Medical Emergencies & Trip Interruption',
      category: 'Travel Insurance',
      date: 'September 05, 2026',
      readTime: '5 min read',
      author: 'Sofia Lindqvist, International Travel Advisor',
      fullContent: `
        <p>Traveling overseas exposes vacationers and business travelers to unfamiliar healthcare systems where out-of-pocket medical bills can rapidly escalate into thousands of dollars.</p>
        <h4>Medical Evacuation and Repatriation</h4>
        <p>The most vital clause in any international travel policy is emergency medical evacuation. If regional facilities cannot adequately treat an acute illness or traumatic injury, evacuation to a tier-one hospital or home repatriation is coordinated directly by the insurer's emergency assistance team.</p>
        <h4>Luggage Delay and Trip Cancellation</h4>
        <p>Trip cancellation coverage reimburses prepaid, non-refundable flight and accommodation bookings if cancellation is compelled by covered medical emergencies, bereavement, or certified severe weather disruptions.</p>
      `
    },
    'art-6': {
      title: 'Risk Management & Business Insurance Essentials for SMEs',
      category: 'Business Insurance',
      date: 'August 22, 2026',
      readTime: '6 min read',
      author: 'Nathaniel Reed, Commercial Underwriter',
      fullContent: `
        <p>Small and medium enterprises (SMEs) face multifaceted operational exposures ranging from physical facility damage to third-party customer injury claims and business downtime.</p>
        <h4>Public & Product Liability</h4>
        <p>Public liability shields your company against legal defense costs and indemnity compensation if a client, vendor, or visitor slips and sustains injury on your business premises.</p>
        <h4>Business Interruption Protection</h4>
        <p>Following a covered fire or storm disaster, repairs may require months of operational shutdown. Business interruption insurance replaces lost net operational income and covers ongoing overheads such as employee payroll and premises lease obligations.</p>
      `
    }
  };

  // Filter function for blog page
  if (blogContainer) {
    let currentCategory = 'all';
    let currentSearch = '';
    let currentSort = 'newest';

    const filterArticles = () => {
      const cards = blogContainer.querySelectorAll('.blog-card');
      let visibleCount = 0;

      cards.forEach(card => {
        const title = (card.querySelector('.blog-card-title')?.textContent || '').toLowerCase();
        const category = card.getAttribute('data-category') || '';
        const excerpt = (card.querySelector('.blog-card-excerpt')?.textContent || '').toLowerCase();

        const matchesCategory = currentCategory === 'all' || category.toLowerCase() === currentCategory.toLowerCase();
        const matchesSearch = !currentSearch || title.includes(currentSearch) || excerpt.includes(currentSearch);

        if (matchesCategory && matchesSearch) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // No results message
      let emptyMsg = document.getElementById('blog-empty-state');
      if (visibleCount === 0) {
        if (!emptyMsg) {
          emptyMsg = document.createElement('div');
          emptyMsg.id = 'blog-empty-state';
          emptyMsg.className = 'blog-empty-state text-center';
          emptyMsg.innerHTML = `
            <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
            <h3>No Articles Found</h3>
            <p>Try refining your search keyword or clearing the active category filters.</p>
            <button type="button" class="btn btn-outline reset-blog-filters">Reset Filters</button>
          `;
          blogContainer.appendChild(emptyMsg);
          emptyMsg.querySelector('.reset-blog-filters').addEventListener('click', () => {
            if (blogSearchInput) blogSearchInput.value = '';
            currentSearch = '';
            currentCategory = 'all';
            blogCategoryPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-filter') === 'all'));
            filterArticles();
          });
        }
        emptyMsg.style.display = 'block';
      } else if (emptyMsg) {
        emptyMsg.style.display = 'none';
      }
    };

    if (blogSearchInput) {
      blogSearchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim().toLowerCase();
        filterArticles();
      });
    }

    blogCategoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        blogCategoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCategory = pill.getAttribute('data-filter') || 'all';
        filterArticles();
      });
    });

    if (blogSortSelect) {
      blogSortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        const cards = Array.from(blogContainer.querySelectorAll('.blog-card'));
        cards.sort((a, b) => {
          const dateA = new Date(a.getAttribute('data-date') || '2026-01-01');
          const dateB = new Date(b.getAttribute('data-date') || '2026-01-01');
          return currentSort === 'oldest' ? dateA - dateB : dateB - dateA;
        });
        cards.forEach(card => blogContainer.appendChild(card));
      });
    }
  }

  // Article details modal opener
  document.querySelectorAll('[data-article-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const artId = btn.getAttribute('data-article-id');
      const article = blogArticlesData[artId];
      if (!article) return;

      const titleEl = document.getElementById('article-modal-title');
      const categoryEl = document.getElementById('article-modal-category');
      const metaEl = document.getElementById('article-modal-meta');
      const contentEl = document.getElementById('article-modal-content');

      if (titleEl) titleEl.textContent = article.title;
      if (categoryEl) categoryEl.textContent = article.category;
      if (metaEl) metaEl.innerHTML = `<i class="fa-regular fa-calendar"></i> ${article.date} &nbsp;•&nbsp; <i class="fa-regular fa-clock"></i> ${article.readTime} &nbsp;•&nbsp; <i class="fa-solid fa-pen-nib"></i> ${article.author}`;
      if (contentEl) contentEl.innerHTML = article.fullContent;

      modalSystem.open('article-details-modal');
    });
  });

  // ==========================================
  // 9. FORM VALIDATIONS & HANDLERS
  // ==========================================

  /**
   * Helper to set validation error on form input
   */
  const setFieldError = (input, message) => {
    input.classList.add('input-error');
    input.classList.remove('input-valid');
    const form = input.closest('form');
    const inputRow = input.closest('.banner-input-row') || input.closest('.newsletter-input-group');
    let parent = input.closest('.form-group');

    let errorSpan;
    if (inputRow) {
      errorSpan = (form || inputRow.parentElement).querySelector('.field-error-msg');
      if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'field-error-msg';
        errorSpan.setAttribute('role', 'alert');
        inputRow.insertAdjacentElement('afterend', errorSpan);
      }
    } else {
      parent = parent || input.parentElement;
      errorSpan = parent.querySelector('.field-error-msg');
      if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'field-error-msg';
        errorSpan.setAttribute('role', 'alert');
        parent.appendChild(errorSpan);
      }
    }

    errorSpan.textContent = message;
    errorSpan.style.color = '#EF4444';
    errorSpan.style.display = 'block';
  };

  /**
   * Helper to clear validation error
   */
  const clearFieldError = (input) => {
    input.classList.remove('input-error');
    input.classList.add('input-valid');
    const form = input.closest('form');
    const inputRow = input.closest('.banner-input-row') || input.closest('.newsletter-input-group');
    const parent = input.closest('.form-group') || input.parentElement;

    let errorSpan;
    if (inputRow && form) {
      errorSpan = form.querySelector('.field-error-msg');
    } else if (parent) {
      errorSpan = parent.querySelector('.field-error-msg');
    }

    if (errorSpan) {
      errorSpan.textContent = '';
      errorSpan.style.display = 'none';
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone.replace(/\s+/g, ''));
  };

  // Helper to extract cleanly capitalized human-readable name from email
  const extractNameFromEmail = (email) => {
    if (!email || !email.includes('@')) return 'Policyholder';
    const prefix = email.split('@')[0];
    const words = prefix.split(/[._\-+0-9]+/).filter(w => w.length > 0);
    if (words.length === 0) {
      const cleanPrefix = prefix.replace(/[^a-zA-Z]/g, '');
      return cleanPrefix ? cleanPrefix.charAt(0).toUpperCase() + cleanPrefix.slice(1).toLowerCase() : 'Policyholder';
    }
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  // 9.1 Newsletter Subscriptions (All Pages)
  document.querySelectorAll('.newsletter-form, .newsletter-form-box').forEach(form => {
    if (form.tagName.toLowerCase() !== 'form') return;

    const emailInput = form.querySelector('input[type="email"]') || form.querySelector('.banner-input') || form.querySelector('.newsletter-input');
    if (!emailInput) return;

    let errorSpan = form.querySelector('.field-error-msg');
    if (!errorSpan) {
      errorSpan = document.createElement('span');
      errorSpan.className = 'field-error-msg';
      errorSpan.setAttribute('role', 'alert');
      errorSpan.style.color = '#EF4444';
      errorSpan.style.fontWeight = '700';
      errorSpan.style.fontSize = '0.85rem';
      errorSpan.style.marginTop = '6px';

      const inputRow = form.querySelector('.banner-input-row') || form.querySelector('.newsletter-input-group') || emailInput.parentElement;
      if (inputRow && inputRow.parentElement === form) {
        inputRow.insertAdjacentElement('afterend', errorSpan);
      } else {
        form.appendChild(errorSpan);
      }
    }

    const validateNewsletterInput = () => {
      const val = emailInput.value.trim();
      if (!val) {
        setFieldError(emailInput, 'Email is required');
        return false;
      } else if (!validateEmail(val)) {
        setFieldError(emailInput, 'Please enter a valid email address.');
        return false;
      } else {
        clearFieldError(emailInput);
        return true;
      }
    };

    emailInput.addEventListener('input', () => {
      if (emailInput.classList.contains('input-error') || emailInput.value.trim()) {
        validateNewsletterInput();
      }
    });

    emailInput.addEventListener('blur', () => {
      if (emailInput.value.trim()) {
        validateNewsletterInput();
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const isValid = validateNewsletterInput();
      if (!isValid) {
        emailInput.focus();
        return;
      }

      clearFieldError(emailInput);
      emailInput.value = '';
      window.location.href = '404.html';
    });
  });

  // 9.2 Contact Form Validation
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      const nameInput = contactForm.querySelector('#contact-name');
      const emailInput = contactForm.querySelector('#contact-email');
      const categorySelect = contactForm.querySelector('#contact-category');
      const subjectInput = contactForm.querySelector('#contact-subject');
      const messageInput = contactForm.querySelector('#contact-message');

      if (nameInput) {
        if (nameInput.value.trim().length < 3) {
          setFieldError(nameInput, 'Full name must contain at least 3 characters.');
          isValid = false;
        } else {
          clearFieldError(nameInput);
        }
      }

      if (emailInput) {
        const emailTrim = emailInput.value.trim();
        if (!emailTrim) {
          setFieldError(emailInput, 'Email is required');
          isValid = false;
        } else if (!validateEmail(emailTrim)) {
          setFieldError(emailInput, 'Please enter a valid email address.');
          isValid = false;
        } else {
          clearFieldError(emailInput);
        }
      }

      if (categorySelect) {
        if (!categorySelect.value) {
          setFieldError(categorySelect, 'Please select an insurance inquiry category.');
          isValid = false;
        } else {
          clearFieldError(categorySelect);
        }
      }

      if (subjectInput) {
        if (subjectInput.value.trim().length < 4) {
          setFieldError(subjectInput, 'Subject requires at least 4 characters.');
          isValid = false;
        } else {
          clearFieldError(subjectInput);
        }
      }

      if (messageInput) {
        if (messageInput.value.trim().length < 15) {
          setFieldError(messageInput, 'Message should provide at least 15 characters describing your request.');
          isValid = false;
        } else {
          clearFieldError(messageInput);
        }
      }

      if (!isValid) return;

      // Honest demonstration confirmation
      contactForm.reset();
      contactForm.querySelectorAll('.input-valid').forEach(el => el.classList.remove('input-valid'));
      window.location.href = '404.html';
    });
  }

  // 9.3 Password Visibility Toggles
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target-input');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      
      const icon = btn.querySelector('i');
      if (icon) {
        if (isPassword) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
          btn.setAttribute('aria-label', 'Hide password');
        } else {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
          btn.setAttribute('aria-label', 'Show password');
        }
      }
    });
  });

  // 9.4 Login Form & Role Redirection
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const roleUserRadio = loginForm.querySelector('#role-user');
    const roleClientRadio = loginForm.querySelector('#role-client');
    const rolePills = loginForm.querySelectorAll('.role-pill');

    // Role switcher visual styling
    rolePills.forEach(pill => {
      pill.addEventListener('click', () => {
        rolePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const radio = pill.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      const emailInput = loginForm.querySelector('#login-email');
      const passwordInput = loginForm.querySelector('#login-password');
      const selectedRole = loginForm.querySelector('input[name="userRole"]:checked')?.value || 'user';

      if (emailInput) {
        const emailTrim = emailInput.value.trim();
        if (!emailTrim) {
          setFieldError(emailInput, 'Email is required');
          isValid = false;
        } else if (!validateEmail(emailTrim)) {
          setFieldError(emailInput, 'Please enter a valid email address.');
          isValid = false;
        } else {
          clearFieldError(emailInput);
        }
      }

      if (passwordInput) {
        if (passwordInput.value.length < 6) {
          setFieldError(passwordInput, 'Password must be at least 6 characters long.');
          isValid = false;
        } else {
          clearFieldError(passwordInput);
        }
      }

      if (!isValid) return;

      const emailVal = emailInput ? emailInput.value.trim() : '';
      const derivedName = extractNameFromEmail(emailVal);

      // Persist user identity from login email for welcome and profile sections
      try {
        localStorage.setItem('stackly_logged_in_email', emailVal);
        localStorage.setItem('stackly_logged_in_name', derivedName);
        sessionStorage.setItem('stackly_logged_in_email', emailVal);
        sessionStorage.setItem('stackly_logged_in_name', derivedName);
        localStorage.setItem('stackly_logged_in_role', selectedRole);
        sessionStorage.setItem('stackly_logged_in_role', selectedRole);
      } catch (err) {
        console.warn('Storage persistence warning:', err);
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
      }

      if (selectedRole === 'client') {
        window.location.href = 'client-dashboard.html';
      } else {
        window.location.href = 'user-dashboard.html';
      }
    });
  }

  // 9.5 Forgot Password Modal Trigger
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      modalSystem.open('forgot-password-modal');
    });
  }

  // 9.6 Signup Form Validation & Demonstration Navigation
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    const signupRolePills = signupForm.querySelectorAll('.role-pill');
    signupRolePills.forEach(pill => {
      pill.addEventListener('click', () => {
        signupRolePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const radio = pill.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      const nameInput = signupForm.querySelector('#signup-name');
      const emailInput = signupForm.querySelector('#signup-email');
      const phoneInput = signupForm.querySelector('#signup-phone');
      const passwordInput = signupForm.querySelector('#signup-password');
      const confirmInput = signupForm.querySelector('#signup-confirm-password');
      const termsCheckbox = signupForm.querySelector('#signup-terms');

      if (nameInput) {
        if (nameInput.value.trim().length < 3) {
          setFieldError(nameInput, 'Full name must contain at least 3 characters.');
          isValid = false;
        } else {
          clearFieldError(nameInput);
        }
      }

      if (emailInput) {
        if (!validateEmail(emailInput.value.trim())) {
          setFieldError(emailInput, 'Please provide a valid email address.');
          isValid = false;
        } else {
          clearFieldError(emailInput);
        }
      }

      if (phoneInput && phoneInput.value.trim()) {
        if (!validatePhone(phoneInput.value.trim())) {
          setFieldError(phoneInput, 'Please provide a valid contact phone number.');
          isValid = false;
        } else {
          clearFieldError(phoneInput);
        }
      }

      let passwordVal = '';
      if (passwordInput) {
        passwordVal = passwordInput.value;
        if (passwordVal.length < 8) {
          setFieldError(passwordInput, 'Password must be at least 8 characters long.');
          isValid = false;
        } else {
          clearFieldError(passwordInput);
        }
      }

      if (confirmInput) {
        if (confirmInput.value !== passwordVal) {
          setFieldError(confirmInput, 'Password confirmation does not match password.');
          isValid = false;
        } else if (!confirmInput.value) {
          setFieldError(confirmInput, 'Please confirm your password.');
          isValid = false;
        } else {
          clearFieldError(confirmInput);
        }
      }

      if (termsCheckbox) {
        if (!termsCheckbox.checked) {
          const termsParent = termsCheckbox.closest('.terms-group') || termsCheckbox.parentElement;
          let err = termsParent.querySelector('.field-error-msg');
          if (!err) {
            err = document.createElement('span');
            err.className = 'field-error-msg';
            termsParent.appendChild(err);
          }
          err.textContent = 'You must agree to the Terms of Service & Privacy Statement to proceed.';
          err.style.display = 'block';
          isValid = false;
        } else {
          const termsParent = termsCheckbox.closest('.terms-group') || termsCheckbox.parentElement;
          const err = termsParent.querySelector('.field-error-msg');
          if (err) err.style.display = 'none';
        }
      }

      if (!isValid) return;

      const emailVal = emailInput ? emailInput.value.trim() : '';
      const enteredName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : extractNameFromEmail(emailVal);
      const selectedType = signupForm.querySelector('input[name="accountType"]:checked')?.value || 'user';

      try {
        localStorage.setItem('stackly_logged_in_email', emailVal);
        localStorage.setItem('stackly_logged_in_name', enteredName);
        sessionStorage.setItem('stackly_logged_in_email', emailVal);
        sessionStorage.setItem('stackly_logged_in_name', enteredName);
        localStorage.setItem('stackly_logged_in_role', selectedType);
        sessionStorage.setItem('stackly_logged_in_role', selectedType);
      } catch (err) {
        console.warn('Storage persistence warning:', err);
      }

      const submitBtn = signupForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing Account...';
      }

      window.location.href = 'login.html';
    });
  }

  // ==========================================
  // 10. DASHBOARD ENGINES (USER & CLIENT)
  // ==========================================

  // 10.0 Dashboard User Profile Personalization Engine
  const initDashboardUserProfile = () => {
    const isDashboard = document.querySelector('.dashboard-layout');
    if (!isDashboard) return;

    const isClientDashboard = window.location.pathname.includes('client-dashboard') || document.getElementById('client-overview') !== null;

    let storedEmail = '';
    let storedName = '';
    try {
      storedEmail = localStorage.getItem('stackly_logged_in_email') || sessionStorage.getItem('stackly_logged_in_email') || '';
      storedName = localStorage.getItem('stackly_logged_in_name') || sessionStorage.getItem('stackly_logged_in_name') || '';
    } catch (e) {
      console.warn('Could not read storage:', e);
    }

    if (storedEmail && !storedName) {
      storedName = extractNameFromEmail(storedEmail);
    }

    // Default fallback values if dashboard is accessed directly without prior login
    const effectiveEmail = storedEmail || (isClientDashboard ? 'd.sterling@sterling-logistics.test' : 'alexander.vance@demo.test');
    const effectiveName = storedName || (isClientDashboard ? 'Sterling Logistics LLC' : extractNameFromEmail(effectiveEmail));

    // 1. Apply respective name and mail id in Welcome Section
    document.querySelectorAll('.user-display-name').forEach(el => {
      el.textContent = effectiveName;
    });
    document.querySelectorAll('.user-display-email').forEach(el => {
      el.textContent = effectiveEmail;
    });

    // 2. Apply name and mail id in Profile Logo Section (Header avatar and profile block)
    const headerProfile = document.querySelector('.header-user-profile');
    if (headerProfile) {
      headerProfile.setAttribute('title', `${effectiveName} • ${effectiveEmail}`);
      const avatarImg = headerProfile.querySelector('.header-avatar, .profile-avatar-img');
      if (avatarImg) {
        avatarImg.alt = `${effectiveName} Profile Avatar`;
        avatarImg.title = `${effectiveName} (${effectiveEmail})`;
      }
      const nameEl = headerProfile.querySelector('.header-user-name');
      if (nameEl) nameEl.textContent = effectiveName;
      const emailEl = headerProfile.querySelector('.header-user-role');
      if (emailEl) emailEl.textContent = effectiveEmail;
      const avatarInitial = headerProfile.querySelector('.avatar-initial');
      if (avatarInitial) {
        avatarInitial.textContent = (effectiveName.trim()[0] || 'U').toUpperCase();
      }
    }

    // 3. Populate User Dashboard Profile Form inputs
    const profileFirstName = document.getElementById('profile-first-name');
    const profileLastName = document.getElementById('profile-last-name');
    const profileEmail = document.getElementById('profile-email');
    if (profileFirstName && profileLastName) {
      const parts = effectiveName.split(' ');
      profileFirstName.value = parts[0] || effectiveName;
      profileLastName.value = parts.slice(1).join(' ') || '';
    }
    if (profileEmail) {
      profileEmail.value = effectiveEmail;
    }

    // 4. Populate Client Dashboard Profile Form inputs
    const clientProfileName = document.getElementById('client-profile-name');
    const clientProfileEmail = document.getElementById('client-profile-email');
    if (clientProfileName) {
      clientProfileName.value = effectiveName;
    }
    if (clientProfileEmail) {
      clientProfileEmail.value = effectiveEmail;
    }
  };

  // 10.1 Sidebar Collapse & Mobile Drawer
  const sidebar = document.querySelector('.dashboard-sidebar');
  const sidebarToggle = document.querySelector('.sidebar-toggle-btn');
  const sidebarBackdrop = document.querySelector('.sidebar-backdrop');

  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      if (window.innerWidth <= 992) {
        sidebar.classList.toggle('is-mobile-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.toggle('is-visible');
      } else {
        sidebar.classList.toggle('is-collapsed');
        document.querySelector('.dashboard-main')?.classList.toggle('sidebar-collapsed');
      }
    });

    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', () => {
        sidebar.classList.remove('is-mobile-open');
        sidebarBackdrop.classList.remove('is-visible');
      });
    }

    const sidebarClose = sidebar.querySelector('.sidebar-close-btn');
    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => {
        sidebar.classList.remove('is-mobile-open');
        sidebarBackdrop?.classList.remove('is-visible');
      });
    }
  }

  // 10.2 Dashboard Tab Switching Engine
  const dashboardNavLinks = document.querySelectorAll('.dashboard-nav-item[data-section]');
  const dashboardSections = document.querySelectorAll('.dashboard-section[id]');

  if (dashboardNavLinks.length && dashboardSections.length) {
    const activateDashboardSection = (sectionId) => {
      dashboardSections.forEach(sec => {
        if (sec.id === sectionId) {
          sec.classList.add('is-active');
          sec.removeAttribute('hidden');
        } else {
          sec.classList.remove('is-active');
          sec.setAttribute('hidden', 'true');
        }
      });

      dashboardNavLinks.forEach(link => {
        const target = link.getAttribute('data-section');
        if (target === sectionId) {
          link.classList.add('active');
          link.setAttribute('aria-selected', 'true');
        } else {
          link.classList.remove('active');
          link.setAttribute('aria-selected', 'false');
        }
      });

      // Update current section title in header if present
      const currentSectionHeader = document.querySelector('.current-section-title');
      const activeLink = document.querySelector(`.dashboard-nav-item[data-section="${sectionId}"] .nav-text`);
      if (currentSectionHeader && activeLink) {
        currentSectionHeader.textContent = activeLink.textContent;
      }

      // Close mobile drawer if open
      if (sidebar && window.innerWidth <= 992) {
        sidebar.classList.remove('is-mobile-open');
        sidebarBackdrop?.classList.remove('is-visible');
      }

      // Re-trigger layout adjustments (e.g., charts)
      window.dispatchEvent(new Event('resize'));
    };

    dashboardNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');
        activateDashboardSection(sectionId);
      });
    });

    // Check URL hash for direct tab link
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById(initialHash)) {
      activateDashboardSection(initialHash);
    }
  }

  // 10.3 Dynamic Days Remaining Renewal Calculation
  const renewalRows = document.querySelectorAll('[data-renewal-date]');
  renewalRows.forEach(el => {
    const renewalStr = el.getAttribute('data-renewal-date');
    if (!renewalStr) return;

    const renewalDate = new Date(renewalStr);
    const today = new Date('2026-10-23'); // Anchor to prompt local demo year
    const diffTime = renewalDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const badge = el.querySelector('.renewal-days-badge');
    if (badge) {
      if (diffDays > 0) {
        badge.textContent = `${diffDays} days left`;
        if (diffDays <= 30) {
          badge.className = 'renewal-days-badge badge-warning';
        } else {
          badge.className = 'renewal-days-badge badge-info';
        }
      } else if (diffDays === 0) {
        badge.textContent = 'Renewing Today';
        badge.className = 'renewal-days-badge badge-danger';
      } else {
        badge.textContent = 'Renewal Overdue';
        badge.className = 'renewal-days-badge badge-danger';
      }
    }
  });

  // 10.4 Policy Filtering & Search (User Dashboard & Client Dashboard)
  const policySearchInput = document.getElementById('policy-search');
  const policyCategoryFilter = document.getElementById('policy-category-filter');
  const policyStatusFilter = document.getElementById('policy-status-filter');
  const policyTableBody = document.getElementById('policy-table-body');
  const policyGridContainer = document.getElementById('policy-grid-container');

  const filterPolicies = () => {
    const term = policySearchInput ? policySearchInput.value.toLowerCase().trim() : '';
    const cat = policyCategoryFilter ? policyCategoryFilter.value.toLowerCase() : 'all';
    const status = policyStatusFilter ? policyStatusFilter.value.toLowerCase() : 'all';

    const items = document.querySelectorAll('.policy-record-item');
    let matchCount = 0;

    items.forEach(item => {
      const pName = (item.getAttribute('data-name') || '').toLowerCase();
      const pNumber = (item.getAttribute('data-number') || '').toLowerCase();
      const pCat = (item.getAttribute('data-category') || '').toLowerCase();
      const pStatus = (item.getAttribute('data-status') || '').toLowerCase();

      const matchesSearch = !term || pName.includes(term) || pNumber.includes(term);
      const matchesCat = cat === 'all' || pCat === cat;
      const matchesStatus = status === 'all' || pStatus === status;

      if (matchesSearch && matchesCat && matchesStatus) {
        item.style.display = '';
        matchCount++;
      } else {
        item.style.display = 'none';
      }
    });

    const noResultsEl = document.getElementById('no-policies-notice');
    if (noResultsEl) {
      noResultsEl.style.display = matchCount === 0 ? 'block' : 'none';
    }
  };

  if (policySearchInput) policySearchInput.addEventListener('input', filterPolicies);
  if (policyCategoryFilter) policyCategoryFilter.addEventListener('change', filterPolicies);
  if (policyStatusFilter) policyStatusFilter.addEventListener('change', filterPolicies);

  // 10.5 Policy Details Modal Populator
  const demoPoliciesData = {
    'POL-HL-9482': {
      number: 'POL-HL-9482',
      name: 'HealthGuard Comprehensive Family Shield',
      category: 'Health Insurance',
      status: 'Active',
      premium: '$190.00 / month',
      coverageLimit: '$1,000,000.00 Aggregate',
      startDate: 'November 12, 2025',
      renewalDate: 'November 12, 2026',
      deductible: '$500 per family member',
      coveredMembers: 'Alexander Vance (Primary), Sarah Vance (Spouse), Leo Vance (Child)',
      hospitalNetwork: '9,400+ Cashless Network Facilities',
      exclusionsSummary: 'Cosmetic elective treatments, dental unless accidental, unprescribed wellness vitamins.',
      recentClaimStatus: 'No active claims filed in the last 12 months.'
    },
    'POL-LF-3319': {
      number: 'POL-LF-3319',
      name: 'FamilySecure 20-Year Term Protection',
      category: 'Life Insurance',
      status: 'Active',
      premium: '$45.00 / month',
      coverageLimit: '$500,000.00 Lump Sum',
      startDate: 'March 01, 2023',
      renewalDate: 'March 01, 2027 (Annual Renewal)',
      deductible: 'N/A (Pure Death Benefit)',
      coveredMembers: 'Alexander Vance (Insured Life)',
      hospitalNetwork: 'Beneficiary: Sarah Vance (100% Primary)',
      exclusionsSummary: 'Suicide clause expired. Fraudulent medical suppression voids contract.',
      recentClaimStatus: 'Policy in good standing. Premium payments up to date.'
    },
    'POL-MT-7741': {
      number: 'POL-MT-7741',
      name: 'DriveProtect Zero-Depreciation Auto',
      category: 'Motor Insurance',
      status: 'Active',
      premium: '$65.00 / month',
      coverageLimit: 'Agreed Market Value ($38,500) + $10M Third Party',
      startDate: 'December 05, 2025',
      renewalDate: 'December 05, 2026',
      deductible: '$250 Standard Accidental Excess',
      coveredMembers: '2024 Hybrid Sedan (Reg: STK-8820-EX)',
      hospitalNetwork: 'Approved Repairer Network with Lifetime Workmanship Guarantee',
      exclusionsSummary: 'Unlicensed drivers, operating vehicle under intoxication, off-road driving.',
      recentClaimStatus: 'Claim #CLM-2026-081 closed in February 2026 (Windscreen replacement).'
    },
    'POL-HM-1185': {
      number: 'POL-HM-1185',
      name: 'HomeSafe Structure & Contents Shield',
      category: 'Home Insurance',
      status: 'Expiring Soon',
      premium: '$55.00 / month',
      coverageLimit: '$450,000 Structure + $100,000 Contents',
      startDate: 'November 01, 2025',
      renewalDate: 'November 01, 2026',
      deductible: '$500 per incident',
      coveredMembers: 'Primary Residence (Oakridge Heights)',
      hospitalNetwork: 'Emergency Make-Safe Contractor Network',
      exclusionsSummary: 'Gradual damp, termite damage, unendorsed coastal flood surge.',
      recentClaimStatus: 'Renewal notice dispatched. 9 days remaining.'
    },
    'POL-TR-5021': {
      number: 'POL-TR-5021',
      name: 'GlobalVoyage Comprehensive Worldwide Travel',
      category: 'Travel Insurance',
      status: 'Pending Review',
      premium: '$140.00 Single Trip',
      coverageLimit: '$500,000 Emergency Medical + $3,000 Baggage',
      startDate: 'December 15, 2026',
      renewalDate: 'January 10, 2027',
      deductible: '$50 Medical Excess',
      coveredMembers: 'Alexander Vance & Sarah Vance',
      hospitalNetwork: 'Global 24/7 Assistance Network',
      exclusionsSummary: 'Extreme mountaineering above 4,000m, travel against government advisory.',
      recentClaimStatus: 'Pre-existing medical declaration pending underwriting approval.'
    },
    'POL-BIZ-8804': {
      number: 'POL-BIZ-8804',
      name: 'Commercial Shield Public Liability & Business Interruption',
      category: 'Commercial Shield',
      status: 'Active',
      premium: '$200.00 / month ($2,400 / yr)',
      coverageLimit: '$2,000,000.00 Aggregate Liability + Net Profit Loss',
      startDate: 'December 15, 2025',
      renewalDate: 'December 15, 2026',
      deductible: '$500 Property / Bodily Injury Excess',
      coveredMembers: 'Sterling Logistics LLC (All Operating Locations & Warehouses)',
      hospitalNetwork: 'Designated Corporate Defense Legal Panel & Engineering Adjusters',
      exclusionsSummary: 'Intentional environmental pollution, employee intentional misconduct, war & nuclear hazards.',
      recentClaimStatus: 'Policy in good standing. No liability actions filed.'
    }
  };

  document.querySelectorAll('[data-view-policy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pId = btn.getAttribute('data-view-policy');
      const data = demoPoliciesData[pId];
      if (!data) return;

      const titleEl = document.getElementById('policy-modal-name');
      const numEl = document.getElementById('policy-modal-number');
      const catEl = document.getElementById('policy-modal-category');
      const statusEl = document.getElementById('policy-modal-status');
      const covEl = document.getElementById('policy-modal-coverage');
      const premEl = document.getElementById('policy-modal-premium');
      const datesEl = document.getElementById('policy-modal-dates');
      const dedEl = document.getElementById('policy-modal-deductible');
      const memEl = document.getElementById('policy-modal-members');
      const excEl = document.getElementById('policy-modal-exclusions');

      if (titleEl) titleEl.textContent = data.name;
      if (numEl) numEl.textContent = data.number;
      if (catEl) catEl.textContent = data.category;
      if (statusEl) {
        statusEl.textContent = data.status;
        statusEl.className = `status-badge status-${data.status.toLowerCase().replace(/\s+/g, '-')}`;
      }
      if (covEl) covEl.textContent = data.coverageLimit;
      if (premEl) premEl.textContent = data.premium;
      if (datesEl) datesEl.textContent = `${data.startDate} to ${data.renewalDate}`;
      if (dedEl) dedEl.textContent = data.deductible;
      if (memEl) memEl.textContent = data.coveredMembers;
      if (excEl) excEl.textContent = data.exclusionsSummary;

      modalSystem.open('policy-details-modal');
    });
  });

  // 10.6 Claims Details Modal
  const demoClaimsData = {
    'CLM-2026-104': {
      id: 'CLM-2026-104',
      category: 'Health Insurance',
      policy: 'POL-HL-9482 (HealthGuard Comprehensive)',
      incidentDate: 'October 02, 2026',
      filedDate: 'October 04, 2026',
      amountClaimed: '$1,450.00',
      status: 'Under Review',
      step: 2, // 1: Submitted, 2: Under Review, 3: Assessment, 4: Decision Recorded
      description: 'Emergency outpatient diagnostic imaging & minor orthopedic treatment following ankle fracture.',
      notes: 'Medical invoices and attending physician report verified. Actuarial review in progress. Simulated demo status.'
    },
    'CLM-2026-081': {
      id: 'CLM-2026-081',
      category: 'Motor Insurance',
      policy: 'POL-MT-7741 (DriveProtect Auto)',
      incidentDate: 'February 11, 2026',
      filedDate: 'February 12, 2026',
      amountClaimed: '$680.00',
      status: 'Decision Recorded',
      step: 4,
      description: 'Windscreen chipped and cracked by road gravel debris on interstate highway.',
      notes: 'Approved without deductible excess under Zero-Depreciation endorsement. Workshop reimbursement settled.'
    },
    'CLM-2026-059': {
      id: 'CLM-2026-059',
      category: 'Home Insurance',
      policy: 'POL-HM-1185 (HomeSafe Shield)',
      incidentDate: 'July 19, 2026',
      filedDate: 'July 20, 2026',
      amountClaimed: '$2,300.00',
      status: 'Decision Recorded',
      step: 4,
      description: 'Internal ceiling plaster and timber restoration following sudden washing machine hose burst.',
      notes: 'Loss assessor assessment concluded. Claim processed as per terms with $500 deductible applied.'
    }
  };

  document.querySelectorAll('[data-view-claim]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cId = btn.getAttribute('data-view-claim');
      const claim = demoClaimsData[cId];
      if (!claim) return;

      const idEl = document.getElementById('claim-modal-id');
      const catEl = document.getElementById('claim-modal-category');
      const polEl = document.getElementById('claim-modal-policy');
      const amtEl = document.getElementById('claim-modal-amount');
      const statEl = document.getElementById('claim-modal-status');
      const descEl = document.getElementById('claim-modal-desc');
      const notesEl = document.getElementById('claim-modal-notes');

      if (idEl) idEl.textContent = claim.id;
      if (catEl) catEl.textContent = claim.category;
      if (polEl) polEl.textContent = claim.policy;
      if (amtEl) amtEl.textContent = claim.amountClaimed;
      if (statEl) {
        statEl.textContent = claim.status;
        statEl.className = `status-badge status-${claim.status.toLowerCase().replace(/\s+/g, '-')}`;
      }
      if (descEl) descEl.textContent = claim.description;
      if (notesEl) notesEl.textContent = claim.notes;

      // Update visual timeline steps
      const steps = document.querySelectorAll('.claim-timeline-step');
      steps.forEach((st, idx) => {
        const stepNum = idx + 1;
        st.classList.remove('is-complete', 'is-current');
        if (stepNum < claim.step) {
          st.classList.add('is-complete');
        } else if (stepNum === claim.step) {
          st.classList.add('is-current');
        }
      });

      modalSystem.open('claim-details-modal');
    });
  });

  // 10.7 Demo Document Downloader
  document.querySelectorAll('[data-download-doc]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const docName = btn.getAttribute('data-download-doc') || 'Sample_Policy_Schedule';
      const docType = btn.getAttribute('data-doc-type') || 'Demonstration Document';
      
      // Generate clean text-based certificate file in browser
      const content = `========================================================================
STACKLY INSURANCE SERVICES PLATFORM — DEMONSTRATION DOCUMENT
========================================================================

Document Title : ${docName.replace(/_/g, ' ')}
Category       : ${docType}
Generated Date : October 23, 2026
Reference ID   : DEMO-${Math.random().toString(36).substring(2, 9).toUpperCase()}

------------------------------------------------------------------------
EDUCATIONAL & DEMONSTRATION NOTICE:
This file is generated dynamically for demonstration purposes on the
Stackly Insurance Services Platform. It does not represent an executed
legal contract, insurance binder, or certified financial instrument.
Actual policy schedules are issued exclusively by registered and
authorized insurance underwriting carriers.
------------------------------------------------------------------------

SUMMARY OF DEMO TERMS:
- Insured Entity  : Demonstration Account Holder
- Platform ID     : STK-2026-USER-884
- Protection Tier : Comprehensive Multi-Benefit Schedule
- Status          : Verified Demo Record

For actual coverage verification, consult your official policy documents
provided directly by your underwriting insurance partner.

========================================================================
© 2026 Stackly Insurance Services Platform. Client-Side Demonstration.
========================================================================
`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  });

  // 10.8 Profile & Settings Demo Form Update
  const profileForm = document.getElementById('profile-settings-form');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const profileFirstName = document.getElementById('profile-first-name');
      const profileLastName = document.getElementById('profile-last-name');
      const profileEmail = document.getElementById('profile-email');
      const clientProfileName = document.getElementById('client-profile-name');
      const clientProfileEmail = document.getElementById('client-profile-email');

      let isValid = true;

      if (profileFirstName) {
        if (!profileFirstName.value.trim()) {
          setFieldError(profileFirstName, 'First name is required.');
          isValid = false;
        } else {
          clearFieldError(profileFirstName);
        }
      }

      if (profileLastName) {
        if (!profileLastName.value.trim()) {
          setFieldError(profileLastName, 'Last name is required.');
          isValid = false;
        } else {
          clearFieldError(profileLastName);
        }
      }

      if (clientProfileName) {
        if (!clientProfileName.value.trim()) {
          setFieldError(clientProfileName, 'Enterprise name is required.');
          isValid = false;
        } else {
          clearFieldError(clientProfileName);
        }
      }

      const activeEmailInput = profileEmail || clientProfileEmail;
      if (activeEmailInput) {
        const emailVal = activeEmailInput.value.trim();
        if (!emailVal) {
          setFieldError(activeEmailInput, 'Email is required.');
          isValid = false;
        } else if (!validateEmail(emailVal)) {
          setFieldError(activeEmailInput, 'Please enter a valid email address.');
          isValid = false;
        } else {
          clearFieldError(activeEmailInput);
        }
      }

      if (!isValid) return;

      let updatedName = '';
      let updatedEmail = '';

      if (profileFirstName && profileLastName) {
        const fn = profileFirstName.value.trim();
        const ln = profileLastName.value.trim();
        updatedName = (fn + ' ' + ln).trim();
      } else if (clientProfileName) {
        updatedName = clientProfileName.value.trim();
      }

      if (profileEmail) {
        updatedEmail = profileEmail.value.trim();
      } else if (clientProfileEmail) {
        updatedEmail = clientProfileEmail.value.trim();
      }

      try {
        if (updatedName) {
          localStorage.setItem('stackly_logged_in_name', updatedName);
          sessionStorage.setItem('stackly_logged_in_name', updatedName);
        }
        if (updatedEmail) {
          localStorage.setItem('stackly_logged_in_email', updatedEmail);
          sessionStorage.setItem('stackly_logged_in_email', updatedEmail);
        }
      } catch (err) {}

      window.location.href = '404.html';
    });
  }

  // 10.9 Password Change Demo Form
  const passwordChangeForm = document.getElementById('password-change-form');
  if (passwordChangeForm) {
    passwordChangeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentPw = passwordChangeForm.querySelector('#current-password');
      const newPw = passwordChangeForm.querySelector('#new-password');
      const confirmNewPw = passwordChangeForm.querySelector('#confirm-new-password');

      let isValid = true;
      if (currentPw && currentPw.value.length < 6) {
        setFieldError(currentPw, 'Current password must be at least 6 characters.');
        isValid = false;
      } else if (currentPw) {
        clearFieldError(currentPw);
      }

      if (newPw && newPw.value.length < 8) {
        setFieldError(newPw, 'New password must be at least 8 characters.');
        isValid = false;
      } else if (newPw) {
        clearFieldError(newPw);
      }

      if (confirmNewPw) {
        if (confirmNewPw.value !== (newPw ? newPw.value : '')) {
          setFieldError(confirmNewPw, 'New password confirmation does not match.');
          isValid = false;
        } else if (!confirmNewPw.value) {
          setFieldError(confirmNewPw, 'Please confirm your password.');
          isValid = false;
        } else {
          clearFieldError(confirmNewPw);
        }
      }

      if (!isValid) return;

      passwordChangeForm.reset();
      window.location.href = '404.html';
    });
  }

  // 10.10 Client Dashboard - New Claim / Support Request Form
  const clientRequestForm = document.getElementById('client-claim-request-form');
  if (clientRequestForm) {
    clientRequestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const policySelect = clientRequestForm.querySelector('#request-policy');
      const typeSelect = clientRequestForm.querySelector('#request-type');
      const detailsText = clientRequestForm.querySelector('#request-details');

      let isValid = true;
      if (policySelect && !policySelect.value) {
        setFieldError(policySelect, 'Please select the policy for this request.');
        isValid = false;
      } else if (policySelect) clearFieldError(policySelect);

      if (typeSelect && !typeSelect.value) {
        setFieldError(typeSelect, 'Please choose a request type.');
        isValid = false;
      } else if (typeSelect) clearFieldError(typeSelect);

      if (detailsText && detailsText.value.trim().length < 15) {
        setFieldError(detailsText, 'Please provide at least 15 characters describing your claim or inquiry.');
        isValid = false;
      } else if (detailsText) clearFieldError(detailsText);

      if (!isValid) return;

      clientRequestForm.reset();
      modalSystem.close('new-claim-modal');
      window.location.href = '404.html';
    });
  }

  // 10.11 Logout Navigation Handling
  document.querySelectorAll('.logout-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'login.html';
    });
  });

  // ==========================================
  // 11. DASHBOARD CHARTS (CHART.JS INTEGRATION)
  // ==========================================
  const initDashboardCharts = () => {
    if (typeof Chart === 'undefined') return;

    // Brand color references
    const COLOR_PRIMARY = '#1F3C88';
    const COLOR_ACCENT = '#F5A623';
    const COLOR_PRIMARY_LIGHT = 'rgba(31, 60, 136, 0.15)';
    const COLOR_ACCENT_LIGHT = 'rgba(245, 166, 35, 0.2)';
    const COLOR_BORDER = 'rgba(31, 60, 136, 0.12)';

    // User Dashboard: Policy Distribution Doughnut
    const userPolicyCanvas = document.getElementById('userPolicyChart');
    if (userPolicyCanvas) {
      new Chart(userPolicyCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Health', 'Life', 'Motor', 'Home', 'Travel'],
          datasets: [{
            data: [35, 25, 20, 15, 5],
            backgroundColor: [
              '#1F3C88',
              '#F5A623',
              '#2e57be',
              '#e08e0b',
              '#5073cc'
            ],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw}% of Portfolio`
              }
            }
          },
          cutout: '68%'
        }
      });
    }

    // User Dashboard: Claims Activity Bar Chart
    const userClaimsCanvas = document.getElementById('userClaimsChart');
    if (userClaimsCanvas) {
      new Chart(userClaimsCanvas, {
        type: 'bar',
        data: {
          labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
          datasets: [{
            label: 'Settled Claims ($)',
            data: [420, 0, 2300, 0, 0, 1450],
            backgroundColor: COLOR_PRIMARY,
            hoverBackgroundColor: COLOR_ACCENT,
            borderRadius: 6,
            maxBarThickness: 46
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Settled: $${ctx.raw}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: COLOR_BORDER },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
                callback: (val) => `$${val}`
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' }
              }
            }
          }
        }
      });
    }

    // Client Dashboard: Comprehensive Coverage Limits Bar Chart
    const clientCoverageCanvas = document.getElementById('clientCoverageChart');
    if (clientCoverageCanvas) {
      new Chart(clientCoverageCanvas, {
        type: 'bar',
        data: {
          labels: ['Health', 'Life', 'Auto', 'Home', 'Travel', 'Business'],
          datasets: [{
            label: 'Coverage Limit ($k)',
            data: [1000, 500, 38, 550, 500, 2000],
            backgroundColor: [
              COLOR_PRIMARY,
              COLOR_ACCENT,
              COLOR_PRIMARY,
              COLOR_PRIMARY,
              COLOR_ACCENT,
              COLOR_PRIMARY
            ],
            hoverBackgroundColor: COLOR_ACCENT,
            borderRadius: 6,
            maxBarThickness: 46
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Coverage: $${ctx.raw}k`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: COLOR_BORDER },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
                callback: (val) => `$${val}k`
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' }
              }
            }
          }
        }
      });
    }

    // Client Dashboard: Portfolio Health Radar / Polar Area
    const clientPortfolioCanvas = document.getElementById('clientPortfolioChart');
    if (clientPortfolioCanvas) {
      new Chart(clientPortfolioCanvas, {
        type: 'polarArea',
        data: {
          labels: ['Health Coverage', 'Life Protection', 'Asset Safety', 'Travel Guard', 'Liability Protection'],
          datasets: [{
            data: [90, 85, 75, 60, 95],
            backgroundColor: [
              'rgba(31, 60, 136, 0.75)',
              'rgba(245, 166, 35, 0.75)',
              'rgba(46, 87, 190, 0.75)',
              'rgba(224, 142, 11, 0.75)',
              'rgba(80, 115, 204, 0.75)'
            ],
            borderColor: '#FFFFFF',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                font: { size: 11 }
              }
            }
          },
          scales: {
            r: {
              ticks: { display: false },
              grid: { color: COLOR_BORDER }
            }
          }
        }
      });
    }

    // User Dashboard: Policy Coverage Sum by Category (Horizontal Bar Chart)
    const userCoverageCanvas = document.getElementById('userPolicyCoverageChart');
    if (userCoverageCanvas) {
      new Chart(userCoverageCanvas, {
        type: 'bar',
        data: {
          labels: ['Health Floater', 'Life Keyman', 'Property Home', 'Global Travel', 'DriveProtect'],
          datasets: [{
            label: 'Sum Insured ($k)',
            data: [1000, 500, 550, 500, 38.5],
            backgroundColor: [COLOR_PRIMARY, COLOR_ACCENT, '#2e57be', '#e08e0b', '#5073cc'],
            borderRadius: 6,
            maxBarThickness: 32
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Limit: $${ctx.raw}k`
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: COLOR_BORDER },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
                callback: (val) => `$${val}k`
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' }
              }
            }
          }
        }
      });
    }

    // User Dashboard: Monthly Claims Settlement Trend
    const userClaimsTrendCanvas = document.getElementById('userClaimsTrendChart');
    if (userClaimsTrendCanvas) {
      new Chart(userClaimsTrendCanvas, {
        type: 'bar',
        data: {
          labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
          datasets: [{
            label: 'Settled Amount ($)',
            data: [0, 0, 2300, 0, 680, 1450],
            backgroundColor: COLOR_ACCENT,
            hoverBackgroundColor: COLOR_PRIMARY,
            borderRadius: 6,
            maxBarThickness: 38
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Payout: $${ctx.raw}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: COLOR_BORDER },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
                callback: (val) => `$${val}`
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' }
              }
            }
          }
        }
      });
    }

    // User Dashboard: Renewal Premium Outflow Schedule
    const userRenewalsCanvas = document.getElementById('userRenewalsChart');
    if (userRenewalsCanvas) {
      new Chart(userRenewalsCanvas, {
        type: 'bar',
        data: {
          labels: ['Home (Nov 1)', 'Health (Nov 12)', 'Motor (Dec 5)', 'Travel (Jan 10)', 'Life (Mar 1)'],
          datasets: [{
            label: 'Annual Premium ($)',
            data: [660, 2280, 780, 140, 540],
            backgroundColor: [COLOR_ACCENT, COLOR_PRIMARY, '#2e57be', '#e08e0b', '#5073cc'],
            borderRadius: 6,
            maxBarThickness: 38
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Premium: $${ctx.raw}/yr`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: COLOR_BORDER },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
                callback: (val) => `$${val}`
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' }
              }
            }
          }
        }
      });
    }

    // Client Dashboard: Commercial Risk Allocation Breakdown Doughnut
    const clientCoverageBreakdownCanvas = document.getElementById('clientCoverageBreakdownChart');
    if (clientCoverageBreakdownCanvas) {
      new Chart(clientCoverageBreakdownCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Public Liability', 'Healthcare Floater', 'Property & Plant', 'Fleet Motor', 'Keyman Life', 'Global Delegation'],
          datasets: [{
            data: [49, 24.5, 13.5, 1, 12, 12],
            backgroundColor: [
              '#1F3C88',
              '#F5A623',
              '#2e57be',
              '#e08e0b',
              '#5073cc',
              '#38a169'
            ],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw}% Risk Allocation`
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // Client Dashboard: Annual Premium Contribution Bar Chart
    const clientPortfolioPremiumCanvas = document.getElementById('clientPortfolioPremiumChart');
    if (clientPortfolioPremiumCanvas) {
      new Chart(clientPortfolioPremiumCanvas, {
        type: 'bar',
        data: {
          labels: ['Commercial Shield', 'Health Floater', 'Fleet Auto', 'Property Center', 'Keyman Life', 'Travel Delegation'],
          datasets: [{
            label: 'Annual Outflow ($/yr)',
            data: [2400, 2280, 780, 660, 540, 300],
            backgroundColor: [COLOR_PRIMARY, COLOR_ACCENT, '#2e57be', '#e08e0b', '#5073cc', '#38a169'],
            borderRadius: 6,
            maxBarThickness: 38
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Annual: $${ctx.raw}/yr`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: COLOR_BORDER },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
                callback: (val) => `$${val}`
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' }
              }
            }
          }
        }
      });
    }

    // Client Dashboard: Commercial Claims History Trend
    const clientClaimsTrendCanvas = document.getElementById('clientClaimsTrendChart');
    if (clientClaimsTrendCanvas) {
      new Chart(clientClaimsTrendCanvas, {
        type: 'bar',
        data: {
          labels: ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026 (Active)'],
          datasets: [{
            label: 'Indemnity Settled ($)',
            data: [680, 0, 2300, 1450],
            backgroundColor: [COLOR_PRIMARY, '#5073cc', COLOR_ACCENT, '#e08e0b'],
            borderRadius: 6,
            maxBarThickness: 42
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Claim: $${ctx.raw}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: COLOR_BORDER },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
                callback: (val) => `$${val}`
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: '#5f7193',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' }
              }
            }
          }
        }
      });
    }
  };

  initDashboardUserProfile();
  initDashboardCharts();

  // ==========================================
  // 12. DEMO NOTICE BANNER DISMISSAL
  // ==========================================
  const demoBanner = document.getElementById('demo-global-banner');
  if (demoBanner) {
    const dismissBtn = demoBanner.querySelector('.banner-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        demoBanner.style.display = 'none';
      });
    }
  }

  // ==========================================
  // 13. GLOBAL 404 REDIRECTION ENGINE
  // ==========================================
  // Redirection rules:
  // - All buttons, links, and icons across all pages redirect to 404.html
  // - Exempted areas:
  //   1. Main site header/navbar (navlinks, brand logo, mobile toggle, login button)
  //   2. Site footer (footer links, social icons, contact items)
  //   3. Login page (login.html) and Signup page (signup.html)
  //   4. Dashboard sidebar menus (.dashboard-sidebar: section tabs, brand logo, sidebar logout)
  //   5. Form submit buttons: validate inline first without alerts, then redirect to 404.html
  //   6. 404 page: "Go Back" button navigates back in history; "Return to Homepage" & logo navigate to index.html
  //      All other buttons, links, pills, and icons on 404 page redirect to 404.html

  // Inject pointer cursor for all icons, buttons, links, and interactive cards
  try {
    const pointerStyle = document.createElement('style');
    pointerStyle.textContent = `
      i, svg, [class*="icon"], [class*="fa-"],
      .service-icon, .feature-icon, .stat-icon, .category-icon, .step-icon,
      .service-card, .feature-card, .category-card, .plan-card, .blog-card,
      .action-card, .stat-card, .contact-card, .helpful-pill, .header-user-profile,
      .accordion-trigger, .carousel-prev, .carousel-next, .carousel-dot, .blog-filter-btn, .back-to-top {
        cursor: pointer;
      }
    `;
    document.head.appendChild(pointerStyle);
  } catch (err) {}

  document.addEventListener('click', (e) => {
    const currentPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

    // 1. Handlers on 404.html itself
    if (currentPath.includes('404')) {
      // Go Back button navigates back in history
      const goBackBtn = e.target.closest('#go-back-btn, .go-back-btn');
      if (goBackBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.goToBackHistory();
        return;
      }

      // Return to Homepage & Brand Logo navigate to index.html
      const homeTrigger = e.target.closest('a[href="index.html"], .error-brand-logo');
      if (homeTrigger) {
        return; // Allow native navigation to homepage
      }

      // Any other button, link, category pill, or icon on 404 page redirects to 404.html
      const otherAction = e.target.closest(
        'a, button, [role="button"], i, svg, [class*="icon"], [class*="fa-"], .helpful-pill, .error-icon-shield, .floating-orb'
      );
      if (otherAction) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = '404.html';
        return;
      }
      return;
    }

    // 2. Completely exempted pages: Login page, Signup page
    if (currentPath.includes('login') || currentPath.includes('signup')) {
      return;
    }

    // 3. Prevent interference with normal form typing and selection
    if (e.target.closest('input:not([type="submit"]):not([type="button"]), textarea, select, label')) {
      return;
    }

    // Exemption: Interactive Accordions (FAQ triggers, headers, and chevron icons)
    if (e.target.closest('.accordion-item, .accordion-trigger, .accordion-header, .accordion-panel')) {
      return;
    }

    // Exemption: Interactive Carousels, Filters, and Modals
    if (e.target.closest('.carousel-dot, .carousel-prev, .carousel-next, .blog-filter-btn, .back-to-top, .modal, [data-modal-target], [data-modal-close]')) {
      return;
    }

    // 4. Identify buttons, links, icons, and action cards
    const clickable = e.target.closest(
      'a, button, [role="button"], i, svg, [class*="icon"], [class*="fa-"], ' +
      '.service-card, .feature-card, .category-card, .plan-card, .blog-card, ' +
      '.action-card, .stat-card, .contact-card, .step-item, .value-card, ' +
      '.read-article-btn, .tab-btn, .header-user-profile, .error-icon-shield'
    );
    if (!clickable) return;

    // 5. Exemption: Main site navbar / header navigation
    if (clickable.closest('.site-header, .navbar, .nav-menu, .mobile-menu-toggle, .brand-logo')) {
      return;
    }

    // 6. Common site footer handling
    if (clickable.closest('.site-footer')) {
      // Exemption 1: Footer Brand Logo navigating to index.html
      if (clickable.closest('.footer-brand .brand-logo')) {
        return;
      }
      // Exemption 2: Quick Links (Home, About, Service, Blog, Contact)
      const quickLink = clickable.closest('.footer-links a');
      if (quickLink && ['index.html', 'about.html', 'service.html', 'blog.html', 'contact.html'].some(p => quickLink.getAttribute('href') === p)) {
        return; // Allow native navigation between main site pages
      }

      // ALL other links, buttons, and icons in the footer redirect to 404.html
      e.preventDefault();
      e.stopPropagation();
      window.location.href = '404.html';
      return;
    }

    // 7. Check if on a Dashboard page (User Dashboard or Client Dashboard)
    const isDashboard = Boolean(document.querySelector('.dashboard-layout') || currentPath.includes('dashboard'));
    if (isDashboard) {
      // Exemption: Sidebar menus (section tabs, sidebar brand, sidebar logout, drawer toggles) and header nav
      if (clickable.closest('.dashboard-sidebar, .sidebar-toggle-btn, .sidebar-backdrop, .mobile-brand-logo, .header-avatar-circle')) {
        return;
      }

      // If it's a form submit button, let the form's submit listener validate and redirect
      const dashboardSubmit = clickable.closest('button[type="submit"], input[type="submit"], .btn-submit');
      if (dashboardSubmit && dashboardSubmit.closest('form')) {
        return;
      }

      // All other buttons, links, and icons inside both dashboard pages redirect to 404.html
      e.preventDefault();
      e.stopPropagation();
      window.location.href = '404.html';
      return;
    }

    // 8. On public pages (index, about, service, blog, contact):
    // Exemption: Form submit buttons (let the form submit handler validate first)
    const formSubmit = clickable.closest('button[type="submit"], input[type="submit"], .btn-submit');
    if (formSubmit && formSubmit.closest('form')) {
      return;
    }

    // All other buttons, links, and icons redirect to 404.html
    e.preventDefault();
    e.stopPropagation();
    window.location.href = '404.html';
  }, true);

  // ==========================================
  // 14. 404 PAGE GO BACK HANDLER
  // ==========================================
  let isNavigatingBack = false;
  window.goToBackHistory = function() {
    if (isNavigatingBack) return;
    isNavigatingBack = true;
    setTimeout(() => { isNavigatingBack = false; }, 1000);

    if (window.history.length > 1) {
      window.history.back();
    } else {
      let fallback = '';
      try {
        fallback = sessionStorage.getItem('stackly_prev_page') || document.referrer || '';
      } catch (err) {}
      if (fallback && !fallback.includes('404')) {
        window.location.href = fallback;
      } else {
        window.history.back();
      }
    }
  };

  const goBackBtn = document.getElementById('go-back-btn');
  if (goBackBtn) {
    goBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.goToBackHistory();
    });
  }

  // ==========================================
  // 15. 404 CARD INTERACTIVE 3D TILT EFFECT
  // ==========================================
  const errorPageMain = document.querySelector('.error-page-main');
  const errorCardWrapper = document.querySelector('.error-card-wrapper');
  if (errorPageMain && errorCardWrapper && window.innerWidth > 992) {
    errorPageMain.addEventListener('mousemove', (e) => {
      const rect = errorCardWrapper.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const tiltX = (-y * 6).toFixed(2);
      const tiltY = (x * 6).toFixed(2);
      errorCardWrapper.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
    });

    errorPageMain.addEventListener('mouseleave', () => {
      errorCardWrapper.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      errorCardWrapper.style.transition = 'transform 0.6s ease';
    });

    errorPageMain.addEventListener('mouseenter', () => {
      errorCardWrapper.style.transition = 'transform 0.1s ease-out';
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStacklyApp);
} else {
  initStacklyApp();
}

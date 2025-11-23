// tooltip.js
// Implements hover tooltips for elements with data-tip attribute

export function initTooltips() {
  const tipEl = document.getElementById('tip');
  if (!tipEl) return;

  let activeElement = null;
  let hideTimeout = null;

  function showTip(text, targetEl) {
  if (!text) return;
  
  clearTimeout(hideTimeout);
  
  // Set the tooltip text
  tipEl.textContent = text;
  
  // Get the target element's position
  const rect = targetEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  
  // Check if element is a vertical slider (EQ slider)
  const isVerticalSlider = targetEl.classList.contains('eq-slider') || 
                          targetEl.classList.contains('eq-input') ||
                          targetEl.closest('.eq-band');
  
  if (isVerticalSlider) {
    // Position to the right of EQ sliders
    const rightX = rect.right + 10;
    const centerY = rect.top + rect.height / 2;
    tipEl.style.left = rightX + 'px';
    tipEl.style.top = centerY + 'px';
    tipEl.style.transform = 'translateY(-50%)';
  } else {
    // Check if element is in top half of viewport
    const isInTopHalf = rect.top < window.innerHeight / 2;
    
    if (isInTopHalf) {
      // Position below the element
      const bottomY = rect.bottom;
      tipEl.style.left = centerX + 'px';
      tipEl.style.top = bottomY + 'px';
      tipEl.style.transform = 'translate(-50%, 20%)';
    } else {
      // Position above the element (default)
      const topY = rect.top;
      tipEl.style.left = centerX + 'px';
      tipEl.style.top = topY + 'px';
      tipEl.style.transform = 'translate(-50%, -120%)';
    }
  }
  
  // Show the tooltip
  tipEl.classList.add('show');
  activeElement = targetEl;
}

  function hideTip() {
    tipEl.classList.remove('show');
    activeElement = null;
  }

  function delayedHide() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      hideTip();
    }, 100);
  }

  // Attach to all elements with data-tip attribute
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-tip]');
    if (target && target !== activeElement) {
      const tipText = target.getAttribute('data-tip') || target.getAttribute('title');
      if (tipText) {
        showTip(tipText, target);
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-tip]');
    if (target === activeElement) {
      delayedHide();
    }
  });

  // Also hide on scroll
  document.addEventListener('scroll', hideTip, true);
  window.addEventListener('resize', hideTip);
}

// Simple version - call this if you want basic tooltips
export function initSimpleTooltips() {
  const tipEl = document.getElementById('tip');
  if (!tipEl) return;

  document.querySelectorAll('[data-tip]').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      const text = el.getAttribute('data-tip');
      if (!text) return;

      const rect = el.getBoundingClientRect();
      tipEl.textContent = text;
      tipEl.style.left = (rect.left + rect.width / 2) + 'px';
      tipEl.style.top = rect.top + 'px';
      tipEl.classList.add('show');
    });

    el.addEventListener('mouseleave', () => {
      tipEl.classList.remove('show');
    });
  });
}
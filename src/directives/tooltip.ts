import type { Directive, DirectiveBinding } from 'vue';

interface TooltipElement extends HTMLElement {
  _tooltip?: HTMLDivElement;
  _tooltipHandlers?: {
    showTooltip: (e: MouseEvent) => void;
    hideTooltip: () => void;
  };
}

export const tooltip: Directive<TooltipElement, string> = {
  mounted(el: TooltipElement, binding: DirectiveBinding<string>) {
    // Create tooltip element
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    tooltipEl.textContent = binding.value;
    tooltipEl.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s;
      z-index: 9999;
      white-space: nowrap;
      backdrop-filter: blur(8px);
    `;
    document.body.appendChild(tooltipEl);

    // Store reference
    el._tooltip = tooltipEl;

    // Show tooltip on mouseenter
    const showTooltip = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
      tooltipEl.style.top = `${rect.top - 10}px`;
      tooltipEl.style.transform = 'translate(-50%, -100%)';
      tooltipEl.style.opacity = '1';
    };

    // Hide tooltip on mouseleave
    const hideTooltip = () => {
      tooltipEl.style.opacity = '0';
    };

    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mouseleave', hideTooltip);

    // Store handlers for cleanup
    el._tooltipHandlers = { showTooltip, hideTooltip };
  },

  updated(el: TooltipElement, binding: DirectiveBinding<string>) {
    if (el._tooltip) {
      el._tooltip.textContent = binding.value;
    }
  },

  unmounted(el: TooltipElement) {
    // Cleanup
    if (el._tooltip) {
      el._tooltip.remove();
    }
    if (el._tooltipHandlers) {
      el.removeEventListener('mouseenter', el._tooltipHandlers.showTooltip);
      el.removeEventListener('mouseleave', el._tooltipHandlers.hideTooltip);
    }
  }
};
import type { DirectiveBinding } from "vue";

declare module "vue" {
  interface ComponentCustomProperties {
    vTooltip: DirectiveBinding<string>;
  }
}

export {};

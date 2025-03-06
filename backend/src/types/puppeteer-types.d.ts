// Augmenting Puppeteer types to help with page.evaluate functions
import { Page } from 'puppeteer';

declare module 'puppeteer' {
  interface Page {
    evaluate<T extends (...args: any[]) => any>(
      pageFunction: T,
      ...args: Parameters<T>
    ): Promise<ReturnType<T>>;
  }
}

// Ensure DOM types are available in our evaluation functions
declare global {
  // This namespace ensures these declarations won't conflict with anything else
  namespace PuppeteerEvaluation {
    interface Window {
      document: Document;
      scrollBy(x: number, y: number): void;
      innerHeight: number;
    }

    interface Document {
      querySelectorAll(selectors: string): NodeListOf<Element>;
      querySelector(selectors: string): Element | null;
      URL: string;
      body: {
        scrollHeight: number;
      };
    }

    interface Element {
      textContent: string | null;
      click(): void;
      querySelector(selectors: string): Element | null;
    }

    interface HTMLAnchorElement extends Element {
      href: string;
    }

    interface HTMLImageElement extends Element {
      src: string;
      alt: string;
    }
  }
}

export {};
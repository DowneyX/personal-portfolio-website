import { Injectable } from '@angular/core';
import figlet from 'figlet';
import standardFont from 'figlet/importable-fonts/Standard.js';

@Injectable({
  providedIn: 'root',
})
export class AsciiService {
  private static fontRegistered = false;

  constructor() {
    if (!AsciiService.fontRegistered) {
      figlet.parseFont('Standard', standardFont);
      AsciiService.fontRegistered = true;
    }
  }

  generateTitleAscii(title: string): string {
    try {
      const text = figlet.textSync(title.toLowerCase(), {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      });
      return text;
    } catch (error) {
      console.error('Failed to generate ASCII art:', error);
      return title;
    }
  }
}

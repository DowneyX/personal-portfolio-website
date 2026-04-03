import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-lua';

export interface LanguageSnippet {
  language: string;
  code: string;
  fileName?: string;
}

@Component({
  selector: 'app-code-snippet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './code-snippet.component.html',
  styleUrl: './code-snippet.component.css',
})
export class CodeSnippetComponent implements OnInit, OnChanges {
  @Input() fileName = 'snippet.ts';
  @Input() language = 'typescript';
  @Input() code = `const snippet = {
  message: 'Hello world'
};`;
  @Input() snippets: LanguageSnippet[] = [];

  highlightedCode: SafeHtml = '';
  selectedLanguageIndex = 0;
  hasMultipleLanguages = false;

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.initializeSnippets();
    this.highlightCode();
  }

  ngOnChanges(): void {
    this.initializeSnippets();
    this.highlightCode();
  }

  private initializeSnippets(): void {
    // If snippets array is provided, use it; otherwise create from single input
    if (this.snippets.length > 0) {
      this.hasMultipleLanguages = this.snippets.length > 1;
      this.selectedLanguageIndex = 0;
    } else {
      this.snippets = [
        {
          language: this.language,
          code: this.code,
          fileName: this.fileName,
        },
      ];
      this.hasMultipleLanguages = false;
      this.selectedLanguageIndex = 0;
    }
  }

  selectLanguage(index: number): void {
    this.selectedLanguageIndex = index;
    this.highlightCode();
  }

  getCurrentSnippet(): LanguageSnippet {
    return this.snippets[this.selectedLanguageIndex];
  }

  getCurrentFileName(): string {
    const current = this.getCurrentSnippet();
    return current.fileName || this.fileName;
  }

  private highlightCode(): void {
    const current = this.getCurrentSnippet();
    const normalizedLanguage = this.normalizeLanguage(current.language);
    const grammar = Prism.languages[normalizedLanguage] ?? Prism.languages['plain'];
    const highlighted = Prism.highlight(current.code, grammar, normalizedLanguage);
    const styledHighlighted = this.applyTokenColors(highlighted);
    this.highlightedCode = this.sanitizer.bypassSecurityTrustHtml(styledHighlighted);
  }

  private applyTokenColors(highlighted: string): string {
    return highlighted.replace(/class="token ([^"]+)"/g, (_match, tokenClasses: string) => {
      const classes = tokenClasses.split(' ');
      let color = '#dce7f3';

      if (classes.includes('keyword')) {
        color = '#7cc5ff';
      } else if (classes.includes('property')) {
        color = '#ffbe7a';
      } else if (classes.includes('string')) {
        color = '#9ce78f';
      } else if (classes.includes('number') || classes.includes('boolean') || classes.includes('constant')) {
        color = '#e99cff';
      } else if (classes.includes('operator') || classes.includes('punctuation')) {
        color = '#8ea4ba';
      }

      return `class="token ${tokenClasses}" style="color:${color}"`;
    });
  }

  private normalizeLanguage(language: string): string {
    const normalized = language.toLowerCase();

    if (normalized === 'html') {
      return 'markup';
    }

    if (normalized === 'ts') {
      return 'typescript';
    }

    if (normalized === 'js') {
      return 'javascript';
    }

    if (normalized === 'shell' || normalized === 'sh' || normalized === 'zsh') {
      return 'bash';
    }

    return normalized;
  }
}
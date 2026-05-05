import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { AsciiService } from '../../services/ascii.service';
import { Project } from '../../models/project.model';
import { CodeSnippetComponent } from '../../components/code-snippet/code-snippet.component';
import { Subscription, switchMap } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule, RouterLink, CodeSnippetComponent],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent implements OnInit {
  project: Project | undefined;
  notFound = false;
  selectedImage: string | null = null;
  asciiTitle = '';
  private readonly subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private asciiService: AsciiService
    ,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap
        .pipe(
          switchMap((params) => {
            const slug = params.get('slug');
            if (!slug) {
              this.notFound = true;
              this.project = undefined;
              return this.projectService.getBySlug('');
            }

            return this.projectService.getBySlug(slug);
          })
        )
        .subscribe((project) => {
          this.project = project;
          this.notFound = !project;
          if (project) {
            this.asciiTitle = this.asciiService.generateTitleAscii(project.title);
          } else {
            this.asciiTitle = '';
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  renderMarkdownLinks(text?: string): string {
    if (!text) {
      return '';
    }

    return text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_match, label: string, url: string, title: string) => {
      const titleAttribute = title ? ` title="${this.escapeAttribute(title)}"` : '';
      return `<a href="${this.escapeAttribute(url)}" target="_blank" rel="noopener noreferrer"${titleAttribute} class="text-sky-400 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-300">${this.escapeHtml(label)}</a>`;
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeAttribute(value: string): string {
    return this.escapeHtml(value).replace(/`/g, '&#96;');
  }

  openLightbox(img: string) {
    this.selectedImage = img;
    // prevent background scroll while lightbox open
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.selectedImage = null;
    document.body.style.overflow = '';
  }

  getHeadingClass(level?: number): string {
    if (level === 3) {
      return ' sm: text-white font-bold mt-10';
    }

    if (level === 4) {
      return ' text-white font-bold mt-8';
    }

    return 'text-white font-bold mt-12';
  }

  getSafeUrl(id?: string): SafeResourceUrl | null {
    if (!id) {
      return null;
    }
    const url = `https://www.youtube-nocookie.com/embed/${id}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.selectedImage) {
      this.closeLightbox();
    }
  }
}

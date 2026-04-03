import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink, CommonModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent implements OnInit, OnDestroy {
  @ViewChild('projectTitle') projectTitle?: ElementRef;
  projects: Project[] = [];
  years: number[] = [];
  projectTypes: string[] = [];
  tags: string[] = [];

  dashLine = '';
  private resizeObserver?: ResizeObserver;
  private readonly subscriptions = new Subscription();
  private readonly onWindowResize = () => this.updateDashLine();

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([
        this.projectService.getAll(),
        this.projectService.getAllYears(),
        this.projectService.getAllTypes(),
        this.projectService.getAllTags(),
      ]).subscribe(([projects, years, projectTypes, tags]) => {
        this.projects = projects;
        this.years = years;
        this.projectTypes = projectTypes;
        this.tags = tags;
      })
    );

    // Wait for template to render, then set up observer
    setTimeout(() => {
      if (this.projectTitle) {
        this.setupResizeObserver();
        this.updateDashLine();
      }
    }, 0);

    // Also update on window resize for safety
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    window.removeEventListener('resize', this.onWindowResize);
  }

  private setupResizeObserver(): void {
    if (!this.projectTitle) return;
    
    this.resizeObserver = new ResizeObserver(() => {
      this.updateDashLine();
    });
    
    this.resizeObserver.observe(this.projectTitle.nativeElement);
  }

  private updateDashLine(): void {
    if (!this.projectTitle) return;
    
    const width = this.projectTitle.nativeElement.offsetWidth;
    // Monospace character width in pixels (adjust based on your font)
    const charWidth = 8;
    const dashCount = Math.max(Math.floor(width / charWidth) - 10, 0);
    this.dashLine = '-'.repeat(dashCount);
  }

  onFilterByYear(year: number): void {
    this.subscriptions.add(
      this.projectService.getByYear(year).subscribe((projects) => {
        this.projects = projects;
      })
    );
  }

  onFilterByTag(tag: string): void {
    this.subscriptions.add(
      this.projectService.getByTag(tag).subscribe((projects) => {
        this.projects = projects;
      })
    );
  }

  onFilterByProjectType(type: string): void {
    this.subscriptions.add(
      this.projectService.getByType(type).subscribe((projects) => {
        this.projects = projects;
      })
    );
  }

  onClearFilters(): void {
    this.subscriptions.add(
      this.projectService.getAll().subscribe((projects) => {
        this.projects = projects;
      })
    );
  }
}

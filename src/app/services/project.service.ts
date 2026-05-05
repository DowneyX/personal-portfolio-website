import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../models/project.model';
import { catchError, map, Observable, of, shareReplay, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly projectsIndexUrl = '/data/projects/index.json';
  private readonly projectsLegacyUrl = '/data/projects.json';
  private readonly projects$: Observable<Project[]>;
  private readonly projectDetailsCache = new Map<string, Observable<Project | undefined>>();

  constructor(private readonly http: HttpClient) {
    this.projects$ = this.http
      .get<Project[]>(this.projectsIndexUrl)
      .pipe(
        catchError((error) => {
          console.error('Failed to load /data/projects/index.json, trying legacy /data/projects.json.', error);
          return this.http.get<Project[]>(this.projectsLegacyUrl).pipe(
            catchError((legacyError) => {
              console.error('Failed to load /data/projects.json, returning empty projects list.', legacyError);
              return of([]);
            })
          );
        })
      )
      .pipe(shareReplay(1));
  }

  getAll(): Observable<Project[]> {
    return this.projects$;
  }

  getByYear(year: number): Observable<Project[]> {
    return this.projects$.pipe(map((projects) => projects.filter((p) => p.year === year)));
  }

  getByTag(tag: string): Observable<Project[]> {
    return this.projects$.pipe(map((projects) => projects.filter((p) => p.tags?.includes(tag))));
  }

  getByType(type: string): Observable<Project[]> {
    return this.projects$.pipe(map((projects) => projects.filter((p) => p.projectType === type)));
  }

  getBySlug(slug: string): Observable<Project | undefined> {
    if (!slug) {
      return of(undefined);
    }

    return this.projects$.pipe(
      map((projects) => projects.find((p) => p.slug === slug)),
      switchMap((projectFromIndex) => {
        if (!projectFromIndex) {
          return of(undefined);
        }

        return this.getProjectDetailsBySlug(slug).pipe(
          map((projectDetails) => projectDetails ?? projectFromIndex)
        );
      })
    );
  }

  private getProjectDetailsBySlug(slug: string): Observable<Project | undefined> {
    const cached = this.projectDetailsCache.get(slug);
    if (cached) {
      return cached;
    }

    const request = this.http
      .get<Project>(`/data/projects/${slug}.json`)
      .pipe(
        catchError(() =>
          this.http
            .get<Project[]>(this.projectsLegacyUrl)
            .pipe(map((projects) => projects.find((project) => project.slug === slug)))
            .pipe(catchError(() => of(undefined)))
        )
      )
      .pipe(shareReplay(1));

    this.projectDetailsCache.set(slug, request);
    return request;
  }

  getAllTags(): Observable<string[]> {
    return this.projects$.pipe(
      map((projects) => {
        const tagsSet = new Set<string>();
        projects.forEach((p) => p.tags?.forEach((t) => tagsSet.add(t)));
        return Array.from(tagsSet);
      })
    );
  }

  getAllYears(): Observable<number[]> {
    return this.projects$.pipe(
      map((projects) => {
        const yearsSet = new Set<number>();
        projects.forEach((p) => p.year && yearsSet.add(p.year));
        return Array.from(yearsSet).sort((a, b) => b - a);
      })
    );
  }

  getAllTypes(): Observable<string[]> {
    return this.projects$.pipe(
      map((projects) => {
        const typesSet = new Set<string>();
        projects.forEach((p) => p.projectType && typesSet.add(p.projectType));
        return Array.from(typesSet);
      })
    );
  }
}

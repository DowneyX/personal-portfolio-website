import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../models/project.model';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly projects$: Observable<Project[]>;
  private readonly fallbackProjects: Project[] = [
    {
      slug: 'factorio-pollution-visuals-mod',
      title: 'Factorio Pollution Visuals Mod',
      year: 2019,
      briefDescription:
        'Mod i made for the game Factorio that adds visual indicators to pollution, giving the game more ambiance and making it easier to see where pollution is spreading.',
      tags: ['Lua'],
      projectType: 'Personal project',
    },
  ];

  constructor(private readonly http: HttpClient) {
    this.projects$ = this.http
      .get<Project[]>('data/projects.json')
      .pipe(
        catchError((error) => {
          console.error('Failed to load data/projects.json, using fallback projects.', error);
          return of(this.fallbackProjects);
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
    return this.projects$.pipe(map((projects) => projects.find((p) => p.slug === slug)));
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

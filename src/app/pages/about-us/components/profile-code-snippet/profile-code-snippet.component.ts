import { Component } from '@angular/core';
import { CodeSnippetComponent, LanguageSnippet } from '../../../../components/code-snippet/code-snippet.component';

@Component({
  selector: 'app-profile-code-snippet',
  standalone: true,
  imports: [CodeSnippetComponent],
  templateUrl: './profile-code-snippet.component.html',
  styleUrl: './profile-code-snippet.component.css',
})
export class ProfileCodeSnippetComponent {
  snippets: LanguageSnippet[] = [
    {
      fileName: 'developer_douwe.ts',
      language: 'typescript',
      code: `const developer = {
  name: 'Douwe Klip',
  role: 'Software Engineer',

  education: [
    {
      degree: 'Multimedia Design',
      institution: 'noorderpoort college kunst en media',
      graduationYear: 2019
    },
    {
      degree: 'Software Engineering',
      institution: 'Hanze University of Applied Sciences',
      graduationYear: 2025
    }
  ],

  skills: [
    'Angular', 'TypeScript', 'JavaScript',
    'HTML', 'CSS', 'Git', 'springboot', 
    'flask', 'python', 'docker', 'flutter', 
    'dart','esp32', 'micropython', 'linux', 
    'bash', 'lua', 'tailwindcss', 'php', 
    'symphony', 'doctrine', 'mysql', 
    'postgresql'
  ],

  lockedIn: true
};`,
    },
  ];
}
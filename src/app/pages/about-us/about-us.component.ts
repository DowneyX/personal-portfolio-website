import { Component } from '@angular/core';
import { ProfileCodeSnippetComponent } from './components/profile-code-snippet/profile-code-snippet.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [ProfileCodeSnippetComponent, RouterLink],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css'
})
export class AboutUsComponent {

}

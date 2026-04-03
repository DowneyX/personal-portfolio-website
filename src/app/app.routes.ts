import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { WorkInProgressComponent } from './pages/work-in-progress/work-in-progress.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { ProjectListComponent } from './pages/project-list/project-list.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';
import { ContactComponent } from './pages/contact/contact.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'privacy-policy', component: WorkInProgressComponent },
  { path: 'project-list', component: ProjectListComponent },
  { path: 'projects/:slug', component: ProjectDetailComponent },
  { path: 'terms-of-use', component: WorkInProgressComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'services', component: WorkInProgressComponent },
  { path: '**', component: PageNotFoundComponent },
];

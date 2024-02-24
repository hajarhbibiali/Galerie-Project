import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
// import { SidebarComponent } from './sidebar/sidebar.component';
import { AlbumComponent } from './album/album.component';
const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'album', component: AlbumComponent },
    // Other routes if any
    // { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default route
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }

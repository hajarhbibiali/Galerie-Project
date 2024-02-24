import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['../../assets/css/style.css']
})
export class HomeComponent {
  constructor(private router: Router) { }
  // onRegisterClick() {
  //   this.router.navigate(['/register']);
  //   }
}

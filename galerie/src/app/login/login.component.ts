import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../Services/authh.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  LoginForm!: FormGroup;

  constructor(private authService: AuthService,private _formBuilder: FormBuilder,private router:Router){
    
  }
  
  ngOnInit(): void {

    this.LoginForm = this._formBuilder.group({
    
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
     
    });
  }
  User_register() {
    if (this.LoginForm) {
      const user = {
      
        email: this.LoginForm.value.email,
        password: this.LoginForm.value.password,
      };

      this.authService.signIn(user).subscribe({
        next: (res) => {
          console.log(res);
          if (res.status === true) {
            console.log('User login successfully');
            localStorage.setItem('userId', JSON.stringify(res.id));
            this.router.navigate(['/album']);
          } else {
            console.log('User login failed');
          }
        },
        error: (err) => {
          console.log(err);
        }
      });
    }
  }

}

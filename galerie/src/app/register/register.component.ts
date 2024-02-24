import { Component, OnInit } from '@angular/core';
import { AuthService } from '../Services/authh.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private dataService: AuthService, private router:Router) {
    this.registerForm = this.formBuilder.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
      // Other form fields as needed
    });
  }
  saveUser() {
    if (this.registerForm) {
      const user = {
        firstname: this.registerForm.value.firstname,
        lastname: this.registerForm.value.lastname,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
      };

      this.dataService.createUser(user).subscribe({
        next: (res) => {
          console.log(res);
          if (res.status === true) {
            console.log('User created successfully');
            // Redirect to the login page after successful registration
            this.router.navigate(['/login']);
          } else {
            console.log('User registration failed');
          }
        },
        error: (err) => {
          console.log(err);
        }
      });
    }
  }
  cancelRegistration(){
    this.router.navigate(['/register']);
    
  }
}


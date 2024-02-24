import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
    
  constructor(private _http:HttpClient) { }

  createUser(data:any):Observable<any>{
       return this._http.post("http://localhost:3000/register",data);
   }
  signIn(data:any):Observable<any>{
    return this._http.post("http://localhost:3000/login",data);
  }

}

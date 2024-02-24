import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chart } from 'chart.js';

@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    constructor(private http: HttpClient) { }

    uploadFiles(formData: FormData): Observable<any> {
        return this.http.post('http://localhost:3000/album', formData);
    }
    getImages(userId: string): Observable<any> {
        return this.http.get(`http://localhost:3000/album/${userId}`);
    }
    deleteImage(imageId: string): Observable<any> {
        return this.http.delete(`http://localhost:3000/album/${imageId}`);
    }
    sendtoFlask(formData: FormData): Observable<any> {
        return this.http.post('http://localhost:5000/album/process', formData);
    }
    getImagesByUserId(userId: string) {
        return this.http.get<any[]>(`http://localhost:5000/album/images/${userId}`);
    }
    searchImages(formData: FormData) {
        return this.http.post<any>('http://localhost:5000/album/search', formData);
    }
    getCategories(): Observable<any> {
        return this.http.get('http://localhost:3000/category');
    }
    addCategory(name: string): Observable<any> {
        const category = { name };
        return this.http.post('http://localhost:3000/category', category);
    }
    deleteCategory(categoryId: string): Observable<any> {
        return this.http.delete(`http://localhost:3000/category/${categoryId}`);
    }
    

}

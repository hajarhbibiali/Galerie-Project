import { Component, ElementRef } from '@angular/core';
import { FileUploadService } from '../Services/FileUploadService';
import { ChartDataset } from 'chart.js';

@Component({
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.css'],
})

export class AlbumComponent {
  categories: any[] = []; // Initialize categories array to empty
  selectedCategory: any;
  selectedImageIds: string[] = [];
  hide : boolean =false;
  selectedFiles!: FileList | null;
  selectedImage: string | ArrayBuffer | null = null; // To store the selected image for preview
  selectedDisplayCategory: string = 'ALL';
  constructor(private fileUploadService: FileUploadService) { }
  selectedImages: any[] = [];
  images: any[] = [];
  similarImages: any[] = []; // Array to store similar images

  ngOnInit() {
    this.getCategories()
    this.getImages();
  }

  selectImage(image: any) {
    this.selectedImages.push(image);
    console.log(this.selectedImages);
  }
  selectCategory(category: any) {
    this.selectedCategory = category;
    // Load images based on the selected category
    this.getImages();
  }
  
  toggleImageSelection(event: any, imageId: string) {
    if (event.target.checked) {
      this.selectedImageIds.push(imageId);
    } else {
      this.selectedImageIds = this.selectedImageIds.filter(id => id !== imageId);
    }
  }
  newCategoryName: string = '';
  onFileSelected(event: any) {
    this.selectedFiles = event.target.files;
    console.log('onselectfiles', this.selectedFiles);
  }
  addingCategory: boolean = false;
  toggleCategoryForm() {
    this.addingCategory = !this.addingCategory;
    if (!this.addingCategory) {
      // Clear the new category name when hiding the input field
      this.newCategoryName = '';
    }
  }
  
  addCategory() {
    if (this.addingCategory) {
      // Add category logic here
      if (this.newCategoryName) {
        this.fileUploadService.addCategory(this.newCategoryName).subscribe(
          (res) => {
            console.log('Category added successfully:', res);
            this.categories.push({ id: res.id, name: this.newCategoryName });
            this.getCategories();
            this.toggleCategoryForm(); // Hide the input field after adding the category
          },
          (error) => {
            console.error('Error occurred:', error);
          }
        );
      } else {
        // Handle case when the category name is empty
        console.error('Category name cannot be empty');
      }
    } else {
      // If not adding a category, toggle the input field
      this.toggleCategoryForm();
    }
  }
  getCategories() {
    this.fileUploadService.getCategories().subscribe(
      (res) => {
        console.log('Categories:', res);
        // Handle the categories here
        this.categories = res.map((category: any) => ({ id: category._id, name: category.name }));
        this.selectedCategory = this.categories[0];
        console.log('this.selectedCategory:', this.selectedCategory);
      },
      (error) => {
        console.error('Error occurred:', error);
      }
    );
  }

  deleteCategory(category: string) {
    console.log('category', category)
    if (confirm(`Are you sure you want to delete the category "${category}"?`)) {
      this.fileUploadService.deleteCategory(category).subscribe(
        (res) => {
          console.log('Category deleted successfully:', res);
          this.getCategories();
          this.selectedCategory = this.categories[0];
        },
        (error) => {
          console.error('Error occurred:', error);
        }
      );
    }
  }

  Selected(event: any) {
    this.hide =true
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.selectedImage = reader.result; // Store selected image for preview
      };
      const formData = new FormData();
      formData.append('files', event.target.files[0]);

      this.fileUploadService.searchImages(formData).subscribe(
        (res) => {
          console.log('Search Results:', res);
          // Handle the search results here
          this.similarImages = res.map((image: any) => {
            const tasnime = `data:${image['image']["content_type"]};base64,${image['image']["image_data"]}`;
            // console.log('tasnime',tasnime)
            return tasnime
          });
        },
        (error) => {
          console.error('Error occurred:', error);
        }
      );
    }
  }

  getImages() {
    let userId = localStorage.getItem('userId');
    if (userId) {
      this.fileUploadService
        .getImagesByUserId(JSON.parse(userId))
        .subscribe((data: any[]) => {
          console.log('data', data);
          this.images = data.map(image => {
            return {
              imageData: `data:${image["content_type"]};base64,${image["image_data"]}`,
              id: image["_id"],
              category: image["category"]
            };
          });
        });
    }
  }

  uploadImages() {
    if (this.selectedFiles) {
      const formData = new FormData();

      let userId = localStorage.getItem('userId');

      if (userId) {
        formData.append('user', JSON.parse(userId));
        formData.append('category', this.selectedCategory.name);

        for (let i = 0; i < this.selectedFiles.length; i++) {
          const file = this.selectedFiles[i];
          formData.append('files', file);
          formData.append('filename', file.name);
          formData.append('contentType', file.type);
        }
        this.fileUploadService.sendtoFlask(formData).subscribe(
          (response) => {
            console.log('Upload success!', response);
            this.getImages();
          },
          (error) => {
            console.error('Upload error:', error);
          }
        );
      }
    }
  }
  deleteSelectedImages() {
    if (this.selectedImageIds.length === 0) {
      alert('Please select images to delete.');
      return;
    }
  
    if (confirm(`Are you sure you want to delete the selected images?`)) {
      for (const imageId of this.selectedImageIds) {
        this.fileUploadService.deleteImage(imageId).subscribe(
          res => {
            console.log(`Image with ID ${imageId} deleted successfully`);
            this.getImages(); // Refresh the image list after deletion
          },
          err => {
            console.log(`Error deleting image with ID ${imageId}:`, err);
          }
        );
      }
      this.selectedImageIds = []; // Clear the selected image IDs after deletion
    }
  }

}

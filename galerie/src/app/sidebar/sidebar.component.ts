import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements AfterViewInit {
  @ViewChild('sidebar') sidebar!: ElementRef;
  @ViewChild('btn') closeBtn!: ElementRef;
  @ViewChild('bxSearch') searchBtn!: ElementRef;
  @ViewChild('modeSwitch') modeSwitch!: ElementRef; // Reference to the dark mode switch

  ngAfterViewInit() {
    this.closeBtn.nativeElement.addEventListener('click', () => this.toggleSidebar());
    this.searchBtn.nativeElement.addEventListener('click', () => this.toggleSidebar());
    this.modeSwitch.nativeElement.addEventListener('change', () => this.toggleDarkMode()); // Add an event listener to the dark mode switch
  }

  toggleSidebar() {
    this.sidebar.nativeElement.classList.toggle('open');
    this.menuBtnChange();
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark-mode'); // Toggle the dark-mode class on the body element
  }

  menuBtnChange() {
    if (this.sidebar.nativeElement.classList.contains('open')) {
      this.closeBtn.nativeElement.classList.replace('bx-menu', 'bx-menu-alt-right');
    } else {
      this.closeBtn.nativeElement.classList.replace('bx-menu-alt-right', 'bx-menu');
    }
  }
}

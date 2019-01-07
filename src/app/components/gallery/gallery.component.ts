import { Component, OnInit, Renderer, ElementRef, ViewChild } from '@angular/core';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit {

  @ViewChild('imagePicker') imagePicker:ElementRef;
  @ViewChild('openModal') openModal:ElementRef;
  @ViewChild('closeModal') closeModal:ElementRef;
  private base64textString:String = "";
  modalImage = {
    image: "",
    index: -1,
    class: ""
  };
  openedImage = new Image();
  images; // contains all the images
  dates; // contains dates of images
  pagination = {
    from: 1,
    to: 0,
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    recordsPerPage: 10,
    perPageAllowedRecords: 10,
    pages: []
  }
  
  constructor(
    private renderer:Renderer
  ) { }

  ngOnInit() {
    if ( localStorage.getItem("images") ) { // if there are any images in local storage
      this.images = JSON.parse(localStorage.getItem("images")); // load them in the array
      this.dates = JSON.parse(localStorage.getItem("dates")); // load dates
      this.updatePagination(this.pagination.currentPage);
    } else {
      this.images = []; // else initialize array as empty
      this.dates = [];
    }
  }

  // keyboard key capture
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ( event.keyCode === 27 ) { // esc key: close modal
      this.closeImageModal();
    } else if ( event.keyCode === 37 ) { // left arrow pressed
      this.showPreviousImage();
    } else if ( event.keyCode === 39 ) { // right arrow pressed
      this.showNextImage();
    } else if ( event.keyCode === 46 ) { // delete key pressed
      if ( this.modalImage.index > -1 ) {
        this.deleteImage();
      }
    }
  }

  addPages(start, end){
    for( var i = start; i <= end; i++ )
    {
      var newPage = {
        page_num: 0,
        isCurrent: false
      };
      newPage.page_num = i;
      if( this.pagination.currentPage == i )
        newPage.isCurrent = true;
      else
        newPage.isCurrent = false;
      this.pagination.pages.push(newPage);
    }
  }

  updatePagination(currentPage) { // parameter is set so the same function call be called from the view

    this.pagination.totalRecords = this.images.length;
    this.pagination.recordsPerPage = this.pagination.perPageAllowedRecords; // to reset records per page when new image is added
    this.pagination.totalPages = Math.ceil(this.pagination.totalRecords/this.pagination.recordsPerPage);
    
    if ( currentPage > this.pagination.totalPages ) { // when there is just one image on a page and it gets deleted. Page needs to be changed to previous
      currentPage--;
    }

    if ( currentPage < 1 || currentPage > this.pagination.totalPages)
      return false;

    this.pagination.pages = [];
    this.pagination.currentPage = currentPage;
    
    if ( this.pagination.totalRecords < this.pagination.recordsPerPage )
      this.pagination.recordsPerPage = this.pagination.totalRecords;

    this.pagination.from = (this.pagination.recordsPerPage * this.pagination.currentPage) - (this.pagination.recordsPerPage - 1);
    this.pagination.to = this.pagination.recordsPerPage * this.pagination.currentPage;

    if(this.pagination.to > this.pagination.totalRecords )
      this.pagination.to = this.pagination.totalRecords;

    // page calculation
    // 5 pages will be shown at a time if pages are more than 5
    if ( this.pagination.totalPages <= 5 ) {
      this.addPages(1,this.pagination.totalPages);
    }
    else if ( this.pagination.totalPages > 5 && this.pagination.currentPage <=2 ) {
      this.addPages(1,5);
    }
    else if ( this.pagination.totalPages > 5 && this.pagination.currentPage > 2 && this.pagination.currentPage <= this.pagination.totalPages-2) {
      this.addPages(this.pagination.currentPage-2,this.pagination.currentPage+2);
    }
    else if ( this.pagination.totalPages > 5 && this.pagination.currentPage > 2 && this.pagination.currentPage > this.pagination.totalPages-2) {
      this.addPages(this.pagination.totalPages-4,this.pagination.totalPages);
    }
  }

  triggerFileClick() {
    var event = new MouseEvent('click', {bubbles: true});
    this.renderer.invokeElementMethod(
      this.imagePicker.nativeElement, 'dispatchEvent', [event]
    );
  }

  handleFileSelect(evt) { 
    var files = evt.target.files;
    var file = files[0];
    console.log(file);
    if (files && file) {
      var reader = new FileReader();
      reader.onload = this.handleReaderLoaded.bind(this, file.type, file.lastModified);
      reader.readAsBinaryString(file);
    } 
  }

  handleReaderLoaded(fileType, date, readerEvt) {
    var binaryString = readerEvt.target.result;
    this.base64textString= btoa(binaryString);
    let fullImage = "data:"+fileType+";base64, "+this.base64textString;
    this.saveImage(fullImage, date);
  }

  saveImage(imageBase64, date) {
    let data = this.images.concat([imageBase64]) // temporary array to add new image and save without updating gallery
    if (this.updateStorage(JSON.stringify(data))) {
      this.images.push(imageBase64); // gallery updated
      this.dates.push(date);
      localStorage.setItem("dates", JSON.stringify(this.dates));
      this.updatePagination(this.pagination.currentPage);
    }
  }

  openImageViewer(imageBase64, index) {
    // open modal
    var event = new MouseEvent('click', {bubbles: true});
    this.renderer.invokeElementMethod(
      this.openModal.nativeElement, 'dispatchEvent', [event]
    );

    this.modalImage.image = imageBase64;
    this.modalImage.index = index;
    this.updateImageDimensionClass(imageBase64);
  }

  updateImageDimensionClass(imageInBase64) {
    this.openedImage.onload = () => {
      let width = this.openedImage.width;
      let height = this.openedImage.height;
      if ( height > width ) {
        this.modalImage.class = "portrait";
      } else if ( height < width ) {
        this.modalImage.class = "landscape";
      } else {
        this.modalImage.class = "square";
      }
    };
    this.openedImage.src = imageInBase64; 
  }

  showPreviousImage() {
    var newIndex = 0;
    if ( this.modalImage.index === this.pagination.from-1 ) { // if it is the first image of the page show last
      newIndex = this.pagination.to-1;
    } else {
      newIndex = this.modalImage.index-1;
    }
    this.modalImage.image = this.images[newIndex];
    this.modalImage.index = newIndex;
    this.updateImageDimensionClass(this.modalImage.image);
  }

  showNextImage () {
    var newIndex = 0;
    if ( this.modalImage.index === this.pagination.to-1 ) { // if it is the first image of the page show first of page
      newIndex = this.pagination.from-1;
    } else {
      newIndex = this.modalImage.index+1;
    }
    this.modalImage.image = this.images[newIndex];
    this.modalImage.index = newIndex;
    this.updateImageDimensionClass(this.modalImage.image);
  }

  deleteImage() { // delete selected image
    this.images.splice(this.modalImage.index, 1);
    if (this.updateStorage(JSON.stringify(this.images))) {
      alert("Deleted Successfully");
      this.updateModalImage();
      this.updatePagination(this.pagination.currentPage);
    }
  }

  updateModalImage() {
    if ( this.images.length ) {
      if ( this.modalImage.index === 0 ) { // if first image was deleted
        this.modalImage.image = this.images[0];
      } else {
        this.modalImage.image = this.images[this.images.length-1];
        this.modalImage.index = this.images.length-1;
      }
    } else {
      this.closeImageModal();
    }
  }

  closeImageModal() {
    var event = new MouseEvent('click', {bubbles: true});
    this.renderer.invokeElementMethod(
      this.closeModal.nativeElement, 'dispatchEvent', [event]
    );
    this.modalImage.image = "";
    this.modalImage.index = -1;
    this.modalImage.class = "";
  }

  updateStorage(data) {
    try {
      localStorage.setItem("images", data);
      return true;
    } catch(e) {
      if (this.isQuotaExceeded(e)) {
        alert("Localstorage full! Please delete some data.");
      } else {
        alert("There was an error uploading image, please try again.");
      }
      return false;
    }
  }

  isQuotaExceeded(e) {
    var quotaExceeded = false;
    if (e) {
      if (e.code) {
        switch (e.code) {
          case 22:
            quotaExceeded = true;
            break;
          case 1014:
            // Firefox
            if (e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
              quotaExceeded = true;
            }
            break;
        }
      } else if (e.number === -2147024882) {
        // Internet Explorer 8
        quotaExceeded = true;
      }
    }
    return quotaExceeded;
  }

}

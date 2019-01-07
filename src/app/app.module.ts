import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { SanitizeHtmlPipe } from './pipes/sanitize-html.pipe';

@NgModule({
  declarations: [
    AppComponent,
    GalleryComponent,
    SanitizeHtmlPipe
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

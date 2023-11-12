import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AuctionComponent } from './auction.component';
import { TokenComponent } from './token.component';
import { AuctionService } from './auction.service';

@NgModule({
  declarations: [
    AppComponent,
    AuctionComponent,
    TokenComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [AuctionService],
  bootstrap: [AppComponent]
})
export class AppModule { }


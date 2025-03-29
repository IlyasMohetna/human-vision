import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PolygonDataService {
  constructor(private http: HttpClient) {}

  // Fetch polygons and related data from the API
  fetchPolygonData(): Observable<any> {
    return this.http.get<any>('/api/dataset/random');
  }

  // Move any heavy transformation logic here if needed
  // ...existing code (transformations, re-mapping, etc.)...
}

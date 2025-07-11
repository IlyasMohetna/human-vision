import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';

export interface PolygonResponse {
  id: number;
  city: string;
  variants: {
    type: string;
    path: string;
  }[];
  meta: any;
  objects: {
    objectId: string;
    label: string;
    polygon: [number, number][];
  }[];
  vehicle: any;
}

@Injectable({
  providedIn: 'root',
})
export class PolygonDataService {
  constructor(private http: HttpClient) {}

  fetchPolygonData(): Observable<PolygonResponse> {
    return this.http.get<PolygonResponse>('/api/dataset/random').pipe(
      tap((response) => console.log('API data received:', response)),
      catchError((error) => {
        return of({
          id: -1,
          city: '',
          variants: [],
          meta: {},
          objects: [],
          vehicle: {},
        } as PolygonResponse);
      })
    );
  }
}

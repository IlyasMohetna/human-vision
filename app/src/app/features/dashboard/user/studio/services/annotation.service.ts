import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnnotationService {
  constructor(private http: HttpClient) {}

  postAnnotationData(data: any): Observable<any> {
    return this.http.post('/api/annotation', data);
  }
}

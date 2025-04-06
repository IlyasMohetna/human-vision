import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dataset } from './models/dataset.model';
import { PaginationInfo } from './models/pagination.types';

@Component({
  selector: 'app-dataset',
  imports: [CommonModule, FormsModule],
  templateUrl: './dataset.component.html',
  styles: ``,
  standalone: true,
})
export class DatasetComponent implements OnInit {
  public Math = Math;
  datasets: Dataset[] = [];
  loading = false;
  pagination: PaginationInfo = {
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  };
  searchTerm = '';
  sortBy = 'created_at';
  sortDirection = 'desc';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDatasets();
  }

  loadDatasets(page = 1): void {
    this.loading = true;
    const params = {
      page,
      perPage: this.pagination.per_page,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      search: this.searchTerm,
    };

    this.http
      .get<{
        current_page: number;
        data: Dataset[];
        per_page: number;
        total: number;
        last_page: number;
      }>('/api/datasets', { params })
      .subscribe({
        next: (response) => {
          this.datasets = response.data;
          this.pagination = {
            total: response.total,
            per_page: response.per_page,
            current_page: response.current_page,
            last_page: response.last_page,
          };
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching datasets:', error);
          this.loading = false;
        },
      });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.loadDatasets(page);
    }
  }

  search(): void {
    this.loadDatasets(1);
  }

  sort(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.loadDatasets(1);
  }

  // Improve pagination methods with null safety
  shouldShowPageButton(page: number): boolean {
    if (
      !this.pagination ||
      !this.pagination.current_page ||
      !this.pagination.last_page
    ) {
      return false;
    }

    // Show current page and a few pages around it
    const currentPage = this.pagination.current_page;
    return (
      page === 1 ||
      page === this.pagination.last_page ||
      Math.abs(page - currentPage) <= 2
    );
  }

  showEllipsis(page: number): boolean {
    if (
      !this.pagination ||
      !this.pagination.current_page ||
      !this.pagination.last_page
    ) {
      return false;
    }

    const currentPage = this.pagination.current_page;
    // Show ellipsis after page 2 if current page > 4
    if (page === 2 && currentPage > 4) {
      return true;
    }
    // Show ellipsis before last-1 page if there are more pages left
    if (
      page === this.pagination.last_page - 1 &&
      currentPage < this.pagination.last_page - 3
    ) {
      return true;
    }
    return false;
  }

  // Helper method for safe page iteration in the template
  getPageArray(): number[] {
    if (
      !this.pagination ||
      !this.pagination.last_page ||
      this.pagination.last_page <= 0
    ) {
      return [];
    }
    // Use a more direct approach instead of Array.from
    const result: number[] = [];
    for (let i = 0; i < this.pagination.last_page; i++) {
      result.push(i + 1);
    }
    return result;
  }
}
